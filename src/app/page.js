/* eslint-disable react/no-unescaped-entities */
"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import clsx from "clsx";

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
  CheckCircle2,
  AlertTriangle,
  ClipboardList,
  Receipt,
  BadgePercent,
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
  Calendar,
  Tag,
  Percent,
  Store,
  Activity,
  Zap,
  Flame,
  PiggyBank,
  Wallet,
} from "lucide-react";
import AiDock from "./ai-dock";

import { supabase, SUPABASE_CONFIGURED } from "@/lib/supabase";
import { hasPerm, canManageUsers } from "@/lib/authz";

/* =========================================================
   BRAND
   ========================================================= */

const BRAND = {
  name: "UnicOs",
  grad: "linear-gradient(135deg, #0ea5e9 0%, #14b8a6 100%)",
};

function BrandMark({ size = 44 }) {
  return (
    <div
      className="rounded-2xl flex items-center justify-center text-white font-black"
      style={{ width: size, height: size, background: BRAND.grad }}
    >
      <Image
        src="/logo-unico.png"
        alt="UnicOs"
        width={size - 10}
        height={size - 10}
        priority
        className="object-contain"
      />
    </div>
  );
}

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

function SetupWizard() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="max-w-xl w-full bg-white border border-slate-200 rounded-[2rem] shadow-2xl p-8">
        <div className="flex items-center gap-3">
          <BrandMark size={44} />
          <div className="min-w-0">
            <h1 className="text-lg font-black text-slate-900 tracking-tight">UnicOs — Setup requerido</h1>
            <p className="text-xs font-semibold text-slate-600">
              Este panel no puede funcionar sin variables de entorno reales (Netlify).
            </p>
          </div>
        </div>

        <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-5">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Checklist</p>

          <div className="mt-3 grid gap-2">
            <div className="flex items-center justify-between rounded-xl bg-white border border-slate-200 px-4 py-3">
              <span className="text-sm font-black text-slate-800">Supabase público (NEXT_PUBLIC_*)</span>
              <span
                className={clsx(
                  "text-xs font-black px-3 py-1 rounded-full border",
                  SUPABASE_CONFIGURED
                    ? "bg-emerald-50 text-emerald-900 border-emerald-200"
                    : "bg-rose-50 text-rose-900 border-rose-200"
                )}
              >
                {SUPABASE_CONFIGURED ? "OK" : "FALTA"}
              </span>
            </div>

            <div className="rounded-xl bg-white border border-slate-200 px-4 py-3">
              <p className="text-sm font-black text-slate-800">Variables que debes poner en Netlify (UnicOs)</p>
              <ul className="mt-2 text-sm font-semibold text-slate-700 space-y-1">
                <li>• <span className="font-black">NEXT_PUBLIC_SUPABASE_URL</span></li>
                <li>• <span className="font-black">NEXT_PUBLIC_SUPABASE_ANON_KEY</span></li>
                <li>• <span className="font-black">SUPABASE_SERVICE_ROLE_KEY</span></li>
                <li>• <span className="font-black">STRIPE_SECRET_KEY</span></li>
                <li>• <span className="font-black">ENVIA_API_KEY</span> (si usas Envía)</li>
              </ul>
              <p className="mt-3 text-xs font-semibold text-slate-500">
                Después: redeploy en Netlify. Sin eso, puede aparecer “No se encontró la organización”.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-6 flex items-center gap-2">
          <button
            onClick={() => window.location.reload()}
            className="px-5 py-3 rounded-2xl text-white font-black shadow-sm"
            style={{ background: BRAND.grad }}
          >
            Reintentar
          </button>

          <a
            href="/"
            className="px-5 py-3 rounded-2xl bg-white border border-slate-200 hover:bg-slate-50 font-black text-slate-800"
          >
            Recargar
          </a>
        </div>
      </div>
    </div>
  );
}

function EmptyState({ title, desc, actionLabel, onAction }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
      <div className="max-w-md w-full bg-white border border-slate-200 rounded-[2rem] shadow-2xl p-8 text-center">
        <div className="mx-auto h-16 w-16 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mb-6">
          <AlertTriangle size={32} />
        </div>
        <h2 className="text-xl font-black text-slate-900 mb-2">{title}</h2>
        <p className="text-sm text-slate-500 font-semibold leading-relaxed">{desc}</p>
        {actionLabel ? (
          <button
            onClick={onAction}
            className="mt-6 px-5 py-3 rounded-2xl text-white font-black shadow-sm"
            style={{ background: BRAND.grad }}
          >
            {actionLabel}
          </button>
        ) : null}
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
    t.type === "ok"
      ? "bg-emerald-50 text-emerald-900 border-emerald-200"
      : t.type === "warn"
      ? "bg-amber-50 text-amber-900 border-amber-200"
      : t.type === "info"
      ? "bg-sky-50 text-sky-900 border-sky-200"
      : "bg-rose-50 text-rose-900 border-rose-200";

  return (
    <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50">
      <div className={clsx("px-5 py-3 rounded-2xl border shadow-xl text-sm font-black", tone)}>
        {t.text}
      </div>
    </div>
  );
}
function Tabs({ active, setActive, items, compact }) {
  return (
    <div className={clsx("flex gap-2 flex-wrap", compact && "gap-1")}>
      {items.map((t) => (
        <button
          key={t.id}
          onClick={() => setActive(t.id)}
          className={clsx(
            "px-4 py-2 rounded-2xl font-black text-sm border transition",
            compact ? "px-3 py-2 text-xs" : "px-4 py-2",
            active === t.id
              ? "bg-slate-900 text-white border-slate-900"
              : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
          )}
          title={t.desc}
          aria-label={t.label}
        >
          <span className="inline-flex items-center gap-2">
            <span className="text-slate-400">{t.icon}</span>
            {t.label}
          </span>
        </button>
      ))}
    </div>
  );
}

