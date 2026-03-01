/* eslint-disable react/no-unescaped-entities */
"use client";

/* =========================================================
   UNICOs OS — Admin (Next.js App Router)
   Archivo real del ZIP + FIXES:
   - Fix sintaxis rota en separadores
   - AiDock import + CommandPalette (antes se usaban pero no existían)
   - UI sin menciones de “70%” (pero conserva cálculo interno)
   ========================================================= */

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import clsx from "clsx";
import Image from "next/image";

import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Users,
  Megaphone,
  Shield,
  Settings,
  LogOut,
  Search,
  Sparkles,
  Bell,
  Menu,
  ChevronDown,
  X,
  RefreshCcw,
  Truck,
  CheckCircle,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ClipboardList,
  Receipt,
  CreditCard,
  ArrowUpRight,
  ArrowDownRight,
  Copy,
  ExternalLink,
  Boxes,
  Clock,
  Wand2,
  GanttChartSquare,
  FileText,
  Send,
  UserPlus,
  Lock,
  Unlock,
} from "lucide-react";

import AiDock from "./ai-dock";

import { supabase } from "@/lib/supabase";
import { hasPerm, canManageUsers } from "@/lib/authz";

/* =========================================================
   BRAND / THEME
   ========================================================= */
const BRAND = {
  name: "UnicOs",
  grad: "linear-gradient(135deg, #0ea5e9 0%, #14b8a6 100%)",
};

/* =========================================================
   HELPERS
   ========================================================= */
const normEmail = (s) => String(s || "").trim().toLowerCase();
const num = (n) => {
  const x = Number(n);
  return Number.isFinite(x) ? x : 0;
};
const moneyMXN = (n) => {
  const x = Number(n);
  if (!Number.isFinite(x)) return "$0.00";
  try {
    return x.toLocaleString("es-MX", { style: "currency", currency: "MXN" });
  } catch {
    return `$${x.toFixed(2)}`;
  }
};

function BrandMark({ size = 44 }) {
  return (
    <div
      className="rounded-2xl flex items-center justify-center text-white font-black"
      style={{ width: size, height: size, background: BRAND.grad }}
    >
      U
    </div>
  );
}

function BootScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
      <div className="max-w-md w-full bg-white border border-slate-200 rounded-[2rem] shadow-2xl p-8 text-center">
        <div className="mx-auto h-16 w-16 rounded-2xl bg-slate-100 text-slate-500 flex items-center justify-center mb-6">
          <Sparkles size={32} />
        </div>
        <h2 className="text-xl font-black text-slate-900 mb-2">Cargando panel…</h2>
        <p className="text-sm text-slate-500 font-semibold leading-relaxed">
          Preparando permisos, organizaciones y datos.
        </p>
        <p className="text-[11px] font-black uppercase tracking-widest text-slate-400 mt-6">
          UnicOs
        </p>
      </div>
    </div>
  );
}

function useToast() {
  const [toast, setToast] = useState(null);
  const show = useCallback((t) => {
    setToast({ ...t, id: Date.now() });
    setTimeout(() => setToast(null), 2600);
  }, []);
  return { toast, show };
}

function Toast({ t }) {
  if (!t) return null;

  const tone =
    t.type === "success"
      ? "bg-emerald-50 text-emerald-900 border-emerald-200"
      : t.type === "warn"
      ? "bg-amber-50 text-amber-900 border-amber-200"
      : t.type === "info"
      ? "bg-sky-50 text-sky-900 border-sky-200"
      : "bg-rose-50 text-rose-900 border-rose-200";

  return (
    <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-[99] px-4">
      <div className={clsx("max-w-lg w-full border rounded-2xl shadow-xl px-4 py-3 font-bold text-sm", tone)}>
        {t.text}
      </div>
    </div>
  );
}

/* =========================================================
   AUTH
   ========================================================= */
export default function Page() {
  const [session, setSession] = useState(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data?.session || null));
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => setSession(s));
    return () => sub?.subscription?.unsubscribe?.();
  }, []);

  if (!session) return <AuthGate onDone={(s) => setSession(s)} />;
  return <Shell session={session} />;
}

function AuthGate({ onDone }) {
  const { toast, show } = useToast();
  const [state, setState] = useState({ email: "", pass: "", busy: false });

  const signIn = async () => {
    const email = normEmail(state.email);
    const pass = String(state.pass || "");
    if (!email || pass.length < 6) {
      show({ type: "warn", text: "Email y contraseña válidos (mínimo 6 caracteres)." });
      return;
    }

    setState((s) => ({ ...s, busy: true }));
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password: pass });
      if (error) throw error;
      onDone?.(data?.session || null);
    } catch (e) {
      show({ type: "error", text: String(e?.message || e) });
    } finally {
      setState((s) => ({ ...s, busy: false }));
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
      <div className="max-w-md w-full bg-white border border-slate-200 rounded-[2rem] shadow-2xl p-8">
        <div className="flex items-center gap-3 mb-6">
          <BrandMark size={44} />
          <div>
            <h1 className="text-lg font-black text-slate-900 leading-tight tracking-tight">UnicOs Admin</h1>
            <p className="text-xs font-semibold text-slate-500">Acceso de administración</p>
          </div>
        </div>

        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-2 mb-2 block">
          Email
        </label>
        <input
          value={state.email}
          onChange={(e) => setState((s) => ({ ...s, email: e.target.value }))}
          className="w-full rounded-xl border border-slate-200 px-4 py-3 font-bold outline-none focus:ring-4 focus:ring-sky-500/10 focus:border-sky-600"
          placeholder="correo@dominio.com"
        />

        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-2 mt-4 mb-2 block">
          Contraseña
        </label>
        <input
          type="password"
          value={state.pass}
          onChange={(e) => setState((s) => ({ ...s, pass: e.target.value }))}
          className="w-full rounded-xl border border-slate-200 px-4 py-3 font-bold outline-none focus:ring-4 focus:ring-sky-500/10 focus:border-sky-600"
          placeholder="••••••••"
        />

        <button
          onClick={signIn}
          disabled={state.busy}
          className="mt-6 w-full px-5 py-3 rounded-2xl text-white font-black shadow-sm disabled:opacity-60"
          style={{ background: BRAND.grad }}
        >
          {state.busy ? "Entrando…" : "Entrar"}
        </button>

        {toast ? <Toast t={toast} /> : null}
      </div>
    </div>
  );
}
/* =========================================================
   COMMAND PALETTE (Ctrl/Cmd + K)
   ========================================================= */
