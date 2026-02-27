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
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(s || "").trim());

const normEmail = (s) => String(s || "").trim().toLowerCase();
const toMajor = (minor) => Number(minor || 0) / 100;

function fxUsdToMxn() {
  const fx = Number(process.env.FX_USD_TO_MXN || NaN);
  return Number.isFinite(fx) && fx > 0 ? fx : null;
}

async function fetchStripeSession(sessionId, stripeKey) {
  const url = new URL(`https://api.stripe.com/v1/checkout/sessions/${sessionId}`);
  url.searchParams.append("expand[]", "payment_intent.latest_charge.balance_transaction");

  const res = await fetch(url.toString(), {
    method: "GET",
    headers: { Authorization: `Bearer ${stripeKey}` },
  });

  const data = await res.json().catch(() => null);
  if (!res.ok) throw new Error(data?.error?.message || `Stripe error (${res.status})`);
  return data;
}

function extractFee(session) {
  const bt = session?.payment_intent?.latest_charge?.balance_transaction;
  const fee = Number(bt?.fee || 0);
  const currency = String(bt?.currency || session?.currency || "mxn").toLowerCase();
  return { feeMinor: fee, currency };
}

export async function POST(req) {
  try {
    const stripeKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeKey) return json(200, { ok: false, mode: "estimate", error: "STRIPE_SECRET_KEY no configurado." });

    const sb = serverSupabase();
    const token = getBearerToken(req);
    const { user, error: authErr } = await requireUserFromToken(sb, token);
    if (authErr) return json(401, { ok: false, error: "No autorizado" });

    const body = await req.json().catch(() => ({}));
    const orgId = String(body?.org_id || "").trim();
    const ids = Array.isArray(body?.stripe_session_ids) ? body.stripe_session_ids : [];

    if (!isUuid(orgId) || !ids.length) return json(400, { ok: false, error: "org_id y stripe_session_ids requeridos." });

    // membership check
    const email = normEmail(user?.email);
    const { data: mem } = await sb
      .from("admin_users")
      .select("role,is_active")
      .eq("organization_id", orgId)
      .ilike("email", email)
      .eq("is_active", true)
      .maybeSingle();

    if (!mem) return json(403, { ok: false, error: "Acceso denegado." });

    // fetch sessions (limited concurrency)
    const sessionIds = ids.map((x) => String(x || "").trim()).filter(Boolean).slice(0, 120);
    const limit = 6;
    let idx = 0;

    const results = [];
    const worker = async () => {
      while (idx < sessionIds.length) {
        const id = sessionIds[idx++];
        try {
          const s = await fetchStripeSession(id, stripeKey);
          results.push({ id, session: s });
        } catch (e) {
          results.push({ id, error: String(e?.message || e) });
        }
      }
    };

    await Promise.all(Array.from({ length: Math.min(limit, sessionIds.length) }, worker));

    let totalMxn = 0;
    let usdMinor = 0;

    for (const r of results) {
      if (!r?.session) continue;
      const { feeMinor, currency } = extractFee(r.session);
      if (!feeMinor) continue;

      if (currency === "mxn") totalMxn += toMajor(feeMinor);
      else if (currency === "usd") usdMinor += feeMinor;
    }

    const fx = fxUsdToMxn();
    if (fx && usdMinor) totalMxn += toMajor(usdMinor) * fx;

    return json(200, {
      ok: true,
      mode: "stripe",
      total_fee_mxn: Number(totalMxn.toFixed(2)),
      processed: sessionIds.length,
      converted_usd: Boolean(fx && usdMinor),
      fx_usd_to_mxn: fx || null,
    });
  } catch (e) {
    return json(500, { ok: false, error: String(e?.message || e) });
  }
}