const ALL_TABS = [
  {
    id: "dashboard",
    label: "Dashboard",
    icon: <LayoutDashboard size={16} />,
    desc: "Resumen de ventas, comisiones y actividad",
  },
  {
    id: "orders",
    label: "Pedidos",
    icon: <ShoppingCart size={16} />,
    desc: "Pedidos / Envíos (Stripe + Envía)",
  },
  {
    id: "products",
    label: "Productos",
    icon: <Package size={16} />,
    desc: "Catálogo rápido",
  },
  {
    id: "crm",
    label: "CRM",
    icon: <Users size={16} />,
    desc: "Clientes reales desde pedidos",
  },
  {
    id: "marketing",
    label: "Marketing",
    icon: <Megaphone size={16} />,
    desc: "Promos, banner, pixel",
  },
  {
    id: "users",
    label: "Equipo",
    icon: <Shield size={16} />,
    desc: "Usuarios, roles y accesos",
  },
  {
    id: "integrations",
    label: "Integraciones",
    icon: <Settings size={16} />,
    desc: "Estado de conexiones",
  },
];

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
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="absolute left-1/2 top-16 -translate-x-1/2 w-[92vw] max-w-2xl">
        <div className="rounded-[2rem] border border-slate-200 bg-white shadow-2xl overflow-hidden">
          <div className="p-4 border-b border-slate-200 flex items-center gap-3">
            <Search className="text-slate-400" size={18} />
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar… (clientes, pedidos, módulos)"
              className="w-full outline-none font-black text-slate-900"
            />
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700"
              aria-label="Cerrar"
              title="Cerrar"
            >
              <X size={18} />
            </button>
          </div>

          <div className="p-4">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-3">
              Acciones rápidas
            </p>

            <div className="grid md:grid-cols-2 gap-3">
              <button
                onClick={() => {
                  onRefresh?.();
                  onClose?.();
                }}
                className="rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 p-4 text-left"
              >
                <p className="font-black text-slate-900 flex items-center gap-2">
                  <RefreshCcw size={16} className="text-slate-400" />
                  Actualizar datos
                </p>
                <p className="text-xs font-semibold text-slate-500 mt-1">Recarga listas y KPIs.</p>
              </button>

              <button
                onClick={() => {
                  onOpenAi?.();
                  onClose?.();
                }}
                className="rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 p-4 text-left"
              >
                <p className="font-black text-slate-900 flex items-center gap-2">
                  <Sparkles size={16} className="text-slate-400" />
                  Abrir IA
                </p>
                <p className="text-xs font-semibold text-slate-500 mt-1">Asistente y auditoría.</p>
              </button>
            </div>

            <div className="mt-6">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-3">
                Navegación
              </p>

              <div className="grid md:grid-cols-2 gap-3">
                {tabs.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => {
                      setActiveTab(t.id);
                      onClose?.();
                    }}
                    className={clsx(
                      "rounded-2xl border p-4 text-left",
                      activeTab === t.id
                        ? "border-slate-900 bg-slate-900 text-white"
                        : "border-slate-200 bg-white hover:bg-slate-50 text-slate-800"
                    )}
                  >
                    <p className="font-black flex items-center gap-2">
                      <span className={clsx(activeTab === t.id ? "text-white" : "text-slate-400")}>
                        {t.icon}
                      </span>
                      {t.label}
                    </p>
                    <p className={clsx("text-xs font-semibold mt-1", activeTab === t.id ? "text-white/80" : "text-slate-500")}>
                      {t.desc}
                    </p>
                  </button>
                ))}
              </div>

              {!canInvite ? (
                <p className="text-xs font-semibold text-slate-500 mt-4">
                  Nota: algunas acciones pueden estar restringidas por tu rol.
                </p>
              ) : null}
            </div>

            {results?.length ? (
              <div className="mt-6">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-3">
                  Resultados
                </p>
                <div className="space-y-2">
                  {results.map((r) => (
                    <div key={r.id} className="rounded-2xl border border-slate-200 bg-white p-4">
                      <p className="font-black text-slate-900">{r.title}</p>
                      <p className="text-xs font-semibold text-slate-500 mt-1">{r.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

function RoleChip({ role }) {
  const r = String(role || "viewer").toLowerCase();

  const cls =
    r === "owner"
      ? "bg-emerald-50 text-emerald-900 border-emerald-200"
      : r === "admin"
      ? "bg-sky-50 text-sky-900 border-sky-200"
      : r === "ops"
      ? "bg-amber-50 text-amber-900 border-amber-200"
      : r === "marketing"
      ? "bg-fuchsia-50 text-fuchsia-900 border-fuchsia-200"
      : r === "sales"
      ? "bg-indigo-50 text-indigo-900 border-indigo-200"
      : "bg-slate-100 text-slate-700 border-slate-200";

  return (
    <span className={clsx("inline-flex items-center px-3 py-1 rounded-full border text-xs font-black", cls)}>
      {r.toUpperCase()}
    </span>
  );
}
function OrgPicker({ orgs, selectedOrgId, onSelect, role }) {
  const [open, setOpen] = useState(false);
  const selected = (orgs || []).find((o) => o.id === selectedOrgId) || (orgs || [])[0];

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-3 px-4 py-2 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50"
        aria-label="Seleccionar organización"
        title="Seleccionar organización"
      >
        <BrandMark size={34} />
        <div className="min-w-0 text-left">
          <p className="font-black text-slate-900 truncate">{selected?.name || "Organización"}</p>
          <p className="text-xs font-semibold text-slate-500 truncate">Acceso: {String(role || "viewer").toUpperCase()}</p>
        </div>
        <ChevronDown size={18} className="text-slate-400" />
      </button>

      {open ? (
        <div className="absolute top-[110%] left-0 z-40 w-[340px] max-w-[92vw] rounded-[1.5rem] border border-slate-200 bg-white shadow-2xl overflow-hidden">
          <div className="p-3 border-b border-slate-200 flex items-center justify-between">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Organizaciones</p>
            <button
              onClick={() => setOpen(false)}
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700"
              aria-label="Cerrar"
              title="Cerrar"
            >
              <X size={18} />
            </button>
          </div>

          <div className="max-h-[320px] overflow-y-auto">
            {(orgs || []).map((o) => (
              <button
                key={o.id}
                onClick={() => {
                  onSelect?.(o.id);
                  setOpen(false);
                }}
                className={clsx(
                  "w-full text-left px-4 py-3 hover:bg-slate-50 border-b border-slate-100",
                  o.id === selectedOrgId && "bg-slate-50"
                )}
              >
                <p className="font-black text-slate-900">{o.name}</p>
                <p className="text-xs font-semibold text-slate-500">{o.slug || o.id}</p>
              </button>
            ))}
            {!orgs?.length ? (
              <p className="p-4 text-sm font-semibold text-slate-500">Sin organizaciones.</p>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function SideNav({ activeTab, setActiveTab, compact, onSignOut }) {
  return (
    <aside
      className={clsx(
        "hidden md:flex flex-col gap-4 border-r border-slate-200 bg-white p-5",
        compact ? "w-20" : "w-72"
      )}
    >
      <div className="flex items-center gap-3">
        <BrandMark size={44} />
        {!compact ? (
          <div className="min-w-0">
            <p className="text-lg font-black text-slate-900 leading-none">{BRAND.name}</p>
            <p className="text-xs font-semibold text-slate-500">Panel corporativo</p>
          </div>
        ) : null}
      </div>

      <div className="mt-2 space-y-2">
        {ALL_TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={clsx(
              "w-full rounded-2xl border flex items-center gap-3 transition px-4 py-3",
              compact ? "justify-center px-3" : "",
              activeTab === t.id
                ? "bg-slate-900 text-white border-slate-900"
                : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
            )}
            title={t.label}
            aria-label={t.label}
          >
            <span className={clsx(activeTab === t.id ? "text-white" : "text-slate-400")}>{t.icon}</span>
            {!compact ? <span className="font-black text-sm">{t.label}</span> : null}
          </button>
        ))}
      </div>

      <div className="mt-auto">
        <button
          onClick={onSignOut}
          className={clsx(
            "w-full rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 px-4 py-3 flex items-center gap-3",
            compact && "justify-center px-3"
          )}
        >
          <LogOut size={18} className="text-slate-400" />
          {!compact ? <span className="font-black text-sm">Salir</span> : null}
        </button>
      </div>
    </aside>
  );
}

function MobileNav({ activeTab, setActiveTab, open, onClose, onSignOut }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 md:hidden">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="absolute left-0 top-0 bottom-0 w-[84vw] max-w-sm bg-white shadow-2xl border-r border-slate-200 p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BrandMark size={44} />
            <div>
              <p className="text-lg font-black text-slate-900 leading-none">{BRAND.name}</p>
              <p className="text-xs font-semibold text-slate-500">Panel corporativo</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700"
            aria-label="Cerrar"
            title="Cerrar"
          >
            <X size={18} />
          </button>
        </div>

        <div className="mt-6 space-y-2">
          {ALL_TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => {
                setActiveTab(t.id);
                onClose?.();
              }}
              className={clsx(
                "w-full rounded-2xl border flex items-center gap-3 transition px-4 py-3",
                activeTab === t.id
                  ? "bg-slate-900 text-white border-slate-900"
                  : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
              )}
            >
              <span className={clsx(activeTab === t.id ? "text-white" : "text-slate-400")}>{t.icon}</span>
              <span className="font-black text-sm">{t.label}</span>
            </button>
          ))}
        </div>

        <div className="mt-8">
          <button
            onClick={onSignOut}
            className="w-full rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 px-4 py-3 flex items-center gap-3"
          >
            <LogOut size={18} className="text-slate-400" />
            <span className="font-black text-sm">Salir</span>
          </button>
        </div>
      </div>
    </div>
  );
}
function Shell({ token, orgs, role, selectedOrgId, setSelectedOrgId, onSignOut }) {
  const { toast, show: toastShow } = useToast();

  const [activeTab, setActiveTab] = useState("dashboard");
  const [compactNav, setCompactNav] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const [paletteOpen, setPaletteOpen] = useState(false);
  const [globalQuery, setGlobalQuery] = useState("");
  const [globalResults, setGlobalResults] = useState([]);
  const paletteInputRef = useRef(null);

  const canInvite = canManageUsers(role);
  const canWrite = hasPerm(role, "write");

  const openAi = useCallback(() => {
    const ev = new CustomEvent("open-ai-dock");
    window.dispatchEvent(ev);
  }, []);

  const forceRefresh = useCallback(() => {
    toastShow({ type: "info", text: "Actualizando…" });
    window.location.reload();
  }, [toastShow]);

  useEffect(() => {
    const onKey = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPaletteOpen(true);
        setTimeout(() => paletteInputRef.current?.focus?.(), 50);
      }
      if (e.key === "Escape") setPaletteOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    const q = globalQuery.trim().toLowerCase();
    if (!q) return setGlobalResults([]);

    const results = [];
    for (const t of ALL_TABS) {
      if (t.label.toLowerCase().includes(q) || t.desc.toLowerCase().includes(q)) {
        results.push({ id: `tab-${t.id}`, title: t.label, desc: t.desc });
      }
    }

    setGlobalResults(results.slice(0, 8));
  }, [globalQuery]);

  return (
    <div className="min-h-screen bg-slate-50">
      <MobileNav
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onSignOut={onSignOut}
      />

      <div className="flex min-h-screen">
        <SideNav
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          compact={compactNav}
          onSignOut={onSignOut}
        />

        <main className="flex-1 flex flex-col min-w-0">
          <header className="sticky top-0 z-40 border-b border-slate-200 bg-white">
            <div className="px-4 md:px-8 py-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <button
                  onClick={() => setMobileOpen(true)}
                  className="md:hidden p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700"
                  aria-label="Menú"
                  title="Menú"
                >
                  <Menu size={18} />
                </button>

                <button
                  onClick={() => setCompactNav((v) => !v)}
                  className="hidden md:inline-flex p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700"
                  aria-label="Compactar navegación"
                  title="Compactar navegación"
                >
                  <Menu size={18} />
                </button>

                <OrgPicker
                  orgs={orgs}
                  selectedOrgId={selectedOrgId}
                  onSelect={setSelectedOrgId}
                  role={role}
                />
                <RoleChip role={role} />
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPaletteOpen(true)}
                  className="hidden md:flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700"
                  title="Buscar (Ctrl/⌘ + K)"
                  aria-label="Buscar"
                >
                  <Search size={16} className="text-slate-400" />
                  <span className="font-black text-xs">Buscar</span>
                  <span className="ml-2 text-[10px] font-black text-slate-400 border border-slate-200 rounded px-2 py-0.5">
                    Ctrl K
                  </span>
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
            </div>
          </header>

          <div className="flex-1 overflow-y-auto p-4 md:p-8 pb-24">
            <div className="max-w-7xl mx-auto space-y-6">
              {activeTab === "dashboard" && (
                <DashboardView orgId={selectedOrgId} token={token} toast={toastShow} />
              )}

              {activeTab === "orders" && (
                <OrdersAndShippingView
                  orgId={selectedOrgId}
                  token={token}
                  canWrite={canWrite}
                  toast={toastShow}
                />
              )}

              {activeTab === "products" && (
                <ProductsView orgId={selectedOrgId} canWrite={canWrite} toast={toastShow} />
              )}

              {activeTab === "crm" && <CRMView orgId={selectedOrgId} toast={toastShow} />}

              {activeTab === "marketing" && (
                <MarketingView orgId={selectedOrgId} role={role} toast={toastShow} />
              )}

              {activeTab === "users" && (
                <UsersView
                  orgId={selectedOrgId}
                  token={token}
                  role={role}
                  canInvite={canInvite}
                  toast={toastShow}
                />
              )}

              {activeTab === "integrations" && (
                <IntegrationsView orgId={selectedOrgId} token={token} toast={toastShow} />
              )}
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

          <AiDock />
        </main>
      </div>
    </div>
  );
}

/* =========================================================
   ORG BOOTSTRAP (auto-recovery)
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
          <p className="text-[11px] font-black uppercase tracking-widest text-slate-400 mt-5">
            UnicOs
          </p>
        </div>
      </div>
    );
  }

  return (
    <EmptyState
      title="Error: No se encontró la organización."
      desc={
        state.error || "Tu cuenta existe, pero no está vinculada a ninguna organización con acceso admin."
      }
      actionLabel="Salir"
      onAction={onSignOut}
    />
  );
}

/* =========================================================
   DASHBOARD (Stripe + Envía)
   ========================================================= */

function MiniKPI({ label, value, note, icon }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 flex items-center gap-2">
        {icon ? <span className="text-slate-400">{icon}</span> : null}
        {label}
      </p>
      <p className="text-lg font-black text-slate-900">{value}</p>
      {note ? <p className="text-xs font-semibold text-slate-500 mt-1">{note}</p> : null}
    </div>
  );
}

function DashboardView({ orgId, token, toast }) {
  const [busy, setBusy] = useState(false);

  const [kpi, setKpi] = useState({
    gross: 0,
    net: 0,
    orders: 0,
    avg: 0,
    stripeFee: 0,
    stripeMode: "estimate",
    enviaCost: 0,
    sessions: [],
    updatedAt: null,
  });

  const load = useCallback(async () => {
    if (!orgId) return;

    setBusy(true);

    try {
      const { data: paidOrders } = await supabase
        .from("orders")
        .select("id, amount_total_mxn, status, stripe_session_id, created_at")
        .eq("organization_id", orgId)
        .in("status", ["paid", "fulfilled"])
        .order("created_at", { ascending: false })
        .limit(600);

      const list = paidOrders || [];

      const gross = list.reduce((a, o) => a + num(o.amount_total_mxn), 0);
      const orders = list.length;
      const avg = orders ? gross / orders : 0;

      const sessions = list.map((o) => o.stripe_session_id).filter(Boolean);

      // Envía costs (desde shipping_labels.raw)
      let enviaCost = 0;
      if (sessions.length) {
        const { data: labels } = await supabase
          .from("shipping_labels")
          .select("stripe_session_id, raw")
          .in("stripe_session_id", sessions.slice(0, 250));

        for (const l of labels || []) {
          const raw = l?.raw || {};
          const price = num(raw?.data?.price) || num(raw?.price) || num(raw?.shipment?.price) || 0;
          enviaCost += price;
        }
      }

      // Stripe fees (real si el endpoint responde; si no, estimación)
      let stripeFee = 0;
      let stripeMode = "estimate";

      if (sessions.length) {
        try {
          const res = await fetch("/api/stripe/fees", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ org_id: orgId, stripe_session_ids: sessions.slice(0, 150) }),
          });

          const j = await res.json().catch(() => ({}));

          if (res.ok && j?.ok) {
            stripeFee = num(j.total_fee_mxn);
            stripeMode = "stripe";
          } else {
            throw new Error(j?.error || "fee fail");
          }
        } catch {
          // Fallback: estimación razonable (MX): % + fijo por transacción
          stripeFee = gross * 0.036 + orders * 3;
          stripeMode = "estimate";
        }
      }

      const net = Math.max(0, gross - stripeFee - enviaCost);

      setKpi({
        gross,
        net,
        orders,
        avg,
        stripeFee,
        stripeMode,
        enviaCost,
        sessions,
        updatedAt: new Date().toISOString(),
      });
    } catch (e) {
      toast?.({ type: "bad", text: String(e?.message || e) });
    } finally {
      setBusy(false);
    }
  }, [orgId, token, toast]);

  useEffect(() => {
    load();
  }, [load]);

  // Realtime (si está habilitado en tu Supabase)
  useEffect(() => {
    if (!orgId) return;

    let ch = null;
    try {
      ch = supabase
        .channel(`kpi-${orgId}`)
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "orders", filter: `organization_id=eq.${orgId}` },
          () => load()
        )
        .subscribe();
    } catch {}

    return () => {
      try {
        ch?.unsubscribe?.();
      } catch {}
    };
  }, [orgId, load]);

  return (
    <div className="space-y-6">
      <div className="rounded-[2rem] border border-slate-200 bg-white shadow-sm p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 flex items-center gap-2">
              <Sparkles size={14} className="text-sky-600" /> Ganancia neta
            </p>

            <h3 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight">
              {moneyMXN(kpi.net)}
            </h3>

            <p className="text-sm font-semibold text-slate-600 mt-1">
              Neto = Ventas brutas − Comisión Stripe − Costo Envía.
            </p>

            <p className="text-xs font-semibold text-slate-500 mt-2">
              {kpi.updatedAt ? `Última actualización: ${new Date(kpi.updatedAt).toLocaleString("es-MX")}` : "—"}
            </p>
          </div>

          <button
            onClick={load}
            className="px-4 py-2 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 font-black text-sm flex items-center gap-2"
          >
            <RefreshCcw size={16} className={busy ? "animate-spin" : ""} /> Actualizar
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-6 mt-6 border-t border-slate-200">
          <MiniKPI label="Ventas brutas" value={moneyMXN(kpi.gross)} icon={<Wallet size={14} />} />
          <MiniKPI label="Pedidos pagados" value={num(kpi.orders)} icon={<ShoppingCart size={14} />} />
          <MiniKPI label="Ticket promedio" value={moneyMXN(kpi.avg)} icon={<Receipt size={14} />} />
          <MiniKPI
            label="Comisión Stripe"
            value={moneyMXN(kpi.stripeFee)}
            note={kpi.stripeMode === "stripe" ? "Real" : "Estimado"}
            icon={<CreditCard size={14} />}
          />
          <MiniKPI label="Costo Envía" value={moneyMXN(kpi.enviaCost)} icon={<Truck size={14} />} />
          <MiniKPI label="Estado" value={busy ? "Cargando…" : "Listo"} icon={<Activity size={14} />} />
          <MiniKPI label="Base" value="orders + shipping_labels" icon={<Boxes size={14} />} />
          <MiniKPI label="Modo" value="multi-org" icon={<Store size={14} />} />
        </div>
      </div>

      <ActivityPanel orgId={orgId} token={token} />
    </div>
  );
}
/* =========================================================
   ACTIVITY / AUDIT
   ========================================================= */

