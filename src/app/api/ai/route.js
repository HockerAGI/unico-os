// src/app/api/ai/route.js
export const dynamic = 'force-dynamic'; // Vacuna Riesgo 1: Evita que Next.js cachee las respuestas de la IA

import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { serverSupabase, requireUserFromToken } from "@/lib/serverSupabase";

function getBearerToken(req) {
  const h = req.headers.get("authorization") || "";
  const m = h.match(/^Bearer\s+(.+)$/i);
  return m ? m[1] : "";
}

export async function POST(req) {
  try {
    const sb = serverSupabase();
    const token = getBearerToken(req);

    const { user, error: authErr } = await requireUserFromToken(sb, token);
    if (authErr) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    const body = await req.json().catch(() => ({}));

    // ✅ FIX REAL: compatibilidad con el contrato viejo y el nuevo
    const prompt = String(body.prompt ?? body.message ?? body.text ?? "").trim();
    const orgId = String(
      body.orgId ?? body.organization_id ?? body.organizationId ?? body.org_id ?? ""
    ).trim();

    if (!prompt || !orgId) {
      return NextResponse.json(
        { error: "Faltan datos (se requiere prompt/message y orgId/organization_id)" },
        { status: 400 }
      );
    }

    // ✅ FIX REAL: no crashear si falta GEMINI_API_KEY en producción
    const geminiKey = process.env.GEMINI_API_KEY;
    if (!geminiKey) {
      return NextResponse.json(
        { error: "Unico IA desconectada: falta GEMINI_API_KEY en variables de entorno (Netlify Production)." },
        { status: 503 }
      );
    }

    const genAI = new GoogleGenerativeAI(geminiKey);

    const model = genAI.getGenerativeModel({
      model: process.env.GEMINI_MODEL || "gemini-1.5-flash",
      systemInstruction:
        "Eres 'Unico IA', el agente autónomo de élite del panel UnicOs. Administras la tienda 'Score Store'. Tu tono es profesional, conciso y tecnológico. Respondes sin tecnicismos innecesarios y con pasos accionables. Si actualizas una promo, debe reflejarse en el módulo 'Megáfono Global'."
    });

    const getMetricsTool = async () => {
      const { data, error } = await sb
        .from("orders")
        .select("amount_total_mxn")
        .eq("organization_id", orgId)
        .eq("status", "paid");

      if (error) return `No pude leer ventas (orders). Motivo: ${error.message}`;

      const total = (data || []).reduce((acc, curr) => acc + Number(curr.amount_total_mxn || 0), 0);
      return `Los ingresos totales pagados son $${total.toLocaleString("es-MX")} MXN de ${data?.length || 0} pedidos.`;
    };

    // ✅ FIX REAL: usar el MISMO esquema que usa el front (site_settings: key/value)
    const updatePromoTool = async (promoText) => {
      const cleanText = String(promoText || "").trim().slice(0, 160);

      const { error } = await sb
        .from("site_settings")
        .upsert(
          {
            organization_id: orgId,
            key: "active_promo",
            value: cleanText,
            updated_at: new Date().toISOString()
          },
          { onConflict: "organization_id, key" }
        );

      if (error) return `No pude activar el megáfono. Motivo: ${error.message}`;
      return `Éxito. El megáfono ahora está activo y dice: "${cleanText}".`;
    };

    let finalResponse = "";
    const p = prompt.toLowerCase();

    if (p.includes("venta") || p.includes("ingreso") || p.includes("dinero") || p.includes("resumen")) {
      const metrics = await getMetricsTool();
      const result = await model.generateContent(
        `El usuario preguntó: "${prompt}". Los datos reales del sistema son: ${metrics}. Responde de forma ejecutiva y con siguiente acción recomendada.`
      );
      finalResponse = result.response.text();
    }
    else if (p.includes("promo") || p.includes("marketing") || p.includes("cintillo") || p.includes("megáfono")) {
      const copyResult = await model.generateContent(
        `El usuario quiere una promoción: "${prompt}". Escribe SOLO UNA FRASE CORTA, persuasiva, en MAYÚSCULAS con 1-2 emojis para un cintillo de tienda online. Nada más.`
      );
      const copy = copyResult.response.text().trim();
      const status = await updatePromoTool(copy);
      finalResponse = `Listo. ${status}`;
    }
    else {
      const result = await model.generateContent(prompt);
      finalResponse = result.response.text();
    }

    return NextResponse.json({ reply: finalResponse });

  } catch (error) {
    console.error("Error en Unico IA:", error);
    return NextResponse.json({ error: "Error en el procesamiento neuronal." }, { status: 500 });
  }
}