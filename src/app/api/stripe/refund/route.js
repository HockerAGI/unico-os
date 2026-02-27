// src/app/api/stripe/refund/route.js
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { serverSupabase, requireUserFromToken } from "@/lib/serverSupabase";

const json = (status, payload) => NextResponse.json(payload, { status });

function getBearerToken(req) {
  const h = req.headers.get("authorization") || "";
  const m = h.match(/^Bearer\s+(.+)$/i);
  return m ? m[1] : "";
}

const normEmail = (s) => String(s || "").trim().toLowerCase();

export async function POST(req) {
  try {
    const stripeKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeKey) return json(400, { ok: false, error: "Falta STRIPE_SECRET_KEY." });

    const sb = serverSupabase();
    const token = getBearerToken(req);

    const { user, error: authErr } = await requireUserFromToken(sb, token);
    if (authErr) return json(401, { ok: false, error: "No autorizado" });

    const body = await req.json().catch(() => ({}));
    const orgId = String(body?.org_id || "").trim();
    const orderId = String(body?.order_id || "").trim();

    if (!orgId || !orderId) return json(400, { ok: false, error: "org_id y order_id requeridos." });

    // membership check (solo owner/admin)
    const email = normEmail(user?.email);
    const { data: mem } = await sb
      .from("admin_users")
      .select("role,is_active")
      .eq("organization_id", orgId)
      .ilike("email", email)
      .eq("is_active", true)
      .maybeSingle();

    const role = String(mem?.role || "").toLowerCase();
    if (!mem || !["owner", "admin"].includes(role)) return json(403, { ok: false, error: "Permisos insuficientes." });

    // get order
    const { data: order, error: oErr } = await sb
      .from("orders")
      .select("id, stripe_payment_intent_id, stripe_session_id, status")
      .eq("organization_id", orgId)
      .eq("id", orderId)
      .maybeSingle();

    if (oErr || !order) return json(404, { ok: false, error: "Pedido no encontrado." });

    const pi = String(order?.stripe_payment_intent_id || "").trim();
    if (!pi) return json(400, { ok: false, error: "Este pedido no tiene payment_intent en DB." });

    // create refund via Stripe API
    const payload = new URLSearchParams();
    payload.set("payment_intent", pi);

    const res = await fetch("https://api.stripe.com/v1/refunds", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${stripeKey}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: payload.toString(),
    });

    const data = await res.json().catch(() => null);
    if (!res.ok) return json(400, { ok: false, error: data?.error?.message || "Stripe refund error." });

    // mark order status (soft)
    await sb
      .from("orders")
      .update({ status: "refunded", updated_at: new Date().toISOString() })
      .eq("organization_id", orgId)
      .eq("id", orderId);

    return json(200, { ok: true, refund: data });
  } catch (e) {
    return json(500, { ok: false, error: String(e?.message || e) });
  }
}