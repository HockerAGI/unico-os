"use client";

import React, { useEffect, useMemo, useState } from "react";
import clsx from "clsx";
import {
  ArrowLeft,
  BadgeHelp,
  ExternalLink,
  Globe2,
  ImagePlus,
  Megaphone,
  RefreshCcw,
  Save,
  Settings2,
  Sparkles,
  UploadCloud,
} from "lucide-react";
import { supabase, SUPABASE_CONFIGURED } from "@/lib/supabase";

const SCORE_ORG_ID = "1f3b9980-a1c5-4557-b4eb-a75bb9a8aaa6";

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

function HelpTip({ title, text }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-slate-200 hover:bg-white/10"
        aria-label={title || "Ayuda"}
        title={title || "Ayuda"}
      >
        <BadgeHelp size={16} />
      </button>

      {open ? (
        <div className="absolute right-0 top-12 z-[80] w-[360px] max-w-[86vw]">
          <div className="rounded-3xl border border-white/10 bg-[rgba(6,14,28,0.96)] p-4 shadow-2xl backdrop-blur-xl">
            <p className="text-sm font-black text-white">{title}</p>
            <p className="mt-2 text-sm leading-relaxed text-slate-300">{text}</p>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="mt-4 rounded-2xl bg-white/10 px-4 py-2 text-xs font-black text-white hover:bg-white/15"
            >
              Cerrar
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function Panel({ className = "", children }) {
  return (
    <section
      className={clsx(
        "rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(8,18,34,0.88),rgba(8,20,37,0.78))] shadow-[0_18px_60px_rgba(0,0,0,0.28)] relative overflow-hidden",
        className
      )}
    >
      <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(135deg,rgba(42,168,255,0.10),transparent_28%),linear-gradient(315deg,rgba(18,213,197,0.08),transparent_26%)]" />
      <div className="relative">{children}</div>
    </section>
  );
}

function Card({ className = "", children }) {
  return (
    <div
      className={clsx(
        "rounded-3xl border border-white/10 bg-white/5 shadow-[0_10px_30px_rgba(0,0,0,0.18)] relative overflow-hidden",
        className
      )}
    >
      <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(180deg,rgba(255,255,255,0.04),transparent_32%)]" />
      <div className="relative">{children}</div>
    </div>
  );
}

function GlassButton({ children, className = "", variant = "secondary", ...props }) {
  return (
    <button
      {...props}
      className={clsx(
        "inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-black transition",
        variant === "primary"
          ? "bg-gradient-to-r from-sky-500 via-blue-500 to-cyan-400 text-slate-950 shadow-[0_18px_50px_rgba(42,168,255,0.28)] hover:brightness-110"
          : "bg-white/5 text-white border border-white/10 hover:bg-white/10",
        className
      )}
    >
      {children}
    </button>
  );
}

function Field({ label, hint, children }) {
  return (
    <label className="block">
      <span className="text-sm font-black text-white">{label}</span>
      {hint ? <p className="mt-1 text-xs leading-relaxed text-slate-400">{hint}</p> : null}
      <div className="mt-2">{children}</div>
    </label>
  );
}

function Input(props) {
  return (
    <input
      {...props}
      className={clsx(
        "w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-white outline-none",
        "placeholder:text-slate-400 focus:border-sky-400/60 focus:ring-4 focus:ring-sky-500/15",
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
        "w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-white outline-none",
        "placeholder:text-slate-400 focus:border-sky-400/60 focus:ring-4 focus:ring-sky-500/15",
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
        "w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-white outline-none",
        "focus:border-sky-400/60 focus:ring-4 focus:ring-sky-500/15",
        props.className
      )}
    />
  );
}

function StatusPill({ ok, children }) {
  return (
    <span
      className={clsx(
        "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.16em]",
        ok
          ? "border-white/10 bg-[rgba(34,197,94,0.14)] text-emerald-200"
          : "border-white/10 bg-[rgba(245,158,11,0.16)] text-amber-200"
      )}
    >
      <span className={clsx("h-2.5 w-2.5 rounded-full", ok ? "bg-emerald-400" : "bg-amber-400")} />
      {children}
    </span>
  );
}

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
    if (!session?.access_token) throw new Error("No hay una sesión activa en UnicOs.");

    return session.access_token;
  }

  const load = async () => {
    try {
      setLoading(true);
      setError("");
      setOkMsg("");

      if (!configured || !supabase) {
        throw new Error("La conexión principal del panel no está disponible en este entorno.");
      }

      const token = await getToken();
      setSessionReady(true);

      const res = await fetch(`/api/score/site-settings?org_id=${encodeURIComponent(SCORE_ORG_ID)}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const payload = await res.json().catch(() => ({}));
      if (!res.ok || !payload?.ok) {
        throw new Error(payload?.error || "No se pudo leer la configuración actual del sitio.");
      }

      applyData(payload.data || emptyData);
    } catch (e) {
      setError(String(e?.message || e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  async function uploadFileToBucket(file, folder = "scorestore") {
    if (!supabase) throw new Error("La conexión del panel todavía no está lista.");

    const ext = String(file.name.split(".").pop() || "jpg").toLowerCase();
    const fileName = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

    const { error: upErr } = await supabase.storage.from("assets").upload(fileName, file, {
      cacheControl: "3600",
      upsert: false,
    });

    if (upErr) throw upErr;

    const { data } = supabase.storage.from("assets").getPublicUrl(fileName);
    const url = data?.publicUrl || "";
    if (!url) throw new Error("No se pudo generar la dirección pública del archivo.");
    return url;
  }

  async function onUploadCover(e) {
    try {
      setError("");
      setOkMsg("");
      const file = e.target.files?.[0];
      if (!file) return;

      setCoverUploading(true);
      const url = await uploadFileToBucket(file, "scorestore/hero");
      setHeroImage(url);
      setOkMsg("La portada se subió correctamente.");
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
        throw new Error(out?.error || "No se pudo guardar la configuración del sitio.");
      }

      applyData(out.data || payload);
      setOkMsg("Los cambios ya quedaron guardados y listos para reflejarse en Score Store.");
    } catch (e) {
      setError(String(e?.message || e));
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen px-4 py-8">
        <div className="mx-auto max-w-7xl">
          <Panel className="p-8">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-3xl border border-white/10 bg-[rgba(42,168,255,0.14)] text-sky-300">
                <RefreshCcw className="animate-spin" size={18} />
              </div>
              <div>
                <p className="text-lg font-black text-white">Cargando configuración actual...</p>
                <p className="text-sm text-slate-300">Estamos leyendo el estado real del sitio conectado.</p>
              </div>
            </div>
          </Panel>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen px-4 py-6 md:py-8">
      <div className="mx-auto max-w-7xl space-y-5">
        <Panel className="p-5 md:p-6">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex items-center gap-4">
              <a
                href="/"
                className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-white hover:bg-white/10"
                aria-label="Volver"
                title="Volver"
              >
                <ArrowLeft size={18} />
              </a>

              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.24em] text-cyan-300">UnicOs / Centro de contenido</p>
                <h1 className="mt-1 text-3xl font-black text-white">Control de Score Store</h1>
                <p className="mt-1 text-sm leading-relaxed text-slate-300">
                  Administra mensajes, portada, soporte, campañas y datos públicos del sitio desde un solo lugar.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <StatusPill ok={configured && sessionReady}>Conexión lista</StatusPill>

              <a
                href="https://scorestore.netlify.app"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-black text-white hover:bg-white/10"
              >
                Ver sitio
                <ExternalLink size={16} />
              </a>

              <GlassButton variant="secondary" onClick={load}>
                <RefreshCcw size={16} />
                Recargar
              </GlassButton>

              <GlassButton variant="primary" onClick={onSave} disabled={saving}>
                {saving ? <RefreshCcw className="animate-spin" size={16} /> : <Save size={16} />}
                Guardar cambios
              </GlassButton>
            </div>
          </div>
        </Panel>

        {error ? (
          <div className="rounded-2xl border border-rose-400/20 bg-rose-500/10 px-4 py-3 text-sm font-semibold text-rose-200">
            {error}
          </div>
        ) : null}

        {okMsg ? (
          <div className="rounded-2xl border border-emerald-400/20 bg-emerald-500/10 px-4 py-3 text-sm font-semibold text-emerald-200">
            {okMsg}
          </div>
        ) : null}

        <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1.2fr_.8fr]">
          <div className="space-y-5">
            <Panel className="p-5 md:p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[11px] font-black uppercase tracking-[0.22em] text-cyan-300">Mensaje principal</p>
                  <h2 className="mt-2 text-2xl font-black text-white">Portada, campaña y visibilidad</h2>
                  <p className="mt-2 text-sm leading-relaxed text-slate-300">
                    Aquí controlas lo primero que ve la gente: mensaje principal, imagen, campaña visible y modo de pausa del sitio.
                  </p>
                </div>
                <HelpTip
                  title="Portada y campaña"
                  text="Usa esta sección para actualizar el mensaje principal, subir nueva portada, encender o apagar campañas visibles y pausar temporalmente el sitio si hace falta."
                />
              </div>

              <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
                <Field
                  label="Título principal"
                  hint="Mensaje corto y claro para la parte más visible del sitio."
                >
                  <Input
                    value={hero_title}
                    onChange={(e) => setHeroTitle(e.target.value)}
                    placeholder="Merch oficial SCORE"
                  />
                </Field>

                <Field
                  label="Clave de temporada"
                  hint="Te ayuda a ordenar campañas por etapa, evento o temporada."
                >
                  <Input
                    value={season_key}
                    onChange={(e) => setSeasonKey(e.target.value)}
                    placeholder="default"
                  />
                </Field>

                <div className="md:col-span-2">
                  <Field
                    label="Portada actual"
                    hint="Pega una imagen pública o sube una nueva desde este panel."
                  >
                    <Input
                      value={hero_image}
                      onChange={(e) => setHeroImage(e.target.value)}
                      placeholder="https://..."
                    />
                  </Field>
                </div>

                <Field
                  label="Subir nueva portada"
                  hint="La imagen se sube y queda lista para usarse en el sitio."
                >
                  <label className="flex cursor-pointer items-center justify-center gap-2 rounded-2xl border border-dashed border-white/14 bg-white/5 px-4 py-4 text-sm font-black text-white hover:bg-white/10">
                    {coverUploading ? <RefreshCcw className="animate-spin" size={16} /> : <UploadCloud size={16} />}
                    {coverUploading ? "Subiendo..." : "Seleccionar archivo"}
                    <input type="file" accept="image/*" className="hidden" onChange={onUploadCover} />
                  </label>
                </Field>

                <Field
                  label="Seguimiento comercial"
                  hint="Identificador del seguimiento publicitario si estás midiendo campañas."
                >
                  <Input
                    value={pixel_id}
                    onChange={(e) => setPixelId(e.target.value)}
                    placeholder="123456789012345"
                  />
                </Field>

                <Field
                  label="Campaña visible"
                  hint="Activa o apaga el aviso comercial que aparece arriba del sitio."
                >
                  <Select value={promo_active ? "1" : "0"} onChange={(e) => setPromoActive(e.target.value === "1")}>
                    <option value="0">Apagada</option>
                    <option value="1">Activa</option>
                  </Select>
                </Field>

                <Field
                  label="Modo pausa"
                  hint="Úsalo solo si necesitas detener temporalmente la operación pública."
                >
                  <Select value={maintenance_mode ? "1" : "0"} onChange={(e) => setMaintenanceMode(e.target.value === "1")}>
                    <option value="0">Normal</option>
                    <option value="1">Pausa temporal</option>
                  </Select>
                </Field>

                <div className="md:col-span-2">
                  <Field
                    label="Texto de campaña"
                    hint="Mensaje corto, potente y fácil de entender para la franja promocional."
                  >
                    <Textarea
                      rows={3}
                      value={promo_text}
                      onChange={(e) => setPromoText(e.target.value)}
                      placeholder="🔥 Envíos nacionales e internacionales disponibles 🔥"
                    />
                  </Field>
                </div>
              </div>
            </Panel>

            <Panel className="p-5 md:p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[11px] font-black uppercase tracking-[0.22em] text-cyan-300">Soporte y presencia</p>
                  <h2 className="mt-2 text-2xl font-black text-white">Contacto y redes públicas</h2>
                  <p className="mt-2 text-sm leading-relaxed text-slate-300">
                    Estos datos aparecen en puntos visibles del sitio y ayudan a que la gente contacte al equipo correcto.
                  </p>
                </div>
                <HelpTip
                  title="Contacto y redes"
                  text="Pon aquí solo los datos oficiales que quieres que se publiquen en soporte, contacto, legal y redes visibles del sitio."
                />
              </div>

              <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
                <Field
                  label="Correo de atención"
                  hint="Correo principal para dudas, seguimiento o atención."
                >
                  <Input
                    value={contact_email}
                    onChange={(e) => setContactEmail(e.target.value)}
                    placeholder="correo@dominio.com"
                  />
                </Field>

                <Field
                  label="Teléfono"
                  hint="Número público que quieras mostrar como referencia."
                >
                  <Input
                    value={contact_phone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    placeholder="+52 664..."
                  />
                </Field>

                <Field
                  label="WhatsApp directo"
                  hint="Ponlo en formato internacional sin espacios."
                >
                  <Input
                    value={whatsapp_e164}
                    onChange={(e) => setWhatsappE164(e.target.value)}
                    placeholder="5216640000000"
                  />
                </Field>

                <Field
                  label="WhatsApp visible"
                  hint="Así es como lo verá la gente en el sitio."
                >
                  <Input
                    value={whatsapp_display}
                    onChange={(e) => setWhatsappDisplay(e.target.value)}
                    placeholder="664 000 0000"
                  />
                </Field>

                <Field label="Facebook">
                  <Input
                    value={facebook}
                    onChange={(e) => setFacebook(e.target.value)}
                    placeholder="https://facebook.com/..."
                  />
                </Field>

                <Field label="Instagram">
                  <Input
                    value={instagram}
                    onChange={(e) => setInstagram(e.target.value)}
                    placeholder="https://instagram.com/..."
                  />
                </Field>

                <Field label="YouTube">
                  <Input
                    value={youtube}
                    onChange={(e) => setYoutube(e.target.value)}
                    placeholder="https://youtube.com/..."
                  />
                </Field>

                <Field label="TikTok">
                  <Input
                    value={tiktok}
                    onChange={(e) => setTiktok(e.target.value)}
                    placeholder="https://tiktok.com/@..."
                  />
                </Field>
              </div>
            </Panel>

            <Panel className="p-5 md:p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[11px] font-black uppercase tracking-[0.22em] text-cyan-300">Experiencia y operación</p>
                  <h2 className="mt-2 text-2xl font-black text-white">Estilo visual y mensajes útiles</h2>
                  <p className="mt-2 text-sm leading-relaxed text-slate-300">
                    Ajusta acentos, microefectos y mensajes clave sin tocar estructura ni depender de cambios manuales en código.
                  </p>
                </div>
                <HelpTip
                  title="Experiencia y mensajes"
                  text="Aquí puedes ajustar el color de apoyo, los efectos visuales y las notas operativas que ayudan a orientar al cliente o al visitante."
                />
              </div>

              <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
                <Field
                  label="Color principal"
                  hint="Color de apoyo para detalles visuales del sitio."
                >
                  <Input
                    value={accent}
                    onChange={(e) => setAccent(e.target.value)}
                    placeholder="#e10600"
                  />
                </Field>

                <Field
                  label="Color oscuro de apoyo"
                  hint="Segundo color para contraste o fondo."
                >
                  <Input
                    value={accent2}
                    onChange={(e) => setAccent2(e.target.value)}
                    placeholder="#111111"
                  />
                </Field>

                <Field
                  label="Efecto visual de partículas"
                  hint="Úsalo para dar más presencia visual al sitio."
                >
                  <Select value={particles ? "1" : "0"} onChange={(e) => setParticles(e.target.value === "1")}>
                    <option value="1">Activo</option>
                    <option value="0">Apagado</option>
                  </Select>
                </Field>

                <Field
                  label="Horario de atención"
                  hint="Texto claro para orientar al cliente."
                >
                  <Input
                    value={support_hours}
                    onChange={(e) => setSupportHours(e.target.value)}
                    placeholder="Lunes a viernes de 9:00 a 18:00"
                  />
                </Field>

                <div className="md:col-span-2">
                  <Field
                    label="Mensaje inferior del sitio"
                    hint="Texto corto para el cierre visual del sitio o la parte institucional."
                  >
                    <Textarea
                      rows={3}
                      value={footer_note}
                      onChange={(e) => setFooterNote(e.target.value)}
                      placeholder="Hecho con pasión para la comunidad off-road."
                    />
                  </Field>
                </div>

                <div className="md:col-span-2">
                  <Field
                    label="Mensaje sobre envíos"
                    hint="Aclara tiempos, cobertura o condiciones de manera simple."
                  >
                    <Textarea
                      rows={3}
                      value={shipping_note}
                      onChange={(e) => setShippingNote(e.target.value)}
                      placeholder="Los tiempos de envío pueden variar según destino y temporada."
                    />
                  </Field>
                </div>

                <div className="md:col-span-2">
                  <Field
                    label="Mensaje sobre cambios o devoluciones"
                    hint="Redacción clara para evitar confusiones."
                  >
                    <Textarea
                      rows={3}
                      value={returns_note}
                      onChange={(e) => setReturnsNote(e.target.value)}
                      placeholder="Los cambios o aclaraciones están sujetos a revisión del pedido y estado de la operación."
                    />
                  </Field>
                </div>
              </div>
            </Panel>
          </div>

          <div className="space-y-5">
            <Panel className="p-5 md:p-6">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-cyan-300">
                  <Settings2 size={18} />
                </div>
                <div>
                  <p className="text-sm font-black text-white">Estado rápido</p>
                  <p className="text-xs text-slate-400">Confirmación visual del sitio conectado.</p>
                </div>
              </div>

              <div className="mt-5 flex flex-wrap gap-2">
                <StatusPill ok={configured}>Conexión</StatusPill>
                <StatusPill ok={sessionReady}>Sesión</StatusPill>
                <StatusPill ok={!!contact_email}>Correo</StatusPill>
                <StatusPill ok={!!hero_title}>Mensaje principal</StatusPill>
                <StatusPill ok={!!promo_text || !promo_active}>Campaña</StatusPill>
              </div>

              <Card className="mt-5 p-4">
                <p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">Resumen público</p>
                <div className="mt-3 space-y-2 text-sm text-slate-300">
                  <p><span className="font-black text-white">Correo:</span> {contact_email || "No configurado"}</p>
                  <p><span className="font-black text-white">WhatsApp:</span> {whatsapp_display || "No configurado"}</p>
                  <p><span className="font-black text-white">Facebook:</span> {facebook || "No configurado"}</p>
                </div>
              </Card>

              <div className="mt-5">
                <GlassButton variant="primary" onClick={onSave} disabled={saving} className="w-full">
                  {saving ? <RefreshCcw className="animate-spin" size={16} /> : <Save size={16} />}
                  Guardar cambios del sitio
                </GlassButton>
              </div>
            </Panel>

            <Panel className="p-5 md:p-6">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-cyan-300">
                  <ImagePlus size={18} />
                </div>
                <div>
                  <p className="text-sm font-black text-white">Vista previa rápida</p>
                  <p className="text-xs text-slate-400">Cómo se está viendo el mensaje principal.</p>
                </div>
              </div>

              <Card className="mt-5 overflow-hidden">
                <div className="aspect-[16/10] bg-[radial-gradient(circle_at_20%_20%,rgba(42,168,255,0.16),transparent_0_28%),linear-gradient(180deg,#081322,#0a172a)] flex items-center justify-center">
                  {hero_image ? (
                    <img src={hero_image} alt="Hero actual" className="h-full w-full object-cover" />
                  ) : (
                    <div className="px-6 text-center">
                      <p className="text-sm font-black text-white">{hero_title || "Todavía no hay portada configurada"}</p>
                      <p className="mt-2 text-xs text-slate-400">
                        Cuando subas una imagen o ajustes el mensaje principal, aparecerá aquí.
                      </p>
                    </div>
                  )}
                </div>
              </Card>
            </Panel>

            <Panel className="p-5 md:p-6">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-cyan-300">
                  <Megaphone size={18} />
                </div>
                <div>
                  <p className="text-sm font-black text-white">Enfoque operativo</p>
                  <p className="text-xs text-slate-400">Pensado para operación real desde UnicOs.</p>
                </div>
              </div>

              <div className="mt-5 space-y-3 text-sm leading-relaxed text-slate-300">
                <Card className="p-4">
                  <div className="flex items-start gap-3">
                    <Globe2 className="mt-0.5 text-sky-300" size={16} />
                    <p>
                      Esta sección no está pensada solo para ecommerce: sirve para controlar mensajes, presencia,
                      soporte y ajustes visibles de cualquier sitio conectado a UnicOs.
                    </p>
                  </div>
                </Card>

                <Card className="p-4">
                  <div className="flex items-start gap-3">
                    <Sparkles className="mt-0.5 text-cyan-300" size={16} />
                    <p>
                      La idea es que el equipo pueda mover campañas, textos, visuales y datos públicos sin depender
                      de lenguaje técnico ni tocar archivos manualmente.
                    </p>
                  </div>
                </Card>
              </div>
            </Panel>
          </div>
        </div>
      </div>
    </main>
  );
}