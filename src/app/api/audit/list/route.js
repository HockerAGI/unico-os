// src/app/api/audit/list/route.js
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { serverSupabase, requireUserFromToken } from "@/lib/serverSupabase";
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

  // Try org_id first
  const q1 = await sb
    .from("admin_users")
    .select("role,is_active")
    .eq("org_id", orgId)
    .eq("is_active", true)
    .or(`user_id.eq.${user?.id || "00000000-0000-0000-0000-000000000000"},email.ilike.${myEmail}`)
    .limit(1)
    .maybeSingle();

  if (!q1?.error && q1?.data?.is_active) return String(q1.data.role || "").toLowerCase();

  // Fallback organization_id
  const q2 = await sb
    .from("admin_users")
    .select("role,is_active")
    .eq("organization_id", orgId)
    .eq("is_active", true)
    .or(`user_id.eq.${user?.id || "00000000-0000-0000-0000-000000000000"},email.ilike.${myEmail}`)
    .limit(1)
    .maybeSingle();

  if (!q2?.data?.is_active) return null;
  return String(q2.data.role || "").toLowerCase();
}

export async function GET(req) {
  try {
    const sb = serverSupabase();
    const token = getBearerToken(req);

    const { user, error: authErr } = await requireUserFromToken(sb, token);
    if (authErr) return json(401, { ok: false, error: "No autorizado" });

    const { searchParams } = new URL(req.url);
    const orgId = String(searchParams.get("org_id") || "").trim();
    const limitRaw = Number(searchParams.get("limit") || 80);
    const limit = Number.isFinite(limitRaw) ? Math.max(1, Math.min(200, Math.floor(limitRaw))) : 80;

    if (!isUuid(orgId)) return json(400, { ok: false, error: "org_id inválido" });

    const role = await getMyRole(sb, orgId, user);
    if (!role || !["owner", "admin"].includes(role)) {
      return json(403, { ok: false, error: "Permisos insuficientes" });
    }

    const { data: rows, error } = await sb
      .from("audit_log")
      .select("id, created_at, actor_email, action, entity, entity_id, summary, meta, org_id, organization_id")
      .or(`org_id.eq.${orgId},organization_id.eq.${orgId}`)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) return json(200, { ok: true, rows: [] });

    await writeAudit(sb, {
      organization_id: orgId,
      actor_email: normEmail(user?.email),
      actor_user_id: user?.id || null,
      action: "audit.list",
      entity: "audit_log",
      entity_id: String(limit),
      summary: "Listed audit log",
      meta: { limit },
      ip: req.headers.get("x-forwarded-for") || null,
      user_agent: req.headers.get("user-agent") || null,
    });

    return json(200, { ok: true, rows: rows || [] });
  } catch (e) {
    return json(500, { ok: false, error: String(e?.message || e) });
  }
}