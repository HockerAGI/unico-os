// src/app/api/stripe/summary/route.js
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { serverSupabase, requireUserFromToken } from "@/lib/serverSupabase";
import { hasPerm } from "@/lib/authz";
import { writeAudit } from "@/lib/auditServer";

const json = (status, payload) => NextResponse.json(payload, { status });

function getBearerToken(req) {
  const h = req.headers.get("authorization") || "";
  const m = h.match(/^Bearer\s+(.+)$/i);
  return m ? m[1] : "";
}

const isUuid = (s) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(s || "").trim());

const normEmail = (s) => String(s || "").trim().toLowerCase();

async function getMyRole(sb, orgId, user) {
  const myEmail = normEmail(user?.email);
  const uid = user?.id || "00000000-0000-0000-0000-000000000000";

  // org_id
  const q1 = await sb
    .from("admin_users")
    .select("role,is_active")
    .eq("org_id", orgId)
    .eq("is_active", true)
    .or(`user_id.eq.${uid},email.ilike.${myEmail}`)
    .limit(1)
    .maybeSingle();

  if (!q1?.error && q1?.data?.is_active) return String(q1.data.role || "").toLowerCase();

  // organization_id fallback
  const q2 = await sb
    .from("admin_users")
    .select("role,is_active")
    .eq("organization_id", orgId)
    .eq("is_active", true)
    .or(`user_id.eq.${uid},email.ilike.${myEmail}`)
    .limit(1)
    .maybeSingle();

  if (!q2?.error && q2?.data?.is_active) return String(q2.data.role || "").toLowerCase();
  return null;
}

const STRIPE_API = "https://api.stripe.com/v1";

function stripeKey() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("Falta STRIPE_SECRET_KEY");
  return key;
}

function fxToMXN(currency) {
  const c = String(currency || "mxn").toLowerCase();
  if (c === "mxn") return 1;
  if (c === "usd") return Math.max(0.0001, Number(process.env.FX_USD_TO_MXN || 18));
  const envKey = `FX_${c.toUpperCase()}_TO_MXN`;
  const fx = Number(process.env[envKey] || NaN);
  return Number.isFinite(fx) && fx > 0 ? fx : 1;
}

async function stripeGET(path, query = {}) {
  const url = new URL(`${STRIPE_API}${path}`);
  for (const [k, v] of Object.entries(query || {})) {
    if (v === undefined || v === null) continue;
    if (Array.isArray(v)) for (const it of v) url.searchParams.append(k, String(it));
    else url.searchParams.set(k, String(v));
  }

  const res = await fetch(url.toString(), {
    method: "GET",
    headers: { Authorization: `Bearer ${stripeKey()}` },
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(String(data?.error?.message || `Stripe error (${res.status})`));
  return data;
}

function sumBalanceArr(arr) {
  let totalMXN = 0;
  for (const it of Array.isArray(arr) ? arr : []) {
    const amount = Number(it?.amount || 0) || 0; // cents
    const currency = String(it?.currency || "mxn").toLowerCase();
    totalMXN += (amount / 100) * fxToMXN(currency);
  }
  return totalMXN;
}

export async function POST(req) {
  try {
    const sb = serverSupabase();
    const token = getBearerToken(req);

    const { user, error: authErr } = await requireUserFromToken(sb, token);
    if (authErr) return json(401, { ok: false, error: "No autorizado" });

    const body = await req.json().catch(() => ({}));
    const orgId = String(body?.org_id || body?.organization_id || "").trim();
    if (!isUuid(orgId)) return json(400, { ok: false, error: "org_id inválido" });

    const role = await getMyRole(sb, orgId, user);
    if (!role || !hasPerm(role, "dashboard")) return json(403, { ok: false, error: "Permisos insuficientes" });

    // Balance actual
    const bal = await stripeGET("/balance");

    const available_mxn = sumBalanceArr(bal?.available);
    const pending_mxn = sumBalanceArr(bal?.pending);

    // Ventana 30 días
    const now = Math.floor(Date.now() / 1000);
    const since = now - 30 * 24 * 60 * 60;

    // Disputes (30d)
    const disputes = await stripeGET("/disputes", { limit: 100, "created[gte]": since });

    // Refunds (30d)
    const refunds = await stripeGET("/refunds", { limit: 100, "created[gte]": since });

    // Payouts recientes (para “dashboard feel”)
    const payouts = await stripeGET("/payouts", { limit: 20 });

    const payload = {
      ok: true,
      updated_at: new Date().toISOString(),
      balance: {
        available_mxn,
        pending_mxn,
      },
      last_30_days: {
        disputes_count: Array.isArray(disputes?.data) ? disputes.data.length : 0,
        refunds_count: Array.isArray(refunds?.data) ? refunds.data.length : 0,
      },
      payouts: (Array.isArray(payouts?.data) ? payouts.data : []).slice(0, 10).map((p) => ({
        id: p?.id || null,
        amount_mxn: ((Number(p?.amount || 0) || 0) / 100) * fxToMXN(p?.currency),
        currency: String(p?.currency || "").toLowerCase() || null,
        status: p?.status || null,
        arrival_date: p?.arrival_date ? new Date(p.arrival_date * 1000).toISOString() : null,
        created: p?.created ? new Date(p.created * 1000).toISOString() : null,
      })),
    };

    await writeAudit(sb, {
      organization_id: orgId,
      actor_email: normEmail(user?.email),
      actor_user_id: user?.id || null,
      action: "stripe.summary",
      entity: "stripe",
      entity_id: orgId,
      summary: "Stripe dashboard summary fetched",
      meta: {
        available_mxn,
        pending_mxn,
        disputes_30d: payload.last_30_days.disputes_count,
        refunds_30d: payload.last_30_days.refunds_count,
      },
      ip: req.headers.get("x-forwarded-for") || null,
      user_agent: req.headers.get("user-agent") || null,
    });

    return json(200, payload);
  } catch (e) {
    return json(500, { ok: false, error: String(e?.message || e) });
  }
}