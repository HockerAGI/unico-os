import { NextResponse } from "next/server";
import { serverSupabase, requireUserFromToken } from "@/lib/serverSupabase";
import { canManageUsers } from "@/lib/authz";

function json(status, body) { return NextResponse.json(body, { status }); }

function getBearerToken(req) {
  const m = (req.headers.get("authorization") || "").match(/^Bearer\s+(.+)$/i);
  return m ? m[1] : "";
}

export async function POST(req) {
  try {
    const sb = serverSupabase();
    const token = getBearerToken(req);
    const { user, error: authErr } = await requireUserFromToken(sb, token);
    if (authErr) return json(401, { error: authErr });

    const { organization_id, email, role } = await req.json();
    if (!organization_id || !email || !role) return json(400, { error: "Datos incompletos" });

    const cleanEmail = String(email).trim().toLowerCase();
    const cleanRole = String(role).trim().toLowerCase();

    // 1) Validar privilegios del solicitante EN ESA ORGANIZACIÓN
    const { data: reqUser, error: memErr } = await sb
      .from("admin_users")
      .select("role,is_active")
      .eq("organization_id", organization_id)
      .eq("email", String(user.email || "").trim().toLowerCase())
      .is("is_active", true)
      .maybeSingle();

    if (memErr) return json(500, { error: memErr.message });
    const reqRole = (reqUser?.role || "viewer").toLowerCase();
    if (!canManageUsers(reqRole)) return json(403, { error: "Privilegios insuficientes" });

    // 2) Invitar vía Supabase Auth
    const { error: invErr } = await sb.auth.admin.inviteUserByEmail(cleanEmail);
    if (invErr && !String(invErr.message || "").includes("already registered")) {
      return json(500, { error: invErr.message });
    }

    // 3) Upsert MULTI-TENANT (NO pisar por email)
    // Requiere UNIQUE (organization_id, email) en admin_users (te dejo SQL abajo)
    const { error: upErr } = await sb
      .from("admin_users")
      .upsert(
        { organization_id, email: cleanEmail, role: cleanRole, is_active: true },
        { onConflict: "organization_id,email" }
      );

    if (upErr) return json(500, { error: upErr.message });

    return json(200, { ok: true, email: cleanEmail, role: cleanRole, organization_id });
  } catch (e) {
    return json(500, { error: e?.message || "Server error" });
  }
}