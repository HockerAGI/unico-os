// src/app/api/stripe/fees/route.js
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { serverSupabase, requireUserFromToken } from "@/lib/serverSupabase";

const json = (status, payload) => NextResponse.json(payload, { status });

function getBearerToken(req) {
  const h = req.headers.get("authorization") || "";
  const m = h.match(/^Bearer\s+(.+)$/i);
  return m ? m[1] : "";
}

const isUuid = (s) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
    String(s || "").trim()
  );

const normEmail = (s) => String(s || "").trim().toLowerCase();

const clampList = (arr, max = 60) => {
  const out = [];
  for (const v of Array.isArray(arr) ? arr : []) {
    const s = String(v || "").trim();
    if (!s) continue;
    out.push(s);
    if (out.length >= max) break;
  }
  return out;
};

function centsToFloat(n) {
  const v = Number(n || 0);
  if (!Number.isFinite(v)) return 0;
  return v / 100;
}

function fxUsdToMxn() {
  const v = Number(process.env.FX_USD_TO_MXN || 0);
  return Number.isFinite(v) && v > 0 ? v : null;
}

async function stripeFetch(path) {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("Falta STRIPE_SECRET_KEY en el servidor.");

  const res = await fetch(`https://api.stripe.com${path}`, {
    headers: {
      Authorization: `Bearer ${key}`,
      "Stripe-Version": "2023-10-16",
    },
    cache: "no-store",
  });

  const j = await res.json().catch(() => null);
  if (!res.ok) {
    const msg = j?.error?.message || `Stripe error (${res.status})`;
    throw new Error(msg);
  }
  return j;
}

async function getFeeFromSession(sessionId) {
  const sid = encodeURIComponent(sessionId);

  const q = new URLSearchParams();
  q.append("expand[]", "payment_intent");
  q.append("expand[]", "payment_intent.latest_charge.balance_transaction");

  const s = await stripeFetch(`/v1/checkout/sessions/${sid}?${q.toString()}`);

  const bt =
    s?.payment_intent?.latest_charge?.balance_transaction ||
    s?.payment_intent?.charges?.data?.[0]?.balance_transaction ||
    null;

  if (!bt || typeof bt === "string") return { fee: 0, currency: null };

  const fee = centsToFloat(bt.fee);
  const currency = String(bt.currency || "").toLowerCase() || null;

  return { fee, currency };
}

async function mapLimit(items, limit, fn) {
  const results = [];
  let idx = 0;

  const workers = new Array(Math.max(1, limit)).fill(null).map(async () => {
    while (idx < items.length) {
      const i = idx++;
      try {
        results[i] = await fn(items[i]);
      } catch (e) {
        results[i] = { fee: 0, currency: null, error: String(e?.message || e) };
      }
    }
  });

  await Promise.all(workers);
  return results;
}

export async function POST(req) {
  try {
    const sb = serverSupabase();
    const token = getBearerToken(req);

    const { user, error: authErr } = await requireUserFromToken(sb, token);
    if (authErr) return json(401, { ok: false, error: "No autorizado" });

    const body = await req.json().catch(() => ({}));
    const orgId = String(body?.org_id || body?.organization_id || "").trim();
    const sessionIds = clampList(body?.stripe_session_ids || body?.sessions || [], 60);

    if (!isUuid(orgId)) return json(400, { ok: false, error: "org_id inválido" });
    if (!sessionIds.length) return json(400, { ok: false, error: "stripe_session_ids requerido" });

    const email = normEmail(user?.email);
    const { data: mem, error: memErr } = await sb
      .from("admin_users")
      .select("role,is_active")
      .eq("organization_id", orgId)
      .ilike("email", email)
      .eq("is_active", true)
      .maybeSingle();

    if (memErr) return json(500, { ok: false, error: memErr.message });

    const role = String(mem?.role || "").toLowerCase();
    if (!mem || !["owner", "admin", "ops"].includes(role)) {
      return json(403, { ok: false, error: "Permisos insuficientes" });
    }

    const fx = fxUsdToMxn();
    const rows = await mapLimit(sessionIds, 5, getFeeFromSession);

    let mxn = 0;
    const byCurrency = {};

    for (const r of rows) {
      const c = r?.currency || "unknown";
      byCurrency[c] = (byCurrency[c] || 0) + Number(r?.fee || 0);

      if (c === "mxn") mxn += Number(r.fee || 0);
      else if (c === "usd" && fx) mxn += Number(r.fee || 0) * fx;
    }

    return json(200, {
      ok: true,
      total_fee_mxn: Number(mxn.toFixed(2)),
      detail: byCurrency,
      fx_usd_to_mxn: fx,
    });
  } catch (e) {
    return json(500, { ok: false, error: String(e?.message || e) });
  }
}