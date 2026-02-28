// src/lib/auditServer.js
export async function writeAudit(sb, payload) {
  try {
    const row = {
      organization_id: payload.organization_id,
      actor_email: payload.actor_email || null,
      actor_user_id: payload.actor_user_id || null,
      action: payload.action,
      entity: payload.entity || null,
      entity_id: payload.entity_id || null,
      summary: payload.summary || null,
      before: payload.before || null,
      after: payload.after || null,
      meta: payload.meta || null,
      ip: payload.ip || null,
      user_agent: payload.user_agent || null,
    };

    if (!row.organization_id || !row.action) return;

    // si audit_log no existe aún, no rompemos el flujo
    await sb.from("audit_log").insert(row);
  } catch {
    // silence (no rompemos producción por auditoría)
  }
}