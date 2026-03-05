"use client";

/**
 * =========================================================
 * UnicOs — Admin App (Score Store + Único Uniformes)
 * page.js — FULL FILE (Aligned to repo helpers + real dashboards)
 *
 * - Stripe dashboard real: /api/stripe/summary (AUTH real)
 * - Envía ops-real dashboard: /api/envia/summary (AUTH real, from shipping_labels.raw)
 * - KPI "Ganancia": muestra SOLO 70% del neto real (política interna, sin decirlo en UI)
 * - Help tips (❓) para dueños no-tech
 * =========================================================
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import clsx from "clsx";
import {
  Activity,
  BadgeCheck,
  CreditCard,
  ExternalLink,
  HelpCircle,
  Lock,
  Package,
  PiggyBank,
  RefreshCcw,
  Search,
  Settings,
  Shield,
  ShoppingCart,
  Sparkles,
  Truck,
  Wallet,
  X,
  Check,
} from "lucide-react";

import { createClient } from "@supabase/supabase-js";

/* =========================================================
   Supabase client (browser) — aligned to typical UnicOs setup
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

const safeStr = (v) => String(v ?? "").trim();

const humanDate = (iso) => {
  try {
    return iso ? new Date(iso).toLocaleString("es-MX") : "—";
  } catch {
    return "—";
  }
};

/* =========================================================
   HelpTip (❓)
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
            "absolute z-[9999] mt-2 w-[360px] max-w-[88vw] rounded-2xl border border-slate-200 bg-white shadow-xl p-4",
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

function MiniKPI({ icon, label, value, note, helpTitle, helpText }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <div className="text-[11px] font-black uppercase tracking-widest text-slate-500">
              {label}
            </div>
            {helpText ? <HelpTip title={helpTitle || label} text={helpText} /> : null}
          </div>
        </div>
        <div className="text-slate-700">{icon}</div>
      </div>
      <div className="mt-2 text-xl font-black text-slate-900">{value}</div>
      {note ? <div className="mt-1 text-xs font-semibold text-slate-500">{note}</div> : null}
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
   Roles (frontend gating)
   ========================================================= */
const ROLE_PERMS = {
  owner: { view_finance: true, write: true, marketing: true },
  admin: { view_finance: true, write: true, marketing: true },
  marketing: { view_finance: true, write: false, marketing: true },
  support: { view_finance: false, write: false, marketing: false },
  viewer: { view_finance: false, write: false, marketing: false },
};

const hasPermLocal = (role, key) => {
  const r = String(role || "viewer");
  return !!ROLE_PERMS[r]?.[key];
};
/* =========================================================
   App Shell
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

        <span className="hidden sm:inline-flex items-center gap-2 px-3 py-2 rounded-2xl border border-slate-200 bg-white text-sm font-black text-slate-800">
          <Shield size={16} className="text-sky-600" />
          Acceso por roles
        </span>
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

  const canWrite = useMemo(() => hasPermLocal(admin?.role, "write"), [admin]);
  const canFinance = useMemo(() => hasPermLocal(admin?.role, "view_finance"), [admin]);

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

      // Identidad real via tu API interna (/api/me) — patrón típico de UnicOs
      const whoRes = await fetch("/api/me", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const who = await whoRes.json().catch(() => ({}));
      if (!whoRes.ok || !who?.ok) throw new Error(who?.error || "No autorizado.");

      const email = safeStr(who.email || "");
      if (email) setSessionEmail(email);

      let targetOrg = storedOrg;
      if (!targetOrg && who?.organization_id) targetOrg = String(who.organization_id);

      if (!targetOrg) {
        // fallback: por email
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
      <HeaderBar orgName={orgName} role={admin.role} email={sessionEmail} onLogout={logout} />

      <NavTabs tab={tab} setTab={setTab} canWrite={canWrite} canFinance={canFinance} />

      {tab === "dashboard" ? <DashboardView orgId={orgId} token={token} toast={toast} /> : null}
      {tab === "products" ? <ProductsView orgId={orgId} canWrite={canWrite} toast={toast} /> : null}
      {tab === "site" ? <SiteSettingsView orgId={orgId} canWrite={canWrite} toast={toast} /> : null}
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
          <p className="text-sm font-semibold text-slate-600 mt-1">Pega el token de acceso de UnicOs.</p>
        </div>

        <HelpTip
          title="¿Qué es el token?"
          text="Es una llave temporal para acceder al panel. Si no lo tienes, pídeselo al admin técnico."
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
   Dashboard (Stripe + Envía) + 70% rule
   ========================================================= */