function CommandPalette({
  open,
  onClose,
  query,
  setQuery,
  inputRef,
  tabs,
  activeTab,
  setActiveTab,
  results,
  canInvite,
  onOpenAi,
  onRefresh,
}) {
  const q = String(query || "").trim();

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === "Escape") onClose?.();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => inputRef?.current?.focus?.(), 0);
    return () => clearTimeout(t);
  }, [open, inputRef]);

  if (!open) return null;

  const quick = [
    { id: "dashboard", label: "Ir a Finanzas", icon: <LayoutDashboard size={18} /> },
    { id: "orders", label: "Ir a Pedidos", icon: <ShoppingCart size={18} /> },
    { id: "shipping", label: "Ir a Envíos", icon: <Truck size={18} /> },
    { id: "products", label: "Ir a Productos", icon: <Package size={18} /> },
    { id: "crm", label: "Ir a Clientes", icon: <Users size={18} /> },
    { id: "marketing", label: "Ir a Marketing", icon: <Megaphone size={18} /> },
    ...(canInvite ? [{ id: "users", label: "Ir a Equipo", icon: <Shield size={18} /> }] : []),
    { id: "settings", label: "Ir a Integraciones", icon: <Settings size={18} /> },
  ].filter((a) => (tabs || []).some((t) => t.id === a.id));

  const go = (id) => {
    if (!(tabs || []).some((t) => t.id === id)) return;
    setActiveTab?.(id);
    onClose?.();
  };

  const openAi = () => {
    try {
      onOpenAi?.();
    } catch {}
    onClose?.();
  };

  const refresh = () => {
    try {
      onRefresh?.();
    } catch {}
    onClose?.();
  };

  return (
    <div className="fixed inset-0 z-[95] bg-slate-900/40 backdrop-blur-sm p-4 flex items-start md:items-center justify-center">
      <div className="w-full max-w-2xl bg-white rounded-[2rem] border border-slate-200 shadow-2xl overflow-hidden">
        <div className="p-4 border-b border-slate-100 bg-slate-50/70 flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 text-slate-400" size={18} />
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar pedidos o productos…"
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white font-bold text-slate-800 outline-none focus:ring-4 focus:ring-sky-500/10 focus:border-sky-600"
            />
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200"
            aria-label="Cerrar"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-4">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">Acciones rápidas</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {quick.map((a) => (
              <button
                key={a.id}
                onClick={() => go(a.id)}
                className={clsx(
                  "w-full p-3 rounded-2xl border text-left flex items-center justify-between gap-3 transition-colors",
                  activeTab === a.id ? "border-transparent text-white" : "border-slate-200 hover:bg-slate-50"
                )}
                style={activeTab === a.id ? { background: BRAND.grad } : undefined}
              >
                <span className="flex items-center gap-2 font-black">
                  <span className={activeTab === a.id ? "text-white" : "text-slate-500"}>{a.icon}</span>
                  {a.label}
                </span>
                <span className={clsx("text-xs font-black", activeTab === a.id ? "text-white/80" : "text-slate-400")}>
                  Enter
                </span>
              </button>
            ))}

            <button
              onClick={refresh}
              className="w-full p-3 rounded-2xl border border-slate-200 hover:bg-slate-50 text-left flex items-center justify-between gap-3"
            >
              <span className="flex items-center gap-2 font-black text-slate-900">
                <RefreshCcw size={18} className="text-slate-500" /> Actualizar vista
              </span>
              <span className="text-xs font-black text-slate-400">R</span>
            </button>

            <button
              onClick={openAi}
              className="w-full p-3 rounded-2xl border border-slate-200 hover:bg-slate-50 text-left flex items-center justify-between gap-3"
            >
              <span className="flex items-center gap-2 font-black text-slate-900">
                <Sparkles size={18} className="text-slate-500" /> Abrir IA
              </span>
              <span className="text-xs font-black text-slate-400">I</span>
            </button>
          </div>

          <div className="mt-5">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">
              Resultados{q.length >= 2 ? " · " : " "}
              <span className="ml-1">{q.length >= 2 ? `“${q}”` : "Escribe para buscar"}</span>
            </p>

            {q.length < 2 ? (
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-sm font-semibold text-slate-600">
                Tip: usa <span className="font-black">Ctrl/⌘ + K</span> en cualquier parte.
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <p className="text-[11px] font-black uppercase tracking-widest text-slate-500 mb-2">Pedidos</p>
                  {results?.orders?.length ? (
                    <div className="space-y-1">
                      {results.orders.map((o) => (
                        <button
                          key={o.id}
                          className="w-full text-left p-3 rounded-xl hover:bg-slate-50 border border-transparent hover:border-slate-200"
                          onClick={() => go("orders")}
                        >
                          <div className="flex items-center justify-between">
                            <p className="font-black text-slate-900">
                              #{String(o.id).split("-")[0].toUpperCase()}{" "}
                              <span className="text-slate-500 font-semibold">• {moneyMXN(o.amount_total_mxn)}</span>
                            </p>
                            <span className="text-xs font-black text-slate-600">
                              {String(o.status || "").toUpperCase()}
                            </span>
                          </div>
                          <p className="text-xs font-semibold text-slate-500">{o.customer_name || o.email || "—"}</p>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm font-semibold text-slate-500">Sin coincidencias.</p>
                  )}
                </div>

                <div>
                  <p className="text-[11px] font-black uppercase tracking-widest text-slate-500 mb-2">Productos</p>
                  {results?.products?.length ? (
                    <div className="space-y-1">
                      {results.products.map((p) => (
                        <button
                          key={p.id}
                          className="w-full text-left p-3 rounded-xl hover:bg-slate-50 border border-transparent hover:border-slate-200"
                          onClick={() => go("products")}
                        >
                          <p className="font-black text-slate-900">{p.name}</p>
                          <p className="text-xs font-semibold text-slate-500">
                            SKU: {p.sku || "—"} • {moneyMXN(p.price_mxn)} • Stock: {num(p.stock)}
                          </p>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm font-semibold text-slate-500">Sin coincidencias.</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="p-4 border-t border-slate-100 bg-slate-50/70 text-xs font-bold text-slate-500 flex items-center justify-between">
          <span>
            <span className="font-black">Ctrl/⌘ + K</span> abrir • <span className="font-black">Esc</span> cerrar
          </span>
          <span className="font-black text-slate-700">UnicOs</span>
        </div>
      </div>
    </div>
  );
}
/* =========================================================
   APP SHELL
   ========================================================= */
function Shell({ session }) {
  const { toast, show: toastShow } = useToast();

  const token = session?.access_token || "";
  const userEmail = normEmail(session?.user?.email);

  const [loading, setLoading] = useState(true);
  const [orgs, setOrgs] = useState([]);
  const [selectedOrgId, setSelectedOrgId] = useState(null);

  const [role, setRole] = useState("viewer");
  const [activeTab, setActiveTab] = useState("dashboard");

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Global Search (orders + products)
  const [globalQuery, setGlobalQuery] = useState("");
  const [globalResults, setGlobalResults] = useState({ orders: [], products: [] });

  // Command Palette
  const [paletteOpen, setPaletteOpen] = useState(false);
  const paletteInputRef = useRef(null);

  const canInvite = canManageUsers(role);
  const canWrite = ["owner", "admin", "ops"].includes(String(role || "").toLowerCase());

  const openAi = useCallback(() => {
    try {
      const btn = document.querySelector(".ai-fab");
      btn?.click?.();
    } catch {}
  }, []);

  const forceRefresh = useCallback(() => {
    toastShow({ type: "info", text: "Actualizando…" });
    try {
      window.location.reload();
    } catch {}
  }, [toastShow]);

  useEffect(() => {
    async function init() {
      setLoading(true);
      try {
        // Memberships by email (RLS-safe)
        const { data: mems, error: memErr } = await supabase
          .from("admin_users")
          .select("organization_id, role, is_active")
          .ilike("email", userEmail)
          .eq("is_active", true);

        if (memErr) throw memErr;

        const orgIds = Array.from(new Set((mems || []).map((m) => m.organization_id).filter(Boolean)));

        if (!orgIds.length) {
          setOrgs([]);
          setSelectedOrgId(null);
          setRole("viewer");
          return;
        }

        const { data: orgData, error: orgErr } = await supabase
          .from("organizations")
          .select("id, name, slug")
          .in("id", orgIds)
          .order("name");

        if (orgErr) throw orgErr;

        const list = orgData || [];
        setOrgs(list);

        const preferScore = list.find((o) => String(o.slug || o.name || "").toLowerCase().includes("score"));
        const pick = preferScore?.id || list?.[0]?.id;

        setSelectedOrgId(pick || null);

        const my = (mems || []).find((m) => String(m.organization_id) === String(pick));
        setRole(String(my?.role || "viewer").toLowerCase());
      } catch (e) {
        console.error(e);
        setOrgs([]);
        setSelectedOrgId(null);
        setRole("viewer");
      } finally {
        setLoading(false);
      }
    }
    init();
  }, [userEmail]);

  useEffect(() => {
    (async () => {
      if (!selectedOrgId) return;
      const { data } = await supabase
        .from("admin_users")
        .select("role,is_active")
        .eq("organization_id", selectedOrgId)
        .ilike("email", userEmail)
        .eq("is_active", true)
        .maybeSingle();

      setRole(String(data?.role || "viewer").toLowerCase());
    })();
  }, [selectedOrgId, userEmail]);

  useEffect(() => {
    let alive = true;
    const q = globalQuery.trim();

    if (!q || q.length < 2 || !selectedOrgId) {
      setGlobalResults({ orders: [], products: [] });
      return;
    }

    const t = setTimeout(async () => {
      try {
        const [oRes, pRes] = await Promise.all([
          supabase
            .from("orders")
            .select("id, created_at, customer_name, email, amount_total_mxn, status, stripe_session_id")
            .eq("organization_id", selectedOrgId)
            .or(`customer_name.ilike.%${q}%,email.ilike.%${q}%,id.ilike.%${q}%`)
            .order("created_at", { ascending: false })
            .limit(6),
          supabase
            .from("products")
            .select("id, name, sku, price_mxn, stock, is_active")
            .eq("organization_id", selectedOrgId)
            .or(`name.ilike.%${q}%,sku.ilike.%${q}%`)
            .order("created_at", { ascending: false })
            .limit(6),
        ]);

        if (!alive) return;
        setGlobalResults({ orders: oRes?.data || [], products: pRes?.data || [] });
      } catch {
        if (!alive) return;
        setGlobalResults({ orders: [], products: [] });
      }
    }, 220);

    return () => {
      alive = false;
      clearTimeout(t);
    };
  }, [globalQuery, selectedOrgId]);

  useEffect(() => {
    const onKey = (e) => {
      const k = String(e.key || "").toLowerCase();

      if ((e.ctrlKey || e.metaKey) && k === "k") {
        e.preventDefault();
        setPaletteOpen(true);
        setTimeout(() => paletteInputRef.current?.focus?.(), 0);
        return;
      }

      if (paletteOpen) {
        if (k === "i") openAi();
        if (k === "r") forceRefresh();
      }
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [paletteOpen, openAi, forceRefresh]);

  const signOut = () => supabase.auth.signOut();

  if (loading) return <BootScreen />;

  // ✅ Auto-recovery: corrige “No se encontró la organización.” cuando no hay vínculo aún
  if (!selectedOrgId) {
    return <BootstrapGate token={token} onSignOut={signOut} />;
  }

  const ALL_TABS = [
    { id: "dashboard", label: "Finanzas", icon: <LayoutDashboard size={20} /> },
    { id: "orders", label: "Pedidos", icon: <ShoppingCart size={20} /> },
    { id: "shipping", label: "Envíos", icon: <Truck size={20} /> },
    { id: "products", label: "Productos", icon: <Package size={20} /> },
    { id: "crm", label: "Clientes", icon: <Users size={20} /> },
    { id: "marketing", label: "Marketing", icon: <Megaphone size={20} /> },
    { id: "users", label: "Equipo", icon: <Shield size={20} /> },
    { id: "settings", label: "Integraciones", icon: <Settings size={20} /> },
  ].filter((t) => hasPerm(role, t.id));

  const activeLabel = ALL_TABS.find((t) => t.id === activeTab)?.label || "Panel";

  return (
    <div
      className="flex h-screen overflow-hidden font-sans"
      style={{
        background:
          "linear-gradient(180deg, rgba(14,165,233,0.06), rgba(20,184,166,0.04) 35%, rgba(248,250,252,1) 100%)",
      }}
    >
      {mobileMenuOpen ? (
        <div
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-30 md:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      ) : null}

      <aside
        className={clsx(
          "fixed inset-y-0 left-0 z-40 w-72 bg-white border-r border-slate-200 flex flex-col transition-transform duration-300 md:translate-x-0 md:static",
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="p-6 flex items-center gap-3 border-b border-slate-200 bg-slate-50/70">
          <BrandMark size={44} />
          <div className="min-w-0">
            <h1 className="text-lg font-black text-slate-900 leading-tight tracking-tight truncate">UnicOs</h1>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
              <p className="text-[10px] font-black tracking-widest uppercase text-slate-500">{role}</p>
            </div>
          </div>
        </div>

        <div className="p-4 border-b border-slate-200">
          <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-2 mb-2 block">
            Organización activa
          </label>
          <div className="relative">
            <select
              value={selectedOrgId}
              onChange={(e) => {
                setSelectedOrgId(e.target.value);
                setActiveTab("dashboard");
                toastShow({ type: "info", text: "Organización actualizada." });
              }}
              className="w-full appearance-none bg-white border border-slate-200 rounded-xl py-3 px-4 text-sm font-black text-slate-900 outline-none focus:ring-4 focus:ring-sky-500/10 focus:border-sky-600"
            >
              {orgs.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.name}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-4 top-3.5 text-slate-400 pointer-events-none" size={16} />
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {ALL_TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                setMobileMenuOpen(false);
              }}
              className={clsx(
                "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-black transition-all",
                activeTab === tab.id ? "text-white shadow-lg" : "hover:bg-slate-100 text-slate-700"
              )}
              style={activeTab === tab.id ? { background: BRAND.grad } : undefined}
            >
              <span className={activeTab === tab.id ? "text-white" : "text-slate-400"}>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-200 bg-slate-50/70 space-y-2">
          <button
            onClick={signOut}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-slate-200 hover:bg-rose-50 hover:text-rose-700 text-xs font-black text-slate-700 transition-colors"
          >
            <LogOut size={14} /> Cerrar sesión
          </button>
        </div>
      </aside>
<main className="flex-1 flex flex-col h-screen overflow-hidden relative">
        <header className="z-20 px-4 md:px-6 py-4 flex justify-between items-center sticky top-0 bg-white/80 backdrop-blur-md border-b border-slate-200">
          <div className="flex items-center gap-4 min-w-0">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="md:hidden p-2 text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg"
              aria-label="Abrir menú"
            >
              <Menu size={20} />
            </button>

            <div className="min-w-0">
              <h2 className="text-xl font-black text-slate-900 tracking-tight truncate">{activeLabel}</h2>
              <p className="text-xs font-semibold text-slate-500 truncate">{userEmail}</p>
            </div>
          </div>

          <div className="relative hidden md:block w-[460px] max-w-[46vw]">
            <Search className="absolute left-3 top-3 text-slate-400" size={18} />
            <input
              ref={paletteInputRef}
              value={globalQuery}
              onChange={(e) => setGlobalQuery(e.target.value)}
              onFocus={() => setPaletteOpen(true)}
              placeholder="Buscar… (Ctrl/⌘ + K)"
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white font-bold text-slate-800 outline-none focus:ring-4 focus:ring-sky-500/10 focus:border-sky-600"
            />
          </div>

          <div className="flex items-center gap-2 md:gap-3">
            <button
              onClick={() => {
                setPaletteOpen(true);
                setTimeout(() => paletteInputRef.current?.focus?.(), 0);
              }}
              className="md:hidden p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700"
              aria-label="Buscar"
              title="Buscar"
            >
              <Search size={18} />
            </button>

            <button
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700"
              aria-label="Notificaciones"
              title="Notificaciones"
            >
              <Bell size={18} />
            </button>

            <button
              onClick={openAi}
              className="flex items-center gap-2 px-3 py-2 rounded-xl text-white font-black text-xs shadow-sm"
              style={{ background: BRAND.grad }}
              title="Unico IA"
            >
              <Sparkles size={16} /> IA
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 md:p-8 pb-24">
          <div className="max-w-7xl mx-auto space-y-6">
            {activeTab === "dashboard" && <DashboardView orgId={selectedOrgId} token={token} toast={toastShow} />}

            {activeTab === "orders" && (
              <OrdersAndShippingView orgId={selectedOrgId} token={token} canWrite={canWrite} toast={toastShow} />
            )}

            {activeTab === "shipping" && <ShippingView orgId={selectedOrgId} toast={toastShow} />}

            {activeTab === "products" && <ProductsView orgId={selectedOrgId} canWrite={canWrite} toast={toastShow} />}

            {activeTab === "crm" && <CRMView orgId={selectedOrgId} />}

            {activeTab === "marketing" && <MarketingView orgId={selectedOrgId} toast={toastShow} />}

            {activeTab === "users" && (
              <UsersView
                orgId={selectedOrgId}
                token={token}
                role={role}
                canInvite={canInvite}
                toast={toastShow}
              />
            )}

            {activeTab === "settings" && <IntegrationsView token={token} toast={toastShow} />}
          </div>
        </div>

        {toast ? <Toast t={toast} /> : null}

        <CommandPalette
          open={paletteOpen}
          onClose={() => setPaletteOpen(false)}
          query={globalQuery}
          setQuery={setGlobalQuery}
          inputRef={paletteInputRef}
          tabs={ALL_TABS}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          results={globalResults}
          canInvite={canInvite}
          onOpenAi={openAi}
          onRefresh={forceRefresh}
        />

        {/* IA (floating) */}
        <AiDock />
      </main>
    </div>
  );
}

/* =========================================================
   BOOTSTRAP (auto recovery)
   ========================================================= */
function BootstrapGate({ token, onSignOut }) {
  const [state, setState] = useState({ busy: true, error: "" });

  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        const res = await fetch("/api/bootstrap", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        });

        const j = await res.json().catch(() => ({}));
        if (!res.ok || !j?.ok) throw new Error(j?.error || "No se pudo activar el acceso.");

        if (alive) window.location.reload();
      } catch (e) {
        if (!alive) return;
        setState({ busy: false, error: String(e?.message || e) });
      }
    })();

    return () => {
      alive = false;
    };
  }, [token]);

  if (state.busy) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-slate-50">
        <div className="max-w-md w-full bg-white border border-slate-200 rounded-[2rem] shadow-2xl p-8 text-center">
          <div className="mx-auto h-16 w-16 rounded-2xl bg-slate-100 text-slate-500 flex items-center justify-center mb-6">
            <Sparkles size={32} />
          </div>
          <h2 className="text-xl font-black text-slate-900 mb-2">Activando acceso…</h2>
          <p className="text-sm text-slate-500 font-semibold leading-relaxed">
            Configurando organizaciones, permisos y seguridad.
          </p>
          <p className="text-[11px] font-black uppercase tracking-widest text-slate-400 mt-5">UnicOs</p>
        </div>
      </div>
    );
  }

  return (
    <EmptyState
      title="Error: No se encontró la organización."
      desc={state.error || "Tu cuenta existe, pero no está vinculada a ninguna organización con acceso admin."}
      actionLabel="Salir"
      onAction={onSignOut}
    />
  );
}
function stripeDashboardUrl(sessionId) {
  if (!sessionId) return "";
  return `https://dashboard.stripe.com/payments/${encodeURIComponent(sessionId)}`;
}

function extractEnviaCost(raw) {
  try {
    const r = raw || {};
    return (
      num(r?.data?.price) ||
      num(r?.price) ||
      num(r?.shipment?.price) ||
      num(r?.shipment?.totalPrice) ||
      0
    );
  } catch {
    return 0;
  }
}

function clampList(arr, max = 120) {
  const out = [];
  for (const v of Array.isArray(arr) ? arr : []) {
    const s = String(v || "").trim();
    if (!s) continue;
    out.push(s);
    if (out.length >= max) break;
  }
  return out;
}

function round2(n) {
  const x = num(n);
  return Math.round(x * 100) / 100;
}

/* =========================================================
   DASHBOARD (Stripe + Envía)
   ========================================================= */
function DashboardView({ orgId, token, toast }) {
  const [busy, setBusy] = useState(false);
  const [kpi, setKpi] = useState({
    gross: 0,
    net100: 0,
    score70: 0,
    stripeFee: 0,
    stripeMode: "estimate",
    enviaCost: 0,
    orders: 0,
    avg: 0,
    sessions: [],
  });

  const load = useCallback(async () => {
    if (!orgId) return;
    setBusy(true);

    try {
      // Paid/fulfilled orders (real)
      const { data: paidOrders } = await supabase
        .from("orders")
        .select("id, amount_total_mxn, status, stripe_session_id")
        .eq("organization_id", orgId)
        .in("status", ["paid", "fulfilled"])
        .order("created_at", { ascending: false })
        .limit(600);

      const list = paidOrders || [];
      const gross = round2(list.reduce((a, o) => a + num(o.amount_total_mxn), 0));
      const orders = list.length;
      const avg = orders ? round2(gross / orders) : 0;
      const sessions = clampList(list.map((o) => o.stripe_session_id).filter(Boolean), 200);

      // Envía cost (real from shipping_labels.raw)
      let enviaCost = 0;
      if (sessions.length) {
        const { data: labels } = await supabase
          .from("shipping_labels")
          .select("stripe_session_id, raw")
          .in("stripe_session_id", sessions.slice(0, 200));

        for (const l of labels || []) {
          enviaCost += extractEnviaCost(l?.raw);
        }
      }
      enviaCost = round2(enviaCost);

      // Stripe fees (try REAL via API, else estimate)
      let stripeFee = 0;
      let stripeMode = "estimate";

      if (sessions.length) {
        try {
          const res = await fetch("/api/stripe/fees", {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
            body: JSON.stringify({ org_id: orgId, stripe_session_ids: sessions.slice(0, 120) }),
          });

          const j = await res.json().catch(() => ({}));
          if (res.ok && j?.ok) {
            stripeFee = round2(j.total_fee_mxn);
            stripeMode = "stripe";
          } else {
            throw new Error(j?.error || "fee fail");
          }
        } catch {
          // estimate fallback
          stripeFee = round2(gross * 0.036 + orders * 3);
          stripeMode = "estimate";
        }
      }

      // Net (internal)
      const net100 = Math.max(0, round2(gross - stripeFee - enviaCost));

      // Score70 internal (displayed as total in UI)
      const score70 = Math.max(0, round2(net100 * 0.7));

      setKpi({
        gross,
        net100,
        score70,
        stripeFee,
        stripeMode,
        enviaCost,
        orders,
        avg,
        sessions,
      });
    } catch (e) {
      console.error(e);
      toast?.({ type: "error", text: e?.message || "No se pudo cargar dashboard." });
    } finally {
      setBusy(false);
    }
  }, [orgId, token, toast]);

  useEffect(() => {
    load();
  }, [load]);

  function MiniKPI({ label, value, hint }) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-4">
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">{label}</p>
        <p className="text-lg font-black text-slate-900">{value}</p>
        {hint ? <p className="text-xs font-semibold text-slate-500 mt-1">{hint}</p> : null}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-slate-900 rounded-[2.2rem] border border-white/10 shadow-xl overflow-hidden">
        <div className="p-8 md:p-10">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
            <div className="min-w-0">
              <p className="text-slate-300/90 text-xs font-black uppercase tracking-widest mb-2 flex items-center gap-2">
                <Sparkles size={14} className="text-sky-300" /> Ganancia total
              </p>
              <div className="flex items-end gap-3">
                <h3 className="text-4xl md:text-5xl font-black text-white tracking-tight">
                  {moneyMXN(kpi.score70)}
                </h3>
              </div>

              <div className="pb-1">
                <p className="text-xs font-bold text-slate-300/80">Neto calculado</p>
              </div>

              <p className="text-sm font-semibold text-slate-200/80 mt-2 flex items-center gap-2">
                <Receipt size={16} className="text-slate-300" />
                Bruto − comisión Stripe − costo Envía = Neto.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={load}
                className="px-4 py-2.5 rounded-2xl bg-white/10 hover:bg-white/15 text-white font-black text-sm flex items-center gap-2 border border-white/10"
              >
                <RefreshCcw size={16} className={busy ? "animate-spin" : ""} /> Actualizar
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-6 mt-6 border-t border-white/10">
            <MiniKPI label="Ventas brutas" value={moneyMXN(kpi.gross)} />
            <MiniKPI label="Pedidos pagados" value={num(kpi.orders)} />
            <MiniKPI label="Ticket promedio" value={moneyMXN(kpi.avg)} />
            <MiniKPI
              label="Comisión Stripe"
              value={moneyMXN(kpi.stripeFee)}
              hint={kpi.stripeMode === "stripe" ? "Real" : "Estimado"}
            />
            <MiniKPI label="Costo Envía" value={moneyMXN(kpi.enviaCost)} />
<MiniKPI label="Estado" value={busy ? "Cargando…" : "Listo"} />
            <MiniKPI label="Base" value="orders + shipping_labels" />
            <MiniKPI label="Sesiones" value={kpi.sessions?.length || 0} />
          </div>
        </div>
      </div>

      <AlertsPanel kpi={kpi} />
    </div>
  );
}
function AlertsPanel({ kpi }) {
  const alerts = useMemo(() => {
    const out = [];
    if (kpi.orders === 0) out.push({ type: "warn", text: "Aún no hay pedidos pagados para calcular KPIs." });
    if (kpi.stripeMode !== "stripe")
      out.push({ type: "info", text: "Comisión Stripe está en modo estimado (si Stripe API falla o falta key)." });
    if (kpi.enviaCost === 0 && kpi.sessions?.length)
      out.push({ type: "info", text: "Envía cost en 0: verifica si ya se están guardando shipping_labels.raw." });
    return out;
  }, [kpi]);

  if (!alerts.length) {
    return (
      <div className="bg-white border border-slate-200 rounded-[2rem] shadow-sm p-6">
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">Alertas</p>
        <p className="text-sm font-semibold text-slate-700">Todo se ve bien.</p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-slate-200 rounded-[2rem] shadow-sm p-6">
      <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-4">Alertas</p>
      <div className="space-y-2">
        {alerts.map((a, i) => (
          <div
            key={i}
            className={clsx(
              "p-3 rounded-2xl border font-bold text-sm",
              a.type === "warn"
                ? "bg-amber-50 border-amber-200 text-amber-900"
                : "bg-sky-50 border-sky-200 text-sky-900"
            )}
          >
            {a.text}
          </div>
        ))}
      </div>
    </div>
  );
}

/* =========================================================
   ORDERS + SHIPPING (real)
   ========================================================= */
function OrdersAndShippingView({ orgId, token, canWrite, toast }) {
  const [busy, setBusy] = useState(true);
  const [orders, setOrders] = useState([]);
  const [selected, setSelected] = useState(new Set());
  const [q, setQ] = useState("");
  const [modal, setModal] = useState(null);

  const load = useCallback(async () => {
    setBusy(true);
    try {
      let query = supabase
        .from("orders")
        .select("id, created_at, customer_name, email, amount_total_mxn, status, stripe_session_id, metadata")
        .eq("organization_id", orgId)
        .order("created_at", { ascending: false })
        .limit(200);

      if (q.trim().length >= 2) {
        const s = q.trim();
        query = query.or(`customer_name.ilike.%${s}%,email.ilike.%${s}%,id.ilike.%${s}%`);
      }

      const { data, error } = await query;
      if (error) throw error;

      setOrders(data || []);
      setSelected(new Set());
    } catch (e) {
      console.error(e);
      toast?.({ type: "error", text: "No se pudieron cargar pedidos." });
      setOrders([]);
    } finally {
      setBusy(false);
    }
  }, [orgId, q, toast]);

  useEffect(() => {
    load();
  }, [load]);

  const toggle = (id) => {
    setSelected((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  };

  const bulkUpdate = async (status) => {
    if (!canWrite) return toast?.({ type: "error", text: "Sin permisos." });
    const ids = Array.from(selected || []);
    if (!ids.length) return toast?.({ type: "warn", text: "Selecciona pedidos primero." });

    try {
      const res = await fetch("/api/orders/bulk-update", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ org_id: orgId, order_ids: ids, patch: { status } }),
      });

      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j?.error || "No se pudo actualizar.");

      toast?.({ type: "success", text: "Pedidos actualizados." });
      await load();
    } catch (e) {
      toast?.({ type: "error", text: e?.message || "Error actualizando." });
    }
  };

  const open = async (o) => {
    try {
      const sessionId = o?.stripe_session_id;
      if (!sessionId) {
        setModal({ order: o, label: null });
        return;
      }

      const { data: label } = await supabase
        .from("shipping_labels")
        .select("stripe_session_id, tracking_number, label_url, status, raw, carrier")
        .eq("stripe_session_id", sessionId)
        .maybeSingle();

      setModal({ order: o, label });
    } catch {
      setModal({ order: o, label: null });
    }
  };
const allSelected = selected.size > 0 && orders?.length && selected.size === orders.length;

  return (
    <div className="space-y-6">
      <div className="bg-white border border-slate-200 rounded-[2rem] shadow-sm p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="font-black text-xl text-slate-900">Pedidos</h3>
            <p className="text-sm font-semibold text-slate-600">Acciones masivas + detalle con Stripe/Envía.</p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-3 text-slate-400" size={18} />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Buscar…"
                className="w-72 max-w-[80vw] pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white font-bold text-slate-800 outline-none focus:ring-4 focus:ring-sky-500/10 focus:border-sky-600"
              />
            </div>

            <button
              onClick={load}
              className="px-4 py-2 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 font-black text-sm flex items-center gap-2"
            >
              <RefreshCcw size={16} className={busy ? "animate-spin" : ""} /> Actualizar
            </button>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-2">
          <button
            disabled={!canWrite}
            onClick={() => bulkUpdate("paid")}
            className="px-4 py-2 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 font-black text-xs flex items-center gap-2 disabled:opacity-60"
          >
            <CheckCircle2 size={14} className="text-emerald-600" /> Marcar pagados
          </button>

          <button
            disabled={!canWrite}
            onClick={() => bulkUpdate("fulfilled")}
            className="px-4 py-2 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 font-black text-xs flex items-center gap-2 disabled:opacity-60"
          >
            <Truck size={14} className="text-sky-600" /> Marcar enviados
          </button>

          <button
            disabled={!canWrite}
            onClick={() => bulkUpdate("cancelled")}
            className="px-4 py-2 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 font-black text-xs flex items-center gap-2 disabled:opacity-60"
          >
            <X size={14} className="text-rose-600" /> Cancelar
          </button>

          <span className="ml-auto text-xs font-black text-slate-500">Seleccionados: {selected.size}</span>
        </div>

        <div className="mt-5 overflow-x-auto">
          <table className="w-full min-w-[920px]">
            <thead>
              <tr className="text-left text-[10px] font-black uppercase tracking-widest text-slate-500">
                <th className="py-2 pr-3 w-10">
                  <input
                    type="checkbox"
                    checked={!!allSelected}
                    onChange={() => {
                      if (selected.size === orders.length) setSelected(new Set());
                      else setSelected(new Set(orders.map((o) => o.id)));
                    }}
                  />
                </th>
                <th className="py-2 pr-3">Pedido</th>
                <th className="py-2 pr-3">Cliente</th>
                <th className="py-2 pr-3">Total</th>
                <th className="py-2 pr-3">Estado</th>
                <th className="py-2 pr-3">Fecha</th>
                <th className="py-2 pr-3 text-right">Acciones</th>
              </tr>
            </thead>

            <tbody className="text-sm">
              {busy ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-sm font-semibold text-slate-500">
                    Cargando…
                  </td>
                </tr>
              ) : (
                (orders || []).map((o) => (
                  <tr key={o.id} className="border-t border-slate-200 hover:bg-slate-50">
                    <td className="py-3 pr-3">
                      <input type="checkbox" checked={selected.has(o.id)} onChange={() => toggle(o.id)} />
                    </td>

                    <td className="py-3 pr-3 font-black text-slate-900">
                      #{String(o.id).split("-")[0].toUpperCase()}
                      <p className="text-xs font-semibold text-slate-500">{o.stripe_session_id ? `Stripe: ${o.stripe_session_id}` : "—"}</p>
                    </td>

                    <td className="py-3 pr-3">
                      <p className="font-black text-slate-900">{o.customer_name || "—"}</p>
                      <p className="text-xs font-semibold text-slate-500">{o.email || "—"}</p>
                    </td>

                    <td className="py-3 pr-3 font-black text-slate-900">{moneyMXN(o.amount_total_mxn)}</td>

                    <td className="py-3 pr-3">
                      <StatusPill status={o.status} />
                    </td>

                    <td className="py-3 pr-3 text-xs font-semibold text-slate-500">
                      {o.created_at ? new Date(o.created_at).toLocaleString("es-MX") : "—"}
                    </td>

                    <td className="py-3 pr-3 text-right">
                      <div className="inline-flex items-center gap-2">
                        <button
                          onClick={() => open(o)}
                          className="px-3 py-2 rounded-xl bg-slate-900 text-white hover:opacity-90 font-black text-xs"
                        >
                          Ver
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}

              {!busy && !orders?.length ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-sm font-semibold text-slate-500">
                    Sin pedidos.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>

      {modal ? (
        <OrderModal
          data={modal}
          token={token}
          orgId={orgId}
          canWrite={canWrite}
          onClose={() => setModal(null)}
          toast={toast}
        />
      ) : null}
    </div>
  );
}
function OrderModal({ data, token, orgId, canWrite, onClose, toast }) {
  const o = data?.order || {};
  const l = data?.label || null;

  const copy = async (txt) => {
    try {
      await navigator.clipboard.writeText(String(txt || ""));
      toast?.({ type: "success", text: "Copiado." });
    } catch {}
  };

  const openStripe = () => {
    const url = stripeDashboardUrl(o.stripe_session_id);
    if (url) window.open(url, "_blank", "noopener,noreferrer");
  };

  const openLabel = () => {
    if (l?.label_url) window.open(l.label_url, "_blank", "noopener,noreferrer");
  };

  const updateStatus = async (newStatus) => {
    if (!canWrite) return toast?.({ type: "error", text: "Sin permisos." });

    try {
      const res = await fetch("/api/orders/update", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          org_id: orgId,
          order_id: o.id,
          patch: { status: newStatus },
        }),
      });

      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j?.error || "No se pudo actualizar.");

      toast?.({ type: "success", text: "Estado actualizado." });
      onClose();
    } catch (e) {
      toast?.({ type: "error", text: e?.message || "Error actualizando." });
    }
  };

  const enviaCost = extractEnviaCost(l?.raw);

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm p-4 flex items-end md:items-center justify-center">
      <div className="w-full max-w-2xl bg-white rounded-[2rem] border border-slate-200 shadow-2xl overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase tracking-widest text-slate-500">Detalle del pedido</p>
            <h4 className="text-xl font-black text-slate-900">#{String(o.id || "").split("-")[0].toUpperCase()}</h4>
            <p className="text-sm font-semibold text-slate-600 mt-1">
              {o.customer_name || "Sin nombre"} • {o.email || "sin correo"}
            </p>
          </div>

          <button onClick={onClose} className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200" aria-label="Cerrar">
            <X size={18} className="text-slate-700" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <DetailCard label="Total" value={moneyMXN(o.amount_total_mxn)} />
            <DetailCard label="Estado" value={<StatusPill status={o.status} />} />
            <DetailCard label="Costo Envía" value={enviaCost ? moneyMXN(enviaCost) : "—"} />
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
            <p className="text-xs font-black uppercase tracking-widest text-slate-500 mb-2">Resumen</p>
            <p className="text-sm font-semibold text-slate-700">{o.items_summary || "Sin detalle."}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <ActionCard
              title="Stripe"
              subtitle={o.stripe_session_id ? "Checkout Session" : "Sin session"}
              primaryLabel="Abrir"
              primaryIcon={<ExternalLink size={14} />}
              primaryAction={openStripe}
              secondaryLabel="Copiar"
              secondaryIcon={<Copy size={14} />}
              secondaryAction={() => copy(o.stripe_session_id)}
              disabled={!o.stripe_session_id}
            />
            <ActionCard
              title="Guía Envía"
              subtitle={l?.tracking_number ? `Tracking: ${l.tracking_number}` : "No existe guía"}
              primaryLabel="Etiqueta"
              primaryIcon={<ExternalLink size={14} />}
              primaryAction={openLabel}
              secondaryLabel="Copiar"
              secondaryIcon={<Copy size={14} />}
              secondaryAction={() => copy(l?.tracking_number)}
              disabled={!l?.label_url && !l?.tracking_number}
            />
          </div>

          {canWrite ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-4">
              <p className="text-xs font-black uppercase tracking-widest text-slate-500 mb-3">Acciones rápidas</p>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => updateStatus("paid")}
                  className="px-3 py-2 rounded-xl bg-emerald-600 text-white hover:opacity-90 font-black text-xs flex items-center gap-2"
                >
                  <CheckCircle size={14} /> Pagado
                </button>
                <button
                  onClick={() => updateStatus("pending_payment")}
                  className="px-3 py-2 rounded-xl bg-amber-500 text-white hover:opacity-90 font-black text-xs flex items-center gap-2"
                >
                  <AlertTriangle size={14} /> Pendiente
                </button>
                <button
                  onClick={() => updateStatus("payment_failed")}
                  className="px-3 py-2 rounded-xl bg-rose-600 text-white hover:opacity-90 font-black text-xs flex items-center gap-2"
                >
                  <XCircle size={14} /> Fallido
                </button>
                <button
                  onClick={() => updateStatus("fulfilled")}
                  className="px-3 py-2 rounded-xl bg-slate-900 text-white hover:opacity-90 font-black text-xs flex items-center gap-2"
                >
                  <Boxes size={14} /> Fulfilled
                </button>
              </div>
            </div>
          ) : null}
        </div>

        <div className="p-5 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
          <p className="text-xs font-bold text-slate-500">
            {o.created_at ? `Creado: ${new Date(o.created_at).toLocaleString("es-MX")}` : ""}
          </p>
          <button onClick={onClose} className="px-4 py-2.5 rounded-xl bg-slate-900 text-white font-black text-xs hover:opacity-90">
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
function OrderModal({ data, token, orgId, canWrite, onClose, toast }) {
  const o = data?.order || {};
  const l = data?.label || null;

  const copy = async (txt) => {
    try {
      await navigator.clipboard.writeText(String(txt || ""));
      toast?.({ type: "success", text: "Copiado." });
    } catch {}
  };

  const openStripe = () => {
    const url = stripeDashboardUrl(o.stripe_session_id);
    if (url) window.open(url, "_blank", "noopener,noreferrer");
  };

  const openLabel = () => {
    if (l?.label_url) window.open(l.label_url, "_blank", "noopener,noreferrer");
  };

  const updateStatus = async (newStatus) => {
    if (!canWrite) return toast?.({ type: "error", text: "Sin permisos." });

    try {
      const res = await fetch("/api/orders/update", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          org_id: orgId,
          order_id: o.id,
          patch: { status: newStatus },
        }),
      });

      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j?.error || "No se pudo actualizar.");

      toast?.({ type: "success", text: "Estado actualizado." });
      onClose();
    } catch (e) {
      toast?.({ type: "error", text: e?.message || "Error actualizando." });
    }
  };

  const enviaCost = extractEnviaCost(l?.raw);

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm p-4 flex items-end md:items-center justify-center">
      <div className="w-full max-w-2xl bg-white rounded-[2rem] border border-slate-200 shadow-2xl overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase tracking-widest text-slate-500">Detalle del pedido</p>
            <h4 className="text-xl font-black text-slate-900">#{String(o.id || "").split("-")[0].toUpperCase()}</h4>
            <p className="text-sm font-semibold text-slate-600 mt-1">
              {o.customer_name || "Sin nombre"} • {o.email || "sin correo"}
            </p>
          </div>

          <button onClick={onClose} className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200" aria-label="Cerrar">
            <X size={18} className="text-slate-700" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <DetailCard label="Total" value={moneyMXN(o.amount_total_mxn)} />
            <DetailCard label="Estado" value={<StatusPill status={o.status} />} />
            <DetailCard label="Costo Envía" value={enviaCost ? moneyMXN(enviaCost) : "—"} />
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
            <p className="text-xs font-black uppercase tracking-widest text-slate-500 mb-2">Resumen</p>
            <p className="text-sm font-semibold text-slate-700">{o.items_summary || "Sin detalle."}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <ActionCard
              title="Stripe"
              subtitle={o.stripe_session_id ? "Checkout Session" : "Sin session"}
              primaryLabel="Abrir"
              primaryIcon={<ExternalLink size={14} />}
              primaryAction={openStripe}
              secondaryLabel="Copiar"
              secondaryIcon={<Copy size={14} />}
              secondaryAction={() => copy(o.stripe_session_id)}
              disabled={!o.stripe_session_id}
            />
            <ActionCard
              title="Guía Envía"
              subtitle={l?.tracking_number ? `Tracking: ${l.tracking_number}` : "No existe guía"}
              primaryLabel="Etiqueta"
              primaryIcon={<ExternalLink size={14} />}
              primaryAction={openLabel}
              secondaryLabel="Copiar"
              secondaryIcon={<Copy size={14} />}
              secondaryAction={() => copy(l?.tracking_number)}
              disabled={!l?.label_url && !l?.tracking_number}
            />
          </div>

          {canWrite ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-4">
              <p className="text-xs font-black uppercase tracking-widest text-slate-500 mb-3">Acciones rápidas</p>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => updateStatus("paid")}
                  className="px-3 py-2 rounded-xl bg-emerald-600 text-white hover:opacity-90 font-black text-xs flex items-center gap-2"
                >
                  <CheckCircle size={14} /> Pagado
                </button>
                <button
                  onClick={() => updateStatus("pending_payment")}
                  className="px-3 py-2 rounded-xl bg-amber-500 text-white hover:opacity-90 font-black text-xs flex items-center gap-2"
                >
                  <AlertTriangle size={14} /> Pendiente
                </button>
                <button
                  onClick={() => updateStatus("payment_failed")}
                  className="px-3 py-2 rounded-xl bg-rose-600 text-white hover:opacity-90 font-black text-xs flex items-center gap-2"
                >
                  <XCircle size={14} /> Fallido
                </button>
                <button
                  onClick={() => updateStatus("fulfilled")}
                  className="px-3 py-2 rounded-xl bg-slate-900 text-white hover:opacity-90 font-black text-xs flex items-center gap-2"
                >
                  <Boxes size={14} /> Fulfilled
                </button>
              </div>
            </div>
          ) : null}
        </div>

        <div className="p-5 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
          <p className="text-xs font-bold text-slate-500">
            {o.created_at ? `Creado: ${new Date(o.created_at).toLocaleString("es-MX")}` : ""}
          </p>
          <button onClick={onClose} className="px-4 py-2.5 rounded-xl bg-slate-900 text-white font-black text-xs hover:opacity-90">
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
function DetailCard({ label, value }) {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-4">
      <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">{label}</p>
      <div className="text-lg font-black text-slate-900">{value}</div>
    </div>
  );
}

