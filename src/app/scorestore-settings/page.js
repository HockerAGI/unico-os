"use client";

import React, { useEffect, useMemo, useState } from "react";
import clsx from "clsx";
import {
  RefreshCcw,
  Save,
  UploadCloud,
  HelpCircle,
  ArrowLeft,
  ExternalLink,
} from "lucide-react";

import { supabase, SUPABASE_CONFIGURED } from "@/lib/supabase";

const SCORE_ORG_ID = "1f3b9980-a1c5-4557-b4eb-a75bb9a8aaa6";

function HelpTip({ title, text }) {
  const [open, setOpen] = useState(false);
  return (
    <span className="relative inline-flex">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-8 h-8 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 flex items-center justify-center text-slate-700"
        aria-label="Ayuda"
        title="Ayuda"
      >
        <HelpCircle size={16} />
      </button>
      {open ? (
        <div className="absolute z-[9999] top-10 right-0 w-[340px] max-w-[85vw]">
          <div className="rounded-2xl border border-slate-200 bg-white shadow-2xl p-4">
            <p className="text-xs font-black text-slate-900">{title}</p>
            <p className="text-sm font-semibold text-slate-600 leading-relaxed mt-1">{text}</p>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="mt-3 px-3 py-2 rounded-xl bg-slate-900 text-white font-black text-xs hover:bg-slate-800"
            >
              Entendido
            </button>
          </div>
        </div>
      ) : null}
    </span>
  );
}

function SectionCard({ title, subtitle, helpTitle, helpText, children }) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white shadow-sm p-5 md:p-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg md:text-xl font-black tracking-tight text-slate-900">{title}</h2>
          {subtitle ? <p className="text-sm text-slate-500 mt-1">{subtitle}</p> : null}
        </div>
        {helpTitle && helpText ? <HelpTip title={helpTitle} text={helpText} /> : null}
      </div>
      <div className="mt-5">{children}</div>
    </section>
  );
}

function Field({ label, hint, children }) {
  return (
    <label className="block">
      <div className="flex items-center gap-2">
        <span className="text-sm font-black text-slate-800">{label}</span>
      </div>
      {hint ? <p className="text-xs text-slate-500 mt-1">{hint}</p> : null}
      <div className="mt-2">{children}</div>
    </label>
  );
}

function Input(props) {
  return (
    <input
      {...props}
      className={clsx(
        "w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-900 outline-none",
        "placeholder:text-slate-400 focus:border-blue-400 focus:ring-4 focus:ring-blue-100",
        props.className
      )}
    />
  );
}

function Textarea(props) {
  return (
    <textarea
      {...props}
      className={clsx(
        "w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-900 outline-none",
        "placeholder:text-slate-400 focus:border-blue-400 focus:ring-4 focus:ring-blue-100",
        props.className
      )}
    />
  );
}

function Select(props) {
  return (
    <select
      {...props}
      className={clsx(
        "w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-900 outline-none",
        "focus:border-blue-400 focus:ring-4 focus:ring-blue-100",
        props.className
      )}
    />
  );
}

function StatusPill({ ok, children }) {
  return (
    <span
      className={clsx(
        "inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-black",
        ok ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
      )}
    >
      <span className={clsx("w-2 h-2 rounded-full", ok ? "bg-emerald-500" : "bg-amber-500")} />
      {children}
    </span>
  );
}

const emptyData = {
  hero_title: "",
  hero_image: "",
  promo_active: false,
  promo_text: "",
  pixel_id: "",
  maintenance_mode: false,
  season_key: "default",
  theme: {
    accent: "#e10600",
    accent2: "#111111",
    particles: true,
  },
  home: {
    footer_note: "",
    shipping_note: "",
    returns_note: "",
    support_hours: "",
  },
  socials: {
    facebook: "",
    instagram: "",
    youtube: "",
    tiktok: "",
  },
  contact_email: "",
  contact_phone: "",
  whatsapp_e164: "",
  whatsapp_display: "",
};

