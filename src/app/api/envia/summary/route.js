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

const safeNum = (v, d = 0) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : d;
};

const safeStr = (v, d = "") => (typeof v === "string" ? v : v == null ? d : String(v));
const normEmail = (s) => safeStr(s).trim().toLowerCase();

function isUuid(v) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    safeStr(v).trim()
  );
}

async function getMyRoleForOrg(sb, orgId, user) {
  const email = normEmail(user?.email);
  const uid = safeStr(user?.id);

  const q1 = await sb
    .from("admin_users")
    .select("role,is_active,organization_id,org_id,email,user_id")
    .eq("is_active", true)
    .or(`organization_id.eq.${orgId},org_id.eq.${orgId}`)
    .or(`email.ilike.${email},user_id.eq.${uid}`)
    .limit(20);

  if (!q1.error && Array.isArray(q1.data) && q1.data.length) {
    const exact =
      q1.data.find((r) => safeStr(r?.organization_id || r?.org_id) === safeStr(orgId)) || q1.data[0];
    return safeStr(exact?.role).toLowerCase();
  }

  return null;
}

function canRead(role) {
  return ["owner", "admin", "marketing", "support", "operations"].includes(
    safeStr(role).toLowerCase()
  );
}

function pickShipmentDate(row) {
  return (
    row?.shipped_at ||
    row?.fulfilled_at ||
    row?.updated_at ||
    row?.created_at ||
    null
  );
}

function pickTracking(row) {
  return (
    safeStr(row?.tracking_number) ||
    safeStr(row?.tracking_no) ||
    safeStr(row?.tracking) ||
    safeStr(row?.envia_tracking_number) ||
    ""
  );
}

function pickCarrier(row) {
  return (
    safeStr(row?.carrier) ||
    safeStr(row?.shipping_carrier) ||
    safeStr(row?.envia_carrier) ||
    ""
  );
}

function pickShipmentStatus(row) {
  const raw =
    safeStr(row?.shipping_status) ||
    safeStr(row?.envia_status) ||
    safeStr(row?.shipment_status) ||
    safeStr(row?.status);

  return raw.toLowerCase();
}

function statusBucket(status) {
  const s = safeStr(status).toLowerCase();

  if (!s) return "unknown";
  if (["delivered", "entregado"].includes(s)) return "delivered";
  if (
    [
      "shipped",
      "in_transit",
      "transit",
      "en_transito",
      "label_created",
      "picked_up",
      "out_for_delivery",
      "guia_generada",
    ].includes(s)
  ) {
    return "in_transit";
  }
  if (["exception", "failed", "returned", "cancelled", "canceled", "error"].includes(s)) {
    return "issue";
  }
  if (["fulfilled"].includes(s)) return "fulfilled";
  return "other";
}

export async function GET(req) {
  try {
    const sb = serverSupabase();
    const token = getBearerToken(req);

    const { user, error: authErr } = await requireUserFromToken(sb, token);
    if (authErr || !user) {
      return json({ ok: false, error: "No autorizado." }, 401);
    }

    const { searchParams } = new URL(req.url);
    const orgId = safeStr(searchParams.get("org_id")).trim();
    const days = Math.max(7, Math.min(180, safeNum(searchParams.get("days"), 30)));

    if (!isUuid(orgId)) {
      return json({ ok: false, error: "org_id inválido." }, 400);
    }

    const role = await getMyRoleForOrg(sb, orgId, user);
    if (!role) return json({ ok: false, error: "Sin acceso a esta organización." }, 403);
    if (!canRead(role)) return json({ ok: false, error: "Permisos insuficientes." }, 403);

    const sinceIso = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

    const { data: orders, error: ordersErr } = await sb
      .from("orders")
      .select(`
        id,
        created_at,
        updated_at,
        fulfilled_at,
        shipped_at,
        amount_total_mxn,
        shipping_total_mxn,
        envia_cost_mxn,
        status,
        shipping_status,
        shipment_status,
        envia_status,
        tracking_number,
        tracking_no,
        tracking,
        envia_tracking_number,
        carrier,
        shipping_carrier,
        envia_carrier,
        org_id,
        organization_id
      `)
      .or(`org_id.eq.${orgId},organization_id.eq.${orgId}`)
      .gte("created_at", sinceIso)
      .order("created_at", { ascending: false })
      .limit(800);

    if (ordersErr) {
      return json({ ok: false, error: ordersErr.message || "No se pudieron leer órdenes." }, 500);
    }

    const rows = Array.isArray(orders) ? orders : [];

    const shipments = rows
      .map((row) => {
        const tracking = pickTracking(row);
        const shipmentStatus = pickShipmentStatus(row);
        const hasShipmentSignal =
          !!tracking ||
          !!safeStr(row?.envia_status) ||
          !!safeStr(row?.shipping_status) ||
          !!safeStr(row?.shipment_status) ||
          safeStr(row?.status).toLowerCase() === "fulfilled";

        if (!hasShipmentSignal) return null;

        return {
          order_id: row.id,
          created_at: row.created_at || null,
          shipment_date: pickShipmentDate(row),
          tracking_number: tracking || null,
          carrier: pickCarrier(row) || null,
          raw_status: shipmentStatus || null,
          status_bucket: statusBucket(shipmentStatus),
          shipping_total_mxn: safeNum(row?.shipping_total_mxn, 0),
          envia_cost_mxn: safeNum(row?.envia_cost_mxn, 0),
          amount_total_mxn: safeNum(row?.amount_total_mxn, 0),
        };
      })
      .filter(Boolean);

    const shipmentsCount = shipments.length;
    const deliveredCount = shipments.filter((x) => x.status_bucket === "delivered").length;
    const transitCount = shipments.filter((x) => x.status_bucket === "in_transit").length;
    const issueCount = shipments.filter((x) => x.status_bucket === "issue").length;

    const totalShippingCharged = shipments.reduce(
      (acc, row) => acc + safeNum(row.shipping_total_mxn, 0),
      0
    );
    const totalEnviaCost = shipments.reduce(
      (acc, row) => acc + safeNum(row.envia_cost_mxn, 0),
      0
    );

    const uniqueCarriers = Array.from(
      new Set(
        shipments
          .map((x) => safeStr(x.carrier).trim())
          .filter(Boolean)
      )
    );

    const lastShipmentAt = shipments
      .map((x) => x.shipment_date)
      .filter(Boolean)
      .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())[0] || null;

    return json({
      ok: true,
      scope: {
        org_id: orgId,
        days,
        role,
      },
      summary: {
        shipments_count: shipmentsCount,
        delivered_count: deliveredCount,
        in_transit_count: transitCount,
        issue_count: issueCount,
        shipping_collected_mxn: Math.round(totalShippingCharged * 100) / 100,
        envia_cost_mxn: Math.round(totalEnviaCost * 100) / 100,
        last_shipment_at: lastShipmentAt,
        carriers: uniqueCarriers,
      },
      rows: shipments.slice(0, 100),
      updated_at: new Date().toISOString(),
    });
  } catch (e) {
    return json({ ok: false, error: String(e?.message || e) }, 500);
  }
}
