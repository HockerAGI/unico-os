// src/lib/dbScope.js

export const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isUuid(value) {
  return UUID_RE.test(String(value || "").trim());
}

export function normEmail(value) {
  return String(value || "").trim().toLowerCase();
}

export async function getMyRoleForOrg(sb, orgId, user) {
  const myEmail = normEmail(user?.email);
  const uid = user?.id || "00000000-0000-0000-0000-000000000000";

  const byOrgId = await sb
    .from("admin_users")
    .select("role,is_active")
    .eq("org_id", orgId)
    .eq("is_active", true)
    .or(`user_id.eq.${uid},email.ilike.${myEmail}`)
    .limit(1)
    .maybeSingle();

  if (!byOrgId?.error && byOrgId?.data?.is_active) {
    return String(byOrgId.data.role || "").toLowerCase();
  }

  const byOrganizationId = await sb
    .from("admin_users")
    .select("role,is_active")
    .eq("organization_id", orgId)
    .eq("is_active", true)
    .or(`user_id.eq.${uid},email.ilike.${myEmail}`)
    .limit(1)
    .maybeSingle();

  if (!byOrganizationId?.error && byOrganizationId?.data?.is_active) {
    return String(byOrganizationId.data.role || "").toLowerCase();
  }

  return null;
}

export function applyOrgFilter(query, orgId) {
  return query.or(`org_id.eq.${orgId},organization_id.eq.${orgId}`);
}

export async function selectOrdersByOrg(sb, orgId, select = "*") {
  const q = sb.from("orders").select(select);
  return applyOrgFilter(q, orgId);
}

export async function selectOneOrderByOrg(sb, orgId, orderId, select = "*") {
  const q = sb.from("orders").select(select).eq("id", orderId);
  return applyOrgFilter(q, orgId).maybeSingle();
}

export async function selectAuditByOrg(sb, orgId, select = "*") {
  const q = sb.from("audit_log").select(select);
  return applyOrgFilter(q, orgId);
}