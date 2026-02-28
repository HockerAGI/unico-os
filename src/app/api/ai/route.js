// src/app/api/ai/route.js
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
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
    String(s || "").trim()
  );

const normEmail = (s) => String(s || "").trim().toLowerCase();

function cleanMsg(s, max = 2400) {
  return String(s ?? "").trim().slice(0, max);
}

function parseQuotedText(input) {
  const m = String(input || "").match(/"([^"]+)"/);
  return m ? m[1].trim() : "";
}

function parsePixelId(input) {
  const m = String(input || "").match(/(\d{10,20})/);
  return m ? m[1] : "";
}

async function getRole(sb, orgId, email) {
  const { data } = await sb
    .from("admin_users")
    .select("role,is_active")
    .eq("organization_id", orgId)
    .ilike("email", email)
    .eq("is_active", true)
    .maybeSingle();
  return { role: String(data?.role || "").toLowerCase(), exists: !!data };
}

function canMarketing(role) {
  return ["owner", "admin", "marketing"].includes(role);
}

async function actionPromo(sb, orgId, on, textMaybe) {
  const payload = {
    organization_id: orgId,
    promo_active: !!on,
    promo_text: on ? (String(textMaybe || "").trim() || "PROMO ACTIVA") : null,
    updated_at: new Date().toISOString(),
  };
  const { error } = await sb.from("site_settings").upsert(payload, { onConflict: "organization_id" });
  if (error) throw new Error(error.message);
  return payload;
}

async function actionPixel(sb, orgId, pixelId) {
  const payload = {
    organization_id: orgId,
    pixel_id: String(pixelId || "").trim() || null,
    updated_at: new Date().toISOString(),
  };
  const { error } = await sb.from("site_settings").upsert(payload, { onConflict: "organization_id" });
  if (error) throw new Error(error.message);
  return payload;
}

async function geminiReply(message, context) {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return "IA no disponible: falta GEMINI_API_KEY en el servidor.";

  const model = process.env.GEMINI_MODEL || "gemini-2.5-flash-lite";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(key)}`;

  const sys = `Eres Unico IA para UnicOs Admin (Score Store).
Responde en español claro, directo y accionable.
Nunca inventes datos; si no puedes leerlos desde DB, dilo y pide el dato mínimo.
Comandos:
- Activa promo: "TEXTO"
- Apaga promo
- Configura pixel: 123...
- Resumen ventas
- Top clientes
- Envíos pendientes`;

  const payload = {
    contents: [
      { role: "user", parts: [{ text: `${sys}\n\nContexto:\n${context}\n\nUsuario:\n${message}` }] },
    ],
    generationConfig: { temperature: 0.3, maxOutputTokens: 500 },
  };

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const j = await res.json().catch(() => null);
  if (!res.ok) {
    const msg = j?.error?.message || `Gemini error (${res.status})`;
    return `IA error: ${msg}`;
  }

  const text =
    j?.candidates?.[0]?.content?.parts?.map((p) => p.text).join("") || "OK.";
  return String(text).trim();
}

export async function POST(req) {
  try {
    const sb = serverSupabase();
    const token = getBearerToken(req);

    const { user, error: authErr } = await requireUserFromToken(sb, token);
    if (authErr) return json(401, { ok: false, error: "No autorizado" });

    const body = await req.json().catch(() => ({}));
    const message = cleanMsg(body?.message);
    const orgId = String(body?.organization_id || "").trim();

    if (!message) return json(400, { ok: false, error: "message requerido." });
    if (!isUuid(orgId)) return json(400, { ok: false, error: "organization_id inválido." });

    const email = normEmail(user?.email);
    const { role, exists } = await getRole(sb, orgId, email);
    if (!exists) return json(403, { ok: false, error: "Acceso denegado." });

    const m = message.toLowerCase();

    // === ACTION ROUTER (real ops) ===
    if (m.includes("activa promo") || m.includes("activar promo")) {
      if (!canMarketing(role)) return json(200, { ok: true, reply: "No tengo permisos para cambiar marketing." });

      const text = parseQuotedText(message) || message.split(":").slice(1).join(":").trim();
      const after = await actionPromo(sb, orgId, true, text);

      await writeAudit(sb, {
        organization_id: orgId,
        actor_email: email,
        actor_user_id: user?.id || null,
        action: "site_settings.promo_on",
        entity: "site_settings",
        entity_id: orgId,
        summary: `Promo ON: ${after.promo_text || ""}`.slice(0, 180),
        after,
        meta: { role },
        ip: req.headers.get("x-forwarded-for") || null,
        user_agent: req.headers.get("user-agent") || null,
      });

      return json(200, { ok: true, reply: `Listo. Promo activada: "${after.promo_text}".` });
    }

    if (m.includes("apaga promo") || m.includes("desactiva promo")) {
      if (!canMarketing(role)) return json(200, { ok: true, reply: "No tengo permisos para cambiar marketing." });

      const after = await actionPromo(sb, orgId, false, "");

      await writeAudit(sb, {
        organization_id: orgId,
        actor_email: email,
        actor_user_id: user?.id || null,
        action: "site_settings.promo_off",
        entity: "site_settings",
        entity_id: orgId,
        summary: "Promo OFF",
        after,
        meta: { role },
      });

      return json(200, { ok: true, reply: "Listo. Promo apagada." });
    }

    if (m.includes("configura pixel") || m.includes("configurar pixel") || m.includes("pixel")) {
      if (!canMarketing(role)) return json(200, { ok: true, reply: "No tengo permisos para cambiar el Pixel." });

      const pid = parsePixelId(message);
      if (!pid) return json(200, { ok: true, reply: "Pásame el Pixel ID (solo números) para configurarlo." });

      const after = await actionPixel(sb, orgId, pid);

      await writeAudit(sb, {
        organization_id: orgId,
        actor_email: email,
        actor_user_id: user?.id || null,
        action: "site_settings.pixel_set",
        entity: "site_settings",
        entity_id: orgId,
        summary: `Pixel set: ${pid}`,
        after,
        meta: { role },
      });

      return json(200, { ok: true, reply: `Listo. Pixel configurado: ${pid}.` });
    }

    // fallback Gemini
    const context = `Rol: ${role}\nOrg: ${orgId}\n`;
    const reply = await geminiReply(message, context);
    return json(200, { ok: true, reply });
  } catch (e) {
    return json(500, { ok: false, error: String(e?.message || e) });
  }
}