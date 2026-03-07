export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { serverSupabase, requireUserFromToken } from "@/lib/serverSupabase";

const noStoreHeaders = {
  "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
  Pragma: "no-cache",
  Expires: "0",
};

const json = (data, status = 200) =>
  NextResponse.json(data, { status, headers: noStoreHeaders });

function getBearerToken(req) {
  const h = req.headers.get("authorization") || "";
  const m = h.match(/^Bearer\s+(.+)$/i);
  return m ? m[1] : "";
}

const normEmail = (s) => String(s || "").trim().toLowerCase();

export async function GET(req) {
  try {
    const sb = serverSupabase();
    const token = getBearerToken(req);

    const { user, error } = await requireUserFromToken(sb, token);
    if (error || !user) {
      return json({ ok: false, error: "No autorizado" }, 401);
    }

    const email = normEmail(user.email);

    const { data: adminRows, error: adminErr } = await sb
      .from("admin_users")
      .select("id, organization_id, org_id, role, is_active, email, user_id, created_at")
      .eq("is_active", true)
      .or(`user_id.eq.${user.id},email.ilike.${email}`)
      .order("created_at", { ascending: true })
      .limit(50);

    if (adminErr) {
      return json({ ok: false, error: adminErr.message || "No se pudo cargar admin_users" }, 500);
    }

    const rawMemberships = (adminRows || [])
      .map((row) => {
        const orgId = String(row?.organization_id || row?.org_id || "").trim();
        if (!orgId) return null;
        return {
          admin_id: row.id || null,
          organization_id: orgId,
          role: String(row?.role || "").trim().toLowerCase() || null,
          email: row?.email || "",
          user_id: row?.user_id || null,
          created_at: row?.created_at || null,
        };
      })
      .filter(Boolean);

    const seen = new Set();
    const memberships = rawMemberships.filter((row) => {
      const key = `${row.organization_id}::${row.role || ""}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    const orgIds = Array.from(new Set(memberships.map((m) => m.organization_id))).filter(Boolean);

    let orgMap = new Map();
    if (orgIds.length) {
      const { data: orgRows } = await sb
        .from("organizations")
        .select("id,name")
        .in("id", orgIds)
        .limit(orgIds.length);

      orgMap = new Map((orgRows || []).map((r) => [String(r.id), r]));
    }

    const membershipsWithName = memberships.map((m) => ({
      ...m,
      organization_name: orgMap.get(String(m.organization_id))?.name || null,
    }));

    const current = membershipsWithName[0] || null;

    return json({
      ok: true,
      id: user.id,
      email: user.email || "",
      organization_id: current?.organization_id || null,
      role: current?.role || null,
      organization_name: current?.organization_name || null,
      organizations: membershipsWithName,
    });
  } catch (e) {
    return json({ ok: false, error: String(e?.message || e) }, 500);
  }
}