function DashboardView({ orgId, token, toast }) {
  const [busy, setBusy] = useState(false);

  const [state, setState] = useState({
    gross_orders_mxn: 0,
    stripe_fee_mxn: 0,
    envia_cost_mxn: 0,
    net_real_mxn: 0,
    net_shown_mxn: 0,
    refunds_mxn: 0,
    disputes: 0,
    stripe: null,
    envia: null,
    updated_at: null,
  });

  const load = useCallback(async () => {
    if (!supabase) {
      toast?.({ type: "bad", text: "Supabase no configurado (ENV)." });
      return;
    }

    setBusy(true);
    try {
      // 1) Ventas reales por orders (tu tienda)
      const { data: orders, error: ordersErr } = await supabase
        .from("orders")
        .select("id, amount_total_mxn, status, created_at")
        .eq("organization_id", orgId)
        .in("status", ["paid", "fulfilled"])
        .order("created_at", { ascending: false })
        .limit(800);

      if (ordersErr) throw ordersErr;

      const grossOrders = (orders || []).reduce((a, o) => a + num(o.amount_total_mxn), 0);

      // 2) Stripe fees reales (tu endpoint ya existente en repo)
      let stripeFee = 0;
      try {
        const r = await fetch(`/api/stripe/fees?org_id=${encodeURIComponent(orgId)}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const j = await r.json().catch(() => ({}));
        if (r.ok && j?.ok) stripeFee = num(j.fees_mxn);
      } catch {}

      // 3) Stripe summary real (balance/payouts/charges)
      let stripe = null;
      let refunds = 0;
      let disputes = 0;
      try {
        const r = await fetch(`/api/stripe/summary?org_id=${encodeURIComponent(orgId)}&days=30`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const j = await r.json().catch(() => ({}));
        if (r.ok && j?.ok) {
          stripe = j;
          refunds = num(j?.kpi?.refunded_mxn);
          disputes = num(j?.kpi?.disputes);
        }
      } catch {}

      // 4) Envía summary real (operación: shipping_labels.raw)
      let envia = null;
      let enviaCost = 0;
      try {
        const r = await fetch(`/api/envia/summary?org_id=${encodeURIComponent(orgId)}&days=30`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const j = await r.json().catch(() => ({}));
        if (r.ok && j?.ok) {
          envia = j;
          enviaCost = num(j?.kpi?.envia_cost_mxn);
        }
      } catch {}

      // Neto real operativo
      const netReal = Math.max(0, grossOrders - stripeFee - enviaCost);

      // ✅ REGLA EMPRESA: mostrar solo 70% como “total”
      const netShown = Math.max(0, netReal * 0.7);

      setState({
        gross_orders_mxn: grossOrders,
        stripe_fee_mxn: stripeFee,
        envia_cost_mxn: enviaCost,
        net_real_mxn: netReal,
        net_shown_mxn: netShown,
        refunds_mxn: refunds,
        disputes,
        stripe,
        envia,
        updated_at: new Date().toISOString(),
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
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
                <Sparkles size={14} className="text-sky-600" /> Ganancia Score Store
              </p>
              <HelpTip
                title="¿Qué significa este total?"
                text="Este total ya descuenta costos reales (Stripe + Envía). Por política interna se muestra un total conservador para operación."
              />
            </div>

            <h3 className="mt-2 text-3xl md:text-4xl font-black text-slate-900 tracking-tight">
              {moneyMXN(state.net_shown_mxn)}
            </h3>

            <p className="text-sm font-semibold text-slate-600 mt-1">
              Basado en ventas pagadas + comisiones reales.
            </p>

            <p className="text-xs font-semibold text-slate-500 mt-2">
              Última actualización: {state.updated_at ? humanDate(state.updated_at) : "—"}
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
          <MiniKPI
            label="Ventas (bruto)"
            value={moneyMXN(state.gross_orders_mxn)}
            icon={<Wallet size={14} />}
            note="Orders pagadas"
            helpText="Suma de pedidos con status paid/fulfilled."
          />
          <MiniKPI
            label="Comisión Stripe"
            value={moneyMXN(state.stripe_fee_mxn)}
            icon={<CreditCard size={14} />}
            note="Fees reales"
            helpText="Se toma de tu endpoint /api/stripe/fees (balance_transaction)."
          />
          <MiniKPI
            label="Costo Envía"
            value={moneyMXN(state.envia_cost_mxn)}
            icon={<Truck size={14} />}
            note="Guías reales"
            helpText="Se calcula desde shipping_labels.raw (lo que realmente pagaste)."
          />
          <MiniKPI
            label="Neto real"
            value={moneyMXN(state.net_real_mxn)}
            icon={<PiggyBank size={14} />}
            note="Interno"
            helpText="Bruto - Stripe fees - Envía."
          />
        </div>
      </div>

      {/* Stripe Panel */}
      <div className="rounded-[2rem] border border-slate-200 bg-white shadow-sm p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                Stripe (panel real)
              </p>
              <HelpTip
                title="Stripe (panel real)"
                text="Este bloque consulta Stripe en vivo: balance, payouts y cargos recientes."
              />
            </div>
            <h4 className="text-lg font-black text-slate-900 mt-1">Balance + Payouts</h4>
            <p className="text-sm font-semibold text-slate-600">
              Reembolsos (30d): {moneyMXN(state.refunds_mxn)} · Disputas: {state.disputes}
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
              {(state.stripe?.stripe_dashboard?.balance_available || [])
                .map((x) => `${String(x.currency || "").toUpperCase()}: ${(num(x.amount || 0) / 100).toFixed(2)}`)
                .join("\n") || "—"}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="text-xs font-black uppercase tracking-widest text-slate-500">
              Payouts recientes
            </div>
            <div className="mt-2 space-y-2">
              {(state.stripe?.stripe_dashboard?.payouts || []).slice(0, 6).map((p) => (
                <div key={p.id} className="flex items-center justify-between text-sm font-semibold">
                  <span className="text-slate-800">
                    {new Date((p.created || 0) * 1000).toLocaleDateString("es-MX")} · {String(p.status || "—")}
                  </span>
                  <span className="text-slate-900 font-black">
                    {(num(p.amount || 0) / 100).toFixed(2)} {String(p.currency || "").toUpperCase()}
                  </span>
                </div>
              ))}
              {!(state.stripe?.stripe_dashboard?.payouts || []).length ? (
                <div className="text-sm font-semibold text-slate-500">—</div>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      {/* Envía Panel */}
      <div className="rounded-[2rem] border border-slate-200 bg-white shadow-sm p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                Envía.com (operación real)
              </p>
              <HelpTip
                title="Envía (operación real)"
                text="Esto no inventa tracking: toma el costo real de guías registradas por tu operación."
              />
            </div>
            <h4 className="text-lg font-black text-slate-900 mt-1">Guías y costos</h4>
            <p className="text-sm font-semibold text-slate-600">
              Costo total 30d: {moneyMXN(num(state.envia?.kpi?.envia_cost_mxn || state.envia_cost_mxn))}
            </p>
          </div>

          <span className="px-4 py-2 rounded-2xl border border-slate-200 bg-white font-black text-sm inline-flex items-center gap-2">
            <Truck size={16} /> {num(state.envia?.scope?.labels_count || 0)} guías
          </span>
        </div>

        <div className="mt-5 overflow-x-auto">
          <table className="w-full min-w-[900px]">
            <thead>
              <tr className="text-left text-[10px] font-black uppercase tracking-widest text-slate-500">
                <th className="py-2 pr-3">Fecha</th>
                <th className="py-2 pr-3">Carrier</th>
                <th className="py-2 pr-3">Tracking</th>
                <th className="py-2 pr-3">Costo</th>
              </tr>
            </thead>
            <tbody>
              {(state.envia?.labels || []).slice(0, 14).map((r) => (
                <tr key={r.id} className="border-t border-slate-200">
                  <td className="py-3 pr-3 text-sm font-semibold text-slate-800">{humanDate(r.created_at)}</td>
                  <td className="py-3 pr-3 text-sm font-black text-slate-900">{r.carrier || "—"}</td>
                  <td className="py-3 pr-3 text-sm font-semibold text-slate-800">{r.tracking || "—"}</td>
                  <td className="py-3 pr-3 text-sm font-black text-slate-900">{moneyMXN(num(r.total_amount_mxn))}</td>
                </tr>
              ))}
              {!(state.envia?.labels || []).length ? (
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
          Si quieres el “clon exacto” del panel Envía (tracking live por guía), se agrega un endpoint directo a Envía API
          usando tu token/tenant real. Esto ya es 100% real por operación (costos).
        </p>
      </div>
    </div>
  );
}

/* =========================================================
   Products (simple list + edit) — usa tu tabla products
   ========================================================= */
function ProductsView({ orgId, canWrite, toast }) {
  const [busy, setBusy] = useState(false);
  const [rows, setRows] = useState([]);
  const [q, setQ] = useState("");

  const load = useCallback(async () => {
    if (!supabase) return;
    setBusy(true);
    try {
      const { data, error } = await supabase
        .from("products")
        .select("id,name,sku,price_mxn,stock,section_id,sub_section,rank,image_url,is_active,deleted_at")
        .eq("organization_id", orgId)
        .is("deleted_at", null)
        .order("rank", { ascending: true })
        .limit(800);

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
    return (rows || []).filter((r) =>
      `${r?.name || ""} ${r?.sku || ""} ${r?.section_id || ""} ${r?.sub_section || ""}`
        .toLowerCase()
        .includes(s)
    );
  }, [rows, q]);

  return (
    <div className="rounded-[2rem] border border-slate-200 bg-white shadow-sm p-6">
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">Catálogo</p>
            <HelpTip
              title="¿Para qué sirve Productos?"
              text="Aquí controlas lo que se ve en la tienda: nombre, precio, stock e imagen. La tienda lee estos datos."
            />
          </div>
          <h4 className="text-lg font-black text-slate-900">Productos (en vivo)</h4>
          <p className="text-sm font-semibold text-slate-600">
            Imágenes cuadradas con fondo blanco se ven pro aquí: marco, padding y object-contain.
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
            disabled={!canWrite}
            className={clsx(
              "px-4 py-2 rounded-2xl font-black text-sm flex items-center gap-2",
              canWrite ? "bg-slate-900 text-white hover:bg-slate-800" : "bg-slate-200 text-slate-500 cursor-not-allowed"
            )}
            onClick={() => toast?.({ type: "bad", text: "Edición avanzada: si quieres alta/baja/imagen upload, lo activamos en el módulo completo." })}
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
            </tr>
          </thead>
          <tbody>
            {(filtered || []).slice(0, 120).map((r) => (
              <tr key={r.id} className="border-t border-slate-200">
                <td className="py-3 pr-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-11 h-11 rounded-2xl border border-slate-200 bg-white overflow-hidden flex items-center justify-center shadow-sm p-1">
                      {r?.image_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={r.image_url} alt={r.name || "Producto"} className="w-full h-full object-contain bg-white" />
                      ) : (
                        <span className="text-xs font-black text-slate-400">IMG</span>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-black text-slate-900 truncate">{r?.name || "—"}</p>
                      <p className="text-xs font-semibold text-slate-500 truncate">Rank: {String(r?.rank ?? "—")}</p>
                    </div>
                  </div>
                </td>
                <td className="py-3 pr-3 text-sm font-black text-slate-900">{r?.sku || "—"}</td>
                <td className="py-3 pr-3 text-sm font-black text-slate-900">{r?.section_id || "—"}</td>
                <td className="py-3 pr-3 text-sm font-black text-slate-900">{r?.sub_section || "—"}</td>
                <td className="py-3 pr-3 text-sm font-black text-slate-900">{moneyMXN(r?.price_mxn || 0)}</td>
                <td className="py-3 pr-3 text-sm font-black text-slate-900">{Number(r?.stock ?? 0)}</td>
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
              </tr>
            ))}
            {!filtered?.length ? (
              <tr>
                <td colSpan={7} className="py-10">
                  <p className="text-sm font-semibold text-slate-500">Sin productos.</p>
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* =========================================================
   Site Settings (simple + real)
   ========================================================= */
function SiteSettingsView({ orgId, canWrite, toast }) {
  const [busy, setBusy] = useState(false);
  const [row, setRow] = useState(null);

  const [form, setForm] = useState({
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
    if (!supabase) return;
    setBusy(true);
    try {
      const { data, error } = await supabase
        .from("site_settings")
        .select("id, org_id, organization_id, promo_active, promo_text, pixel_id, maintenance_mode, season_key, theme, home, socials, contact_email, updated_at, created_at")
        .or(`org_id.eq.${orgId},organization_id.eq.${orgId}`)
        .order("updated_at", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      setRow(data || null);

      setForm({
        promo_active: !!data?.promo_active,
        promo_text: data?.promo_text || "",
        pixel_id: data?.pixel_id || "",
        maintenance_mode: !!data?.maintenance_mode,
        season_key: data?.season_key || "default",
        theme_json: JSON.stringify(data?.theme ?? {}, null, 2),
        home_json: JSON.stringify(data?.home ?? {}, null, 2),
        socials_json: JSON.stringify(data?.socials ?? {}, null, 2),
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
    if (!canWrite) return toast?.({ type: "bad", text: "No tienes permisos para editar Site Settings." });
    setBusy(true);
    try {
      const payload = {
        org_id: orgId,
        organization_id: orgId,
        promo_active: !!form.promo_active,
        promo_text: String(form.promo_text || "").trim() || null,
        pixel_id: String(form.pixel_id || "").trim() || null,
        maintenance_mode: !!form.maintenance_mode,
        season_key: String(form.season_key || "default").trim() || "default",
        theme: JSON.parse(form.theme_json || "{}"),
        home: JSON.parse(form.home_json || "{}"),
        socials: JSON.parse(form.socials_json || "{}"),
        contact_email: String(form.contact_email || "").trim() || null,
        updated_at: new Date().toISOString(),
      };

      if (row?.id) {
        const { error } = await supabase.from("site_settings").update(payload).eq("id", row.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("site_settings").insert({ ...payload, created_at: new Date().toISOString() });
        if (error) throw error;
      }

      toast?.({ type: "ok", text: "Site Settings guardado. Score Store lo leerá en vivo." });
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
              text="Controla promo bar, pixel, mantenimiento y temporada. Score Store lo consulta desde su function site_settings."
            />
          </div>
          <h4 className="text-lg font-black text-slate-900">Site Settings (en vivo)</h4>
          <p className="text-sm font-semibold text-slate-600">
            Guardar aquí actualiza lo que la tienda consume.
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
        <div className="md:col-span-2 rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <div className="flex items-center justify-between gap-3">
            <div className="text-sm font-black text-slate-900">Promoción (Promo Bar)</div>
            <HelpTip title="Promo Bar" text="Activa una barra superior en Score Store con un texto corto de promo." />
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
            <HelpTip title="Mantenimiento" text="Si lo activas, Score Store debería bloquear checkout para evitar ventas." />
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
            <HelpTip title="Pixel" text="ID del pixel. Se recomienda que se active solo tras aceptar cookies." />
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
            <HelpTip title="Temporada" text="Sirve para activar detalles suaves (no cambios drásticos) en Score Store." />
          </div>

          <input
            value={form.season_key}
            onChange={(e) => setForm((p) => ({ ...p, season_key: e.target.value }))}
            className="mt-3 w-full px-4 py-3 rounded-2xl border border-slate-200 bg-white font-semibold text-slate-900 outline-none"
            placeholder="default | navidad | verano | ..."
          />
        </div>

        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 md:col-span-2">
          <div className="flex items-center justify-between gap-3">
            <div className="text-sm font-black text-slate-900">JSONs (theme/home/socials)</div>
            <HelpTip
              title="JSONs"
              text="Opcionales. Se guardan tal cual. Score Store puede consumirlos si lo habilitas en su frontend."
              align="left"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-3">
            <textarea
              value={form.theme_json}
              onChange={(e) => setForm((p) => ({ ...p, theme_json: e.target.value }))}
              rows={8}
              className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-white font-mono text-xs font-semibold text-slate-900 outline-none"
              placeholder='theme JSON'
            />
            <textarea
              value={form.home_json}
              onChange={(e) => setForm((p) => ({ ...p, home_json: e.target.value }))}
              rows={8}
              className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-white font-mono text-xs font-semibold text-slate-900 outline-none"
              placeholder='home JSON'
            />
            <textarea
              value={form.socials_json}
              onChange={(e) => setForm((p) => ({ ...p, socials_json: e.target.value }))}
              rows={8}
              className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-white font-mono text-xs font-semibold text-slate-900 outline-none"
              placeholder='socials JSON'
            />
          </div>
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   Ops (placeholder seguro)
   ========================================================= */
function OpsView({ orgId }) {
  return (
    <div className="rounded-[2rem] border border-slate-200 bg-white shadow-sm p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">Operación</p>
          <h4 className="text-lg font-black text-slate-900">Operación y logística</h4>
          <p className="text-sm font-semibold text-slate-600">
            Aquí se puede expandir tracking por pedido (Stripe session + guía Envía).
          </p>
        </div>
        <HelpTip
          title="¿Qué se puede ver aquí?"
          text="Tracking por pedido, guías, estatus de fulfillment, devoluciones. Se activa cuando tengas webhooks y tablas listas."
        />
      </div>

      <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4">
        <p className="text-sm font-semibold text-slate-700">
          Org: <span className="font-black">{orgId}</span>
        </p>
      </div>
    </div>
  );
}