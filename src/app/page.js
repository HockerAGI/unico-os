"use client";

/**
 * =========================================================
 * UnicOs — Admin App (Score Store + Unico Uniformes)
 * page.js — FULL FILE (v2026-03-05)
 *
 * - Dashboard real: Stripe + Envía (via /api/stripe/summary, /api/stripe/fees, /api/envia/summary)
 * - KPI "Ganancia Score Store" muestra SOLO 70% del neto (regla empresa)
 * - Help tips (❓) para dueños no-tech
 * - UI pro, claro, sin tecnicismos
 * =========================================================
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import clsx from "clsx";
import {
  Activity,
  BadgeCheck,
  Boxes,
  Calendar,
  Check,
  ChevronDown,
  Clock,
  CreditCard,
  ExternalLink,
  FileText,
  HelpCircle,
  Lock,
  Package,
  Pencil,
  PiggyBank,
  RefreshCcw,
  Search,
  Settings,
  Shield,
  ShoppingCart,
  Sparkles,
  Truck,
  Upload,
  Wallet,
  X,
} from "lucide-react";

import { createClient } from "@supabase/supabase-js";

/* =========================================================
   Supabase client (browser)
   ========================================================= */

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

const supabase =
  SUPABASE_URL && SUPABASE_ANON_KEY
    ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        auth: { persistSession: true, autoRefreshToken: true },
      })
    : null;

/* =========================================================
   Helpers
   ========================================================= */

const num = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

const moneyMXN = (v) =>
  new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    maximumFractionDigits: 2,
  }).format(num(v));

const clampInt = (v, a, b) => {
  const n = Math.floor(Number(v));
  if (!Number.isFinite(n)) return a;
  return Math.max(a, Math.min(b, n));
};

const safeStr = (v) => String(v ?? "").trim();

const humanDate = (iso) => {
  try {
    return iso ? new Date(iso).toLocaleString("es-MX") : "—";
  } catch {
    return "—";
  }
};

/* =========================================================
   HelpTip (❓) — para el dueño no-tech
   ========================================================= */