function ActionCard({
  title,
  subtitle,
  primaryLabel,
  primaryIcon,
  primaryAction,
  secondaryLabel,
  secondaryIcon,
  secondaryAction,
  disabled,
}) {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-4 flex items-center justify-between gap-3">
      <div>
        <p className="font-black text-slate-900">{title}</p>
        <p className="text-xs font-semibold text-slate-500">{subtitle}</p>
      </div>
      <div className="flex gap-2">
        <button
          onClick={secondaryAction}
          disabled={disabled}
          className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 font-black text-xs flex items-center gap-2 disabled:opacity-50"
        >
          {secondaryIcon} {secondaryLabel}
        </button>
        <button
          onClick={primaryAction}
          disabled={disabled}
          className="px-3 py-2 rounded-xl bg-slate-900 text-white hover:opacity-90 font-black text-xs flex items-center gap-2 disabled:opacity-50"
        >
          {primaryIcon} {primaryLabel}
        </button>
      </div>
    </div>
  );
}

function StatusPill({ status }) {
  const s = String(status || "").toLowerCase();
  if (s === "paid")
    return (
      <span className="bg-emerald-50 text-emerald-700 font-black px-3 py-1 rounded-full text-xs flex items-center gap-1 w-max border border-emerald-100">
        <CheckCircle size={12} /> Pagado
      </span>
    );
  if (s === "pending_payment" || s === "pending")
    return (
      <span className="bg-amber-50 text-amber-700 font-black px-3 py-1 rounded-full text-xs flex items-center gap-1 w-max border border-amber-100">
        <AlertTriangle size={12} /> Pendiente
      </span>
    );
  if (s === "payment_failed")
    return (
      <span className="bg-rose-50 text-rose-700 font-black px-3 py-1 rounded-full text-xs flex items-center gap-1 w-max border border-rose-100">
        <XCircle size={12} /> Fallido
      </span>
    );
  if (s === "fulfilled")
    return (
      <span className="bg-sky-50 text-sky-700 font-black px-3 py-1 rounded-full text-xs flex items-center gap-1 w-max border border-sky-100">
        <Boxes size={12} /> Fulfilled
      </span>
    );
  if (s === "cancelled")
    return (
      <span className="bg-slate-100 text-slate-700 font-black px-3 py-1 rounded-full text-xs w-max border border-slate-200">
        Cancelado
      </span>
    );
  return (
    <span className="bg-slate-100 text-slate-700 font-black px-3 py-1 rounded-full text-xs w-max border border-slate-200">
      {status || "—"}
    </span>
  );
}
/* =========================================================
   SHIPPING LIST (real from shipping_labels)
   ========================================================= */
