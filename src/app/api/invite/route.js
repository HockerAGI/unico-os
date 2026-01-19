// src/app/api/invite/route.js
import { NextResponse } from "next/server";
import { serverSupabase } from "@/lib/serverSupabase";

function json(status, body) {
  return NextResponse.json(body, { status });
}

export async function POST(req) {
  try {
    const sb = serverSupabase();
    const body = await req.json();

    const { org_id, email, role, requester_user_id } = body || {};
    if (!org_id || !email || !role || !requester_user_id) {
      return json(400, { error: "Missing org_id/email/role/requester_user_id" });
    }

    // Verifica que requester sea admin/owner en esa org
    const { data: requesterMem, error: memErr } = await sb
      .from("org_memberships")
      .select("role")
      .eq("org_id", org_id)
      .eq("user_id", requester_user_id)
      .maybeSingle();

    if (memErr) return json(500, { error: memErr.message });
    const rr = (requesterMem?.role || "viewer").toLowerCase();
    if (!(rr === "owner" || rr === "admin")) {
      return json(403, { error: "Not allowed" });
    }

    // 1) crea usuario (si no existe) con invitación por email
    // Nota: createUser crea usuario. Para “invitar” con email, Supabase ofrece inviteUserByEmail.
    // Usamos inviteUserByEmail para flujo limpio.
    const { data: invited, error: invErr } = await sb.auth.admin.inviteUserByEmail(email, {
      redirectTo: process.env.NEXT_PUBLIC_INVITE_REDIRECT || undefined
    });

    if (invErr) return json(500, { error: invErr.message });

    const newUserId = invited?.user?.id;
    if (!newUserId) return json(500, { error: "Invite created but user id missing" });

    // 2) upsert membership
    const { error: upErr } = await sb
      .from("org_memberships")
      .upsert(
        { org_id, user_id: newUserId, role: role.toLowerCase() },
        { onConflict: "org_id,user_id" }
      );

    if (upErr) return json(500, { error: upErr.message });

    return json(200, { ok: true, user_id: newUserId });
  } catch (e) {
    return json(500, { error: e?.message || "Server error" });
  }
}