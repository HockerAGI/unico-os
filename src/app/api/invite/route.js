// src/app/api/invite/route.js
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { serverSupabase, requireUserFromToken } from "@/lib/serverSupabase";
import { hasPerm } from "@/lib/authz";
import { writeAudit } from "@/lib/auditServer";

function bearerToken(req) {
  const h = req.headers.get("authorization") || "";
  const m = h.match(/^Bearer\s+(.+)$/i);
  return m ? m[1] : "";
}

function json(status, payload) {
  return NextResponse.json(payload, { status });
}

const isUuid = (s) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(s || "").trim());

const normEmail = (s) => String(s || "").trim().toLowerCase();

async function getMyRole(sb, orgId, user) {
  const myEmail = normEmail(user?.email);
  const { data: me } = await sb
    .from("admin_users")
    .select("role,is_active")
    .eq("organization_id", orgId)
    .eq("is_active", true)
    .or(`user_id.eq.${user?.id || "00000000-0000-0000-0000-000000000000"},email.ilike.${myEmail}`)
    .limit(1)
    .maybeSingle();

  if (!me?.is_active) return null;
  return String(me?.role || "").toLowerCase();
}

export async function POST(req) {
  try {
    const sb = serverSupabase();
    const token = bearerToken(req);
    const { user, error: authErr } = await requireUserFromToken(sb, token);
    if (authErr) return json(401, { ok: false, error: "No autorizado" });

    const body = await req.json().catch(() => ({}));
    const orgId = String(body?.organization_id || "").trim();
    const email = normEmail(body?.email);
    const role = String(body?.role || "viewer").toLowerCase();

    if (!isUuid(orgId)) return json(400, { ok: false, error: "organization_id inválido" });
    if (!email) return json(400, { ok: false, error: "Email inválido" });

    const myRole = await getMyRole(sb, orgId, user);
    if (!myRole || !hasPerm(myRole, "users")) return json(403, { ok: false, error: "Permisos insuficientes" });

    // Upsert membership (invitar = crear acceso)
    const { error } = await sb.from("admin_users").upsert(
      {
        organization_id: orgId,
        email,
        role,
        is_active: true,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "organization_id,email" }
    );

    if (error) return json(500, { ok: false, error: error.message || "No se pudo invitar" });

    await writeAudit(sb, {
      organization_id: orgId,
      actor_email: normEmail(user?.email),
      actor_user_id: user?.id || null,
      action: "admin_users.invite",
      entity: "admin_users",
      entity_id: email,
      summary: `Invite ${email} as ${role}`,
      meta: { email, role },
      ip: req.headers.get("x-forwarded-for") || null,
      user_agent: req.headers.get("user-agent") || null,
    });

    return json(200, { ok: true });
  } catch (e) {
    return json(500, { ok: false, error: String(e?.message || e) });
  }
}