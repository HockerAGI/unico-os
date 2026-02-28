// src/app/api/orders/bulk-update/route.js
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
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
    String(s || "").trim()
  );

const normEmail = (s) => String(s || "").trim().toLowerCase();

const ALLOWED_STATUS = new Set([
  "pending",
  "pending_payment",
  "paid",
  "payment_failed",
  "fulfilled",
  "cancelled",
  "refunded",
]);

function clampIds(arr, max = 120) {
  const out = [];
  for (const v of Array.isArray(arr) ? arr : []) {
    const s = String(v || "").trim();
    if (!isUuid(s)) continue;
    out.push(s);
    if (out.length >= max) break;
  }
  return out;
}

async function getMyRole(sb, orgId, user) {
  const myEmail = normEmail(user?.email);

  const { data: mem } = await sb
    .from("admin_users")
    .select("role,is_active")
    .eq("organization_id", orgId)
    .eq("is_active", true)
    .or(
      `user_id.eq.${user?.id || "00000000-0000-0000-0000-000000000000"},email.ilike.${myEmail}`
    )
    .limit(1)
    .maybeSingle();

  if (!mem?.is_active) return null;
  return String(mem?.role || "").toLowerCase();
}

export async function POST(req) {
  try {
    const sb = serverSupabase();
    const token = getBearerToken(req);

    const { user, error: authErr } = await requireUserFromToken(sb, token);
    if (authErr) return json(401, { ok: false, error: "No autorizado" });

    const body = await req.json().catch(() => ({}));
    const orgId = String(body?.org_id || "").trim();
    const orderIds = clampIds(body?.order_ids, 150);
    const patch = body?.patch && typeof body.patch === "object" ? body.patch : {};

    if (!isUuid(orgId)) return json(400, { ok: false, error: "org_id inválido" });
    if (!orderIds.length) return json(400, { ok: false, error: "order_ids vacío" });

    const role = await getMyRole(sb, orgId, user);
    if (!role || !hasPerm(role, "orders")) return json(403, { ok: false, error: "Permisos insuficientes" });

    const newStatus = String(patch?.status || "").trim().toLowerCase();
    if (!ALLOWED_STATUS.has(newStatus)) return json(400, { ok: false, error: "status inválido" });

    const now = new Date().toISOString();

    const { data: updated, error: eUpd } = await sb
      .from("orders")
      .update({ status: newStatus, updated_at: now })
      .eq("organization_id", orgId)
      .in("id", orderIds)
      .select("id,status,updated_at");

    if (eUpd) return json(400, { ok: false, error: eUpd.message });

    await writeAudit(sb, {
      organization_id: orgId,
      actor_email: normEmail(user?.email),
      actor_user_id: user?.id || null,
      action: "orders.bulk_update_status",
      entity: "orders",
      entity_id: String(orderIds.length),
      summary: `Bulk updated ${orderIds.length} orders to ${newStatus}`,
      meta: { count: orderIds.length, status: newStatus },
      ip: req.headers.get("x-forwarded-for") || null,
      user_agent: req.headers.get("user-agent") || null,
    });

    return json(200, { ok: true, updated: updated || [] });
  } catch (e) {
    return json(500, { ok: false, error: String(e?.message || e) });
  }
}