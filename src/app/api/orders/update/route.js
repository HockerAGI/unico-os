import { NextResponse } from "next/server";
import { serverSupabase, requireUserFromToken } from "@/lib/serverSupabase";
import { canWriteOrders } from "@/lib/authz";

function json(status, body) {
  return NextResponse.json(body, { status });
}

function getBearerToken(req) {
  const h = req.headers.get("authorization") || "";
  const m = h.match(/^Bearer\s+(.+)$/i);
  return m ? m[1] : "";
}

// Solo permitimos estos campos desde el panel:
const ALLOWED_ORDER_PATCH_KEYS = new Set([
  "status",
  "tracking_number",
  "shipping_cost",
  "stripe_fee",
  "notes_internal"
]);

function sanitizePatch(patch) {
  const clean = {};
  const src = patch && typeof patch === "object" ? patch : {};
  for (const k of Object.keys(src)) {
    if (ALLOWED_ORDER_PATCH_KEYS.has(k)) clean[k] = src[k];
  }
  return clean;
}

export async function POST(req) {
  try {
    const sb = serverSupabase();
    const token = getBearerToken(req);

    // 1) user real
    const { user, error: authErr } = await requireUserFromToken(sb, token);
    if (authErr) return json(401, { error: authErr });

    // 2) body
    const body = await req.json();
    const { org_id, order_id, patch } = body || {};
    if (!org_id || !order_id || !patch) {
      return json(400, { error: "Missing org_id/order_id/patch" });
    }

    // 3) membership real
    const { data: mem, error: memErr } = await sb
      .from("org_memberships")
      .select("role")
      .eq("org_id", org_id)
      .eq("user_id", user.id)
      .maybeSingle();

    if (memErr) return json(500, { error: memErr.message });

    const role = (mem?.role || "viewer").toLowerCase();
    if (!canWriteOrders(role)) return json(403, { error: "Not allowed" });

    // 4) sanitize patch
    const cleanPatch = sanitizePatch(patch);
    if (!Object.keys(cleanPatch).length) {
      return json(400, { error: "Patch has no allowed fields" });
    }

    // 5) update
    const { data, error } = await sb
      .from("orders")
      .update(cleanPatch)
      .eq("org_id", org_id)
      .eq("id", order_id)
      .select("*")
      .single();

    if (error) return json(500, { error: error.message });

    return json(200, { ok: true, order: data });
  } catch (e) {
    return json(500, { error: e?.message || "Server error" });
  }
}