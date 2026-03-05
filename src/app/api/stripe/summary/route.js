import { NextResponse } from "next/server";
import { serverSupabase } from "@/lib/serverSupabase";
import { requireUserFromToken } from "@/lib/authServer";
import { hasPerm } from "@/lib/authz";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const STRIPE_KEY = process.env.STRIPE_SECRET_KEY || "";

const noStoreHeaders = {
  "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
  Pragma: "no-cache",
  Expires: "0",
};

const json = (data, status = 200) =>
  NextResponse.json(data, { status, headers: noStoreHeaders });

const num = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

const stripeFetch = async (path, params = {}) => {
  if (!STRIPE_KEY) throw new Error("STRIPE_SECRET_KEY no configurada en UnicOs");

  const url = new URL(`https://api.stripe.com${path}`);
  Object.entries(params).forEach(([k, v]) => {
    if (v === undefined || v === null || v === "") return;
    url.searchParams.set(k, String(v));
  });

  const res = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${STRIPE_KEY}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    cache: "no-store",
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = data?.error?.message || data?.message || `Stripe error (${res.status})`;
    throw new Error(msg);
  }
  return data;
};

const requireBearer = (req) => {
  const auth = req.headers.get("authorization") || "";
  return auth.startsWith("Bearer ") ? auth.slice(7).trim() : "";
};

export async function GET(req) {
  try {
    const token = requireBearer(req);
    const user = await requireUserFromToken(token);

    const { searchParams } = new URL(req.url);
    const orgId = String(searchParams.get("org_id") || "").trim();
    const days = Math.min(180, Math.max(7, Number(searchParams.get("days") || "30")));

    if (!orgId) return json({ ok: false, error: "Falta org_id" }, 400);

    // Permisos reales (igual patrón que fees route)
    const sb = serverSupabase();
    const { data: adminRow } = await sb
      .from("admin_users")
      .select("id, role, is_active, organization_id, user_id, email")
      .eq("organization_id", orgId)
      .eq("is_active", true)
      .or(`user_id.eq.${user.id},email.ilike.${user.email || ""}`)
      .limit(1)
      .maybeSingle();

    if (!adminRow) return json({ ok: false, error: "No autorizado" }, 403);
    if (!hasPerm(adminRow.role, "view_finance")) return json({ ok: false, error: "Sin permisos" }, 403);

    // Stripe “panel real”
    const [balance, payouts, charges] = await Promise.all([
      stripeFetch("/v1/balance"),
      stripeFetch("/v1/payouts", { limit: "10" }),
      stripeFetch("/v1/charges", { limit: "30" }),
    ]);

    // Resumen de periodo (por timestamp)
    const sinceTs = Math.floor((Date.now() - days * 24 * 3600 * 1000) / 1000);
    const recentCharges = (Array.isArray(charges?.data) ? charges.data : []).filter(
      (c) => num(c?.created) >= sinceTs
    );

    const agg = recentCharges.reduce(
      (acc, c) => {
        const amount = num(c?.amount || 0);
        const refunded = num(c?.amount_refunded || 0);
        acc.gross_cents += Math.max(0, amount);
        acc.refunded_cents += Math.max(0, refunded);
        acc.disputes += c?.disputed ? 1 : 0;
        return acc;
      },
      { gross_cents: 0, refunded_cents: 0, disputes: 0 }
    );

    return json({
      ok: true,
      scope: { org_id: orgId, days },
      kpi: {
        gross_stripe_mxn: Math.round((agg.gross_cents / 100) * 100) / 100,
        refunded_mxn: Math.round((agg.refunded_cents / 100) * 100) / 100,
        disputes: agg.disputes,
      },
      stripe_dashboard: {
        balance_available: balance?.available || [],
        balance_pending: balance?.pending || [],
        payouts: payouts?.data || [],
        charges: recentCharges.map((c) => ({
          id: c.id,
          created: c.created,
          status: c.status,
          paid: c.paid,
          amount: c.amount,
          amount_refunded: c.amount_refunded,
          currency: c.currency,
          disputed: !!c.disputed,
        })),
      },
      updated_at: new Date().toISOString(),
    });
  } catch (e) {
    return json({ ok: false, error: String(e?.message || e) }, 500);
  }
}