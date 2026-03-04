// src/app/api/invite/route.js
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { serverSupabase, requireUserFromToken } from "@/lib/serverSupabase";
import { canManageUsers } from "@/lib/authz";
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

  // Intenta org_id primero, luego organization_id
  const try1 = await sb
    .from("admin_users")
    .select("role,is_active")
    .eq("org_id", orgId)
    .eq("is_active", true)
    .or(`user_id.eq.${user?.id || "00000000-0000-0000-0000-000000000000"},email.ilike.${myEmail}`)
    .limit(1)
    .maybeSingle();

  if (!try1?.error && try1?.data?.is_active) return String(try1.data.role || "").toLowerCase();

  const try2 = await sb
    .from("admin_users")
    .select("role,is_active")
    .eq("organization_id", orgId)
    .eq("is_active", true)
    .or(`user_id.eq.${user?.id || "00000000-0000-0000-0000-000000000000"},email.ilike.${myEmail}`)
    .limit(1)
    .maybeSingle();

  if (!try2?.data?.is_active) return null;
  return String(try2.data.role || "").toLowerCase();
}

async function upsertInvite(sb, row) {
  try {
    const { error } = await sb.from("admin_users").upsert(row, { onConflict: "org_id,email" });
    if (error) throw error;
    return true;
  } catch {
    const { error } = await sb.from("admin_users").upsert(row, { onConflict: "organization_id,email" });
    if (error) throw error;
    return true;
  }
}

export async function POST(req) {
  try {
    const sb = serverSupabase();
    const token = getBearerToken(req);

    const { user, error: authErr } = await requireUserFromToken(sb, token);
    if (authErr) return json(401, { ok: false, error: "No autorizado" });

    const body = await req.json().catch(() => ({}));
    const orgId = String(body?.org_id || body?.organization_id || "").trim();
    const email = normEmail(body?.email);
    const role = String(body?.role || "viewer").trim().toLowerCase();

    if (!isUuid(orgId)) return json(400, { ok: false, error: "org_id inválido" });
    if (!email || !email.includes("@")) return json(400, { ok: false, error: "Email inválido" });

    const myRole = await getMyRole(sb, orgId, user);
    if (!myRole || !canManageUsers(myRole)) return json(403, { ok: false, error: "Permisos insuficientes" });

    const now = new Date().toISOString();

    await upsertInvite(sb, {
      org_id: orgId,
      organization_id: orgId,
      email,
      role,
      is_active: true,
      updated_at: now,
      created_at: now,
    });

    await writeAudit(sb, {
      organization_id: orgId,
      actor_email: normEmail(user?.email),
      actor_user_id: user?.id || null,
      action: "admin_users.invite",
      entity: "admin_users",
      entity_id: email,
      summary: `Invited ${email} as ${role}`,
      meta: { role },
      ip: req.headers.get("x-forwarded-for") || null,
      user_agent: req.headers.get("user-agent") || null,
    });

    return json(200, { ok: true });
  } catch (e) {
    return json(500, { ok: false, error: String(e?.message || e) });
  }
}