function ActivityPanel({ orgId, token }) {
  const [rows, setRows] = useState([]);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    if (!orgId) return;

    setBusy(true);

    try {
      const res = await fetch(`/api/audit/list?org_id=${encodeURIComponent(orgId)}&limit=40`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const j = await res.json().catch(() => ({}));
      setRows(res.ok && j?.ok ? j.rows || [] : []);
    } catch {
      setRows([]);
    } finally {
      setBusy(false);
    }
  }, [orgId, token]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="rounded-[2rem] border border-slate-200 bg-white shadow-sm p-6">
      <div className="flex items-center justify-between gap-4 mb-4">
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">
            Actividad
          </p>
          <h4 className="text-lg font-black text-slate-900">Registro de cambios</h4>
        </div>
        <button
          onClick={load}
          className="px-4 py-2 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 font-black text-sm flex items-center gap-2"
        >
          <RefreshCcw size={16} className={busy ? "animate-spin" : ""} /> Actualizar
        </button>
      </div>

      <div className="space-y-2">
        {(rows || []).map((r) => (
          <div key={r.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-black text-slate-900">
                  {r.action || "Evento"}
                </p>
                <p className="text-xs font-semibold text-slate-600 mt-1">
                  {r.summary || r.entity || "—"}
                </p>
              </div>
              <p className="text-xs font-semibold text-slate-500">
                {r.created_at ? new Date(r.created_at).toLocaleString("es-MX") : "—"}
              </p>
            </div>
          </div>
        ))}

        {!rows?.length ? (
          <p className="text-sm font-semibold text-slate-500">Sin actividad.</p>
        ) : null}
      </div>
    </div>
  );
}

