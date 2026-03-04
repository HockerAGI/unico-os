// src/app/api/ai/route.js
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { serverSupabase, requireUserFromToken } from "@/lib/serverSupabase";
import { hasPerm } from "@/lib/authz";
import { writeAudit } from "@/lib/auditServer";

function json(status, payload) {
  return NextResponse.json(payload, { status });
}

function getBearerToken(req) {
  const h = req.headers.get("authorization") || "";
  const m = h.match(/^Bearer\s+(.+)$/i);
  return m ? m[1] : "";
}

const clamp = (v, n = 2500) => String(v ?? "").trim().slice(0, n);
const normEmail = (s) => String(s || "").trim().toLowerCase();

const isUuid = (s) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(s || "").trim());

function normalizeGeminiError(e) {
  const msg = String(e?.message || e || "");
  if (/model.*not found|404/i.test(msg)) return "Modelo de IA no disponible. Cambia GEMINI_MODEL (recomendado: gemini-2.5-flash-lite).";
  if (/api key|unauth|permission|denied|401|403/i.test(msg)) return "IA desconectada o sin permisos. Revisa GEMINI_API_KEY en Netlify.";
  return "Error interno en Unico IA.";
}

async function getMyRole(sb, orgId, user) {
  const myEmail = normEmail(user?.email);
  const uid = user?.id || "00000000-0000-0000-0000-000000000000";

  const q1 = await sb
    .from("admin_users")
    .select("role,is_active")
    .eq("org_id", orgId)
    .eq("is_active", true)
    .or(`user_id.eq.${uid},email.ilike.${myEmail}`)
    .limit(1)
    .maybeSingle();

  if (!q1?.error && q1?.data?.is_active) return String(q1.data.role || "").toLowerCase();

  const q2 = await sb
    .from("admin_users")
    .select("role,is_active")
    .eq("organization_id", orgId)
    .eq("is_active", true)
    .or(`user_id.eq.${uid},email.ilike.${myEmail}`)
    .limit(1)
    .maybeSingle();

  if (!q2?.data?.is_active) return null;
  return String(q2.data.role || "").toLowerCase();
}

async function selectOrdersByOrg(sb, orgId) {
  // try org_id then fallback organization_id
  const q1 = await sb.from("orders").select("amount_total_mxn,status").eq("org_id", orgId);
  if (!q1?.error) return q1.data || [];
  const q2 = await sb.from("orders").select("amount_total_mxn,status").eq("organization_id", orgId);
  return q2.data || [];
}

async function upsertSiteSettings(sb, orgId, payload) {
  // escribe ambos para compat
  const row = {
    ...payload,
    org_id: orgId,
    organization_id: orgId,
    updated_at: new Date().toISOString(),
  };

  // intenta conflict por org_id, luego organization_id
  try {
    const { error } = await sb.from("site_settings").upsert(row, { onConflict: "org_id" });
    if (error) throw error;
    return null;
  } catch {
    const { error } = await sb.from("site_settings").upsert(row, { onConflict: "organization_id" });
    return error || null;
  }
}