export default function ScoreStoreSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [sessionReady, setSessionReady] = useState(false);
  const [error, setError] = useState("");
  const [okMsg, setOkMsg] = useState("");
  const [coverUploading, setCoverUploading] = useState(false);

  const [hero_title, setHeroTitle] = useState("");
  const [hero_image, setHeroImage] = useState("");
  const [promo_active, setPromoActive] = useState(false);
  const [promo_text, setPromoText] = useState("");
  const [pixel_id, setPixelId] = useState("");
  const [maintenance_mode, setMaintenanceMode] = useState(false);
  const [season_key, setSeasonKey] = useState("default");

  const [accent, setAccent] = useState("#e10600");
  const [accent2, setAccent2] = useState("#111111");
  const [particles, setParticles] = useState(true);

  const [contact_email, setContactEmail] = useState("");
  const [contact_phone, setContactPhone] = useState("");
  const [whatsapp_e164, setWhatsappE164] = useState("");
  const [whatsapp_display, setWhatsappDisplay] = useState("");

  const [facebook, setFacebook] = useState("");
  const [instagram, setInstagram] = useState("");
  const [youtube, setYoutube] = useState("");
  const [tiktok, setTiktok] = useState("");

  const [footer_note, setFooterNote] = useState("");
  const [shipping_note, setShippingNote] = useState("");
  const [returns_note, setReturnsNote] = useState("");
  const [support_hours, setSupportHours] = useState("");

  const configured = useMemo(() => !!SUPABASE_CONFIGURED, []);

