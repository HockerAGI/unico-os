"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";
import clsx from "clsx";
import { Bot, Sparkles, Send, X, ChevronDown, RefreshCcw, History, Search } from "lucide-react";

const BRAND = {
  primaryLogo: "/logo-unico.png",
  fallbackLogo: "/icon-512.png",
  grad: "linear-gradient(135deg, #0EA5E9, #14B8A6)",
};

const clamp = (v, n = 2000) => String(v ?? "").trim().slice(0, n);
const normEmail = (s) => String(s || "").trim().toLowerCase();

export default function AiDock() {
  const [open, setOpen] = useState(false);
  const [view, setView] = useState("chat"); // chat | activity

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

  // Activity
  const [auditBusy, setAuditBusy] = useState(false);
  const [auditRows, setAuditRows] = useState([]);
  const [auditQ, setAuditQ] = useState("");

  const bottomRef = useRef(null);
  const [logoSrc, setLogoSrc] = useState(BRAND.primaryLogo);

  useEffect(() => {
    bottomRef.current?.scrollIntoView?.({ behavior: "smooth" });
  }, [messages, open]);

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
      { label: "Resumen ventas", prompt: "Resumen ventas" },
      { label: "Top clientes", prompt: "Top clientes" },
      { label: "Envíos pendientes", prompt: "Envíos pendientes" },
      { label: "Activar promo", prompt: 'Activa promo: "ENVÍO GRATIS A TODO MÉXICO 🚚🔥"' },
      { label: "Apagar promo", prompt: "Apaga promo" },
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
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ message: msg, organization_id: orgId }),
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

  const loadAudit = async () => {
    if (!canUse) return;
    setAuditBusy(true);
    try {
      const res = await fetch(`/api/audit/list?org_id=${encodeURIComponent(orgId)}&limit=120`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok || !j?.ok) throw new Error(j?.error || "No se pudo cargar actividad.");
      setAuditRows(j.rows || []);
    } catch {
      setAuditRows([]);
    } finally {
      setAuditBusy(false);
    }
  };

  useEffect(() => {
    if (open && view === "activity") loadAudit();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, view, orgId]);

  const filteredAudit = useMemo(() => {
    const q = auditQ.trim().toLowerCase();
    if (!q) return auditRows;
    return (auditRows || []).filter((r) => {
      const hay = `${r.action || ""} ${r.actor_email || ""} ${r.summary || ""}`.toLowerCase();
      return hay.includes(q);
    });
  }, [auditRows, auditQ]);

  if (!session) return null;

  return (
    <>
      <button
        onClick={() => { setOpen(true); setView("chat"); }}
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

      {open && (
        <div className="fixed inset-0 z-[100] bg-slate-900/45 backdrop-blur-sm p-4 flex items-end md:items-center justify-center">
          <div className="w-full max-w-2xl bg-white rounded-[2rem] border border-slate-200 shadow-2xl overflow-hidden animate-slide-up">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-11 h-11 rounded-2xl border border-slate-200 bg-white overflow-hidden flex items-center justify-center">
                  <img
                    src={logoSrc}
                    alt="UnicOs"
                    className="w-full h-full object-contain p-2"
                    onError={() => { if (logoSrc !== BRAND.fallbackLogo) setLogoSrc(BRAND.fallbackLogo); }}
                  />
                </div>
                <div className="min-w-0">
                  <p className="font-black text-slate-900 flex items-center gap-2">
                    <Bot size={16} /> Unico IA
                  </p>
                  <p className="text-xs font-semibold text-slate-500 truncate">{email || "—"}</p>
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
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Organización</span>

                <div className="relative">
                  <select
                    value={orgId}
                    onChange={(e) => setOrgId(e.target.value)}
                    className="appearance-none bg-white border border-slate-200 rounded-xl py-2 pl-3 pr-9 text-sm font-black text-slate-900 outline-none focus:ring-4 focus:ring-sky-500/10 focus:border-sky-600"
                    disabled={loadingOrgs || !orgs.length}
                  >
                    {orgs.map((o) => (
                      <option key={o.id} value={o.id}>{o.name}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-2.5 text-slate-400 pointer-events-none" size={16} />
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => setView("chat")}
                    className={clsx(
                      "px-3 py-2 rounded-xl font-black text-xs border",
                      view === "chat" ? "text-white border-transparent" : "bg-white text-slate-900 border-slate-200 hover:bg-slate-100"
                    )}
                    style={view === "chat" ? { background: BRAND.grad } : undefined}
                  >
                    <Sparkles size={14} className="inline mr-2" /> Chat
                  </button>

                  <button
                    onClick={() => setView("activity")}
                    className={clsx(
                      "px-3 py-2 rounded-xl font-black text-xs border",
                      view === "activity" ? "text-white border-transparent" : "bg-white text-slate-900 border-slate-200 hover:bg-slate-100"
                    )}
                    style={view === "activity" ? { background: BRAND.grad } : undefined}
                  >
                    <History size={14} className="inline mr-2" /> Actividad
                  </button>
                </div>

                {loadingOrgs ? (
                  <span className="text-xs font-black text-slate-500 flex items-center gap-2">
                    <RefreshCcw className="animate-spin" size={14} /> Cargando…
                  </span>
                ) : null}
              </div>

              {view === "chat" ? (
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
              ) : (
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 text-slate-400" size={16} />
                    <input
                      value={auditQ}
                      onChange={(e) => setAuditQ(e.target.value)}
                      placeholder="Buscar acción/correo…"
                      className="pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 bg-white font-bold text-slate-800 outline-none focus:ring-4 focus:ring-sky-500/10 focus:border-sky-600 w-[240px]"
                    />
                  </div>
                  <button
                    onClick={loadAudit}
                    className="px-3 py-2.5 rounded-xl bg-slate-900 text-white font-black text-xs hover:opacity-90 flex items-center gap-2"
                    disabled={auditBusy}
                  >
                    <RefreshCcw size={14} /> {auditBusy ? "Cargando…" : "Recargar"}
                  </button>
                </div>
              )}
            </div>

            {view === "chat" ? (
              <>
                <div className="p-5 h-[52vh] md:h-[56vh] overflow-y-auto space-y-3">
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
              </>
            ) : (
              <div className="p-5 h-[60vh] overflow-y-auto">
                <div className="text-xs font-semibold text-slate-500 mb-3">
                  Solo owner/admin pueden ver actividad.
                </div>

                {auditBusy ? (
                  <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 text-slate-700 font-bold">
                    Cargando…
                  </div>
                ) : filteredAudit.length ? (
                  <div className="space-y-2">
                    {filteredAudit.slice(0, 120).map((r) => (
                      <div key={r.id} className="p-4 rounded-2xl border border-slate-200 bg-white">
                        <div className="flex items-center justify-between gap-3 flex-wrap">
                          <div>
                            <p className="font-black text-slate-900">{r.action}</p>
                            <p className="text-xs font-semibold text-slate-500">
                              {r.actor_email || "—"} •{" "}
                              {r.created_at ? new Date(r.created_at).toLocaleString("es-MX") : "—"}
                            </p>
                          </div>
                          {r.entity ? (
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-600 bg-slate-100 border border-slate-200 px-3 py-1 rounded-full">
                              {r.entity}
                            </span>
                          ) : null}
                        </div>
                        {r.summary ? (
                          <p className="mt-2 text-sm font-semibold text-slate-700">{r.summary}</p>
                        ) : null}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 text-slate-700 font-bold">
                    Sin registros (o falta audit_log / permisos).
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}