export async function POST(req) {
  try {
    const sb = serverSupabase();
    const token = getBearerToken(req);

    const { user, error: authErr } = await requireUserFromToken(sb, token);
    if (authErr) return json(401, { error: "No autorizado. Inicia sesión otra vez." });

    const body = await req.json().catch(() => ({}));
    const prompt = clamp(body.prompt ?? body.message ?? body.text, 2000);
    const orgId = clamp(body.orgId ?? body.organization_id ?? body.organizationId ?? body.org_id, 128);

    if (!prompt || !orgId) return json(400, { error: "Faltan datos. Se requiere 'message' o 'prompt' y 'org_id'/'organization_id'." });
    if (!isUuid(orgId)) return json(400, { error: "org_id inválido." });

    const role = await getMyRole(sb, orgId, user);
    if (!role || !hasPerm(role, "dashboard")) return json(403, { error: "Permisos insuficientes." });

    const geminiKey = process.env.GEMINI_API_KEY;
    if (!geminiKey) return json(503, { error: "Unico IA está desconectada: falta GEMINI_API_KEY en Netlify." });

    const modelName = process.env.GEMINI_MODEL || "gemini-2.5-flash-lite";

    const genAI = new GoogleGenerativeAI(geminiKey);
    const model = genAI.getGenerativeModel({
      model: modelName,
      systemInstruction:
        "Eres 'Unico IA', el agente ejecutivo-operativo del panel UnicOs. Hablas claro y directo. Si ejecutas acciones (promo, pixel, envíos, clientes, ventas), confirma lo hecho o explica el bloqueo con una solución.",
    });

    // ----- Tools (operativas reales) -----
    const tool_salesSummary = async () => {
      const rows = await selectOrdersByOrg(sb, orgId);
      const paid = (rows || []).filter((o) => ["paid", "fulfilled"].includes(String(o.status || "").toLowerCase()));
      const pending = (rows || []).filter((o) => !["paid", "fulfilled"].includes(String(o.status || "").toLowerCase()));
      const total = paid.reduce((acc, o) => acc + Number(o.amount_total_mxn || 0), 0);
      return `Ventas: ${paid.length} pagadas, ${pending.length} no pagadas. Ingresos pagados: $${total.toLocaleString("es-MX")} MXN.`;
    };

    const tool_setPromo = async (text) => {
      if (!hasPerm(role, "marketing")) return "No tienes permisos para activar promos (Marketing).";
      const promoText = clamp(text, 160);
      const err = await upsertSiteSettings(sb, orgId, { promo_active: true, promo_text: promoText });
      if (err) return `No pude activar el megáfono. Motivo: ${err.message}`;
      return `Megáfono ACTIVADO. Mensaje: "${promoText}"`;
    };

    const tool_disablePromo = async () => {
      if (!hasPerm(role, "marketing")) return "No tienes permisos para desactivar promos (Marketing).";
      const err = await upsertSiteSettings(sb, orgId, { promo_active: false, promo_text: null });
      if (err) return `No pude apagar el megáfono. Motivo: ${err.message}`;
      return "Megáfono APAGADO.";
    };

    const tool_setPixel = async (pixelIdRaw) => {
      if (!hasPerm(role, "marketing") && !hasPerm(role, "integrations")) return "No tienes permisos para configurar Pixel (Marketing/Integraciones).";
      const pixelId = clamp(pixelIdRaw, 80);
      const err = await upsertSiteSettings(sb, orgId, { pixel_id: pixelId });
      if (err) return `No pude guardar el Pixel. Motivo: ${err.message}`;
      return `Pixel guardado: ${pixelId}`;
    };

    // IA: decide tool context simple
    const p = prompt.toLowerCase();
    let toolContext = "";

    if (p.includes("ventas") || p.includes("reporte") || p.includes("ingresos")) toolContext += "\n" + (await tool_salesSummary());
    if (p.includes("activar promo")) toolContext += "\nTOOL_HINT: setPromo('<texto>')";
    if (p.includes("apagar promo") || p.includes("desactivar promo")) toolContext += "\nTOOL_HINT: disablePromo()";
    if (p.includes("pixel")) toolContext += "\nTOOL_HINT: setPixel('<id>')";

    const input = `CONTEXTO:\nOrg=${orgId}\nRol=${role}\n${toolContext}\n\nUSUARIO:\n${prompt}\n\nRESPUESTA:`;

    let reply = "";
    try {
      const out = await model.generateContent(input);
      reply = out?.response?.text?.() || "Listo.";
    } catch (e) {
      return json(500, { error: normalizeGeminiError(e) });
    }

    // Ejecutar acciones si el reply trae comandos (súper conservador)
    const exec = async () => {
      const r = reply || "";
      const m1 = r.match(/setPromo\(['"`](.+?)['"`]\)/i);
      const m2 = r.match(/disablePromo\(\)/i);
      const m3 = r.match(/setPixel\(['"`](.+?)['"`]\)/i);

      const logs = [];
      if (m1) logs.push(await tool_setPromo(m1[1]));
      if (m2) logs.push(await tool_disablePromo());
      if (m3) logs.push(await tool_setPixel(m3[1]));

      if (logs.length) reply += `\n\n—\nAcciones:\n- ${logs.join("\n- ")}`;
    };

    await exec();

    await writeAudit(sb, {
      organization_id: orgId,
      actor_email: normEmail(user?.email),
      actor_user_id: user?.id || null,
      action: "ai.chat",
      entity: "ai",
      entity_id: "gemini",
      summary: "AI request processed",
      meta: { len: prompt.length },
      ip: req.headers.get("x-forwarded-for") || null,
      user_agent: req.headers.get("user-agent") || null,
    });

    return json(200, { ok: true, reply });
  } catch (e) {
    return json(500, { error: String(e?.message || e) });
  }
}