/* =========================================================
   ORDERS + SHIPPING
   ========================================================= */

function OrdersAndShippingView({ orgId, token, canWrite, toast }) {
  const [busy, setBusy] = useState(false);
  const [orders, setOrders] = useState([]);
  const [labels, setLabels] = useState([]);

  const load = useCallback(async () => {
    if (!orgId) return;

    setBusy(true);

    try {
      const { data: o } = await supabase
        .from("orders")
        .select("id, created_at, email, customer_name, amount_total_mxn, status, stripe_session_id, promo_code")
        .eq("organization_id", orgId)
        .order("created_at", { ascending: false })
        .limit(200);

      const sessions = (o || []).map((x) => x.stripe_session_id).filter(Boolean);

      let l = [];
      if (sessions.length) {
        const { data } = await supabase
          .from("shipping_labels")
          .select("id, created_at, stripe_session_id, carrier, tracking_number, label_url, status, raw")
          .in("stripe_session_id", sessions.slice(0, 200))
          .order("created_at", { ascending: false })
          .limit(200);

        l = data || [];
      }

      setOrders(o || []);
      setLabels(l || []);
    } catch (e) {
      toast?.({ type: "bad", text: String(e?.message || e) });
    } finally {
      setBusy(false);
    }
  }, [orgId, toast]);

  useEffect(() => {
    load();
  }, [load]);

  const labelBySession = useMemo(() => {
    const map = new Map();
    for (const l of labels || []) {
      if (l?.stripe_session_id && !map.has(l.stripe_session_id)) map.set(l.stripe_session_id, l);
    }
    return map;
  }, [labels]);

  return (
    <div className="space-y-6">
      <div className="rounded-[2rem] border border-slate-200 bg-white shadow-sm p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">
              Operación
            </p>
            <h4 className="text-lg font-black text-slate-900">Pedidos & Envíos</h4>
            <p className="text-sm font-semibold text-slate-600">
              Pedidos desde Stripe + guías desde Envía (si existen).
            </p>
          </div>

          <button
            onClick={load}
            className="px-4 py-2 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 font-black text-sm flex items-center gap-2"
          >
            <RefreshCcw size={16} className={busy ? "animate-spin" : ""} /> Actualizar
          </button>
        </div>

        <div className="mt-5 overflow-x-auto">
          <table className="w-full min-w-[980px]">
            <thead>
              <tr className="text-left text-[10px] font-black uppercase tracking-widest text-slate-500">
                <th className="py-2 pr-3">Fecha</th>
                <th className="py-2 pr-3">Cliente</th>
                <th className="py-2 pr-3">Total</th>
                <th className="py-2 pr-3">Estado</th>
                <th className="py-2 pr-3">Cupón</th>
                <th className="py-2 pr-3">Envío</th>
                <th className="py-2 pr-3 text-right">Acción</th>
              </tr>
            </thead>

            <tbody className="text-sm">
              {(orders || []).map((o) => {
                const l = o?.stripe_session_id ? labelBySession.get(o.stripe_session_id) : null;

                return (
                  <tr key={o.id} className="border-t border-slate-200">
                    <td className="py-3 pr-3 text-xs font-semibold text-slate-500">
                      {o.created_at ? new Date(o.created_at).toLocaleString("es-MX") : "—"}
                    </td>
                    <td className="py-3 pr-3">
                      <p className="font-black text-slate-900">{o.customer_name || "—"}</p>
                      <p className="text-xs font-semibold text-slate-500">{o.email || "—"}</p>
                    </td>
                    <td className="py-3 pr-3 font-black text-slate-900">{moneyMXN(o.amount_total_mxn)}</td>
                    <td className="py-3 pr-3">
                      <span className={clsx(
                        "inline-flex items-center px-3 py-1 rounded-full border text-xs font-black",
                        ["paid", "fulfilled"].includes(String(o.status || "").toLowerCase())
                          ? "bg-emerald-50 text-emerald-900 border-emerald-200"
                          : "bg-slate-100 text-slate-700 border-slate-200"
                      )}>
                        {String(o.status || "pending").toUpperCase()}
                      </span>
                    </td>
                    <td className="py-3 pr-3 font-black text-slate-900">{o.promo_code || "—"}</td>
                    <td className="py-3 pr-3">
                      {l?.tracking_number ? (
                        <div>
                          <p className="font-black text-slate-900">{l.carrier || "Carrier"}</p>
                          <p className="text-xs font-semibold text-slate-500">{l.tracking_number}</p>
                        </div>
                      ) : (
                        <span className="text-xs font-semibold text-slate-500">—</span>
                      )}
                    </td>
                    <td className="py-3 pr-3 text-right">
                      {l?.label_url ? (
                        <a
                          href={l.label_url}
                          target="_blank"
                          rel="noreferrer"
                          className="px-3 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 font-black text-xs inline-flex items-center gap-2"
                        >
                          <ExternalLink size={14} /> Ver guía
                        </a>
                      ) : (
                        <span className="text-xs font-semibold text-slate-500">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}

              {!orders?.length ? (
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
    </div>
  );
}

/* =========================================================
   PRODUCTS (simple)
   ========================================================= */

function ProductsView({ orgId, canWrite, toast }) {
  const [busy, setBusy] = useState(false);
  const [rows, setRows] = useState([]);

  const load = useCallback(async () => {
    if (!orgId) return;

    setBusy(true);

    try {
      const { data, error } = await supabase
        .from("products")
        .select("id, name, sku, price_mxn, stock, is_active, created_at")
        .eq("organization_id", orgId)
        .order("created_at", { ascending: false })
        .limit(200);

      if (error) throw error;
      setRows(data || []);
    } catch (e) {
      toast?.({ type: "bad", text: String(e?.message || e) });
    } finally {
      setBusy(false);
    }
  }, [orgId, toast]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="rounded-[2rem] border border-slate-200 bg-white shadow-sm p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">
            Catálogo
          </p>
          <h4 className="text-lg font-black text-slate-900">Productos</h4>
          <p className="text-sm font-semibold text-slate-600">
            Vista rápida (gestión avanzada puede ir en módulo aparte).
          </p>
        </div>

        <button
          onClick={load}
          className="px-4 py-2 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 font-black text-sm flex items-center gap-2"
        >
          <RefreshCcw size={16} className={busy ? "animate-spin" : ""} /> Actualizar
        </button>
      </div>

      <div className="mt-5 overflow-x-auto">
        <table className="w-full min-w-[760px]">
          <thead>
            <tr className="text-left text-[10px] font-black uppercase tracking-widest text-slate-500">
              <th className="py-2 pr-3">Producto</th>
              <th className="py-2 pr-3">SKU</th>
              <th className="py-2 pr-3">Precio</th>
              <th className="py-2 pr-3">Stock</th>
              <th className="py-2 pr-3">Estado</th>
            </tr>
          </thead>

          <tbody className="text-sm">
            {(rows || []).map((p) => (
              <tr key={p.id} className="border-t border-slate-200">
                <td className="py-3 pr-3 font-black text-slate-900">{p.name}</td>
                <td className="py-3 pr-3 font-semibold text-slate-600">{p.sku || "—"}</td>
                <td className="py-3 pr-3 font-black text-slate-900">{moneyMXN(p.price_mxn)}</td>
                <td className="py-3 pr-3 font-black text-slate-900">{num(p.stock)}</td>
                <td className="py-3 pr-3">
                  <span
                    className={clsx(
                      "inline-flex items-center px-3 py-1 rounded-full border text-xs font-black",
                      p.is_active
                        ? "bg-emerald-50 text-emerald-900 border-emerald-200"
                        : "bg-slate-100 text-slate-700 border-slate-200"
                    )}
                  >
                    {p.is_active ? "ACTIVO" : "INACTIVO"}
                  </span>
                </td>
              </tr>
            ))}

            {!rows?.length ? (
              <tr>
                <td colSpan={5} className="py-10 text-center text-sm font-semibold text-slate-500">
                  Sin productos.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      {!canWrite ? (
        <p className="text-xs font-semibold text-slate-500 mt-4">
          Nota: tu rol actual es solo lectura.
        </p>
      ) : null}
    </div>
  );
}

/* =========================================================
   CRM / MARKETING / USERS / INTEGRATIONS
   ========================================================= */

function Badge({ children, tone = "slate" }) {
  const cls =
    tone === "emerald"
      ? "bg-emerald-50 text-emerald-900 border-emerald-200"
      : tone === "sky"
      ? "bg-sky-50 text-sky-900 border-sky-200"
      : tone === "amber"
      ? "bg-amber-50 text-amber-900 border-amber-200"
      : tone === "rose"
      ? "bg-rose-50 text-rose-900 border-rose-200"
      : "bg-slate-100 text-slate-800 border-slate-200";

  return (
    <span className={clsx("inline-flex items-center px-3 py-1 rounded-full border text-xs font-black", cls)}>
      {children}
    </span>
  );
}

/* ---------------------------
   CRM (clientes reales desde orders)
--------------------------- */
function CRMView({ orgId, toast }) {
  const [busy, setBusy] = useState(false);
  const [q, setQ] = useState("");
  const [rows, setRows] = useState([]);
  const [selected, setSelected] = useState(null);

  const load = useCallback(async () => {
    if (!orgId) return;
    setBusy(true);

    try {
      const { data, error } = await supabase
        .from("orders")
        .select("id, created_at, email, customer_name, phone, amount_total_mxn, status")
        .eq("organization_id", orgId)
        .order("created_at", { ascending: false })
        .limit(1200);

      if (error) throw error;

      const map = new Map();

      for (const o of data || []) {
        const email = normEmail(o.email);
        if (!email) continue;

        const isPaid = ["paid", "fulfilled"].includes(String(o.status || "").toLowerCase());
        const total = isPaid ? num(o.amount_total_mxn) : 0;

        const cur = map.get(email) || {
          email,
          name: o.customer_name || "",
          phone: o.phone || "",
          orders: 0,
          paidOrders: 0,
          spent: 0,
          lastAt: null,
          firstAt: null,
        };

        cur.orders += 1;
        if (isPaid) cur.paidOrders += 1;
        cur.spent += total;

        const ts = o.created_at ? new Date(o.created_at).getTime() : 0;
        if (!cur.lastAt || ts > cur.lastAt) {
          cur.lastAt = ts;
          if (!cur.name && o.customer_name) cur.name = o.customer_name;
          if (!cur.phone && o.phone) cur.phone = o.phone;
        }
        if (!cur.firstAt || ts < cur.firstAt) cur.firstAt = ts;

        map.set(email, cur);
      }

      const list = Array.from(map.values()).sort((a, b) => (b.spent - a.spent) || (b.lastAt - a.lastAt));
      setRows(list);

      if (selected && !map.has(selected)) setSelected(null);
    } catch (e) {
      toast?.({ type: "bad", text: String(e?.message || e) });
      setRows([]);
    } finally {
      setBusy(false);
    }
  }, [orgId, toast, selected]);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return rows;
    return rows.filter((r) => (r.email || "").includes(s) || (r.name || "").toLowerCase().includes(s));
  }, [rows, q]);

  const selectedObj = useMemo(() => filtered.find((r) => r.email === selected) || null, [filtered, selected]);

  const segment = (c) => {
    const now = Date.now();
    const days14 = 14 * 24 * 3600 * 1000;
    if (c.spent >= 10000) return { t: "VIP", tone: "emerald" };
    if (c.paidOrders >= 3) return { t: "Recurrente", tone: "sky" };
    if (c.firstAt && now - c.firstAt < days14) return { t: "Nuevo", tone: "amber" };
    return { t: "Cliente", tone: "slate" };
  };

  return (
    <div className="grid lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 rounded-[2rem] border border-slate-200 bg-white shadow-sm p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">CRM</p>
            <h4 className="text-lg font-black text-slate-900">Clientes</h4>
            <p className="text-sm font-semibold text-slate-600">
              Basado en pedidos reales. Segmenta, busca y revisa historial.
            </p>
          </div>

          <button
            onClick={load}
            className="px-4 py-2 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 font-black text-sm flex items-center gap-2"
          >
            <RefreshCcw size={16} className={busy ? "animate-spin" : ""} /> Actualizar
          </button>
        </div>

        <div className="mt-5 flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 text-slate-400" size={18} />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Buscar por nombre o email…"
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white font-black text-slate-800 outline-none focus:ring-4 focus:ring-sky-500/10 focus:border-sky-600"
            />
          </div>
          <Badge tone="slate">{filtered.length} clientes</Badge>
        </div>

        <div className="mt-5 overflow-x-auto">
          <table className="w-full min-w-[880px]">
            <thead>
              <tr className="text-left text-[10px] font-black uppercase tracking-widest text-slate-500">
                <th className="py-2 pr-3">Cliente</th>
                <th className="py-2 pr-3">Email</th>
                <th className="py-2 pr-3">Pedidos</th>
                <th className="py-2 pr-3">Pagados</th>
                <th className="py-2 pr-3">Total</th>
                <th className="py-2 pr-3">Última compra</th>
                <th className="py-2 pr-3 text-right">Acción</th>
              </tr>
            </thead>

            <tbody className="text-sm">
              {filtered.map((c) => {
                const seg = segment(c);
                return (
                  <tr key={c.email} className="border-t border-slate-200">
                    <td className="py-3 pr-3">
                      <p className="font-black text-slate-900">{c.name || "—"}</p>
                      <div className="mt-1">
                        <Badge tone={seg.tone}>{seg.t}</Badge>
                      </div>
                    </td>
                    <td className="py-3 pr-3 font-semibold text-slate-700">{c.email}</td>
                    <td className="py-3 pr-3 font-black text-slate-900">{c.orders}</td>
                    <td className="py-3 pr-3 font-black text-slate-900">{c.paidOrders}</td>
                    <td className="py-3 pr-3 font-black text-slate-900">{moneyMXN(c.spent)}</td>
                    <td className="py-3 pr-3 text-xs font-semibold text-slate-500">
                      {c.lastAt ? new Date(c.lastAt).toLocaleString("es-MX") : "—"}
                    </td>
                    <td className="py-3 pr-3 text-right">
                      <button
                        onClick={() => setSelected(c.email)}
                        className="px-3 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 font-black text-xs"
                      >
                        Ver
                      </button>
                    </td>
                  </tr>
                );
              })}

              {!filtered.length ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-sm font-semibold text-slate-500">
                    Sin clientes (o no hay pedidos aún).
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>

      <div className="rounded-[2rem] border border-slate-200 bg-white shadow-sm p-6">
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">Detalle</p>
        <h4 className="text-lg font-black text-slate-900">Cliente</h4>

        {!selectedObj ? (
          <p className="text-sm font-semibold text-slate-600 mt-3">
            Selecciona un cliente para ver datos rápidos.
          </p>
        ) : (
          <div className="mt-4 space-y-3">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm font-black text-slate-900">{selectedObj.name || "—"}</p>
              <p className="text-xs font-semibold text-slate-600 mt-1">{selectedObj.email}</p>
              {selectedObj.phone ? (
                <p className="text-xs font-semibold text-slate-600 mt-1">Tel: {selectedObj.phone}</p>
              ) : null}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <MiniKPI label="Pedidos" value={selectedObj.orders} icon={<ClipboardList size={14} />} />
              <MiniKPI label="Pagados" value={selectedObj.paidOrders} icon={<CheckCircle2 size={14} />} />
              <MiniKPI label="Total" value={moneyMXN(selectedObj.spent)} icon={<PiggyBank size={14} />} />
              <MiniKPI
                label="Última compra"
                value={selectedObj.lastAt ? new Date(selectedObj.lastAt).toLocaleDateString("es-MX") : "—"}
                icon={<Clock size={14} />}
              />
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(selectedObj.email);
                  } catch {}
                  toast?.({ type: "ok", text: "Email copiado." });
                }}
                className="flex-1 px-4 py-3 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 font-black text-sm flex items-center justify-center gap-2"
              >
                <Copy size={16} /> Copiar email
              </button>

              {selectedObj.phone ? (
                <a
                  className="flex-1 px-4 py-3 rounded-2xl text-white font-black text-sm flex items-center justify-center gap-2"
                  style={{ background: BRAND.grad }}
                  href={`https://wa.me/${encodeURIComponent(String(selectedObj.phone).replace(/[^\d]/g, ""))}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  <Send size={16} /> WhatsApp
                </a>
              ) : null}
            </div>

            <button
              onClick={() => setSelected(null)}
              className="w-full px-4 py-3 rounded-2xl bg-rose-50 border border-rose-200 hover:bg-rose-100 font-black text-rose-800 text-sm"
            >
              Cerrar detalle
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ---------------------------
   MARKETING (banner + pixel + cupones DB)
--------------------------- */
function MarketingView({ orgId, role, toast }) {
  const canEdit = ["owner", "admin", "marketing"].includes(String(role || "").toLowerCase());

  const [busy, setBusy] = useState(false);
  const [saving, setSaving] = useState(false);

  const [settings, setSettings] = useState({
    promo_active: false,
    promo_text: "",
    pixel_id: "",
    updated_at: null,
  });

  const [promoSupported, setPromoSupported] = useState(true);
  const [rulesBusy, setRulesBusy] = useState(false);
  const [rules, setRules] = useState([]);
  const [newRule, setNewRule] = useState({
    code: "",
    type: "percent",
    value: 0.1,
    description: "",
    active: true,
    min_amount_mxn: 0,
    expires_at: "",
  });

  const loadSettings = useCallback(async () => {
    if (!orgId) return;
    setBusy(true);
    try {
      const { data, error } = await supabase
        .from("site_settings")
        .select("organization_id, promo_active, promo_text, pixel_id, updated_at")
        .eq("organization_id", orgId)
        .maybeSingle();

      if (error) throw error;

      setSettings({
        promo_active: !!data?.promo_active,
        promo_text: data?.promo_text || "",
        pixel_id: data?.pixel_id || "",
        updated_at: data?.updated_at || null,
      });
    } catch (e) {
      toast?.({ type: "bad", text: String(e?.message || e) });
    } finally {
      setBusy(false);
    }
  }, [orgId, toast]);

  const saveSettings = useCallback(async () => {
    if (!orgId) return;
    if (!canEdit) {
      toast?.({ type: "warn", text: "Tu rol no puede editar Marketing." });
      return;
    }

    setSaving(true);
    try {
      const payload = {
        organization_id: orgId,
        promo_active: !!settings.promo_active,
        promo_text: String(settings.promo_text || ""),
        pixel_id: String(settings.pixel_id || ""),
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase.from("site_settings").upsert(payload, {
        onConflict: "organization_id",
      });

      if (error) throw error;

      toast?.({ type: "ok", text: "Marketing guardado." });
      await loadSettings();
    } catch (e) {
      toast?.({ type: "bad", text: String(e?.message || e) });
    } finally {
      setSaving(false);
    }
  }, [orgId, settings, canEdit, toast, loadSettings]);

  const loadRules = useCallback(async () => {
    if (!orgId) return;
    setRulesBusy(true);
    try {
      const { data, error } = await supabase
        .from("promo_rules")
        .select("id, code, type, value, description, active, min_amount_mxn, expires_at, updated_at, created_at")
        .eq("organization_id", orgId)
        .order("created_at", { ascending: false })
        .limit(200);

      if (error) {
        setPromoSupported(false);
        setRules([]);
        return;
      }

      setPromoSupported(true);
      setRules(data || []);
    } catch {
      setPromoSupported(false);
      setRules([]);
    } finally {
      setRulesBusy(false);
    }
  }, [orgId]);

  const addRule = useCallback(async () => {
    if (!canEdit) {
      toast?.({ type: "warn", text: "Tu rol no puede editar cupones." });
      return;
    }

    const code = String(newRule.code || "").trim().toUpperCase();
    if (!code) {
      toast?.({ type: "warn", text: "Código inválido." });
      return;
    }

    setRulesBusy(true);
    try {
      const payload = {
        organization_id: orgId,
        code,
        type: String(newRule.type || "percent"),
        value: num(newRule.value),
        description: String(newRule.description || ""),
        active: !!newRule.active,
        min_amount_mxn: num(newRule.min_amount_mxn),
        expires_at: newRule.expires_at ? new Date(newRule.expires_at).toISOString() : null,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase.from("promo_rules").upsert(payload, {
        onConflict: "organization_id,code",
      });

      if (error) throw error;

      setNewRule({
        code: "",
        type: "percent",
        value: 0.1,
        description: "",
        active: true,
        min_amount_mxn: 0,
        expires_at: "",
      });

      toast?.({ type: "ok", text: "Cupón guardado." });
      await loadRules();
    } catch (e) {
      toast?.({ type: "bad", text: String(e?.message || e) });
    } finally {
      setRulesBusy(false);
    }
  }, [orgId, newRule, canEdit, toast, loadRules]);

  const toggleRule = useCallback(
    async (id, active) => {
      if (!canEdit) return toast?.({ type: "warn", text: "Sin permisos." });

      setRulesBusy(true);
      try {
        const { error } = await supabase
          .from("promo_rules")
          .update({ active: !!active, updated_at: new Date().toISOString() })
          .eq("id", id);

        if (error) throw error;
        await loadRules();
      } catch (e) {
        toast?.({ type: "bad", text: String(e?.message || e) });
      } finally {
        setRulesBusy(false);
      }
    },
    [canEdit, toast, loadRules]
  );

  useEffect(() => {
    loadSettings();
    loadRules();
  }, [loadSettings, loadRules]);

  return (
    <div className="grid lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 rounded-[2rem] border border-slate-200 bg-white shadow-sm p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">Marketing</p>
            <h4 className="text-lg font-black text-slate-900">Banner + Pixel</h4>
            <p className="text-sm font-semibold text-slate-600">
              Cambios rápidos sin tocar código (fácil para personas no técnicas).
            </p>
          </div>

          <button
            onClick={loadSettings}
            className="px-4 py-2 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 font-black text-sm flex items-center gap-2"
          >
            <RefreshCcw size={16} className={busy ? "animate-spin" : ""} /> Actualizar
          </button>
        </div>

        <div className="mt-6 grid md:grid-cols-2 gap-4">
          <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-2 mb-2 block">
              Pixel ID (Meta/GA)
            </label>
            <input
              value={settings.pixel_id}
              onChange={(e) => setSettings((s) => ({ ...s, pixel_id: e.target.value }))}
              className="w-full rounded-xl border border-slate-200 px-4 py-3 font-black outline-none focus:ring-4 focus:ring-sky-500/10 focus:border-sky-600"
              placeholder="1234567890"
              disabled={!canEdit}
            />
          </div>

          <div className="flex items-end justify-between gap-3">
            <label className="inline-flex items-center gap-2 text-sm font-black text-slate-800">
              <input
                type="checkbox"
                checked={!!settings.promo_active}
                onChange={(e) => setSettings((s) => ({ ...s, promo_active: e.target.checked }))}
                disabled={!canEdit}
              />
              Activar banner promo
            </label>
          </div>

          <div className="md:col-span-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-2 mb-2 block">
              Texto del banner
            </label>
            <input
              value={settings.promo_text}
              onChange={(e) => setSettings((s) => ({ ...s, promo_text: e.target.value }))}
              className="w-full rounded-xl border border-slate-200 px-4 py-3 font-black outline-none focus:ring-4 focus:ring-sky-500/10 focus:border-sky-600"
              placeholder="🔥 ENVÍOS NACIONALES E INTERNACIONALES 🔥"
              disabled={!canEdit}
            />

            <div className="mt-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-black text-slate-700 mb-2">Vista previa</p>
              {settings.promo_active ? (
                <div className="rounded-xl px-4 py-3 text-white font-black text-sm" style={{ background: BRAND.grad }}>
                  {settings.promo_text || "Promo activa"}
                </div>
              ) : (
                <p className="text-sm font-semibold text-slate-600">Banner desactivado.</p>
              )}
              <p className="text-xs font-semibold text-slate-500 mt-3">
                {settings.updated_at ? `Último guardado: ${new Date(settings.updated_at).toLocaleString("es-MX")}` : "—"}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-6 flex items-center gap-2">
          <button
            onClick={saveSettings}
            disabled={!canEdit || saving}
            className="px-5 py-3 rounded-2xl text-white font-black shadow-sm disabled:opacity-60"
            style={{ background: BRAND.grad }}
          >
            {saving ? "Guardando…" : "Guardar cambios"}
          </button>

          {!canEdit ? <Badge tone="amber">Tu rol no puede editar Marketing</Badge> : null}
        </div>
      </div>

      <div className="rounded-[2rem] border border-slate-200 bg-white shadow-sm p-6">
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">Cupones</p>
        <h4 className="text-lg font-black text-slate-900">Reglas de descuento</h4>

        {!promoSupported ? (
          <div className="mt-3 rounded-2xl border border-amber-200 bg-amber-50 p-4">
            <p className="text-sm font-black text-amber-900">Falta tabla promo_rules</p>
            <p className="text-sm font-semibold text-amber-800 mt-1">
              Para administrar cupones desde UnicOs, crea la tabla <span className="font-black">promo_rules</span> en Supabase.
            </p>
          </div>
        ) : (
          <>
            <div className="mt-4 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-2 mb-2 block">
                    Código
                  </label>
                  <input
                    value={newRule.code}
                    onChange={(e) => setNewRule((s) => ({ ...s, code: e.target.value }))}
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 font-black outline-none focus:ring-4 focus:ring-sky-500/10 focus:border-sky-600"
                    placeholder="SCORE10"
                    disabled={!canEdit}
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-2 mb-2 block">
                    Tipo
                  </label>
                  <select
                    value={newRule.type}
                    onChange={(e) => setNewRule((s) => ({ ...s, type: e.target.value }))}
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 font-black outline-none focus:ring-4 focus:ring-sky-500/10 focus:border-sky-600 bg-white"
                    disabled={!canEdit}
                  >
                    <option value="percent">Porcentaje</option>
                    <option value="fixed_mxn">Monto fijo (MXN)</option>
                    <option value="free_shipping">Envío gratis</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-2 mb-2 block">
                    Valor
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={newRule.value}
                    onChange={(e) => setNewRule((s) => ({ ...s, value: e.target.value }))}
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 font-black outline-none focus:ring-4 focus:ring-sky-500/10 focus:border-sky-600"
                    disabled={!canEdit}
                  />
                  <p className="text-xs font-semibold text-slate-500 mt-1">percent: 0.10 = 10%</p>
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-2 mb-2 block">
                    Mínimo (MXN)
                  </label>
                  <input
                    type="number"
                    step="1"
                    value={newRule.min_amount_mxn}
                    onChange={(e) => setNewRule((s) => ({ ...s, min_amount_mxn: e.target.value }))}
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 font-black outline-none focus:ring-4 focus:ring-sky-500/10 focus:border-sky-600"
                    disabled={!canEdit}
                  />
                </div>

                <div className="col-span-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-2 mb-2 block">
                    Descripción
                  </label>
                  <input
                    value={newRule.description}
                    onChange={(e) => setNewRule((s) => ({ ...s, description: e.target.value }))}
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 font-black outline-none focus:ring-4 focus:ring-sky-500/10 focus:border-sky-600"
                    placeholder="10% OFF Fans"
                    disabled={!canEdit}
                  />
                </div>

                <div className="col-span-2 flex items-center justify-between">
                  <label className="inline-flex items-center gap-2 text-sm font-black text-slate-800">
                    <input
                      type="checkbox"
                      checked={!!newRule.active}
                      onChange={(e) => setNewRule((s) => ({ ...s, active: e.target.checked }))}
                      disabled={!canEdit}
                    />
                    Activo
                  </label>

                  <div className="flex items-center gap-2">
                    <Calendar size={16} className="text-slate-400" />
                    <input
                      type="date"
                      value={newRule.expires_at}
                      onChange={(e) => setNewRule((s) => ({ ...s, expires_at: e.target.value }))}
                      className="rounded-xl border border-slate-200 px-4 py-2 font-black outline-none focus:ring-4 focus:ring-sky-500/10 focus:border-sky-600"
                      disabled={!canEdit}
                    />
                  </div>
                </div>
              </div>

              <button
                onClick={addRule}
                disabled={!canEdit || rulesBusy}
                className="w-full px-5 py-3 rounded-2xl text-white font-black shadow-sm disabled:opacity-60"
                style={{ background: BRAND.grad }}
              >
                {rulesBusy ? "Guardando…" : "Guardar cupón"}
              </button>
            </div>

            <div className="mt-6">
              <p className="text-xs font-black text-slate-700 mb-2">Cupones existentes</p>

              <div className="space-y-2">
                {(rules || []).map((r) => (
                  <div key={r.id} className="rounded-2xl border border-slate-200 bg-white p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-black text-slate-900 flex items-center gap-2">
                          <Tag size={16} className="text-slate-400" />
                          {String(r.code || "").toUpperCase()}
                          {r.active ? <Badge tone="emerald">Activo</Badge> : <Badge tone="slate">Off</Badge>}
                        </p>
                        <p className="text-xs font-semibold text-slate-600 mt-1">{r.description || "—"}</p>
                        <p className="text-xs font-semibold text-slate-500 mt-1">
                          Tipo: <span className="font-black">{r.type}</span> · Valor:{" "}
                          <span className="font-black">
                            {r.type === "percent" ? `${Math.round(num(r.value) * 100)}%` : moneyMXN(r.value)}
                          </span>{" "}
                          · Mínimo: <span className="font-black">{moneyMXN(r.min_amount_mxn)}</span>
                        </p>
                      </div>

                      <button
                        onClick={() => toggleRule(r.id, !r.active)}
                        disabled={!canEdit || rulesBusy}
                        className="px-4 py-2 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 font-black text-xs disabled:opacity-60"
                        title="Activar / Desactivar"
                      >
                        {r.active ? (
                          <>
                            <Lock size={14} className="inline mr-1 text-rose-600" /> Desactivar
                          </>
                        ) : (
                          <>
                            <Unlock size={14} className="inline mr-1 text-emerald-600" /> Activar
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                ))}

                {!rules?.length ? <p className="text-sm font-semibold text-slate-500">Sin cupones aún.</p> : null}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/* ---------------------------
   USERS (equipo real: invita, roles, activar/desactivar)
--------------------------- */
function UsersView({ orgId, token, role, canInvite, toast }) {
  const [busy, setBusy] = useState(false);
  const [rows, setRows] = useState([]);
  const [q, setQ] = useState("");

  const [invite, setInvite] = useState({ email: "", role: "viewer" });
  const canEdit = ["owner", "admin"].includes(String(role || "").toLowerCase());

  const load = useCallback(async () => {
    if (!orgId) return;
    setBusy(true);

    try {
      const { data, error } = await supabase
        .from("admin_users")
        .select("id, email, role, is_active, created_at, last_login, user_id")
        .eq("organization_id", orgId)
        .order("created_at", { ascending: false })
        .limit(250);

      if (error) throw error;
      setRows(data || []);
    } catch (e) {
      toast?.({ type: "bad", text: String(e?.message || e) });
      setRows([]);
    } finally {
      setBusy(false);
    }
  }, [orgId, toast]);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return rows;
    return rows.filter((r) => (r.email || "").toLowerCase().includes(s));
  }, [rows, q]);

  const doInvite = async () => {
    if (!canInvite) return toast?.({ type: "warn", text: "Sin permisos para invitar." });

    const email = normEmail(invite.email);
    if (!email) return toast?.({ type: "warn", text: "Email inválido." });

    setBusy(true);
    try {
      const res = await fetch("/api/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ org_id: orgId, email, role: invite.role }),
      });

      const j = await res.json().catch(() => ({}));
      if (!res.ok || !j?.ok) throw new Error(j?.error || "No se pudo invitar.");

      toast?.({ type: "ok", text: "Invitación creada. Ese correo ya puede entrar." });
      setInvite({ email: "", role: "viewer" });
      await load();
    } catch (e) {
      toast?.({ type: "bad", text: String(e?.message || e) });
    } finally {
      setBusy(false);
    }
  };

  const updateRow = async (id, patch) => {
    if (!canEdit) return toast?.({ type: "warn", text: "Solo Owner/Admin puede editar." });

    setBusy(true);
    try {
      const { error } = await supabase
        .from("admin_users")
        .update({ ...patch, updated_at: new Date().toISOString() })
        .eq("id", id);

      if (error) throw error;
      await load();
      toast?.({ type: "ok", text: "Actualizado." });
    } catch (e) {
      toast?.({ type: "bad", text: String(e?.message || e) });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-[2rem] border border-slate-200 bg-white shadow-sm p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">Equipo</p>
            <h4 className="text-lg font-black text-slate-900">Usuarios y roles</h4>
            <p className="text-sm font-semibold text-slate-600">Control de acceso por organización.</p>
          </div>

          <button
            onClick={load}
            className="px-4 py-2 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 font-black text-sm flex items-center gap-2"
          >
            <RefreshCcw size={16} className={busy ? "animate-spin" : ""} /> Actualizar
          </button>
        </div>

        <div className="mt-5 grid md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-2 mb-2 block">
              Buscar
            </label>
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-4 py-3 font-black outline-none focus:ring-4 focus:ring-sky-500/10 focus:border-sky-600"
              placeholder="email…"
            />
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-black text-slate-700">Tu rol</p>
            <p className="text-sm font-black text-slate-900 mt-1">{String(role || "viewer").toUpperCase()}</p>
            <div className="mt-2">
              {canInvite ? <Badge tone="emerald">Puede invitar</Badge> : <Badge tone="amber">Solo lectura</Badge>}
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-[2rem] border border-slate-200 bg-white shadow-sm p-6">
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">Invitar</p>
        <h4 className="text-lg font-black text-slate-900">Nuevo usuario</h4>

        <div className="mt-4 grid md:grid-cols-3 gap-3">
          <input
            value={invite.email}
            onChange={(e) => setInvite((s) => ({ ...s, email: e.target.value }))}
            placeholder="correo@dominio.com"
            className="md:col-span-2 rounded-xl border border-slate-200 px-4 py-3 font-black outline-none focus:ring-4 focus:ring-sky-500/10 focus:border-sky-600"
            disabled={!canInvite}
          />

          <select
            value={invite.role}
            onChange={(e) => setInvite((s) => ({ ...s, role: e.target.value }))}
            className="rounded-xl border border-slate-200 px-4 py-3 font-black outline-none focus:ring-4 focus:ring-sky-500/10 focus:border-sky-600 bg-white"
            disabled={!canInvite}
          >
            <option value="viewer">Viewer</option>
            <option value="marketing">Marketing</option>
            <option value="sales">Sales</option>
            <option value="ops">Ops</option>
            <option value="admin">Admin</option>
            <option value="owner">Owner</option>
          </select>
        </div>

        <button
          onClick={doInvite}
          disabled={!canInvite || busy}
          className="mt-4 w-full px-5 py-3 rounded-2xl text-white font-black shadow-sm disabled:opacity-60 flex items-center justify-center gap-2"
          style={{ background: BRAND.grad }}
        >
          <UserPlus size={18} /> Crear acceso
        </button>

        {!canInvite ? (
          <p className="text-xs font-semibold text-slate-500 mt-3">
            Solo Owner/Admin puede invitar o modificar roles.
          </p>
        ) : null}
      </div>

      <div className="rounded-[2rem] border border-slate-200 bg-white shadow-sm p-6">
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">Usuarios</p>
        <h4 className="text-lg font-black text-slate-900">Lista</h4>

        <div className="mt-5 overflow-x-auto">
          <table className="w-full min-w-[860px]">
            <thead>
              <tr className="text-left text-[10px] font-black uppercase tracking-widest text-slate-500">
                <th className="py-2 pr-3">Email</th>
                <th className="py-2 pr-3">Rol</th>
                <th className="py-2 pr-3">Estado</th>
                <th className="py-2 pr-3">Creado</th>
                <th className="py-2 pr-3">Último login</th>
                <th className="py-2 pr-3 text-right">Acción</th>
              </tr>
            </thead>

            <tbody className="text-sm">
              {filtered.map((u) => (
                <tr key={u.id} className="border-t border-slate-200">
                  <td className="py-3 pr-3 font-black text-slate-900">{u.email}</td>

                  <td className="py-3 pr-3">
                    <select
                      value={String(u.role || "viewer").toLowerCase()}
                      onChange={(e) => updateRow(u.id, { role: e.target.value })}
                      disabled={!canEdit || busy}
                      className="rounded-xl border border-slate-200 px-3 py-2 font-black bg-white"
                    >
                      <option value="viewer">viewer</option>
                      <option value="marketing">marketing</option>
                      <option value="sales">sales</option>
                      <option value="ops">ops</option>
                      <option value="admin">admin</option>
                      <option value="owner">owner</option>
                    </select>
                  </td>

                  <td className="py-3 pr-3">{u.is_active ? <Badge tone="emerald">Activo</Badge> : <Badge tone="slate">Off</Badge>}</td>

                  <td className="py-3 pr-3 text-xs font-semibold text-slate-500">
                    {u.created_at ? new Date(u.created_at).toLocaleString("es-MX") : "—"}
                  </td>

                  <td className="py-3 pr-3 text-xs font-semibold text-slate-500">
                    {u.last_login ? new Date(u.last_login).toLocaleString("es-MX") : "—"}
                  </td>

                  <td className="py-3 pr-3 text-right">
                    <button
                      onClick={() => updateRow(u.id, { is_active: !u.is_active })}
                      disabled={!canEdit || busy}
                      className="px-4 py-2 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 font-black text-xs disabled:opacity-60"
                    >
                      {u.is_active ? (
                        <>
                          <Lock size={14} className="inline mr-1 text-rose-600" /> Desactivar
                        </>
                      ) : (
                        <>
                          <Unlock size={14} className="inline mr-1 text-emerald-600" /> Activar
                        </>
                      )}
                    </button>
                  </td>
                </tr>
              ))}

              {!filtered.length ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-sm font-semibold text-slate-500">
                    Sin usuarios.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/* ---------------------------
   INTEGRATIONS (estado real: envs + conteos + salud)
--------------------------- */
function IntegrationsView({ orgId, token, toast }) {
  const [busy, setBusy] = useState(false);
  const [health, setHealth] = useState(null);

  const [stats, setStats] = useState({
    orders24: 0,
    paid24: 0,
    revenue24: 0,
    labels24: 0,
    webhooks24: 0,
  });

  const load = useCallback(async () => {
    setBusy(true);
    try {
      const res = await fetch("/api/health", {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        cache: "no-store",
      }).catch(() => null);

      const j = res ? await res.json().catch(() => null) : null;
      setHealth(j);

      if (orgId) {
        const since = new Date(Date.now() - 24 * 3600 * 1000).toISOString();

        const [oAll, oPaid, labels, wh] = await Promise.all([
          supabase
            .from("orders")
            .select("id", { count: "exact", head: true })
            .eq("organization_id", orgId)
            .gte("created_at", since),

          supabase
            .from("orders")
            .select("amount_total_mxn, status", { count: "exact", head: false })
            .eq("organization_id", orgId)
            .gte("created_at", since)
            .in("status", ["paid", "fulfilled"])
            .limit(500),

          supabase
            .from("shipping_labels")
            .select("id", { count: "exact", head: true })
            .eq("org_id", orgId)
            .gte("created_at", since),

          supabase
            .from("shipping_webhooks")
            .select("id", { count: "exact", head: true })
            .gte("created_at", since),
        ]);

        const revenue24 = (oPaid?.data || []).reduce((a, r) => a + num(r.amount_total_mxn), 0);

        setStats({
          orders24: Number(oAll?.count || 0),
          paid24: Number(oPaid?.count || (oPaid?.data || []).length || 0),
          revenue24,
          labels24: Number(labels?.count || 0),
          webhooks24: Number(wh?.count || 0),
        });
      }
    } catch (e) {
      toast?.({ type: "bad", text: String(e?.message || e) });
    } finally {
      setBusy(false);
    }
  }, [orgId, token, toast]);

  useEffect(() => {
    load();
  }, [load]);

  const ok = (v) => !!v;

  return (
    <div className="space-y-6">
      <div className="rounded-[2rem] border border-slate-200 bg-white shadow-sm p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">Integraciones</p>
            <h4 className="text-lg font-black text-slate-900">Estado del sistema</h4>
            <p className="text-sm font-semibold text-slate-600">
              Verifica Supabase, Stripe y Envía con señales reales.
            </p>
          </div>

          <button
            onClick={load}
            className="px-4 py-2 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 font-black text-sm flex items-center gap-2"
          >
            <RefreshCcw size={16} className={busy ? "animate-spin" : ""} /> Actualizar
          </button>
        </div>

        <div className="mt-6 grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          <MiniKPI label="Pedidos (24h)" value={stats.orders24} icon={<ShoppingCart size={14} />} />
          <MiniKPI label="Pagados (24h)" value={stats.paid24} icon={<CheckCircle2 size={14} />} />
          <MiniKPI label="Ingresos (24h)" value={moneyMXN(stats.revenue24)} icon={<Wallet size={14} />} />
          <MiniKPI label="Guías Envía (24h)" value={stats.labels24} icon={<Truck size={14} />} />
        </div>
      </div>

      <div className="rounded-[2rem] border border-slate-200 bg-white shadow-sm p-6">
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">Health</p>
        <h4 className="text-lg font-black text-slate-900">Variables / Conexiones</h4>

        <div className="mt-4 grid md:grid-cols-2 gap-3">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-black text-slate-700 mb-2">Supabase</p>
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-slate-700">URL</span>
              {ok(health?.env?.SUPABASE_URL) ? <Badge tone="emerald">OK</Badge> : <Badge tone="rose">FALTA</Badge>}
            </div>
            <div className="flex items-center justify-between mt-2">
              <span className="text-sm font-semibold text-slate-700">Service Role</span>
              {ok(health?.env?.SUPABASE_SECRET_KEY) ? <Badge tone="emerald">OK</Badge> : <Badge tone="rose">FALTA</Badge>}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-black text-slate-700 mb-2">Pagos / Envíos</p>
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-slate-700">Stripe</span>
              {ok(health?.env?.STRIPE_SECRET_KEY) ? <Badge tone="emerald">OK</Badge> : <Badge tone="rose">FALTA</Badge>}
            </div>
            <div className="flex items-center justify-between mt-2">
              <span className="text-sm font-semibold text-slate-700">Envía</span>
              {ok(health?.env?.ENVIA_API_KEY) ? <Badge tone="emerald">OK</Badge> : <Badge tone="amber">Opcional</Badge>}
            </div>
          </div>
        </div>

        {health?.ok === false ? (
          <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 p-4">
            <p className="text-sm font-black text-rose-900">Health error</p>
            <p className="text-sm font-semibold text-rose-800 mt-1">
              {health?.error || health?.detail || "Error"}
            </p>
          </div>
        ) : null}

        <p className="text-xs font-semibold text-slate-500 mt-4">
          Si ves “FALTA”, corrige envs en Netlify y redeploy. Eso elimina el error “No se encontró la organización”.
        </p>
      </div>
    </div>
  );
}