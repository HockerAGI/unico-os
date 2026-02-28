"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";
import clsx from "clsx";
import { Bot, Sparkles, Send, X, ChevronDown, RefreshCcw } from "lucide-react";

const BRAND = {
  primaryLogo: "/logo-unico.png",
  fallbackLogo: "/icon-512.png",
  grad: "linear-gradient(135deg, #0EA5E9, #14B8A6)",
};

const clamp = (v, n = 2000) => String(v ?? "").trim().slice(0, n);
const normEmail = (s) => String(s || "").trim().toLowerCase();

export default function AiDock() {
  const [open, setOpen] = useState(false);

  const [session, setSession] = useState(null);
  const token = session?.access_token || "";
  const email = normEmail(session?.user?.email);

  const [orgs, setOrgs] = useState([]);
  const [orgId, setOrgId] = useState("");

  const [busy, setBusy] = useState(false);
  const [loadingOrgs, setLoadingOrgs] = useState(false);

  const [messages, setMessages] = useState([
    { role: "assistant", content: "Listo. Dime qué necesitas y lo hago." },
  ]);
  const [input, setInput] = useState("");

  const bottomRef = useRef(null);
  const [logoSrc, setLogoSrc] = useState(BRAND.primaryLogo);

  useEffect(() => {
    bottomRef.current?.scrollIntoView?.({ behavior: "smooth" });
  }, [messages, open]);

  // Session watcher
  useEffect(() => {
    let unsub = null;
    (async () => {
      const { data } = await supabase.auth.getSession();
      setSession(data?.session || null);

      const { data: sub } = await supabase.auth.onAuthStateChange((_e, s) =>
        setSession(s || null)
      );
      unsub = sub?.subscription || null;
    })();

    return () => unsub?.unsubscribe?.();
  }, []);

  // Load orgs for logged user
  useEffect(() => {
    const run = async () => {
      if (!email) {
        setOrgs([]);
        setOrgId("");
        return;
      }

      setLoadingOrgs(true);
      try {
        const { data: mems } = await supabase
          .from("admin_users")
          .select("organization_id, role")
          .ilike("email", email)
          .eq("is_active", true);

        const ids = Array.from(new Set((mems || []).map((m) => m.organization_id).filter(Boolean)));
        if (!ids.length) {
          setOrgs([]);
          setOrgId("");
          return;
        }

        const { data: orgData } = await supabase
          .from("organizations")
          .select("id, name, slug")
          .in("id", ids)
          .order("name");

        const list = orgData || [];
        setOrgs(list);

        const preferScore =
          list.find((o) => String(o.slug || o.name || "").toLowerCase().includes("score")) || list[0];
        setOrgId(preferScore?.id || "");
      } finally {
        setLoadingOrgs(false);
      }
    };

    run();
  }, [email]);

  // Esc close
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") setOpen(false);
    };
    if (open) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const canUse = Boolean(token && email && orgId);

  const quickActions = useMemo(
    () => [
      { label: "Resumen ventas", prompt: "Dame un resumen de ventas del dashboard." },
      { label: "Top clientes", prompt: "Muéstrame los top clientes." },
      { label: "Envíos pendientes", prompt: "¿Qué envíos están pendientes? (tracking/estatus)" },
      {
        label: "Activar promo",
        prompt: 'Activa una promo: "ENVÍO GRATIS A TODO MÉXICO 🚚🔥"',
      },
      { label: "Apagar promo", prompt: "Apaga la promo (megáfono)." },
      { label: "Configurar Pixel", prompt: "Configura el Pixel con ID 123456789012345" },
    ],
    []
  );

  const send = async (text) => {
    const msg = clamp(text);
    if (!msg) return;

    if (!canUse) {
      setMessages((m) => [
        ...m,
        { role: "assistant", content: "No puedo operar: falta sesión u organización." },
      ]);
      return;
    }

    setBusy(true);
    setInput("");
    setMessages((m) => [...m, { role: "user", content: msg }]);

    try {
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          message: msg,
          organization_id: orgId,
        }),
      });

      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j?.error || "Error IA.");

      setMessages((m) => [...m, { role: "assistant", content: j?.reply || "OK" }]);
    } catch (e) {
      setMessages((m) => [
        ...m,
        { role: "assistant", content: `Error: ${String(e?.message || e)}` },
      ]);
    } finally {
      setBusy(false);
    }
  };

  // Hide dock if not logged
  if (!session) return null;

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-[80] px-4 py-3 rounded-2xl text-white font-black text-sm flex items-center gap-2 ai-fab"
        style={{
          background: BRAND.grad,
          paddingBottom: "max(12px, calc(12px + env(safe-area-inset-bottom)))",
        }}
        aria-label="Abrir Unico IA"
        title="Unico IA"
      >
        <Sparkles size={18} />
        IA
      </button>

      {/* Modal */}
      {open && (
        <div className="fixed inset-0 z-[100] bg-slate-900/45 backdrop-blur-sm p-4 flex items-end md:items-center justify-center">
          <div className="w-full max-w-2xl bg-white rounded-[2rem] border border-slate-200 shadow-2xl overflow-hidden animate-slide-up">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-11 h-11 rounded-2xl border border-slate-200 bg-white overflow-hidden flex items-center justify-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={logoSrc}
                    alt="UnicOs"
                    className="w-full h-full object-contain p-2"
                    onError={() => {
                      if (logoSrc !== BRAND.fallbackLogo) setLogoSrc(BRAND.fallbackLogo);
                    }}
                  />
                </div>
                <div className="min-w-0">
                  <p className="font-black text-slate-900 flex items-center gap-2">
                    <Bot size={16} /> Unico IA
                  </p>
                  <p className="text-xs font-semibold text-slate-500 truncate">
                    {email || "—"}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setOpen(false)}
                className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200"
                aria-label="Cerrar"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-4 border-b border-slate-100 bg-slate-50/70 flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                  Organización
                </span>

                <div className="relative">
                  <select
                    value={orgId}
                    onChange={(e) => setOrgId(e.target.value)}
                    className="appearance-none bg-white border border-slate-200 rounded-xl py-2 pl-3 pr-9 text-sm font-black text-slate-900 outline-none focus:ring-4 focus:ring-sky-500/10 focus:border-sky-600"
                    disabled={loadingOrgs || !orgs.length}
                  >
                    {orgs.map((o) => (
                      <option key={o.id} value={o.id}>
                        {o.name}
                      </option>
                    ))}
                  </select>
                  <ChevronDown
                    className="absolute right-3 top-2.5 text-slate-400 pointer-events-none"
                    size={16}
                  />
                </div>

                {loadingOrgs ? (
                  <span className="text-xs font-black text-slate-500 flex items-center gap-2">
                    <RefreshCcw className="animate-spin" size={14} /> Cargando…
                  </span>
                ) : null}
              </div>

              <div className="flex flex-wrap gap-2">
                {quickActions.slice(0, 4).map((a) => (
                  <button
                    key={a.label}
                    onClick={() => send(a.prompt)}
                    className="px-3 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-100 font-black text-xs text-slate-900"
                    disabled={busy}
                  >
                    {a.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="p-5 h-[52vh] md:h-[56vh] overflow-y-auto space-y-3">
              {!canUse ? (
                <div className="p-4 rounded-2xl bg-amber-50 border border-amber-100 text-amber-800 font-bold">
                  Falta sesión u organización válida. Si acabas de entrar, espera 2-3s y reintenta.
                </div>
              ) : null}

              {messages.map((m, idx) => (
                <div
                  key={idx}
                  className={clsx(
                    "max-w-[92%] rounded-2xl px-4 py-3 text-sm leading-relaxed font-semibold",
                    m.role === "assistant"
                      ? "bg-slate-50 border border-slate-200 text-slate-800"
                      : "text-white ml-auto"
                  )}
                  style={m.role === "user" ? { background: BRAND.grad } : undefined}
                >
                  {m.content}
                </div>
              ))}
              <div ref={bottomRef} />
            </div>

            <div className="p-4 border-t border-slate-100 bg-slate-50 flex gap-3">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && send(input)}
                className="flex-1 bg-white border border-slate-200 text-slate-800 font-bold px-4 py-3 rounded-xl outline-none focus:ring-4 focus:ring-sky-500/10 focus:border-sky-600"
                placeholder="Escribe una instrucción…"
                disabled={busy}
              />
              <button
                onClick={() => send(input)}
                disabled={busy || !input.trim()}
                className="px-5 py-3 rounded-xl text-white font-black flex items-center gap-2 disabled:opacity-60"
                style={{ background: BRAND.grad }}
              >
                <Send size={16} />
                {busy ? "Enviando" : "Enviar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}