function applyData(data) {
    const d = { ...emptyData, ...(data || {}) };
    const theme = d.theme && typeof d.theme === "object" ? d.theme : emptyData.theme;
    const home = d.home && typeof d.home === "object" ? d.home : emptyData.home;
    const socials = d.socials && typeof d.socials === "object" ? d.socials : emptyData.socials;

    setHeroTitle(String(d.hero_title || ""));
    setHeroImage(String(d.hero_image || ""));
    setPromoActive(!!d.promo_active);
    setPromoText(String(d.promo_text || ""));
    setPixelId(String(d.pixel_id || ""));
    setMaintenanceMode(!!d.maintenance_mode);
    setSeasonKey(String(d.season_key || "default"));

    setAccent(String(theme.accent || "#e10600"));
    setAccent2(String(theme.accent2 || "#111111"));
    setParticles(typeof theme.particles === "boolean" ? theme.particles : true);

    setContactEmail(String(d.contact_email || ""));
    setContactPhone(String(d.contact_phone || ""));
    setWhatsappE164(String(d.whatsapp_e164 || ""));
    setWhatsappDisplay(String(d.whatsapp_display || ""));

    setFacebook(String(socials.facebook || ""));
    setInstagram(String(socials.instagram || ""));
    setYoutube(String(socials.youtube || ""));
    setTiktok(String(socials.tiktok || ""));

    setFooterNote(String(home.footer_note || ""));
    setShippingNote(String(home.shipping_note || ""));
    setReturnsNote(String(home.returns_note || ""));
    setSupportHours(String(home.support_hours || ""));
  }

  async function getToken() {
    const {
      data: { session },
      error: sessionErr,
    } = await supabase.auth.getSession();

    if (sessionErr) throw sessionErr;
    if (!session?.access_token) throw new Error("No hay sesión activa en UnicOs.");

    return session.access_token;
  }

  useEffect(() => {
    let alive = true;

    async function bootstrap() {
      try {
        setLoading(true);
        setError("");
        setOkMsg("");

        if (!configured || !supabase) {
          throw new Error("Supabase no está configurado en este entorno.");
        }

        const token = await getToken();
        if (!alive) return;
        setSessionReady(true);

        const res = await fetch(`/api/score/site-settings?org_id=${encodeURIComponent(SCORE_ORG_ID)}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const payload = await res.json().catch(() => ({}));
        if (!res.ok || !payload?.ok) {
          throw new Error(payload?.error || "No se pudo leer site_settings.");
        }

        if (!alive) return;
        applyData(payload.data || emptyData);
      } catch (e) {
        if (!alive) return;
        setError(String(e?.message || e));
      } finally {
        if (alive) setLoading(false);
      }
    }

    bootstrap();
    return () => {
      alive = false;
    };
  }, [configured]);

  async function uploadFileToBucket(file, folder = "scorestore") {
    if (!supabase) throw new Error("Supabase no está listo.");

    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.access_token) throw new Error("Tu sesión expiró. Vuelve a entrar a UnicOs.");

    const ext = String(file.name.split(".").pop() || "jpg").toLowerCase();
    const fileName = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

    const { error: upErr } = await supabase.storage.from("assets").upload(fileName, file, {
      cacheControl: "3600",
      upsert: false,
    });
    if (upErr) throw upErr;

    const { data } = supabase.storage.from("assets").getPublicUrl(fileName);
    const url = data?.publicUrl || "";
    if (!url) throw new Error("No se pudo generar URL pública del archivo.");
    return url;
  }

  async function onUploadCover(e) {
    try {
      setError("");
      const file = e.target.files?.[0];
      if (!file) return;
      setCoverUploading(true);
      const url = await uploadFileToBucket(file, "scorestore/hero");
      setHeroImage(url);
      setOkMsg("Portada subida correctamente.");
    } catch (e2) {
      setError(String(e2?.message || e2));
    } finally {
      setCoverUploading(false);
      e.target.value = "";
    }
  }

  async function onSave() {
    try {
      setSaving(true);
      setError("");
      setOkMsg("");

      const token = await getToken();

      const payload = {
        organization_id: SCORE_ORG_ID,
        hero_title,
        hero_image,
        promo_active,
        promo_text,
        pixel_id,
        maintenance_mode,
        season_key,
        theme: {
          accent,
          accent2,
          particles,
        },
        home: {
          footer_note,
          shipping_note,
          returns_note,
          support_hours,
        },
        socials: {
          facebook,
          instagram,
          youtube,
          tiktok,
        },
        contact_email,
        contact_phone,
        whatsapp_e164,
        whatsapp_display,
      };

      const res = await fetch("/api/score/site-settings", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const out = await res.json().catch(() => ({}));
      if (!res.ok || !out?.ok) {
        throw new Error(out?.error || "No se pudo guardar site_settings.");
      }

      applyData(out.data || payload);
      setOkMsg("Configuración real de Score Store guardada.");
    } catch (e) {
      setError(String(e?.message || e));
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
        <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm max-w-md w-full text-center">
          <div className="w-12 h-12 rounded-2xl bg-blue-100 flex items-center justify-center mx-auto">
            <RefreshCcw className="animate-spin text-blue-700" size={20} />
          </div>
          <p className="mt-4 text-base font-black text-slate-900">Cargando configuración real...</p>
          <p className="mt-1 text-sm text-slate-500">Leyendo site_settings activo de Score Store.</p>
        </div>
      </div>
    );
  }

return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-6 md:py-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <a
              href="/"
              className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-800 hover:bg-slate-50"
            >
              <ArrowLeft size={16} />
              Volver
            </a>
            <div>
              <p className="text-xs font-black uppercase tracking-[0.22em] text-blue-700">UnicOs / Score Store</p>
              <h1 className="text-2xl md:text-3xl font-black tracking-tight">Site Settings real</h1>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <StatusPill ok={configured && sessionReady}>Conexión real lista</StatusPill>
            <a
              href="https://scorestore.netlify.app"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-2xl bg-white border border-slate-200 px-4 py-3 text-sm font-black text-slate-800 hover:bg-slate-50"
            >
              Ver sitio
              <ExternalLink size={16} />
            </a>
            <button
              type="button"
              onClick={onSave}
              disabled={saving}
              className={clsx(
                "inline-flex items-center gap-2 rounded-2xl px-4 py-3 text-sm font-black text-white",
                saving ? "bg-slate-400" : "bg-blue-700 hover:bg-blue-800"
              )}
            >
              {saving ? <RefreshCcw className="animate-spin" size={16} /> : <Save size={16} />}
              Guardar
            </button>
          </div>
        </div>

        {error ? (
          <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
            {error}
          </div>
        ) : null}

        {okMsg ? (
          <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
            {okMsg}
          </div>
        ) : null}

        <div className="mt-6 grid grid-cols-1 xl:grid-cols-3 gap-5">
          <div className="xl:col-span-2 space-y-5">
            <SectionCard
              title="Hero, promo y operación"
              subtitle="Esto sí pega con el storefront real de Score."
              helpTitle="Hero y promo"
              helpText="Aquí controlas el título del hero, la promo superior, el pixel y el modo mantenimiento."
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="Hero title">
                  <Input value={hero_title} onChange={(e) => setHeroTitle(e.target.value)} placeholder="Merch Oficial SCORE" />
                </Field>

                <Field label="Season key">
                  <Input value={season_key} onChange={(e) => setSeasonKey(e.target.value)} placeholder="default" />
                </Field>

                <div className="md:col-span-2">
                  <Field label="Hero image URL">
                    <Input value={hero_image} onChange={(e) => setHeroImage(e.target.value)} placeholder="https://..." />
                  </Field>
                </div>

                <Field label="Subir portada">
                  <label className="w-full rounded-2xl border border-dashed border-slate-300 bg-slate-50 hover:bg-slate-100 px-4 py-4 flex items-center justify-center gap-2 cursor-pointer text-sm font-black text-slate-700">
                    {coverUploading ? <RefreshCcw className="animate-spin" size={16} /> : <UploadCloud size={16} />}
                    {coverUploading ? "Subiendo..." : "Seleccionar archivo"}
                    <input type="file" accept="image/*" className="hidden" onChange={onUploadCover} />
                  </label>
                </Field>

                <Field label="Meta Pixel ID">
                  <Input value={pixel_id} onChange={(e) => setPixelId(e.target.value)} placeholder="123456789012345" />
                </Field>

                <Field label="Promo activa">
                  <Select value={promo_active ? "1" : "0"} onChange={(e) => setPromoActive(e.target.value === "1")}>
                    <option value="0">No</option>
                    <option value="1">Sí</option>
                  </Select>
                </Field>

                <Field label="Maintenance mode">
                  <Select value={maintenance_mode ? "1" : "0"} onChange={(e) => setMaintenanceMode(e.target.value === "1")}>
                    <option value="0">No</option>
                    <option value="1">Sí</option>
                  </Select>
                </Field>

                <div className="md:col-span-2">
                  <Field label="Texto promo">
                    <Textarea rows={3} value={promo_text} onChange={(e) => setPromoText(e.target.value)} placeholder="🔥 ENVÍOS NACIONALES E INTERNACIONALES 🔥" />
                  </Field>
                </div>
              </div>
            </SectionCard>

            <SectionCard
              title="Contacto y redes"
              subtitle="Esto reemplaza los datos hardcodeados del storefront."
              helpTitle="Contacto"
              helpText="Aquí van los datos oficiales que debe leer Score Store para footer, legal y soporte."
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="Correo">
                  <Input value={contact_email} onChange={(e) => setContactEmail(e.target.value)} placeholder="correo@dominio.com" />
                </Field>
                <Field label="Teléfono">
                  <Input value={contact_phone} onChange={(e) => setContactPhone(e.target.value)} placeholder="+52 664..." />
                </Field>
                <Field label="WhatsApp E164">
                  <Input value={whatsapp_e164} onChange={(e) => setWhatsappE164(e.target.value)} placeholder="5216640000000" />
                </Field>
                <Field label="WhatsApp visible">
                  <Input value={whatsapp_display} onChange={(e) => setWhatsappDisplay(e.target.value)} placeholder="664 000 0000" />
                </Field>
                <Field label="Facebook">
                  <Input value={facebook} onChange={(e) => setFacebook(e.target.value)} placeholder="https://facebook.com/..." />
                </Field>
                <Field label="Instagram">
                  <Input value={instagram} onChange={(e) => setInstagram(e.target.value)} placeholder="https://instagram.com/..." />
                </Field>
                <Field label="YouTube">
                  <Input value={youtube} onChange={(e) => setYoutube(e.target.value)} placeholder="https://youtube.com/..." />
                </Field>
                <Field label="TikTok">
                  <Input value={tiktok} onChange={(e) => setTiktok(e.target.value)} placeholder="https://tiktok.com/@..." />
                </Field>
              </div>
            </SectionCard>
<SectionCard
              title="Tema y notas operativas"
              subtitle="Control visual suave y notas informativas del sitio."
              helpTitle="Tema y notas"
              helpText="Esto ajusta acentos y notas sin tocar drásticamente la estructura ni el hero copy principal."
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="Accent color">
                  <Input value={accent} onChange={(e) => setAccent(e.target.value)} placeholder="#e10600" />
                </Field>
                <Field label="Accent 2 / oscuro">
                  <Input value={accent2} onChange={(e) => setAccent2(e.target.value)} placeholder="#111111" />
                </Field>
                <Field label="Particles">
                  <Select value={particles ? "1" : "0"} onChange={(e) => setParticles(e.target.value === "1")}>
                    <option value="1">Sí</option>
                    <option value="0">No</option>
                  </Select>
                </Field>
                <Field label="Horario de soporte">
                  <Input value={support_hours} onChange={(e) => setSupportHours(e.target.value)} placeholder="Lunes a viernes de 9:00 a 18:00" />
                </Field>
                <div className="md:col-span-2">
                  <Field label="Nota footer">
                    <Textarea rows={3} value={footer_note} onChange={(e) => setFooterNote(e.target.value)} placeholder="Hecho con pasión. Fabricado y operado por..." />
                  </Field>
                </div>
                <div className="md:col-span-2">
                  <Field label="Nota de envíos">
                    <Textarea rows={3} value={shipping_note} onChange={(e) => setShippingNote(e.target.value)} placeholder="Tiempos, cobertura y observaciones..." />
                  </Field>
                </div>
                <div className="md:col-span-2">
                  <Field label="Nota de cambios y devoluciones">
                    <Textarea rows={3} value={returns_note} onChange={(e) => setReturnsNote(e.target.value)} placeholder="Política clara y entendible..." />
                  </Field>
                </div>
              </div>
            </SectionCard>
          </div>

          <div className="space-y-5">
            <SectionCard
              title="Vista rápida"
              subtitle="Lectura rápida del estado actual."
              helpTitle="Vista rápida"
              helpText="Sirve para detectar si ya quedó conectado hero, promo, contacto y redes."
            >
              <div className="space-y-3">
                <div className="rounded-2xl bg-slate-50 border border-slate-200 p-4">
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">Estado</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <StatusPill ok={configured}>Supabase</StatusPill>
                    <StatusPill ok={sessionReady}>Sesión</StatusPill>
                    <StatusPill ok={!!contact_email}>Correo</StatusPill>
                    <StatusPill ok={!!hero_title}>Hero</StatusPill>
                    <StatusPill ok={!!promo_text || !promo_active}>Promo</StatusPill>
                  </div>
                </div>

                <div className="rounded-2xl bg-white border border-slate-200 p-4">
                  <p className="text-sm font-black text-slate-900">Score Store</p>
                  <div className="mt-3 text-xs text-slate-500 space-y-1">
                    <p><span className="font-black text-slate-700">Correo:</span> {contact_email || "No configurado"}</p>
                    <p><span className="font-black text-slate-700">WhatsApp:</span> {whatsapp_display || "No configurado"}</p>
                    <p><span className="font-black text-slate-700">Facebook:</span> {facebook || "No configurado"}</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={onSave}
                  disabled={saving}
                  className={clsx(
                    "w-full inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-black text-white",
                    saving ? "bg-slate-400" : "bg-slate-900 hover:bg-slate-800"
                  )}
                >
                  {saving ? <RefreshCcw className="animate-spin" size={16} /> : <Save size={16} />}
                  Guardar site_settings
                </button>
              </div>
            </SectionCard>
          </div>
        </div>
      </div>
    </main>
  );
}