function HelpTip({ title = "Ayuda", text = "", align = "right" }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const onDoc = (e) => {
      if (!ref.current) return;
      if (!ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  return (
    <span className="relative inline-flex" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center justify-center w-7 h-7 rounded-full border border-slate-200 bg-white hover:bg-slate-50"
        aria-label="Ayuda"
        title="¿Qué es esto?"
      >
        <HelpCircle size={16} className="text-slate-600" />
      </button>

      {open ? (
        <div
          className={[
            "absolute z-[9999] mt-2 w-[340px] max-w-[88vw] rounded-2xl border border-slate-200 bg-white shadow-xl p-4",
            align === "left" ? "left-0" : "right-0",
          ].join(" ")}
          role="dialog"
          aria-label={title}
        >
          <div className="text-xs font-black uppercase tracking-widest text-slate-500">
            {title}
          </div>
          <div className="mt-2 text-sm font-semibold text-slate-800 leading-relaxed">
            {text || "—"}
          </div>
          <div className="mt-3 text-[11px] font-semibold text-slate-500">
            Tip: si algo no te cuadra, presiona “Actualizar”.
          </div>
        </div>
      ) : null}
    </span>
  );
}

/* =========================================================
   UI atoms
   ========================================================= */

function MiniKPI({ icon, label, value, note }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="text-[11px] font-black uppercase tracking-widest text-slate-500">
          {label}
        </div>
        <div className="text-slate-700">{icon}</div>
      </div>
      <div className="mt-2 text-xl font-black text-slate-900">{value}</div>
      {note ? (
        <div className="mt-1 text-xs font-semibold text-slate-500">{note}</div>
      ) : null}
    </div>
  );
}

function Toast({ toast, clear }) {
  if (!toast?.text) return null;
  return (
    <div className="fixed bottom-6 left-0 right-0 z-[99999] flex justify-center px-4">
      <div
        className={clsx(
          "w-full max-w-xl rounded-2xl border shadow-lg p-4 flex items-start justify-between gap-4",
          toast.type === "ok"
            ? "border-emerald-200 bg-emerald-50"
            : "border-red-200 bg-red-50"
        )}
      >
        <div className="text-sm font-semibold text-slate-900">{toast.text}</div>
        <button
          className="w-9 h-9 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 flex items-center justify-center"
          onClick={clear}
          aria-label="Cerrar"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
}

/* =========================================================
   Auth + role perms (frontend)
   ========================================================= */

const ROLE_PERMS = {
  owner: { view_finance: true, write: true, marketing: true },
  admin: { view_finance: true, write: true, marketing: true },
  marketing: { view_finance: true, write: false, marketing: true },
  support: { view_finance: false, write: false, marketing: false },
  viewer: { view_finance: false, write: false, marketing: false },
};

const hasPerm = (role, key) => {
  const r = String(role || "viewer");
  return !!ROLE_PERMS[r]?.[key];
};
/* =========================================================
   Main App Shell
   ========================================================= */

export default function Page() {
  const [toast, setToast] = useState(null);

  const showToast = useCallback((t) => setToast(t), []);
  const clearToast = useCallback(() => setToast(null), []);

  return (
    <div className="min-h-screen bg-slate-50">
      <TopShell />
      <div className="max-w-6xl mx-auto px-4 py-6">
        <AppRoot toast={showToast} />
      </div>
      <Toast toast={toast} clear={clearToast} />
    </div>
  );
}

function TopShell() {
  return (
    <div className="sticky top-0 z-50 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between gap-4">
        <div className="min-w-0">
          <div className="text-[10px] font-black uppercase tracking-widest text-slate-500">
            UnicOs
          </div>
          <div className="text-lg font-black text-slate-900 truncate">
            Panel Maestro (Score Store + Operación)
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="hidden sm:inline-flex items-center gap-2 px-3 py-2 rounded-2xl border border-slate-200 bg-white text-sm font-black text-slate-800">
            <Shield size={16} className="text-sky-600" />
            Acceso por roles
          </span>
        </div>
      </div>
    </div>
  );
}

function AppRoot({ toast }) {
  const [token, setToken] = useState("");
  const [sessionEmail, setSessionEmail] = useState("");

  const [orgId, setOrgId] = useState("");
  const [orgName, setOrgName] = useState("—");

  const [admin, setAdmin] = useState(null);
  const [busy, setBusy] = useState(false);

  const [tab, setTab] = useState("dashboard");

  const canWrite = useMemo(() => hasPerm(admin?.role, "write"), [admin]);
  const canFinance = useMemo(() => hasPerm(admin?.role, "view_finance"), [admin]);

  // ------------------------------------------------------------------
  // Boot: restore token from localStorage
  // ------------------------------------------------------------------
  useEffect(() => {
    try {
      const t = localStorage.getItem("unicos_token") || "";
      const e = localStorage.getItem("unicos_email") || "";
      if (t) setToken(t);
      if (e) setSessionEmail(e);
    } catch {}
  }, []);

  const logout = useCallback(() => {
    try {
      localStorage.removeItem("unicos_token");
      localStorage.removeItem("unicos_email");
      localStorage.removeItem("unicos_org_id");
    } catch {}
    setToken("");
    setSessionEmail("");
    setOrgId("");
    setOrgName("—");
    setAdmin(null);
    toast?.({ type: "ok", text: "Sesión cerrada." });
  }, [toast]);

  // ------------------------------------------------------------------
  // Resolve org + admin user
  // ------------------------------------------------------------------
  const resolveOrg = useCallback(async () => {
    if (!supabase) {
      toast?.({ type: "bad", text: "Supabase no está configurado (ENV)." });
      return;
    }
    if (!token) return;

    setBusy(true);
    try {
      const storedOrg = (() => {
        try {
          return localStorage.getItem("unicos_org_id") || "";
        } catch {
          return "";
        }
      })();

      // 1) Identidad desde token (server auth)
      const whoRes = await fetch("/api/me", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const who = await whoRes.json().catch(() => ({}));
      if (!whoRes.ok || !who?.ok) throw new Error(who?.error || "No autorizado.");

      const email = safeStr(who.email || "");
      if (email) setSessionEmail(email);

      // 2) Admin row (por org)
      let targetOrg = storedOrg;
      if (!targetOrg && who?.organization_id) targetOrg = String(who.organization_id);

      if (!targetOrg) {
        // fallback: buscar por email
        const { data: rows, error } = await supabase
          .from("admin_users")
          .select("organization_id, role, is_active, email")
          .eq("is_active", true)
          .ilike("email", email)
          .order("created_at", { ascending: true })
          .limit(1);

        if (error) throw error;
        const row = rows?.[0];
        if (!row?.organization_id) throw new Error("No hay organización asociada a este usuario.");
        targetOrg = row.organization_id;
      }

      setOrgId(targetOrg);
      try {
        localStorage.setItem("unicos_org_id", targetOrg);
      } catch {}

      const { data: adminRow, error: adminErr } = await supabase
        .from("admin_users")
        .select("id, role, is_active, email, user_id, organization_id")
        .eq("organization_id", targetOrg)
        .eq("is_active", true)
        .or(`email.ilike.${email},user_id.eq.${who.id}`)
        .limit(1)
        .maybeSingle();

      if (adminErr || !adminRow) throw new Error("No autorizado para este org.");

      setAdmin(adminRow);

      // 3) Org name
      const { data: org, error: orgErr } = await supabase
        .from("organizations")
        .select("id,name")
        .eq("id", targetOrg)
        .limit(1)
        .maybeSingle();

      if (!orgErr && org?.name) setOrgName(org.name);

      toast?.({ type: "ok", text: "Sesión lista." });
    } catch (e) {
      toast?.({ type: "bad", text: String(e?.message || e) });
      logout();
    } finally {
      setBusy(false);
    }
  }, [token, toast, logout]);

  useEffect(() => {
    resolveOrg();
  }, [resolveOrg]);

  // ------------------------------------------------------------------
  // Login (token manual)
  // ------------------------------------------------------------------
  const onSaveToken = useCallback(() => {
    const t = safeStr(token);
    if (!t) return toast?.({ type: "bad", text: "Pega tu token primero." });
    try {
      localStorage.setItem("unicos_token", t);
      if (sessionEmail) localStorage.setItem("unicos_email", sessionEmail);
    } catch {}
    toast?.({ type: "ok", text: "Token guardado." });
    resolveOrg();
  }, [token, sessionEmail, toast, resolveOrg]);

  // ------------------------------------------------------------------
  // UI
  // ------------------------------------------------------------------
  if (!token) {
    return (
      <LoginScreen
        token={token}
        setToken={setToken}
        email={sessionEmail}
        setEmail={setSessionEmail}
        onSave={onSaveToken}
      />
    );
  }

  if (!orgId || !admin) {
    return (
      <div className="rounded-[2rem] border border-slate-200 bg-white shadow-sm p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">
              Cargando organización
            </p>
            <h3 className="text-lg font-black text-slate-900">Preparando UnicOs…</h3>
            <p className="text-sm font-semibold text-slate-600 mt-1">
              Validando permisos y configuración.
            </p>
          </div>
          <button
            onClick={resolveOrg}
            className="px-4 py-2 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 font-black text-sm flex items-center gap-2"
          >
            <RefreshCcw size={16} className={busy ? "animate-spin" : ""} /> Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <HeaderBar
        orgName={orgName}
        role={admin.role}
        email={sessionEmail}
        onLogout={logout}
      />

      <NavTabs tab={tab} setTab={setTab} canWrite={canWrite} canFinance={canFinance} />

      {tab === "dashboard" ? (
        <DashboardView orgId={orgId} token={token} toast={toast} />
      ) : null}

      {tab === "products" ? (
        <ProductsView orgId={orgId} canWrite={canWrite} toast={toast} />
      ) : null}

      {tab === "promos" ? (
        <PromosView orgId={orgId} canWrite={canWrite} toast={toast} />
      ) : null}

      {tab === "site" ? (
        <SiteSettingsView orgId={orgId} canWrite={canWrite} toast={toast} />
      ) : null}

      {tab === "ops" ? <OpsView orgId={orgId} token={token} toast={toast} /> : null}
    </div>
  );
}

function HeaderBar({ orgName, role, email, onLogout }) {
  return (
    <div className="rounded-[2rem] border border-slate-200 bg-white shadow-sm p-6">
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">
            Organización
          </p>
          <h2 className="text-2xl md:text-3xl font-black text-slate-900 truncate">{orgName}</h2>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-2 px-3 py-2 rounded-2xl border border-slate-200 bg-white text-sm font-black text-slate-800">
              <BadgeCheck size={16} className="text-emerald-600" /> Rol: {String(role || "viewer")}
            </span>
            <span className="inline-flex items-center gap-2 px-3 py-2 rounded-2xl border border-slate-200 bg-white text-sm font-semibold text-slate-700">
              <Lock size={16} className="text-slate-600" /> {email || "—"}
            </span>
          </div>
        </div>

        <button
          onClick={onLogout}
          className="px-4 py-2 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 font-black text-sm"
        >
          Cerrar sesión
        </button>
      </div>
    </div>
  );
}

function NavTabs({ tab, setTab, canWrite, canFinance }) {
  const tabs = [
    { id: "dashboard", label: "Dashboard", icon: <Activity size={16} /> },
    { id: "products", label: "Productos", icon: <Package size={16} />, gated: !canWrite },
    { id: "promos", label: "Promos", icon: <Sparkles size={16} />, gated: !canWrite },
    { id: "site", label: "Site Settings", icon: <Settings size={16} />, gated: !canWrite },
    { id: "ops", label: "Operación", icon: <Truck size={16} />, gated: !canFinance },
  ];

  return (
    <div className="flex flex-wrap gap-2">
      {tabs.map((t) => (
        <button
          key={t.id}
          onClick={() => setTab(t.id)}
          disabled={!!t.gated}
          className={clsx(
            "px-4 py-2 rounded-2xl border font-black text-sm inline-flex items-center gap-2",
            tab === t.id
              ? "border-slate-900 bg-slate-900 text-white"
              : "border-slate-200 bg-white hover:bg-slate-50 text-slate-900",
            t.gated ? "opacity-50 cursor-not-allowed" : ""
          )}
        >
          {t.icon} {t.label}
        </button>
      ))}
    </div>
  );
}

function LoginScreen({ token, setToken, email, setEmail, onSave }) {
  return (
    <div className="rounded-[2rem] border border-slate-200 bg-white shadow-sm p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">
            Acceso
          </p>
          <h3 className="text-lg font-black text-slate-900">Iniciar sesión</h3>
          <p className="text-sm font-semibold text-slate-600 mt-1">
            Pega el token de acceso de UnicOs.
          </p>
        </div>

        <HelpTip
          title="¿Qué es el token?"
          text="Es una llave temporal para acceder al panel. Si no lo tienes, pídeselo al administrador técnico. Sin token, UnicOs no puede leer datos."
        />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4">
        <div>
          <label className="text-xs font-black text-slate-700">Correo (opcional)</label>
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 w-full px-4 py-3 rounded-2xl border border-slate-200 bg-white font-semibold text-slate-900 outline-none"
            placeholder="correo@empresa.com"
          />
        </div>

        <div>
          <label className="text-xs font-black text-slate-700">Token</label>
          <textarea
            value={token}
            onChange={(e) => setToken(e.target.value)}
            rows={4}
            className="mt-1 w-full px-4 py-3 rounded-2xl border border-slate-200 bg-white font-semibold text-slate-900 outline-none"
            placeholder="Pega aquí tu token"
          />
        </div>

        <button
          onClick={onSave}
          className="px-4 py-3 rounded-2xl bg-slate-900 text-white hover:bg-slate-800 font-black text-sm"
        >
          Entrar
        </button>

        <p className="text-[11px] font-semibold text-slate-500">
          Seguridad: el token se guarda solo en este navegador (localStorage).
        </p>
      </div>
    </div>
  );
}
/* =========================================================
   Dashboard (Stripe + Envía real) + 70% rule
   ========================================================= */

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
    stripeDash: null,
    enviaDash: null,
  });

  const load = useCallback(async () => {
    if (!orgId) return;

    setBusy(true);

    try {
      // Orders reales
      const { data: paidOrders, error: paidErr } = await supabase
        .from("orders")
        .select("id, amount_total_mxn, status, stripe_session_id, created_at")
        .eq("organization_id", orgId)
        .in("status", ["paid", "fulfilled"])
        .order("created_at", { ascending: false })
        .limit(600);

      if (paidErr) throw paidErr;

      const list = paidOrders || [];
      const gross = list.reduce((a, o) => a + num(o.amount_total_mxn), 0);
      const orders = list.length;
      const avg = orders ? gross / orders : 0;

      // Envía summary real (endpoint UnicOs)
      let enviaCost = 0;
      let enviaDash = null;
      try {
        const res = await fetch(`/api/envia/summary?org_id=${encodeURIComponent(orgId)}&days=30`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const j = await res.json().catch(() => ({}));
        if (res.ok && j?.ok) {
          enviaCost = num(j?.kpi?.envia_cost_mxn);
          enviaDash = j;
        }
      } catch {}

      // Stripe fee real
      let stripeFee = 0;
      let stripeMode = "estimate";
      try {
        const res = await fetch(`/api/stripe/fees?org_id=${encodeURIComponent(orgId)}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const j = await res.json().catch(() => ({}));
        if (res.ok && j?.ok) {
          stripeFee = num(j.fees_mxn);
          stripeMode = "stripe";
        } else {
          stripeFee = Math.round(gross * 0.039);
          stripeMode = "estimate";
        }
      } catch {
        stripeFee = Math.round(gross * 0.039);
        stripeMode = "estimate";
      }

      // Stripe dashboard real (balance/payouts)
      let stripeDash = null;
      try {
        const res = await fetch(`/api/stripe/summary`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ org_id: orgId }),
        });
        const j = await res.json().catch(() => ({}));
        if (res.ok && j?.ok) stripeDash = j;
      } catch {}

      // Neto real: bruto - stripeFee - enviaCost
      const netReal = Math.max(0, gross - stripeFee - enviaCost);

      // ✅ Política empresa: mostrar SOLO 70% como “total”
      const netShown = Math.max(0, netReal * 0.7);

      setKpi({
        gross,
        net: netShown,
        orders,
        avg,
        stripeFee,
        stripeMode,
        enviaCost,
        sessions: list.slice(0, 12),
        updatedAt: new Date().toISOString(),
        stripeDash,
        enviaDash,
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

  return (
    <div className="space-y-6">
      {/* KPI principal */}
      <div className="rounded-[2rem] border border-slate-200 bg-white shadow-sm p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-3">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 flex items-center gap-2">
                <Sparkles size={14} className="text-sky-600" /> Ganancia Score Store
              </p>
              <HelpTip
                title="¿Qué representa esta ganancia?"
                text="Este indicador ya descuenta costos reales (Stripe + Envía). Aquí se muestra un total conservador para operación."
              />
            </div>

            <h3 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight">
              {moneyMXN(kpi.net)}
            </h3>

            <p className="text-sm font-semibold text-slate-600 mt-1">
              Resumen en tiempo real de ingresos y costos.
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
          <MiniKPI label="Ganancia Score Store" value={moneyMXN(kpi.net)} icon={<PiggyBank size={14} />} />
          <MiniKPI
            label="Comisión Stripe"
            value={moneyMXN(kpi.stripeFee)}
            note={kpi.stripeMode === "stripe" ? "Real" : "Estimado"}
            icon={<CreditCard size={14} />}
          />
          <MiniKPI label="Comisión Envía.com" value={moneyMXN(kpi.enviaCost)} icon={<Truck size={14} />} />
          <MiniKPI label="Ventas totales" value={moneyMXN(kpi.gross)} icon={<Wallet size={14} />} />
          <MiniKPI label="Pedidos pagados" value={num(kpi.orders)} icon={<ShoppingCart size={14} />} />
          <MiniKPI label="Ticket promedio" value={moneyMXN(kpi.avg)} icon={<FileText size={14} />} />
          <MiniKPI
            label="Actualizado"
            value={kpi.updatedAt ? new Date(kpi.updatedAt).toLocaleTimeString("es-MX") : "—"}
            icon={<Clock size={14} />}
          />
          <MiniKPI label="Estado" value={busy ? "Cargando…" : "Listo"} icon={<Activity size={14} />} />
        </div>
      </div>

      {/* Stripe: panel real */}
      <div className="rounded-[2rem] border border-slate-200 bg-white shadow-sm p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                Stripe (panel real)
              </p>
              <HelpTip
                title="Stripe (panel real)"
                text="Aquí se consulta Stripe en vivo (balance y payouts). Es información real de tu cuenta."
              />
            </div>
            <h4 className="text-lg font-black text-slate-900 mt-1">Balance + Payouts</h4>
            <p className="text-sm font-semibold text-slate-600">
              Si algo no aparece, revisa que STRIPE_SECRET_KEY esté configurada en tu entorno.
            </p>
          </div>

          <a
            className="px-4 py-2 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 font-black text-sm inline-flex items-center gap-2"
            href="https://dashboard.stripe.com/"
            target="_blank"
            rel="noreferrer"
          >
            Abrir Stripe <ExternalLink size={16} />
          </a>
        </div>

        <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="text-xs font-black uppercase tracking-widest text-slate-500">
              Balance disponible
            </div>
            <div className="mt-2 text-sm font-semibold text-slate-800 whitespace-pre-wrap">
              {(kpi.stripeDash?.balance_available || kpi.stripeDash?.balance?.available || [])
                .map((x) => `${String(x.currency || "").toUpperCase()}: ${(num(x.amount || 0) / 100).toFixed(2)}`)
                .join("\n") || "—"}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="text-xs font-black uppercase tracking-widest text-slate-500">
              Payouts recientes
            </div>
            <div className="mt-2 space-y-2">
              {(kpi.stripeDash?.payouts || kpi.stripeDash?.payouts?.data || [])
                .slice(0, 6)
                .map((p) => (
                  <div key={p.id} className="flex items-center justify-between text-sm font-semibold">
                    <span className="text-slate-800">
                      {new Date((p.created || 0) * 1000).toLocaleDateString("es-MX")} ·{" "}
                      {String(p.status || "—")}
                    </span>
                    <span className="text-slate-900 font-black">
                      {(num(p.amount || 0) / 100).toFixed(2)} {String(p.currency || "").toUpperCase()}
                    </span>
                  </div>
                ))}

              {!((kpi.stripeDash?.payouts || kpi.stripeDash?.payouts?.data || []).length) ? (
                <div className="text-sm font-semibold text-slate-500">—</div>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      {/* Envía: operación real */}
      <div className="rounded-[2rem] border border-slate-200 bg-white shadow-sm p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                Envía.com (operación real)
              </p>
              <HelpTip
                title="Envía (operación real)"
                text="Se toma el costo real de guías generadas/registradas por tu operación. Es lo que realmente estás pagando por envíos."
              />
            </div>
            <h4 className="text-lg font-black text-slate-900 mt-1">Guías y costos</h4>
            <p className="text-sm font-semibold text-slate-600">
              Costo total 30d: {moneyMXN(num(kpi.enviaDash?.kpi?.envia_cost_mxn || kpi.enviaCost))}
            </p>
          </div>

          <span className="px-4 py-2 rounded-2xl border border-slate-200 bg-white font-black text-sm inline-flex items-center gap-2">
            <Truck size={16} /> {num(kpi.enviaDash?.scope?.labels_count || 0)} guías
          </span>
        </div>

        <div className="mt-5 overflow-x-auto">
          <table className="w-full min-w-[780px]">
            <thead>
              <tr className="text-left text-[10px] font-black uppercase tracking-widest text-slate-500">
                <th className="py-2 pr-3">Fecha</th>
                <th className="py-2 pr-3">Carrier</th>
                <th className="py-2 pr-3">Tracking</th>
                <th className="py-2 pr-3">Costo</th>
              </tr>
            </thead>
            <tbody>
              {(kpi.enviaDash?.labels || []).slice(0, 12).map((r) => (
                <tr key={r.id} className="border-t border-slate-200">
                  <td className="py-3 pr-3 text-sm font-semibold text-slate-800">
                    {humanDate(r.created_at)}
                  </td>
                  <td className="py-3 pr-3 text-sm font-black text-slate-900">
                    {r.carrier || "—"}
                  </td>
                  <td className="py-3 pr-3 text-sm font-semibold text-slate-800">
                    {r.tracking || "—"}
                  </td>
                  <td className="py-3 pr-3 text-sm font-black text-slate-900">
                    {moneyMXN(num(r.total_amount_mxn))}
                  </td>
                </tr>
              ))}

              {!(kpi.enviaDash?.labels || []).length ? (
                <tr>
                  <td colSpan={4} className="py-10 text-sm font-semibold text-slate-500">
                    Sin guías registradas en el periodo.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>

        <p className="mt-4 text-[11px] font-semibold text-slate-500">
          Nota: si deseas ver “exactamente” lo mismo que el panel de Envía (tracking en vivo por guía),
          se puede ampliar este endpoint para consultar Envía API directo con tu token.
        </p>
      </div>
    </div>
  );
}
/* =========================================================
   Products (catálogo) — real Supabase
   ========================================================= */

function ProductsView({ orgId, canWrite, toast }) {
  const [busy, setBusy] = useState(false);
  const [rows, setRows] = useState([]);
  const [q, setQ] = useState("");

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  const emptyForm = useMemo(
    () => ({
      name: "",
      sku: "",
      description: "",
      price_mxn: "",
      stock: "",
      section_id: "EDICION_2025",
      sub_section: "default",
      rank: "999",
      is_active: true,
      sizes_csv: "S,M,L,XL,XXL",
      images_lines: "",
      image_url: "",
    }),
    []
  );

  const [form, setForm] = useState(emptyForm);

  const load = useCallback(async () => {
    if (!orgId) return;
    setBusy(true);
    try {
      const { data, error } = await supabase
        .from("products")
        .select(
          "id, name, sku, description, price_mxn, price_cents, stock, section_id, sub_section, rank, images, sizes, image_url, is_active, deleted_at, created_at"
        )
        .eq("organization_id", orgId)
        .is("deleted_at", null)
        .order("rank", { ascending: true })
        .order("created_at", { ascending: false })
        .limit(600);

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

  const filtered = useMemo(() => {
    const s = String(q || "").trim().toLowerCase();
    if (!s) return rows || [];
    return (rows || []).filter((r) => {
      const t = `${r?.name || ""} ${r?.sku || ""} ${r?.section_id || ""} ${r?.sub_section || ""}`.toLowerCase();
      return t.includes(s);
    });
  }, [rows, q]);

  const openNew = () => {
    setEditing(null);
    setForm(emptyForm);
    setOpen(true);
  };

  const openEdit = (row) => {
    setEditing(row);
    const sizes = Array.isArray(row?.sizes) ? row.sizes.join(",") : "";
    const images = Array.isArray(row?.images) ? row.images.join("\n") : "";
    setForm({
      name: row?.name || "",
      sku: row?.sku || "",
      description: row?.description || "",
      price_mxn: String(row?.price_mxn ?? ""),
      stock: String(row?.stock ?? ""),
      section_id: row?.section_id || "EDICION_2025",
      sub_section: row?.sub_section || "default",
      rank: String(row?.rank ?? "999"),
      is_active: !!row?.is_active,
      sizes_csv: sizes || "S,M,L,XL,XXL",
      images_lines: images || "",
      image_url: row?.image_url || "",
    });
    setOpen(true);
  };

  const closeModal = () => {
    setOpen(false);
    setEditing(null);
    setForm(emptyForm);
  };

  const save = async () => {
    if (!orgId) return;

    if (!canWrite) {
      toast?.({ type: "bad", text: "No tienes permisos para editar productos." });
      return;
    }

    const name = String(form.name || "").trim();
    const sku = String(form.sku || "").trim();
    if (!name) return toast?.({ type: "bad", text: "Falta el nombre del producto." });
    if (!sku) return toast?.({ type: "bad", text: "Falta el SKU." });

    const price_mxn = Number(form.price_mxn);
    if (!Number.isFinite(price_mxn) || price_mxn <= 0) {
      return toast?.({ type: "bad", text: "Precio MXN inválido." });
    }

    const stock = Number(form.stock);
    const section_id = String(form.section_id || "EDICION_2025").trim() || "EDICION_2025";
    const sub_section = String(form.sub_section || "default").trim() || "default";
    const rank = Number(form.rank);

    const sizes = String(form.sizes_csv || "")
      .split(",")
      .map((x) => String(x || "").trim())
      .filter(Boolean);

    const images = String(form.images_lines || "")
      .split("\n")
      .map((x) => String(x || "").trim())
      .filter(Boolean);

    const image_url = String(form.image_url || "").trim() || (images[0] || null);

    const payload = {
      organization_id: orgId,
      name,
      sku,
      description: String(form.description || "").trim(),
      price_mxn,
      price_cents: Math.round(price_mxn * 100),
      stock: Number.isFinite(stock) ? Math.max(0, Math.floor(stock)) : 0,
      section_id,
      sub_section,
      rank: Number.isFinite(rank) ? rank : 999,
      is_active: !!form.is_active,
      images: images.length ? images : [],
      sizes: sizes.length ? sizes : [],
      image_url,
      updated_at: new Date().toISOString(),
    };

    setBusy(true);
    try {
      if (editing?.id) {
        const { error } = await supabase.from("products").update(payload).eq("id", editing.id);
        if (error) throw error;
        toast?.({ type: "ok", text: "Producto actualizado." });
      } else {
        const { error } = await supabase.from("products").insert({ ...payload, created_at: new Date().toISOString() });
        if (error) throw error;
        toast?.({ type: "ok", text: "Producto creado." });
      }

      closeModal();
      load();
    } catch (e) {
      toast?.({ type: "bad", text: String(e?.message || e) });
    } finally {
      setBusy(false);
    }
  };

  const softDelete = async (row) => {
    if (!row?.id) return;
    if (!canWrite) {
      toast?.({ type: "bad", text: "No tienes permisos para eliminar productos." });
      return;
    }

    const ok = confirm(`¿Eliminar "${row?.name || row?.sku || "producto"}"? (Se puede recuperar reactivando)`);
    if (!ok) return;

    setBusy(true);
    try {
      const { error } = await supabase
        .from("products")
        .update({ deleted_at: new Date().toISOString(), is_active: false, updated_at: new Date().toISOString() })
        .eq("id", row.id);

      if (error) throw error;
      toast?.({ type: "ok", text: "Producto eliminado (soft-delete)." });
      load();
    } catch (e) {
      toast?.({ type: "bad", text: String(e?.message || e) });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="rounded-[2rem] border border-slate-200 bg-white shadow-sm p-6">
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">
              Catálogo
            </p>
            <HelpTip
              title="¿Qué es Catálogo?"
              text="Aquí controlas los productos que ve el cliente en Score Store. Si cambias precio, imagen o stock, la tienda se actualiza."
            />
          </div>
          <h4 className="text-lg font-black text-slate-900">Productos (en vivo)</h4>
          <p className="text-sm font-semibold text-slate-600">
            Estos datos alimentan Score Store en tiempo real (Netlify Functions → Supabase).
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
          <div className="flex items-center gap-2 px-4 py-2 rounded-2xl border border-slate-200 bg-white">
            <Search size={16} className="text-slate-500" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Buscar por nombre / SKU / sección…"
              className="outline-none text-sm font-semibold text-slate-800 w-[240px] max-w-full"
            />
          </div>

          <button
            onClick={load}
            className="px-4 py-2 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 font-black text-sm flex items-center gap-2"
          >
            <RefreshCcw size={16} className={busy ? "animate-spin" : ""} /> Actualizar
          </button>

          <button
            onClick={openNew}
            disabled={!canWrite}
            className={clsx(
              "px-4 py-2 rounded-2xl font-black text-sm flex items-center gap-2",
              canWrite
                ? "bg-slate-900 text-white hover:bg-slate-800"
                : "bg-slate-200 text-slate-500 cursor-not-allowed"
            )}
          >
            <Package size={16} /> Nuevo
          </button>
        </div>
      </div>

      <div className="mt-5 overflow-x-auto">
        <table className="w-full min-w-[1050px]">
          <thead>
            <tr className="text-left text-[10px] font-black uppercase tracking-widest text-slate-500">
              <th className="py-2 pr-3">Producto</th>
              <th className="py-2 pr-3">SKU</th>
              <th className="py-2 pr-3">Sección</th>
              <th className="py-2 pr-3">Sub</th>
              <th className="py-2 pr-3">Precio</th>
              <th className="py-2 pr-3">Stock</th>
              <th className="py-2 pr-3">Activo</th>
              <th className="py-2 pr-3 text-right">Acciones</th>
            </tr>
          </thead>

          <tbody>
            {(filtered || []).map((r) => (
              <tr key={r.id} className="border-t border-slate-200">
                <td className="py-3 pr-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-2xl border border-slate-200 bg-white overflow-hidden flex items-center justify-center shadow-sm">
                      {r?.image_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={r.image_url}
                          alt={r.name || "Producto"}
                          className="w-full h-full object-contain bg-white"
                        />
                      ) : (
                        <span className="text-xs font-black text-slate-400">IMG</span>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-black text-slate-900 truncate">{r?.name || "—"}</p>
                      <p className="text-xs font-semibold text-slate-500 truncate">
                        Rank: {String(r?.rank ?? "—")}
                      </p>
                    </div>
                  </div>
                </td>

                <td className="py-3 pr-3">
                  <p className="text-sm font-black text-slate-900">{r?.sku || "—"}</p>
                </td>

                <td className="py-3 pr-3">
                  <p className="text-sm font-black text-slate-900">{r?.section_id || "—"}</p>
                </td>

                <td className="py-3 pr-3">
                  <p className="text-sm font-black text-slate-900">{r?.sub_section || "—"}</p>
                </td>

                <td className="py-3 pr-3">
                  <p className="text-sm font-black text-slate-900">{moneyMXN(r?.price_mxn || 0)}</p>
                </td>

                <td className="py-3 pr-3">
                  <p className="text-sm font-black text-slate-900">{Number(r?.stock ?? 0)}</p>
                </td>

                <td className="py-3 pr-3">
                  <span
                    className={clsx(
                      "inline-flex items-center px-3 py-1 rounded-full text-[11px] font-black",
                      r?.is_active ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"
                    )}
                  >
                    {r?.is_active ? "Sí" : "No"}
                  </span>
                </td>

                <td className="py-3 pr-3 text-right">
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => openEdit(r)}
                      disabled={!canWrite}
                      className={clsx(
                        "px-3 py-2 rounded-2xl font-black text-sm border",
                        canWrite
                          ? "border-slate-200 bg-white hover:bg-slate-50 text-slate-900"
                          : "border-slate-200 bg-slate-100 text-slate-400 cursor-not-allowed"
                      )}
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => softDelete(r)}
                      disabled={!canWrite}
                      className={clsx(
                        "px-3 py-2 rounded-2xl font-black text-sm border",
                        canWrite
                          ? "border-red-200 bg-red-50 hover:bg-red-100 text-red-700"
                          : "border-slate-200 bg-slate-100 text-slate-400 cursor-not-allowed"
                      )}
                    >
                      Eliminar
                    </button>
                  </div>
                </td>
              </tr>
            ))}

            {!filtered?.length ? (
              <tr>
                <td colSpan={8} className="py-10">
                  <p className="text-sm font-semibold text-slate-500">Sin productos.</p>
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {open ? (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={closeModal}
            role="button"
            aria-label="Cerrar modal"
          />
          <div className="relative w-full max-w-3xl rounded-[2rem] border border-slate-200 bg-white shadow-xl p-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">
                  {editing?.id ? "Editar" : "Nuevo"} producto
                </p>
                <h4 className="text-lg font-black text-slate-900">
                  {editing?.id ? editing?.name || "Producto" : "Crear producto"}
                </h4>
              </div>

              <button
                onClick={closeModal}
                className="w-10 h-10 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 flex items-center justify-center"
              >
                <X size={18} />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-5">
              <div>
                <label className="text-xs font-black text-slate-700">Nombre</label>
                <input
                  value={form.name}
                  onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                  className="mt-1 w-full px-4 py-3 rounded-2xl border border-slate-200 bg-white font-semibold text-slate-900 outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-black text-slate-700">SKU</label>
                <input
                  value={form.sku}
                  onChange={(e) => setForm((p) => ({ ...p, sku: e.target.value }))}
                  className="mt-1 w-full px-4 py-3 rounded-2xl border border-slate-200 bg-white font-semibold text-slate-900 outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-black text-slate-700">Precio MXN</label>
                <input
                  value={form.price_mxn}
                  onChange={(e) => setForm((p) => ({ ...p, price_mxn: e.target.value }))}
                  inputMode="decimal"
                  className="mt-1 w-full px-4 py-3 rounded-2xl border border-slate-200 bg-white font-semibold text-slate-900 outline-none"
                />
                <p className="text-[11px] font-semibold text-slate-500 mt-1">
                  Stripe usa centavos automáticamente (price_cents).
                </p>
              </div>

              <div>
                <label className="text-xs font-black text-slate-700">Stock</label>
                <input
                  value={form.stock}
                  onChange={(e) => setForm((p) => ({ ...p, stock: e.target.value }))}
                  inputMode="numeric"
                  className="mt-1 w-full px-4 py-3 rounded-2xl border border-slate-200 bg-white font-semibold text-slate-900 outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-black text-slate-700">Sección (section_id)</label>
                <input
                  value={form.section_id}
                  onChange={(e) => setForm((p) => ({ ...p, section_id: e.target.value }))}
                  className="mt-1 w-full px-4 py-3 rounded-2xl border border-slate-200 bg-white font-semibold text-slate-900 outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-black text-slate-700">Sub-sección (sub_section)</label>
                <input
                  value={form.sub_section}
                  onChange={(e) => setForm((p) => ({ ...p, sub_section: e.target.value }))}
                  className="mt-1 w-full px-4 py-3 rounded-2xl border border-slate-200 bg-white font-semibold text-slate-900 outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-black text-slate-700">Rank (orden)</label>
                <input
                  value={form.rank}
                  onChange={(e) => setForm((p) => ({ ...p, rank: e.target.value }))}
                  inputMode="numeric"
                  className="mt-1 w-full px-4 py-3 rounded-2xl border border-slate-200 bg-white font-semibold text-slate-900 outline-none"
                />
              </div>

              <div className="md:col-span-2">
                <label className="text-xs font-black text-slate-700">Descripción</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                  rows={3}
                  className="mt-1 w-full px-4 py-3 rounded-2xl border border-slate-200 bg-white font-semibold text-slate-900 outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-black text-slate-700">Tallas (CSV)</label>
                <input
                  value={form.sizes_csv}
                  onChange={(e) => setForm((p) => ({ ...p, sizes_csv: e.target.value }))}
                  className="mt-1 w-full px-4 py-3 rounded-2xl border border-slate-200 bg-white font-semibold text-slate-900 outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-black text-slate-700">Imagen principal (URL)</label>
                <input
                  value={form.image_url}
                  onChange={(e) => setForm((p) => ({ ...p, image_url: e.target.value }))}
                  className="mt-1 w-full px-4 py-3 rounded-2xl border border-slate-200 bg-white font-semibold text-slate-900 outline-none"
                />
              </div>

              <div className="md:col-span-2">
                <label className="text-xs font-black text-slate-700">Imágenes (1 URL por línea)</label>
                <textarea
                  value={form.images_lines}
                  onChange={(e) => setForm((p) => ({ ...p, images_lines: e.target.value }))}
                  rows={4}
                  className="mt-1 w-full px-4 py-3 rounded-2xl border border-slate-200 bg-white font-semibold text-slate-900 outline-none"
                  placeholder="https://.../img1.webp&#10;https://.../img2.webp"
                />
              </div>

              <div className="md:col-span-2 flex items-center justify-between gap-3">
                <label className="flex items-center gap-2 text-sm font-black text-slate-800">
                  <input
                    type="checkbox"
                    checked={!!form.is_active}
                    onChange={(e) => setForm((p) => ({ ...p, is_active: e.target.checked }))}
                    className="w-4 h-4"
                  />
                  Activo
                </label>

                <div className="flex gap-2">
                  <button
                    onClick={closeModal}
                    className="px-4 py-3 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 font-black text-sm"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={save}
                    disabled={busy}
                    className={clsx(
                      "px-4 py-3 rounded-2xl font-black text-sm",
                      busy ? "bg-slate-200 text-slate-500" : "bg-slate-900 text-white hover:bg-slate-800"
                    )}
                  >
                    Guardar
                  </button>
                </div>
              </div>
            </div>

            <p className="text-[11px] font-semibold text-slate-500 mt-4">
              Nota: Score Store consume estos datos vía <code>/.netlify/functions/catalog</code> y valida precios en el checkout.
            </p>
          </div>
        </div>
      ) : null}
    </div>
  );
}

/* =========================================================
   Promos — real Supabase
   ========================================================= */

function PromosView({ orgId, canWrite, toast }) {
  const [busy, setBusy] = useState(false);
  const [rows, setRows] = useState([]);
  const [q, setQ] = useState("");

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  const emptyForm = useMemo(
    () => ({
      code: "",
      type: "percent",
      value: "10",
      description: "",
      min_amount_mxn: "0",
      expires_at: "",
      active: true,
    }),
    []
  );

  const [form, setForm] = useState(emptyForm);

  const load = useCallback(async () => {
    if (!orgId) return;
    setBusy(true);
    try {
      const { data, error } = await supabase
        .from("promo_rules")
        .select("id, code, type, value, description, active, min_amount_mxn, expires_at, created_at")
        .eq("organization_id", orgId)
        .order("created_at", { ascending: false })
        .limit(400);

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

  const filtered = useMemo(() => {
    const s = String(q || "").trim().toLowerCase();
    if (!s) return rows || [];
    return (rows || []).filter((r) => {
      const t = `${r?.code || ""} ${r?.type || ""} ${r?.description || ""}`.toLowerCase();
      return t.includes(s);
    });
  }, [rows, q]);

  const openNew = () => {
    setEditing(null);
    setForm(emptyForm);
    setOpen(true);
  };

  const openEdit = (row) => {
    setEditing(row);
    setForm({
      code: row?.code || "",
      type: row?.type || "percent",
      value: String(row?.value ?? "0"),
      description: row?.description || "",
      min_amount_mxn: String(row?.min_amount_mxn ?? "0"),
      expires_at: row?.expires_at ? String(row.expires_at).slice(0, 16) : "",
      active: !!row?.active,
    });
    setOpen(true);
  };

  const closeModal = () => {
    setOpen(false);
    setEditing(null);
    setForm(emptyForm);
  };

  const save = async () => {
    if (!orgId) return;
    if (!canWrite) return toast?.({ type: "bad", text: "No tienes permisos para editar promos." });

    const code = String(form.code || "").trim().toUpperCase().replace(/\s+/g, "");
    if (!code) return toast?.({ type: "bad", text: "Falta el código." });

    const type = String(form.type || "").trim();
    const value = Number(form.value);
    if (!Number.isFinite(value) || value < 0) return toast?.({ type: "bad", text: "Valor inválido." });

    const min_amount_mxn = Number(form.min_amount_mxn);
    const expires_at = form.expires_at ? new Date(form.expires_at).toISOString() : null;

    const payload = {
      organization_id: orgId,
      code,
      type,
      value,
      description: String(form.description || "").trim(),
      active: !!form.active,
      min_amount_mxn: Number.isFinite(min_amount_mxn) ? min_amount_mxn : 0,
      expires_at,
      updated_at: new Date().toISOString(),
    };

    setBusy(true);
    try {
      if (editing?.id) {
        const { error } = await supabase.from("promo_rules").update(payload).eq("id", editing.id);
        if (error) throw error;
        toast?.({ type: "ok", text: "Promo actualizada." });
      } else {
        const { error } = await supabase.from("promo_rules").insert({ ...payload, created_at: new Date().toISOString() });
        if (error) throw error;
        toast?.({ type: "ok", text: "Promo creada." });
      }

      closeModal();
      load();
    } catch (e) {
      toast?.({ type: "bad", text: String(e?.message || e) });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="rounded-[2rem] border border-slate-200 bg-white shadow-sm p-6">
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">
              Marketing
            </p>
            <HelpTip
              title="¿Qué es Promos?"
              text="Aquí creas cupones de descuento (porcentaje, monto fijo o envío gratis). Se aplican en Score Store al momento del pago."
            />
          </div>
          <h4 className="text-lg font-black text-slate-900">Promociones</h4>
          <p className="text-sm font-semibold text-slate-600">
            Estos códigos se validan en el checkout (Stripe) y se reflejan en Score Store.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
          <div className="flex items-center gap-2 px-4 py-2 rounded-2xl border border-slate-200 bg-white">
            <Search size={16} className="text-slate-500" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Buscar por código o descripción…"
              className="outline-none text-sm font-semibold text-slate-800 w-[260px] max-w-full"
            />
          </div>

          <button
            onClick={load}
            className="px-4 py-2 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 font-black text-sm flex items-center gap-2"
          >
            <RefreshCcw size={16} className={busy ? "animate-spin" : ""} /> Actualizar
          </button>

          <button
            onClick={openNew}
            disabled={!canWrite}
            className={clsx(
              "px-4 py-2 rounded-2xl font-black text-sm flex items-center gap-2",
              canWrite
                ? "bg-slate-900 text-white hover:bg-slate-800"
                : "bg-slate-200 text-slate-500 cursor-not-allowed"
            )}
          >
            <Sparkles size={16} /> Nueva
          </button>
        </div>
      </div>

      <div className="mt-5 overflow-x-auto">
        <table className="w-full min-w-[980px]">
          <thead>
            <tr className="text-left text-[10px] font-black uppercase tracking-widest text-slate-500">
              <th className="py-2 pr-3">Código</th>
              <th className="py-2 pr-3">Tipo</th>
              <th className="py-2 pr-3">Valor</th>
              <th className="py-2 pr-3">Mínimo</th>
              <th className="py-2 pr-3">Expira</th>
              <th className="py-2 pr-3">Activa</th>
              <th className="py-2 pr-3 text-right">Acciones</th>
            </tr>
          </thead>

          <tbody>
            {(filtered || []).map((r) => (
              <tr key={r.id} className="border-t border-slate-200">
                <td className="py-3 pr-3">
                  <p className="text-sm font-black text-slate-900">{r?.code || "—"}</p>
                  <p className="text-xs font-semibold text-slate-500 truncate">{r?.description || ""}</p>
                </td>

                <td className="py-3 pr-3 text-sm font-black text-slate-900">
                  {String(r?.type || "—")}
                </td>

                <td className="py-3 pr-3 text-sm font-black text-slate-900">
                  {String(r?.value ?? "—")}
                </td>

                <td className="py-3 pr-3 text-sm font-black text-slate-900">
                  {moneyMXN(num(r?.min_amount_mxn))}
                </td>

                <td className="py-3 pr-3 text-sm font-semibold text-slate-700">
                  {r?.expires_at ? new Date(r.expires_at).toLocaleDateString("es-MX") : "—"}
                </td>

                <td className="py-3 pr-3">
                  <span
                    className={clsx(
                      "inline-flex items-center px-3 py-1 rounded-full text-[11px] font-black",
                      r?.active ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"
                    )}
                  >
                    {r?.active ? "Sí" : "No"}
                  </span>
                </td>

                <td className="py-3 pr-3 text-right">
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => openEdit(r)}
                      disabled={!canWrite}
                      className={clsx(
                        "px-3 py-2 rounded-2xl font-black text-sm border",
                        canWrite
                          ? "border-slate-200 bg-white hover:bg-slate-50 text-slate-900"
                          : "border-slate-200 bg-slate-100 text-slate-400 cursor-not-allowed"
                      )}
                    >
                      Editar
                    </button>
                  </div>
                </td>
              </tr>
            ))}

            {!filtered?.length ? (
              <tr>
                <td colSpan={7} className="py-10">
                  <p className="text-sm font-semibold text-slate-500">Sin promos.</p>
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {open ? (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={closeModal}
            role="button"
            aria-label="Cerrar modal"
          />
          <div className="relative w-full max-w-3xl rounded-[2rem] border border-slate-200 bg-white shadow-xl p-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">
                  {editing?.id ? "Editar" : "Nueva"} promo
                </p>
                <h4 className="text-lg font-black text-slate-900">
                  {editing?.id ? `Código ${editing?.code || ""}` : "Crear promo"}
                </h4>
              </div>

              <button
                onClick={closeModal}
                className="w-10 h-10 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 flex items-center justify-center"
              >
                <X size={18} />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-5">
              <div>
                <label className="text-xs font-black text-slate-700">Código</label>
                <input
                  value={form.code}
                  onChange={(e) => setForm((p) => ({ ...p, code: e.target.value }))}
                  className="mt-1 w-full px-4 py-3 rounded-2xl border border-slate-200 bg-white font-semibold text-slate-900 outline-none uppercase"
                  placeholder="SCOREVIP"
                />
              </div>

              <div>
                <label className="text-xs font-black text-slate-700">Tipo</label>
                <select
                  value={form.type}
                  onChange={(e) => setForm((p) => ({ ...p, type: e.target.value }))}
                  className="mt-1 w-full px-4 py-3 rounded-2xl border border-slate-200 bg-white font-semibold text-slate-900 outline-none"
                >
                  <option value="percent">Porcentaje</option>
                  <option value="fixed_mxn">Monto fijo (MXN)</option>
                  <option value="free_shipping">Envío gratis</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-black text-slate-700">Valor</label>
                <input
                  value={form.value}
                  onChange={(e) => setForm((p) => ({ ...p, value: e.target.value }))}
                  inputMode="decimal"
                  className="mt-1 w-full px-4 py-3 rounded-2xl border border-slate-200 bg-white font-semibold text-slate-900 outline-none"
                />
                <p className="text-[11px] font-semibold text-slate-500 mt-1">
                  Percent: 10 = 10% · Fixed: 50 = $50 MXN
                </p>
              </div>

              <div>
                <label className="text-xs font-black text-slate-700">Mínimo compra (MXN)</label>
                <input
                  value={form.min_amount_mxn}
                  onChange={(e) => setForm((p) => ({ ...p, min_amount_mxn: e.target.value }))}
                  inputMode="decimal"
                  className="mt-1 w-full px-4 py-3 rounded-2xl border border-slate-200 bg-white font-semibold text-slate-900 outline-none"
                />
              </div>

              <div className="md:col-span-2">
                <label className="text-xs font-black text-slate-700">Descripción</label>
                <input
                  value={form.description}
                  onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                  className="mt-1 w-full px-4 py-3 rounded-2xl border border-slate-200 bg-white font-semibold text-slate-900 outline-none"
                  placeholder="Ej: 10% en toda la tienda"
                />
              </div>

              <div>
                <label className="text-xs font-black text-slate-700">Expira</label>
                <input
                  value={form.expires_at}
                  onChange={(e) => setForm((p) => ({ ...p, expires_at: e.target.value }))}
                  type="datetime-local"
                  className="mt-1 w-full px-4 py-3 rounded-2xl border border-slate-200 bg-white font-semibold text-slate-900 outline-none"
                />
              </div>

              <div className="flex items-end">
                <label className="flex items-center gap-2 text-sm font-black text-slate-800">
                  <input
                    type="checkbox"
                    checked={!!form.active}
                    onChange={(e) => setForm((p) => ({ ...p, active: e.target.checked }))}
                    className="w-4 h-4"
                  />
                  Activa
                </label>
              </div>

              <div className="md:col-span-2 flex items-center justify-end gap-2">
                <button
                  onClick={closeModal}
                  className="px-4 py-3 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 font-black text-sm"
                >
                  Cancelar
                </button>
                <button
                  onClick={save}
                  disabled={busy}
                  className={clsx(
                    "px-4 py-3 rounded-2xl font-black text-sm",
                    busy ? "bg-slate-200 text-slate-500" : "bg-slate-900 text-white hover:bg-slate-800"
                  )}
                >
                  Guardar
                </button>
              </div>
            </div>

            <p className="text-[11px] font-semibold text-slate-500 mt-4">
              Nota: Score Store valida promos en backend para evitar abuso.
            </p>
          </div>
        </div>
      ) : null}
    </div>
  );
}

/* =========================================================
   Site Settings — base (en tu repo actual)
   ========================================================= */

function SiteSettingsView({ orgId, canWrite, toast }) {
  const [busy, setBusy] = useState(false);
  const [row, setRow] = useState(null);

  const [form, setForm] = useState({
    hero_title: "",
    hero_image: "",
    promo_active: false,
    promo_text: "",
    pixel_id: "",
    maintenance_mode: false,
    season_key: "default",
    theme_json: "{}",
    home_json: "{}",
    socials_json: "{}",
    contact_email: "",
  });

  const load = useCallback(async () => {
    if (!orgId) return;
    setBusy(true);
    try {
      const { data, error } = await supabase
        .from("site_settings")
        .select(
          "id, org_id, organization_id, hero_title, hero_image, promo_active, promo_text, pixel_id, maintenance_mode, season_key, theme, home, socials, contact_email, updated_at, created_at"
        )
        .or(`org_id.eq.${orgId},organization_id.eq.${orgId}`)
        .order("updated_at", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      setRow(data || null);

      const theme = data?.theme ?? {};
      const home = data?.home ?? {};
      const socials = data?.socials ?? {};

      setForm({
        hero_title: data?.hero_title || "",
        hero_image: data?.hero_image || "",
        promo_active: !!data?.promo_active,
        promo_text: data?.promo_text || "",
        pixel_id: data?.pixel_id || "",
        maintenance_mode: !!data?.maintenance_mode,
        season_key: data?.season_key || "default",
        theme_json: JSON.stringify(theme, null, 2),
        home_json: JSON.stringify(home, null, 2),
        socials_json: JSON.stringify(socials, null, 2),
        contact_email: data?.contact_email || "",
      });
    } catch (e) {
      toast?.({ type: "bad", text: String(e?.message || e) });
    } finally {
      setBusy(false);
    }
  }, [orgId, toast]);

  useEffect(() => {
    load();
  }, [load]);

  const save = async () => {
    if (!orgId) return;
    if (!canWrite) return toast?.({ type: "bad", text: "No tienes permisos para editar Site Settings." });

    setBusy(true);
    try {
      const theme = JSON.parse(form.theme_json || "{}");
      const home = JSON.parse(form.home_json || "{}");
      const socials = JSON.parse(form.socials_json || "{}");

      const payload = {
        org_id: orgId, // tu schema real lo exige NOT NULL
        organization_id: orgId, // lo dejamos también para compatibilidad
        hero_title: String(form.hero_title || "").trim() || null,
        hero_image: String(form.hero_image || "").trim() || null,
        promo_active: !!form.promo_active,
        promo_text: String(form.promo_text || "").trim() || null,
        pixel_id: String(form.pixel_id || "").trim() || null,
        maintenance_mode: !!form.maintenance_mode,
        season_key: String(form.season_key || "default").trim() || "default",
        theme,
        home,
        socials,
        contact_email: String(form.contact_email || "").trim() || null,
        updated_at: new Date().toISOString(),
      };

      if (row?.id) {
        const { error } = await supabase.from("site_settings").update(payload).eq("id", row.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("site_settings")
          .insert({ ...payload, created_at: new Date().toISOString() });
        if (error) throw error;
      }

      toast?.({ type: "ok", text: "Site Settings guardado. Score Store se actualizará en vivo." });
      load();
    } catch (e) {
      toast?.({ type: "bad", text: `Error guardando: ${String(e?.message || e)}` });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="rounded-[2rem] border border-slate-200 bg-white shadow-sm p-6 space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">
              Score Store — Control
            </p>
            <HelpTip
              title="¿Qué es Site Settings?"
              text="Este panel controla: promo bar, pixel, mantenimiento y tema suave (sin romper tu diseño). Al guardar, Score Store lo lee en tiempo real."
            />
          </div>
          <h4 className="text-lg font-black text-slate-900">Site Settings (en vivo)</h4>
          <p className="text-sm font-semibold text-slate-600">
            Aquí editas parámetros globales de Score Store.
          </p>
        </div>

        <button
          onClick={save}
          disabled={!canWrite || busy}
          className={clsx(
            "px-4 py-2 rounded-2xl font-black text-sm inline-flex items-center gap-2",
            canWrite && !busy
              ? "bg-slate-900 text-white hover:bg-slate-800"
              : "bg-slate-200 text-slate-500 cursor-not-allowed"
          )}
        >
          <Check size={16} /> Guardar
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="text-xs font-black text-slate-700">Hero title (opcional)</label>
          <input
            value={form.hero_title}
            onChange={(e) => setForm((p) => ({ ...p, hero_title: e.target.value }))}
            className="mt-1 w-full px-4 py-3 rounded-2xl border border-slate-200 bg-white font-semibold text-slate-900 outline-none"
            placeholder="Merch Oficial SCORE"
          />
        </div>

        <div>
          <label className="text-xs font-black text-slate-700">Hero image URL (opcional)</label>
          <input
            value={form.hero_image}
            onChange={(e) => setForm((p) => ({ ...p, hero_image: e.target.value }))}
            className="mt-1 w-full px-4 py-3 rounded-2xl border border-slate-200 bg-white font-semibold text-slate-900 outline-none"
            placeholder="https://.../hero.webp"
          />
        </div>

        <div className="md:col-span-2 rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <div className="flex items-center justify-between gap-3">
            <div className="text-sm font-black text-slate-900">Promoción (Promo Bar)</div>
            <HelpTip
              title="Promo Bar"
              text="Si activas esto, Score Store muestra una barra arriba con tu promo. Es ideal para temporadas o anuncios."
            />
          </div>

          <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-3">
            <label className="flex items-center gap-2 text-sm font-black text-slate-800">
              <input
                type="checkbox"
                checked={!!form.promo_active}
                onChange={(e) => setForm((p) => ({ ...p, promo_active: e.target.checked }))}
                className="w-4 h-4"
              />
              Promo activa
            </label>

            <input
              value={form.promo_text}
              onChange={(e) => setForm((p) => ({ ...p, promo_text: e.target.value }))}
              className="px-4 py-3 rounded-2xl border border-slate-200 bg-white font-semibold text-slate-900 outline-none md:col-span-2"
              placeholder="Ej: ENVÍO GRATIS en compras arriba de $999"
            />
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <div className="flex items-center justify-between gap-3">
            <div className="text-sm font-black text-slate-900">Mantenimiento</div>
            <HelpTip
              title="Mantenimiento"
              text="Si lo activas, Score Store bloquea el botón de pago (checkout) para evitar ventas durante cambios."
            />
          </div>

          <label className="mt-3 flex items-center gap-2 text-sm font-black text-slate-800">
            <input
              type="checkbox"
              checked={!!form.maintenance_mode}
              onChange={(e) => setForm((p) => ({ ...p, maintenance_mode: e.target.checked }))}
              className="w-4 h-4"
            />
            Tienda en mantenimiento
          </label>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <div className="flex items-center justify-between gap-3">
            <div className="text-sm font-black text-slate-900">Pixel Meta (opcional)</div>
            <HelpTip
              title="Pixel"
              text="Pon el ID del pixel. Se activa solo si el usuario acepta cookies en Score Store (cumplimiento)."
            />
          </div>

          <input
            value={form.pixel_id}
            onChange={(e) => setForm((p) => ({ ...p, pixel_id: e.target.value }))}
            className="mt-3 w-full px-4 py-3 rounded-2xl border border-slate-200 bg-white font-semibold text-slate-900 outline-none"
            placeholder="Ej: 1234567890"
          />
        </div>

        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <div className="flex items-center justify-between gap-3">
            <div className="text-sm font-black text-slate-900">Temporada (season_key)</div>
            <HelpTip
              title="Temporada"
              text="No cambia drásticamente el diseño. Sirve para activar detalles suaves (colores/partículas) desde Score Store."
            />
          </div>

          <input
            value={form.season_key}
            onChange={(e) => setForm((p) => ({ ...p, season_key: e.target.value }))}
            className="mt-3 w-full px-4 py-3 rounded-2xl border border-slate-200 bg-white font-semibold text-slate-900 outline-none"
            placeholder="default | navidad | verano | ..."
          />
        </div>

        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <div className="flex items-center justify-between gap-3">
            <div className="text-sm font-black text-slate-900">Correo de contacto</div>
            <HelpTip
              title="Contacto"
              text="Este correo se usa para soporte y comunicación. Score Store puede leerlo como contacto principal."
            />
          </div>

          <input
            value={form.contact_email}
            onChange={(e) => setForm((p) => ({ ...p, contact_email: e.target.value }))}
            className="mt-3 w-full px-4 py-3 rounded-2xl border border-slate-200 bg-white font-semibold text-slate-900 outline-none"
            placeholder="ventas@empresa.com"
          />
        </div>

        <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-1">
            <div className="flex items-center justify-between gap-3">
              <label className="text-xs font-black text-slate-700">theme (JSON)</label>
              <HelpTip
                title="theme"
                text="Control suave de colores / efectos. Ej: {\"accent\":\"#E10600\",\"particles\":true}"
                align="left"
              />
            </div>
            <textarea
              value={form.theme_json}
              onChange={(e) => setForm((p) => ({ ...p, theme_json: e.target.value }))}
              rows={10}
              className="mt-1 w-full px-4 py-3 rounded-2xl border border-slate-200 bg-white font-mono text-xs font-semibold text-slate-900 outline-none"
            />
          </div>

          <div className="md:col-span-1">
            <div className="flex items-center justify-between gap-3">
              <label className="text-xs font-black text-slate-700">home (JSON)</label>
              <HelpTip
                title="home"
                text="Campos de contenido (copys/strings). Score Store puede leerlos si habilitas render dinámico."
                align="left"
              />
            </div>
            <textarea
              value={form.home_json}
              onChange={(e) => setForm((p) => ({ ...p, home_json: e.target.value }))}
              rows={10}
              className="mt-1 w-full px-4 py-3 rounded-2xl border border-slate-200 bg-white font-mono text-xs font-semibold text-slate-900 outline-none"
            />
          </div>

          <div className="md:col-span-1">
            <div className="flex items-center justify-between gap-3">
              <label className="text-xs font-black text-slate-700">socials (JSON)</label>
              <HelpTip
                title="socials"
                text="Redes sociales (links). Score Store puede leerlos para footer / UI."
                align="left"
              />
            </div>
            <textarea
              value={form.socials_json}
              onChange={(e) => setForm((p) => ({ ...p, socials_json: e.target.value }))}
              rows={10}
              className="mt-1 w-full px-4 py-3 rounded-2xl border border-slate-200 bg-white font-mono text-xs font-semibold text-slate-900 outline-none"
            />
          </div>
        </div>

        <div className="md:col-span-2 text-[11px] font-semibold text-slate-500">
          Guardar aquí actualiza Score Store “en vivo” porque Score Store lee <code>/.netlify/functions/site_settings</code>.
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   OpsView — placeholder mínimo (seguro)
   ========================================================= */

function OpsView({ orgId, token, toast }) {
  return (
    <div className="rounded-[2rem] border border-slate-200 bg-white shadow-sm p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">
            Operación
          </p>
          <h4 className="text-lg font-black text-slate-900">Operación y logística</h4>
          <p className="text-sm font-semibold text-slate-600">
            Este módulo se puede expandir con tracking en vivo (Stripe/Envía) por pedido.
          </p>
        </div>

        <HelpTip
          title="¿Qué puedes ver aquí?"
          text="Tracking por pedido, guías, estatus de fulfillment, alertas, devoluciones. Lo activamos cuando tu Score Store ya esté corriendo 100%."
        />
      </div>

      <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4">
        <p className="text-sm font-semibold text-slate-700">
          Org: <span className="font-black">{orgId}</span>
        </p>
        <p className="text-xs font-semibold text-slate-500 mt-2">
          Para ver tracking en vivo, se requiere conectar endpoints de Envía API directos (según tu cuenta) y asociarlos a tus órdenes.
        </p>
      </div>
    </div>
  );
}