function ShippingView({ orgId, toast }) {
  const [busy, setBusy] = useState(true);
  const [rows, setRows] = useState([]);

  const load = useCallback(async () => {
    setBusy(true);
    try {
      const { data, error } = await supabase
        .from("shipping_labels")
        .select("stripe_session_id, tracking_number, label_url, status, updated_at, raw, carrier")
        .eq("org_id", orgId)
        .order("updated_at", { ascending: false })
        .limit(80);

      if (error) throw error;
      setRows(data || []);
    } catch (e) {
      console.error(e);
      toast?.({ type: "error", text: "No se pudieron cargar envíos." });
      setRows([]);
    } finally {
      setBusy(false);
    }
  }, [orgId, toast]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="bg-white border border-slate-200 rounded-[2rem] shadow-sm overflow-hidden">
      <div className="p-6 border-b border-slate-100 bg-slate-50/70 flex items-center justify-between">
        <div>
          <h4 className="font-black text-xl text-slate-900">Envíos</h4>
          <p className="text-sm font-semibold text-slate-600">Guías (Envía) con tracking + costo real (raw).</p>
        </div>

        <button
          onClick={load}
          className="px-3 py-2.5 rounded-xl bg-slate-900 text-white font-black text-sm flex items-center gap-2 hover:opacity-90"
        >
          <RefreshCcw size={16} /> Actualizar
        </button>
      </div>

      {busy ? (
        <div className="p-10 text-center text-slate-500 font-bold">Cargando…</div>
      ) : rows.length ? (
        <div className="overflow-x-auto">
          <table className="w-full text-sm whitespace-nowrap">
            <thead className="bg-slate-50 text-slate-600 uppercase text-[11px] tracking-widest font-black border-b border-slate-200">
              <tr>
                <th className="p-4 text-left pl-6">Estatus</th>
                <th className="p-4 text-left">Tracking</th>
                <th className="p-4 text-left">Carrier</th>
                <th className="p-4 text-left">Costo</th>
                <th className="p-4 text-left">Actualizado</th>
                <th className="p-4 text-right pr-6">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((r) => (
                <tr key={r.stripe_session_id || r.tracking_number} className="hover:bg-slate-50">
                  <td className="p-4 pl-6 font-black text-slate-900">{String(r.status || "—").toUpperCase()}</td>
                  <td className="p-4 font-mono font-black text-sky-700">{r.tracking_number || "—"}</td>
                  <td className="p-4 font-bold text-slate-700">{r.carrier || "—"}</td>
                  <td className="p-4 font-black text-slate-900">
                    {extractEnviaCost(r.raw) ? moneyMXN(extractEnviaCost(r.raw)) : "—"}
                  </td>
                  <td className="p-4 text-slate-600 font-semibold">
                    {r.updated_at ? new Date(r.updated_at).toLocaleString("es-MX") : "—"}
                  </td>
                  <td className="p-4 pr-6 text-right">
                    {r.label_url ? (
                      <button
                        onClick={() => window.open(r.label_url, "_blank", "noopener,noreferrer")}
                        className="px-3 py-2 rounded-xl bg-slate-900 text-white font-black text-xs hover:opacity-90 inline-flex items-center gap-2"
                      >
                        <ExternalLink size={14} /> Etiqueta
                      </button>
                    ) : (
                      <span className="text-xs font-black text-slate-500">Sin etiqueta</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="p-10 text-center text-slate-500 font-bold">Todavía no hay guías registradas.</div>
      )}
    </div>
  );
}
/* =========================================================
   PRODUCTS (CRUD real + optional upload)
   ========================================================= */
function ProductsView({ orgId, canWrite, toast }) {
  const [busy, setBusy] = useState(true);
  const [rows, setRows] = useState([]);
  const [q, setQ] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  const load = useCallback(async () => {
    setBusy(true);
    try {
      let query = supabase
        .from("products")
        .select("id, name, sku, price_mxn, stock, category, image_url, is_active, created_at")
        .eq("organization_id", orgId)
        .is("deleted_at", null)
        .order("created_at", { ascending: false })
        .limit(200);

      if (q.trim()) {
        const s = q.trim();
        query = query.or(`name.ilike.%${s}%,sku.ilike.%${s}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      setRows(data || []);
    } catch (e) {
      console.error(e);
      toast?.({ type: "error", text: "No se pudieron cargar productos." });
      setRows([]);
    } finally {
      setBusy(false);
    }
  }, [orgId, q, toast]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="space-y-4">
      <div className="bg-white border border-slate-200 rounded-[2rem] shadow-sm p-6 flex items-end justify-between gap-3">
        <div>
          <h3 className="font-black text-xl text-slate-900">Productos</h3>
          <p className="text-sm font-semibold text-slate-600">Inventario real (Supabase).</p>
        </div>

        <div className="flex gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-3 text-slate-400" size={18} />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Buscar…"
              className="pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white font-bold text-slate-800 outline-none focus:ring-4 focus:ring-sky-500/10 focus:border-sky-600 w-[240px]"
            />
          </div>

          {canWrite ? (
            <button
              onClick={() => {
                setEditing(null);
                setModalOpen(true);
              }}
              className="px-4 py-2.5 rounded-xl text-white font-black text-sm"
              style={{ background: BRAND.grad }}
            >
              + Nuevo
            </button>
          ) : null}

          <button
            onClick={load}
            className="px-3 py-2.5 rounded-xl bg-slate-900 text-white font-black text-sm hover:opacity-90"
          >
            <RefreshCcw size={16} className="inline mr-2" />
            Recargar
          </button>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-[2rem] shadow-sm overflow-hidden">
        {busy ? (
          <div className="p-10 text-center text-slate-500 font-bold">Cargando…</div>
        ) : rows.length ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm whitespace-nowrap">
              <thead className="bg-slate-50 text-slate-600 uppercase text-[11px] tracking-widest font-black border-b border-slate-200">
                <tr>
                  <th className="p-4 text-left pl-6">Producto</th>
                  <th className="p-4 text-left">SKU</th>
                  <th className="p-4 text-left">Precio</th>
                  <th className="p-4 text-left">Stock</th>
                  <th className="p-4 text-left">Estado</th>
                  <th className="p-4 text-right pr-6">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50">
                    <td className="p-4 pl-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center">
                          {p.image_url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={p.image_url} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <Package size={18} className="text-slate-400" />
                          )}
                        </div>
                        <div>
                          <p className="font-black text-slate-900">{p.name}</p>
                          <p className="text-xs font-semibold text-slate-500">{p.category || "—"}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 font-mono font-black text-sky-700">{p.sku || "—"}</td>
                    <td className="p-4 font-black text-slate-900">{moneyMXN(p.price_mxn)}</td>
                    <td className="p-4 font-black text-slate-900">{num(p.stock)}</td>
                    <td className="p-4">
                      {p.is_active ? (
                        <span className="px-3 py-1 rounded-full text-xs font-black bg-emerald-50 border border-emerald-100 text-emerald-700">
                          Activo
                        </span>
                      ) : (
                        <span className="px-3 py-1 rounded-full text-xs font-black bg-slate-100 border border-slate-200 text-slate-700">
                          Oculto
                        </span>
                      )}
                    </td>
                    <td className="p-4 pr-6 text-right">
                      {canWrite ? (
                        <button
                          onClick={() => {
                            setEditing(p);
                            setModalOpen(true);
                          }}
                          className="px-3 py-2 rounded-xl bg-slate-900 text-white font-black text-xs hover:opacity-90"
                        >
                          Editar
                        </button>
                      ) : (
                        <span className="text-xs font-black text-slate-500">Solo lectura</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-10 text-center text-slate-500 font-bold">Sin productos.</div>
        )}
      </div>

      {modalOpen ? (
        <ProductModal
          orgId={orgId}
          editing={editing}
          onClose={() => setModalOpen(false)}
          onDone={() => {
            setModalOpen(false);
            load();
          }}
          toast={toast}
        />
      ) : null}
    </div>
  );
}
function ProductModal({ orgId, editing, onClose, onDone, toast }) {
  const [busy, setBusy] = useState(false);
  const [uploadBusy, setUploadBusy] = useState(false);

  const [form, setForm] = useState({
    name: editing?.name || "",
    sku: editing?.sku || "",
    price_mxn: Number(editing?.price_mxn || 0),
    stock: Number(editing?.stock || 0),
    category: editing?.category || "BAJA_1000",
    is_active: editing?.is_active ?? true,
    image_url: editing?.image_url || "",
  });

  const uploadImage = async (file) => {
    if (!file) return;
    setUploadBusy(true);

    try {
      const ext = (file.name.split(".").pop() || "png").toLowerCase();
      const safeExt = ["png", "jpg", "jpeg", "webp"].includes(ext) ? ext : "png";
      const id = typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : String(Date.now());
      const path = `${orgId}/${id}.${safeExt}`;

      const { error: upErr } = await supabase.storage.from("products").upload(path, file, {
        cacheControl: "3600",
        upsert: false,
        contentType: file.type || undefined,
      });

      if (upErr) throw upErr;

      const { data } = supabase.storage.from("products").getPublicUrl(path);
      const url = data?.publicUrl || "";
      if (!url) throw new Error("No se pudo obtener URL pública.");

      setForm((f) => ({ ...f, image_url: url }));
      toast?.({ type: "success", text: "Imagen cargada." });
    } catch (e) {
      toast?.({ type: "error", text: e?.message || "Error subiendo imagen." });
    } finally {
      setUploadBusy(false);
    }
  };

  const save = async () => {
    setBusy(true);
    try {
      const payload = {
        organization_id: orgId,
        name: String(form.name || "").trim(),
        sku: String(form.sku || "").trim() || null,
        price_mxn: Number(form.price_mxn || 0),
        stock: Number(form.stock || 0),
        category: String(form.category || "").trim() || null,
        is_active: Boolean(form.is_active),
        image_url: String(form.image_url || "").trim() || null,
      };

      if (!payload.name) throw new Error("Nombre requerido.");

      if (editing?.id) {
        const { error } = await supabase.from("products").update(payload).eq("organization_id", orgId).eq("id", editing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("products").insert(payload);
        if (error) throw error;
      }

      toast?.({ type: "success", text: "Producto guardado." });
      onDone?.();
    } catch (e) {
      toast?.({ type: "error", text: e?.message || "Error guardando." });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm p-4 flex items-end md:items-center justify-center">
      <div className="w-full max-w-xl bg-white rounded-[2rem] border border-slate-200 shadow-2xl overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-widest text-slate-500">{editing ? "Editar producto" : "Nuevo producto"}</p>
            <h4 className="text-xl font-black text-slate-900">{editing ? editing.name : "Crear"}</h4>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200" aria-label="Cerrar">
            <X size={18} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="text-xs font-black uppercase tracking-widest text-slate-500">Nombre</label>
            <input
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              className="mt-1 w-full border-2 border-slate-100 bg-slate-50 p-3 rounded-xl outline-none focus:border-sky-600 font-bold text-slate-800"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-black uppercase tracking-widest text-slate-500">SKU</label>
              <input
                value={form.sku}
                onChange={(e) => setForm((f) => ({ ...f, sku: e.target.value }))}
                className="mt-1 w-full border-2 border-slate-100 bg-slate-50 p-3 rounded-xl outline-none focus:border-sky-600 font-bold text-slate-800"
              />
            </div>
            <div>
              <label className="text-xs font-black uppercase tracking-widest text-slate-500">Categoría</label>
              <input
                value={form.category}
                onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                className="mt-1 w-full border-2 border-slate-100 bg-slate-50 p-3 rounded-xl outline-none focus:border-sky-600 font-bold text-slate-800"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-black uppercase tracking-widest text-slate-500">Precio (MXN)</label>
              <input
                type="number"
                value={form.price_mxn}
                onChange={(e) => setForm((f) => ({ ...f, price_mxn: e.target.value }))}
                className="mt-1 w-full border-2 border-slate-100 bg-slate-50 p-3 rounded-xl outline-none focus:border-sky-600 font-bold text-slate-800"
              />
            </div>
            <div>
              <label className="text-xs font-black uppercase tracking-widest text-slate-500">Stock</label>
              <input
                type="number"
                value={form.stock}
                onChange={(e) => setForm((f) => ({ ...f, stock: e.target.value }))}
                className="mt-1 w-full border-2 border-slate-100 bg-slate-50 p-3 rounded-xl outline-none focus:border-sky-600 font-bold text-slate-800"
              />
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
            <p className="text-xs font-black uppercase tracking-widest text-slate-500 mb-2">Imagen</p>

            <div className="flex flex-col md:flex-row gap-3 md:items-center">
              <input
                value={form.image_url}
                onChange={(e) => setForm((f) => ({ ...f, image_url: e.target.value }))}
                placeholder="URL (opcional) o sube un archivo…"
                className="flex-1 border-2 border-slate-100 bg-white p-3 rounded-xl outline-none focus:border-sky-600 font-bold text-slate-800"
              />

              <label className="px-4 py-3 rounded-xl bg-slate-900 text-white font-black text-xs cursor-pointer hover:opacity-90 inline-flex items-center justify-center">
                {uploadBusy ? "SUBIENDO…" : "SUBIR"}
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  className="hidden"
                  onChange={(e) => uploadImage(e.target.files?.[0] || null)}
                  disabled={uploadBusy}
                />
              </label>
            </div>

            {form.image_url ? (
              <div className="mt-3 flex items-center gap-3">
                <div className="w-16 h-16 rounded-xl border border-slate-200 bg-white overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={form.image_url} alt="" className="w-full h-full object-cover" />
                </div>
                <p className="text-xs font-semibold text-slate-600">Vista previa cargada.</p>
              </div>
            ) : null}
          </div>

          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={!!form.is_active}
              onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.checked }))}
              className="w-5 h-5 accent-sky-600"
            />
            <span className="font-black text-slate-800">Producto activo</span>
          </label>

          <button
            disabled={busy}
            onClick={save}
            className="w-full py-4 rounded-xl text-white font-black disabled:opacity-60"
            style={{ background: BRAND.grad }}
          >
            {busy ? "GUARDANDO…" : "GUARDAR"}
          </button>
        </div>
      </div>
    </div>
  );
}
/* =========================================================
   CRM (LTV)
   ========================================================= */
function CRMView({ orgId }) {
  const [busy, setBusy] = useState(true);
  const [customers, setCustomers] = useState([]);

  useEffect(() => {
    setBusy(true);
    supabase
      .from("orders")
      .select("email, customer_name, phone, amount_total_mxn, created_at, status")
      .eq("organization_id", orgId)
      .eq("status", "paid")
      .limit(800)
      .then(({ data }) => {
        const map = {};
        (data || []).forEach((o) => {
          if (!o.email) return;
          if (!map[o.email])
            map[o.email] = {
              email: o.email,
              name: o.customer_name || o.email,
              phone: o.phone || "",
              ltv: 0,
              orders: 0,
              last: o.created_at,
            };
          map[o.email].ltv += Number(o.amount_total_mxn || 0);
          map[o.email].orders += 1;
          if (new Date(o.created_at) > new Date(map[o.email].last)) map[o.email].last = o.created_at;
        });
        setCustomers(Object.values(map).sort((a, b) => b.ltv - a.ltv));
        setBusy(false);
      })
      .catch(() => setBusy(false));
  }, [orgId]);

  return (
    <div className="bg-white border border-slate-200 rounded-[2rem] shadow-sm overflow-hidden">
      <div className="p-6 border-b border-slate-100 bg-slate-50/70">
        <h3 className="font-black text-xl text-slate-900">Clientes</h3>
        <p className="text-sm font-semibold text-slate-600">LTV (valor total) por correo.</p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm whitespace-nowrap">
          <thead className="bg-slate-50 text-slate-600 uppercase text-[11px] tracking-widest font-black border-b border-slate-200">
            <tr>
              <th className="px-6 py-4">Cliente</th>
              <th className="px-6 py-4">Compras</th>
              <th className="px-6 py-4">Última</th>
              <th className="px-6 py-4 text-right">LTV</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {busy ? (
              <tr>
                <td colSpan={4} className="px-6 py-10 text-slate-500 font-bold">
                  Cargando…
                </td>
              </tr>
            ) : customers.length ? (
              customers.map((c) => (
                <tr key={c.email} className="hover:bg-slate-50">
                  <td className="px-6 py-4">
                    <p className="font-black text-slate-900">{c.name}</p>
                    <p className="text-xs font-semibold text-slate-500">
                      {c.email} {c.phone ? `• ${c.phone}` : ""}
                    </p>
                  </td>
                  <td className="px-6 py-4 font-black text-slate-700">{c.orders}</td>
                  <td className="px-6 py-4 font-semibold text-slate-600">
                    {c.last ? new Date(c.last).toLocaleDateString("es-MX") : "—"}
                  </td>
                  <td className="px-6 py-4 font-black text-sky-700 text-right">{moneyMXN(c.ltv)}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={4} className="p-10 text-center text-slate-500 font-bold">
                  Sin clientes todavía.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* =========================================================
   MARKETING (site_settings: promo + pixel)
   ========================================================= */
function MarketingView({ orgId, toast }) {
  const [busy, setBusy] = useState(true);
  const [cfg, setCfg] = useState({ promo_active: false, promo_text: "", pixel_id: "" });

  useEffect(() => {
    setBusy(true);
    supabase
      .from("site_settings")
      .select("promo_active, promo_text, pixel_id")
      .eq("organization_id", orgId)
      .single()
      .then(({ data }) => {
        if (data) {
          setCfg({
            promo_active: !!data.promo_active,
            promo_text: data.promo_text || "",
            pixel_id: data.pixel_id || "",
          });
        }
        setBusy(false);
      })
      .catch(() => setBusy(false));
  }, [orgId]);

  const save = async () => {
    try {
      const payload = {
        organization_id: orgId,
        promo_active: !!cfg.promo_active,
        promo_text: String(cfg.promo_text || "") || null,
        pixel_id: String(cfg.pixel_id || "") || null,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase.from("site_settings").upsert(payload, { onConflict: "organization_id" });
      if (error) throw error;

      toast?.({ type: "success", text: "Marketing guardado." });
    } catch (e) {
      toast?.({ type: "error", text: e?.message || "No se pudo guardar." });
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-[2rem] shadow-sm p-8 max-w-xl">
      <h3 className="font-black text-xl text-slate-900 mb-2">Marketing</h3>
      <p className="text-sm font-semibold text-slate-600">Cintillo + Pixel.</p>

      <div className="mt-6 flex items-center gap-3">
        <input
          type="checkbox"
          checked={!!cfg.promo_active}
          onChange={(e) => setCfg((c) => ({ ...c, promo_active: e.target.checked }))}
          className="w-5 h-5 accent-sky-600"
          disabled={busy}
        />
        <span className="font-black text-slate-800">Activar banner</span>
      </div>

      <textarea
        value={cfg.promo_text}
        onChange={(e) => setCfg((c) => ({ ...c, promo_text: e.target.value }))}
        className="mt-4 w-full border-2 border-slate-100 rounded-xl p-4 font-bold text-slate-800 outline-none focus:border-sky-600 bg-slate-50"
        placeholder="Ej. ENVÍO GRATIS A TODO MÉXICO"
        rows={3}
        disabled={busy}
      />

      <div className="mt-4">
        <label className="text-xs font-black uppercase tracking-widest text-slate-500">Pixel ID</label>
        <input
          value={cfg.pixel_id}
          onChange={(e) => setCfg((c) => ({ ...c, pixel_id: e.target.value }))}
          className="mt-1 w-full border-2 border-slate-100 rounded-xl p-3 font-bold text-slate-800 outline-none focus:border-sky-600 bg-slate-50"
          placeholder="Meta Pixel ID"
          disabled={busy}
        />
      </div>

      <button
        onClick={save}
        disabled={busy}
        className="mt-5 w-full py-4 rounded-xl text-white font-black disabled:opacity-60"
        style={{ background: BRAND.grad }}
      >
        Publicar
      </button>
    </div>
  );
}

/* =========================================================
   USERS (list + invite)
   ========================================================= */
function UsersView({ orgId, token, role, canInvite, toast }) {
  const [busy, setBusy] = useState(true);
  const [rows, setRows] = useState([]);
  const [inviteOpen, setInviteOpen] = useState(false);

  const load = useCallback(async () => {
    setBusy(true);
    try {
      const { data, error } = await supabase
        .from("admin_users")
        .select("id, email, role, is_active, created_at")
        .eq("organization_id", orgId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setRows(data || []);
    } catch (e) {
      setRows([]);
    } finally {
      setBusy(false);
    }
  }, [orgId]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="space-y-4">
      <div className="bg-white border border-slate-200 rounded-[2rem] shadow-sm p-6 flex items-start justify-between gap-4">
        <div>
          <h3 className="font-black text-xl text-slate-900">Equipo</h3>
          <p className="text-sm font-semibold text-slate-600">Accesos por organización.</p>
        </div>

        {canInvite ? (
          <button
            onClick={() => setInviteOpen(true)}
            className="px-4 py-2.5 rounded-xl text-white font-black text-sm flex items-center gap-2"
            style={{ background: BRAND.grad }}
          >
            <Users size={16} /> Invitar
          </button>
        ) : (
          <span className="text-xs font-black text-slate-500 bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl">
            Solo owner/admin invita
          </span>
        )}
      </div>

      <div className="bg-white border border-slate-200 rounded-[2rem] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-slate-50 text-slate-600 font-black border-b border-slate-200 text-[11px] uppercase tracking-widest">
              <tr>
                <th className="px-6 py-4">Correo</th>
                <th className="px-6 py-4">Rol</th>
                <th className="px-6 py-4">Estado</th>
                <th className="px-6 py-4">Creado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {busy ? (
                <tr>
                  <td colSpan={4} className="px-6 py-10 text-slate-500 font-bold">
                    Cargando…
                  </td>
                </tr>
              ) : rows.length ? (
                rows.map((m) => (
                  <tr key={m.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4 font-black text-slate-900">{m.email}</td>
                    <td className="px-6 py-4">
                      <span className="px-3 py-1 rounded-full text-xs font-black bg-slate-100 border border-slate-200 text-slate-700">
                        {m.role}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {m.is_active ? (
                        <span className="px-3 py-1 rounded-full text-xs font-black bg-emerald-50 border border-emerald-100 text-emerald-700">
                          Activo
                        </span>
                      ) : (
                        <span className="px-3 py-1 rounded-full text-xs font-black bg-rose-50 border border-rose-100 text-rose-700">
                          Inactivo
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 font-semibold text-slate-600">
                      {m.created_at ? new Date(m.created_at).toLocaleDateString("es-MX") : "—"}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="p-10 text-center text-slate-500 font-bold">
                    Si no eres owner/admin, Supabase puede ocultar la lista completa por seguridad.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {inviteOpen ? (
        <InviteModal
          orgId={orgId}
          token={token}
          onClose={() => setInviteOpen(false)}
          onDone={() => {
            setInviteOpen(false);
            load();
          }}
          toast={toast}
        />
      ) : null}
    </div>
  );
}
function InviteModal({ orgId, token, onClose, onDone, toast }) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("staff");
  const [busy, setBusy] = useState(false);

  const send = async () => {
    setBusy(true);
    try {
      const res = await fetch("/api/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ organization_id: orgId, email: normEmail(email), role }),
      });

      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j?.error || "No se pudo invitar.");

      toast?.({ type: "success", text: "Invitación enviada." });
      onDone?.();
    } catch (e) {
      toast?.({ type: "error", text: e?.message || "Error al invitar." });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm p-4 flex items-end md:items-center justify-center">
      <div className="w-full max-w-lg bg-white rounded-[2rem] border border-slate-200 shadow-2xl overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-widest text-slate-500">Invitar usuario</p>
            <h4 className="text-xl font-black text-slate-900">Acceso al panel</h4>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200" aria-label="Cerrar">
            <X size={18} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="text-xs font-black uppercase tracking-widest text-slate-500">Correo</label>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="persona@empresa.com"
              className="mt-1 w-full border-2 border-slate-100 bg-slate-50 p-3 rounded-xl outline-none focus:border-sky-600 font-bold text-slate-800"
            />
          </div>

          <div>
            <label className="text-xs font-black uppercase tracking-widest text-slate-500">Rol</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="mt-1 w-full border-2 border-slate-100 bg-slate-50 p-3 rounded-xl outline-none focus:border-sky-600 font-black text-slate-800"
            >
              <option value="owner">Owner</option>
              <option value="admin">Admin</option>
              <option value="ops">Ops</option>
              <option value="sales">Sales</option>
              <option value="marketing">Marketing</option>
              <option value="staff">Staff</option>
              <option value="viewer">Viewer</option>
            </select>
          </div>

          <button
            onClick={send}
            disabled={busy || !email.trim()}
            className="w-full py-4 rounded-xl text-white font-black disabled:opacity-60"
            style={{ background: BRAND.grad }}
          >
            {busy ? "ENVIANDO…" : "ENVIAR INVITACIÓN"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   INTEGRATIONS (health check real)
   ========================================================= */
function IntegrationsView({ token, toast }) {
  const [busy, setBusy] = useState(true);
  const [env, setEnv] = useState(null);

  const load = useCallback(async () => {
    setBusy(true);
    try {
      const res = await fetch("/api/health", { headers: { Authorization: `Bearer ${token}` } });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j?.error || "No se pudo consultar salud.");
      setEnv(j?.env || null);
    } catch (e) {
      setEnv(null);
      toast?.({ type: "error", text: "No se pudo leer estado." });
    } finally {
      setBusy(false);
    }
  }, [token, toast]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="bg-white border border-slate-200 rounded-[2rem] shadow-sm p-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-black text-xl text-slate-900 mb-1">Integraciones</h3>
          <p className="text-sm font-semibold text-slate-600">Checklist real (variables del servidor).</p>
        </div>
        <button
          onClick={load}
          className="px-3 py-2.5 rounded-xl bg-slate-900 text-white font-black text-sm flex items-center gap-2 hover:opacity-90"
        >
          <RefreshCcw size={16} /> Actualizar
        </button>
      </div>

      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-3">
        <EnvCard label="Supabase URL" ok={!!env?.SUPABASE_URL} />
        <EnvCard label="Supabase Secret" ok={!!env?.SUPABASE_SECRET_KEY} />
        <EnvCard label="Gemini (IA)" ok={!!env?.GEMINI_API_KEY} />
        <EnvCard label="Stripe Secret" ok={!!env?.STRIPE_SECRET_KEY} />
        <EnvCard label="Envía API Key" ok={!!env?.ENVIA_API_KEY} />
        <EnvCard label="FX USD→MXN" ok={!!env?.FX_USD_TO_MXN} />
      </div>

      {busy ? <p className="mt-4 text-sm font-bold text-slate-500">Cargando estado…</p> : null}
    </div>
  );
}

function EnvCard({ label, ok }) {
  return (
    <div className="border border-slate-200 rounded-2xl p-4 flex items-center justify-between">
      <div>
        <p className="text-xs font-black uppercase tracking-widest text-slate-500">{label}</p>
        <p className="text-sm font-black text-slate-900 mt-1">{ok ? "CONFIGURADO" : "FALTA"}</p>
      </div>
      <div
        className={clsx(
          "w-10 h-10 rounded-2xl flex items-center justify-center border",
          ok ? "bg-emerald-50 border-emerald-100 text-emerald-700" : "bg-rose-50 border-rose-100 text-rose-700"
        )}
      >
        {ok ? <CheckCircle size={18} /> : <AlertTriangle size={18} />}
      </div>
    </div>
  );
}

/* =========================================================
   EMPTY STATE
   ========================================================= */
function EmptyState({ title, desc, actionLabel, onAction }) {
  return (
    <div className="min-h-screen w-full flex items-center justify-center p-6 bg-slate-50">
      <div className="max-w-md w-full bg-white border border-slate-200 rounded-[2rem] shadow-2xl p-8 text-center">
        <div className="mx-auto h-16 w-16 rounded-2xl bg-slate-100 text-slate-500 flex items-center justify-center mb-6">
          <Shield size={32} />
        </div>
        <h2 className="text-xl font-black text-slate-900 mb-2">{title}</h2>
        <p className="text-sm text-slate-500 font-semibold leading-relaxed mb-6">{desc}</p>
        <button onClick={onAction} className="px-5 py-3 rounded-xl bg-slate-900 text-white font-black hover:opacity-90">
          {actionLabel}
        </button>
      </div>
    </div>
  );
}