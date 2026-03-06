"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import clsx from "clsx";
import Image from "next/image";
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
  Sparkles,
  Truck,
  Wallet,
  X,
  Check,
  BarChart3,
} from "lucide-react";
import { createClient } from "@supabase/supabase-js";

/* =========================================================
   Supabase client
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

const ROLE_PERMS = {
  owner: { view_finance: true, write: true },
  admin: { view_finance: true, write: true },
  marketing: { view_finance: true, write: false },
  support: { view_finance: false, write: false },
  viewer: { view_finance: false, write: false },
};

const hasPermLocal = (role, key) => {
  const r = String(role || "viewer");
  return !!ROLE_PERMS[r]?.[key];
};

/* =========================================================
   UI atoms
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
        className="inline-flex items-center justify-center w-7 h-7 rounded-full border border-sky-100 bg-white/90 hover:bg-white shadow-sm"
        aria-label="Ayuda"
        title="¿Qué significa esto?"
      >
        <HelpCircle size={16} className="text-sky-700" />
      </button>

      {open ? (
        <div
          className={[
            "absolute z-[9999] mt-2 w-[340px] max-w-[85vw] rounded-2xl border border-sky-100 bg-white shadow-2xl p-4",
            align === "left" ? "left-0" : "right-0",
          ].join(" ")}
          role="dialog"
          aria-label={title}
        >
          <div className="text-[11px] font-black uppercase tracking-[0.18em] text-sky-700">
            {title}
          </div>
          <div className="mt-2 text-sm font-semibold text-slate-700 leading-relaxed">
            {text || "—"}
          </div>
        </div>
      ) : null}
    </span>
  );
}

function MiniKPI({ icon, label, value, note, helpTitle, helpText }) {
  return (
    <div className="rounded-3xl border border-sky-100 bg-white/95 p-4 shadow-[0_12px_35px_rgba(15,23,42,0.06)]">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <div className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-500">
              {label}
            </div>
            {helpText ? <HelpTip title={helpTitle || label} text={helpText} /> : null}
          </div>
        </div>
        <div className="text-sky-700">{icon}</div>
      </div>
      <div className="mt-3 text-xl font-black text-slate-900">{value}</div>
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
   Main
   ========================================================= */
export default function Page() {
  const [toast, setToast] = useState(null);
  const showToast = useCallback((t) => setToast(t), []);
  const clearToast = useCallback(() => setToast(null), []);

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,#e0f2fe_0%,#f8fafc_40%,#f8fafc_100%)]">
      <TopShell />
      <div className="max-w-7xl mx-auto px-4 py-6">
        <AppRoot toast={showToast} />
      </div>
      <Toast toast={toast} clear={clearToast} />
    </div>
  );
}

function TopShell() {
  return (
    <div className="sticky top-0 z-50 border-b border-sky-100 bg-white/85 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className="relative w-11 h-11 rounded-2xl overflow-hidden border border-sky-100 bg-white shadow-sm">
            <Image
              src="/assets/logo-unicos.png"
              alt="UnicOs"
              fill
              className="object-contain p-1.5"
              sizes="44px"
              priority
            />
          </div>

          <div className="min-w-0">
            <div className="text-[11px] font-black uppercase tracking-[0.18em] text-sky-700">
              UnicOs Admin
            </div>
            <div className="text-lg font-black text-slate-900 truncate">
              Control comercial y operativo
            </div>
          </div>
        </div>

        <span className="hidden md:inline-flex items-center gap-2 px-3 py-2 rounded-2xl border border-sky-100 bg-white text-sm font-black text-slate-800 shadow-sm">
          <Shield size={16} className="text-sky-700" />
          Panel protegido
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
      toast?.({ type: "bad", text: "Supabase no está configurado." });
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

      const whoRes = await fetch("/api/me", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const who = await whoRes.json().catch(() => ({}));
      if (!whoRes.ok || !who?.ok) throw new Error(who?.error || "No autorizado.");

      const email = safeStr(who.email || "");
      if (email) setSessionEmail(email);

      let targetOrg = storedOrg || String(who?.organization_id || "").trim();

      if (!targetOrg) {
        const { data: rows, error } = await supabase
          .from("admin_users")
          .select("organization_id, org_id, role, is_active, email")
          .eq("is_active", true)
          .ilike("email", email)
          .order("created_at", { ascending: true })
          .limit(1);

        if (error) throw error;
        const row = rows?.[0];
        targetOrg = row?.organization_id || row?.org_id || "";
        if (!targetOrg) throw new Error("No encontramos una organización ligada a este acceso.");
      }

      setOrgId(targetOrg);
      try {
        localStorage.setItem("unicos_org_id", targetOrg);
      } catch {}

      let adminRow = null;

      const q1 = await supabase
        .from("admin_users")
        .select("id, role, is_active, email, user_id, organization_id, org_id")
        .eq("organization_id", targetOrg)
        .eq("is_active", true)
        .or(`email.ilike.${email},user_id.eq.${who.id}`)
        .limit(1)
        .maybeSingle();

      if (!q1.error && q1.data) adminRow = q1.data;

      if (!adminRow) {
        const q2 = await supabase
          .from("admin_users")
          .select("id, role, is_active, email, user_id, organization_id, org_id")
          .eq("org_id", targetOrg)
          .eq("is_active", true)
          .or(`email.ilike.${email},user_id.eq.${who.id}`)
          .limit(1)
          .maybeSingle();

        if (!q2.error && q2.data) adminRow = q2.data;
      }

      if (!adminRow) throw new Error("Este acceso no tiene permisos para entrar a UnicOs.");

      setAdmin(adminRow);

      const { data: org, error: orgErr } = await supabase
        .from("organizations")
        .select("id,name")
        .eq("id", targetOrg)
        .limit(1)
        .maybeSingle();

      if (!orgErr && org?.name) setOrgName(org.name);

      toast?.({ type: "ok", text: "Panel listo." });
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
    if (!t) return toast?.({ type: "bad", text: "Pega primero tu token de acceso." });
    try {
      localStorage.setItem("unicos_token", t);
      if (sessionEmail) localStorage.setItem("unicos_email", sessionEmail);
    } catch {}
    toast?.({ type: "ok", text: "Acceso guardado." });
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
      <div className="rounded-[2rem] border border-sky-100 bg-white/95 shadow-[0_20px_60px_rgba(15,23,42,0.08)] p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.16em] text-sky-700 mb-1">
              Preparando panel
            </p>
            <h3 className="text-xl font-black text-slate-900">Estamos cargando tu espacio de control</h3>
            <p className="text-sm font-semibold text-slate-600 mt-1">
              Verificando acceso, permisos y datos comerciales.
            </p>
          </div>
          <button
            onClick={resolveOrg}
            className="px-4 py-2 rounded-2xl border border-sky-100 bg-white hover:bg-sky-50 font-black text-sm flex items-center gap-2"
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
      {tab === "products" ? <ProductsView orgId={orgId} toast={toast} /> : null}
      {tab === "site" ? <SiteSettingsView orgId={orgId} canWrite={canWrite} toast={toast} /> : null}
      {tab === "ops" ? <OpsView orgId={orgId} /> : null}
    </div>
  );
}

function HeaderBar({ orgName, role, email, onLogout }) {
  return (
    <div className="rounded-[2rem] border border-sky-100 bg-white/95 shadow-[0_20px_60px_rgba(15,23,42,0.08)] p-6">
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[11px] font-black uppercase tracking-[0.16em] text-sky-700 mb-1">
            Centro de control
          </p>
          <h2 className="text-2xl md:text-3xl font-black text-slate-900 truncate">
            {orgName}
          </h2>
          <p className="text-sm font-semibold text-slate-600 mt-2">
            Administra ventas, catálogo, configuración comercial y operación desde un solo lugar.
          </p>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-2 px-3 py-2 rounded-2xl border border-sky-100 bg-sky-50 text-sm font-black text-sky-900">
              <BadgeCheck size={16} className="text-sky-700" />
              Rol: {String(role || "viewer")}
            </span>
            <span className="inline-flex items-center gap-2 px-3 py-2 rounded-2xl border border-slate-200 bg-white text-sm font-semibold text-slate-700">
              <Lock size={16} className="text-slate-500" />
              {email || "—"}
            </span>
          </div>
        </div>

        <button
          onClick={onLogout}
          className="px-4 py-2 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 font-black text-sm"
        >
          Salir
        </button>
      </div>
    </div>
  );
}

function NavTabs({ tab, setTab, canWrite, canFinance }) {
  const tabs = [
    { id: "dashboard", label: "Resumen", icon: <BarChart3 size={16} /> },
    { id: "products", label: "Catálogo", icon: <Package size={16} /> },
    { id: "site", label: "Configuración", icon: <Settings size={16} />, gated: !canWrite },
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
            "px-4 py-2.5 rounded-2xl border font-black text-sm inline-flex items-center gap-2 transition",
            tab === t.id
              ? "border-sky-600 bg-sky-600 text-white shadow-[0_12px_30px_rgba(2,132,199,0.25)]"
              : "border-sky-100 bg-white hover:bg-sky-50 text-slate-900",
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
    <div className="max-w-5xl mx-auto">
      <div className="rounded-[2.2rem] border border-sky-100 bg-white/95 shadow-[0_25px_70px_rgba(15,23,42,0.08)] overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-[1.08fr_0.92fr]">
          <div className="relative bg-[linear-gradient(135deg,#082f49_0%,#0369a1_45%,#14b8a6_100%)] p-8 md:p-10 text-white">
            <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_top_right,white_0%,transparent_45%)]" />
            <div className="relative z-10">
              <div className="flex items-center gap-3">
                <div className="relative w-14 h-14 rounded-2xl overflow-hidden bg-white/10 border border-white/15 backdrop-blur">
                  <Image
                    src="/assets/logo-unicos.png"
                    alt="UnicOs"
                    fill
                    className="object-contain p-1.5"
                    sizes="56px"
                    priority
                  />
                </div>
                <div>
                  <div className="text-[11px] font-black uppercase tracking-[0.22em] text-sky-100">
                    UnicOs Admin
                  </div>
                  <div className="text-2xl font-black">Panel maestro comercial</div>
                </div>
              </div>

              <h2 className="mt-8 text-3xl md:text-4xl font-black leading-tight">
                Controla Score Store y tu operación con una vista más clara, rápida y profesional.
              </h2>

              <p className="mt-4 text-sm md:text-base font-semibold text-sky-50/95 max-w-xl leading-relaxed">
                Revisa ventas, costos, catálogo y configuración desde un solo panel. Todo con una interfaz más clara, moderna y lista para trabajar.
              </p>

              <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="rounded-2xl bg-white/10 border border-white/15 px-4 py-4 backdrop-blur">
                  <div className="text-sm font-black">Ventas</div>
                  <div className="text-xs font-semibold text-sky-100/90 mt-1">Monitorea ingresos y rendimiento</div>
                </div>
                <div className="rounded-2xl bg-white/10 border border-white/15 px-4 py-4 backdrop-blur">
                  <div className="text-sm font-black">Catálogo</div>
                  <div className="text-xs font-semibold text-sky-100/90 mt-1">Revisa productos, stock e imagen</div>
                </div>
                <div className="rounded-2xl bg-white/10 border border-white/15 px-4 py-4 backdrop-blur">
                  <div className="text-sm font-black">Operación</div>
                  <div className="text-xs font-semibold text-sky-100/90 mt-1">Mantén control de logística y cobros</div>
                </div>
              </div>
            </div>
          </div>

          <div className="p-8 md:p-10 bg-white">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.16em] text-sky-700 mb-1">
                  Acceso seguro
                </p>
                <h3 className="text-2xl font-black text-slate-900">Entra a tu panel</h3>
                <p className="text-sm font-semibold text-slate-600 mt-2">
                  Usa tu acceso actual de UnicOs para abrir el panel.
                </p>
              </div>

              <HelpTip
                title="¿Qué acceso necesito?"
                text="Este panel hoy espera un token guardado por tu flujo de autenticación. Si no tienes uno, hay que conectar inicio de sesión real para que el dueño no tenga que pegar nada."
                align="left"
              />
            </div>

            <div className="mt-8 space-y-4">
              <div>
                <label className="text-xs font-black text-slate-700">Correo (opcional)</label>
                <input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-1 w-full px-4 py-3.5 rounded-2xl border border-slate-200 bg-slate-50 font-semibold text-slate-900 outline-none focus:bg-white focus:border-sky-300"
                  placeholder="correo@empresa.com"
                />
              </div>

              <div>
                <label className="text-xs font-black text-slate-700">Token de acceso</label>
                <textarea
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  rows={5}
                  className="mt-1 w-full px-4 py-3.5 rounded-2xl border border-slate-200 bg-slate-50 font-semibold text-slate-900 outline-none focus:bg-white focus:border-sky-300"
                  placeholder="Pega aquí tu acceso actual"
                />
              </div>

              <button
                onClick={onSave}
                className="w-full px-4 py-4 rounded-2xl bg-[linear-gradient(135deg,#0369a1_0%,#0f172a_100%)] text-white hover:opacity-95 font-black text-base shadow-[0_16px_40px_rgba(3,105,161,0.25)]"
              >
                Entrar al panel
              </button>

              <p className="text-[12px] font-semibold text-slate-500 leading-relaxed">
                Tu acceso se guarda solo en este navegador para agilizar la entrada.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

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
      toast?.({ type: "bad", text: "Supabase no está configurado." });
      return;
    }

    setBusy(true);
    try {
      const { data: orders, error: ordersErr } = await supabase
        .from("orders")
        .select("id, amount_total_mxn, stripe_session_id, status, created_at")
        .eq("organization_id", orgId)
        .in("status", ["paid", "fulfilled"])
        .order("created_at", { ascending: false })
        .limit(800);

      if (ordersErr) throw ordersErr;

      const grossOrders = (orders || []).reduce((a, o) => a + num(o.amount_total_mxn), 0);

      const stripeSessionIds = Array.from(
        new Set((orders || []).map((o) => String(o?.stripe_session_id || "").trim()).filter(Boolean))
      ).slice(0, 120);

      let stripeFee = 0;
      try {
        const r = await fetch(`/api/stripe/fees`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            org_id: orgId,
            stripe_session_ids: stripeSessionIds,
          }),
        });
        const j = await r.json().catch(() => ({}));
        if (r.ok && j?.ok) stripeFee = num(j.total_fee_mxn);
      } catch {}

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
          if (!stripeFee) stripeFee = num(j?.kpi?.stripe_fee_mxn);
        }
      } catch {}

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

      const netReal = Math.max(0, grossOrders - stripeFee - enviaCost);
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
      <div className="rounded-[2rem] border border-sky-100 bg-white/95 shadow-[0_20px_60px_rgba(15,23,42,0.08)] p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-3">
              <p className="text-[11px] font-black uppercase tracking-[0.16em] text-sky-700 flex items-center gap-2">
                <Sparkles size={14} className="text-sky-700" /> Vista general
              </p>
              <HelpTip
                title="Resumen general"
                text="Aquí tienes una lectura rápida del rendimiento comercial y operativo de Score Store."
              />
            </div>

            <h3 className="mt-2 text-3xl md:text-4xl font-black text-slate-900 tracking-tight">
              {moneyMXN(state.net_shown_mxn)}
            </h3>

            <p className="text-sm font-semibold text-slate-600 mt-1">
              Indicador principal del panel para seguimiento operativo.
            </p>

            <p className="text-xs font-semibold text-slate-500 mt-2">
              Actualizado: {state.updated_at ? humanDate(state.updated_at) : "—"}
            </p>
          </div>

          <button
            onClick={load}
            className="px-4 py-2 rounded-2xl border border-sky-100 bg-white hover:bg-sky-50 font-black text-sm flex items-center gap-2"
          >
            <RefreshCcw size={16} className={busy ? "animate-spin" : ""} /> Actualizar
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-6 mt-6 border-t border-slate-100">
          <MiniKPI
            label="Ventas"
            value={moneyMXN(state.gross_orders_mxn)}
            icon={<Wallet size={14} />}
            note="Pedidos pagados"
            helpText="Suma de pedidos en estado paid y fulfilled."
          />
          <MiniKPI
            label="Costo Stripe"
            value={moneyMXN(state.stripe_fee_mxn)}
            icon={<CreditCard size={14} />}
            note="Comisión real"
            helpText="Comisiones obtenidas desde Stripe."
          />
          <MiniKPI
            label="Costo Envía"
            value={moneyMXN(state.envia_cost_mxn)}
            icon={<Truck size={14} />}
            note="Costo logístico"
            helpText="Costo real tomado de guías registradas."
          />
          <MiniKPI
            label="Neto interno"
            value={moneyMXN(state.net_real_mxn)}
            icon={<PiggyBank size={14} />}
            note="Para control"
            helpText="Resultado después de descontar Stripe y Envía."
          />
        </div>
      </div>

      <div className="rounded-[2rem] border border-sky-100 bg-white/95 shadow-[0_20px_60px_rgba(15,23,42,0.08)] p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <p className="text-[11px] font-black uppercase tracking-[0.16em] text-sky-700">
                Cobros y balance
              </p>
              <HelpTip
                title="Stripe"
                text="Consulta en vivo balance disponible, payouts y movimientos recientes."
              />
            </div>
            <h4 className="text-xl font-black text-slate-900 mt-1">Stripe en tiempo real</h4>
            <p className="text-sm font-semibold text-slate-600">
              Reembolsos 30d: {moneyMXN(state.refunds_mxn)} · Disputas: {state.disputes}
            </p>
          </div>

          <a
            className="px-4 py-2 rounded-2xl border border-sky-100 bg-white hover:bg-sky-50 font-black text-sm inline-flex items-center gap-2"
            href="https://dashboard.stripe.com/"
            target="_blank"
            rel="noreferrer"
          >
            Abrir Stripe <ExternalLink size={16} />
          </a>
        </div>

        <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="rounded-3xl border border-sky-100 bg-sky-50/40 p-4">
            <div className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">
              Balance disponible
            </div>
            <div className="mt-2 text-sm font-semibold text-slate-800 whitespace-pre-wrap">
              {(state.stripe?.stripe_dashboard?.balance_available || [])
                .map((x) => `${String(x.currency || "").toUpperCase()}: ${(num(x.amount || 0) / 100).toFixed(2)}`)
                .join("\n") || "—"}
            </div>
          </div>

          <div className="rounded-3xl border border-sky-100 bg-sky-50/40 p-4">
            <div className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">
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

      <div className="rounded-[2rem] border border-sky-100 bg-white/95 shadow-[0_20px_60px_rgba(15,23,42,0.08)] p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <p className="text-[11px] font-black uppercase tracking-[0.16em] text-sky-700">
                Logística
              </p>
              <HelpTip
                title="Envía.com"
                text="Este bloque te muestra el costo real de las guías registradas por tu operación."
              />
            </div>
            <h4 className="text-xl font-black text-slate-900 mt-1">Envía.com y operación</h4>
            <p className="text-sm font-semibold text-slate-600">
              Costo total 30d: {moneyMXN(num(state.envia?.kpi?.envia_cost_mxn || state.envia_cost_mxn))}
            </p>
          </div>

          <span className="px-4 py-2 rounded-2xl border border-sky-100 bg-white font-black text-sm inline-flex items-center gap-2">
            <Truck size={16} /> {num(state.envia?.scope?.labels_count || 0)} guías
          </span>
        </div>

        <div className="mt-5 overflow-x-auto">
          <table className="w-full min-w-[900px]">
            <thead>
              <tr className="text-left text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">
                <th className="py-2 pr-3">Fecha</th>
                <th className="py-2 pr-3">Carrier</th>
                <th className="py-2 pr-3">Tracking</th>
                <th className="py-2 pr-3">Costo</th>
              </tr>
            </thead>
            <tbody>
              {(state.envia?.labels || []).slice(0, 14).map((r) => (
                <tr key={r.id} className="border-t border-slate-100">
                  <td className="py-3 pr-3 text-sm font-semibold text-slate-800">{humanDate(r.created_at)}</td>
                  <td className="py-3 pr-3 text-sm font-black text-slate-900">{r.carrier || "—"}</td>
                  <td className="py-3 pr-3 text-sm font-semibold text-slate-800">{r.tracking || "—"}</td>
                  <td className="py-3 pr-3 text-sm font-black text-slate-900">{moneyMXN(num(r.total_amount_mxn))}</td>
                </tr>
              ))}
              {!(state.envia?.labels || []).length ? (
                <tr>
                  <td colSpan={4} className="py-10 text-sm font-semibold text-slate-500">
                    Aún no hay guías registradas en este periodo.
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

function ProductsView({ orgId, toast }) {
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
    <div className="rounded-[2rem] border border-sky-100 bg-white/95 shadow-[0_20px_60px_rgba(15,23,42,0.08)] p-6">
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <p className="text-[11px] font-black uppercase tracking-[0.16em] text-sky-700 mb-1">
              Catálogo comercial
            </p>
            <HelpTip
              title="Catálogo"
              text="Aquí revisas cómo están cargados tus productos: nombre, precio, stock e imagen."
            />
          </div>
          <h4 className="text-xl font-black text-slate-900">Productos de la tienda</h4>
          <p className="text-sm font-semibold text-slate-600">
            Tus imágenes cuadradas con fondo blanco se muestran limpias, nítidas y con look premium.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
          <div className="flex items-center gap-2 px-4 py-2 rounded-2xl border border-sky-100 bg-white">
            <Search size={16} className="text-sky-700" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Buscar producto, SKU o sección"
              className="outline-none text-sm font-semibold text-slate-800 w-[240px] max-w-full"
            />
          </div>

          <button
            onClick={load}
            className="px-4 py-2 rounded-2xl border border-sky-100 bg-white hover:bg-sky-50 font-black text-sm flex items-center gap-2"
          >
            <RefreshCcw size={16} className={busy ? "animate-spin" : ""} /> Actualizar
          </button>
        </div>
      </div>

      <div className="mt-5 overflow-x-auto">
        <table className="w-full min-w-[1050px]">
          <thead>
            <tr className="text-left text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">
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
              <tr key={r.id} className="border-t border-slate-100">
                <td className="py-3 pr-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-12 h-12 rounded-2xl border border-sky-100 bg-white overflow-hidden flex items-center justify-center shadow-sm p-1.5">
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
                  <p className="text-sm font-semibold text-slate-500">No encontramos productos con ese filtro.</p>
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}

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
    if (!canWrite) return toast?.({ type: "bad", text: "No tienes permisos para editar esta sección." });
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
        const { error } = await supabase.from("site_settings").insert({
          ...payload,
          created_at: new Date().toISOString(),
        });
        if (error) throw error;
      }

      toast?.({ type: "ok", text: "Configuración guardada correctamente." });
      load();
    } catch (e) {
      toast?.({ type: "bad", text: `No se pudo guardar: ${String(e?.message || e)}` });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="rounded-[2rem] border border-sky-100 bg-white/95 shadow-[0_20px_60px_rgba(15,23,42,0.08)] p-6 space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <p className="text-[11px] font-black uppercase tracking-[0.16em] text-sky-700 mb-1">
              Configuración comercial
            </p>
            <HelpTip
              title="Configuración"
              text="Aquí ajustas promos, mantenimiento, pixel y detalles globales que la tienda puede consumir."
            />
          </div>
          <h4 className="text-xl font-black text-slate-900">Ajustes de la tienda</h4>
          <p className="text-sm font-semibold text-slate-600">
            Mantén al día mensajes, campañas y detalles visuales sin tocar código.
          </p>
        </div>

        <button
          onClick={save}
          disabled={!canWrite || busy}
          className={clsx(
            "px-4 py-2 rounded-2xl font-black text-sm inline-flex items-center gap-2",
            canWrite && !busy
              ? "bg-[linear-gradient(135deg,#0369a1_0%,#0f172a_100%)] text-white hover:opacity-95"
              : "bg-slate-200 text-slate-500 cursor-not-allowed"
          )}
        >
          <Check size={16} /> Guardar
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="md:col-span-2 rounded-3xl border border-sky-100 bg-sky-50/40 p-4">
          <div className="flex items-center justify-between gap-3">
            <div className="text-sm font-black text-slate-900">Mensaje promocional</div>
            <HelpTip title="Promoción" text="Activa una barra superior con una promoción o aviso clave." />
          </div>

          <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-3">
            <label className="flex items-center gap-2 text-sm font-black text-slate-800">
              <input
                type="checkbox"
                checked={!!form.promo_active}
                onChange={(e) => setForm((p) => ({ ...p, promo_active: e.target.checked }))}
                className="w-4 h-4"
              />
              Mostrar promoción
            </label>

            <input
              value={form.promo_text}
              onChange={(e) => setForm((p) => ({ ...p, promo_text: e.target.value }))}
              className="px-4 py-3 rounded-2xl border border-slate-200 bg-white font-semibold text-slate-900 outline-none md:col-span-2"
              placeholder="Ej: Envío gratis en compras arriba de $999"
            />
          </div>
        </div>

        <div>
          <label className="text-xs font-black text-slate-700">Temporada</label>
          <input
            value={form.season_key}
            onChange={(e) => setForm((p) => ({ ...p, season_key: e.target.value }))}
            className="mt-1 w-full px-4 py-3 rounded-2xl border border-slate-200 bg-slate-50 font-semibold text-slate-900 outline-none"
            placeholder="default | navidad | verano"
          />
        </div>

        <div>
          <label className="text-xs font-black text-slate-700">Correo de contacto</label>
          <input
            value={form.contact_email}
            onChange={(e) => setForm((p) => ({ ...p, contact_email: e.target.value }))}
            className="mt-1 w-full px-4 py-3 rounded-2xl border border-slate-200 bg-slate-50 font-semibold text-slate-900 outline-none"
            placeholder="ventas@empresa.com"
          />
        </div>

        <div>
          <label className="text-xs font-black text-slate-700">Pixel Meta</label>
          <input
            value={form.pixel_id}
            onChange={(e) => setForm((p) => ({ ...p, pixel_id: e.target.value }))}
            className="mt-1 w-full px-4 py-3 rounded-2xl border border-slate-200 bg-slate-50 font-semibold text-slate-900 outline-none"
            placeholder="Ej: 1234567890"
          />
        </div>

        <div className="rounded-3xl border border-sky-100 bg-sky-50/40 p-4">
          <div className="text-sm font-black text-slate-900">Modo mantenimiento</div>
          <label className="mt-3 flex items-center gap-2 text-sm font-black text-slate-800">
            <input
              type="checkbox"
              checked={!!form.maintenance_mode}
              onChange={(e) => setForm((p) => ({ ...p, maintenance_mode: e.target.checked }))}
              className="w-4 h-4"
            />
            Bloquear compras temporalmente
          </label>
        </div>

        <div>
          <label className="text-xs font-black text-slate-700">theme (JSON)</label>
          <textarea
            value={form.theme_json}
            onChange={(e) => setForm((p) => ({ ...p, theme_json: e.target.value }))}
            rows={8}
            className="mt-1 w-full px-4 py-3 rounded-2xl border border-slate-200 bg-slate-50 font-mono text-xs font-semibold text-slate-900 outline-none"
          />
        </div>

        <div>
          <label className="text-xs font-black text-slate-700">home (JSON)</label>
          <textarea
            value={form.home_json}
            onChange={(e) => setForm((p) => ({ ...p, home_json: e.target.value }))}
            rows={8}
            className="mt-1 w-full px-4 py-3 rounded-2xl border border-slate-200 bg-slate-50 font-mono text-xs font-semibold text-slate-900 outline-none"
          />
        </div>

        <div className="md:col-span-2">
          <label className="text-xs font-black text-slate-700">socials (JSON)</label>
          <textarea
            value={form.socials_json}
            onChange={(e) => setForm((p) => ({ ...p, socials_json: e.target.value }))}
            rows={6}
            className="mt-1 w-full px-4 py-3 rounded-2xl border border-slate-200 bg-slate-50 font-mono text-xs font-semibold text-slate-900 outline-none"
          />
        </div>
      </div>
    </div>
  );
}

function OpsView({ orgId }) {
  return (
    <div className="rounded-[2rem] border border-sky-100 bg-white/95 shadow-[0_20px_60px_rgba(15,23,42,0.08)] p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.16em] text-sky-700 mb-1">
            Operación
          </p>
          <h4 className="text-xl font-black text-slate-900">Seguimiento operativo</h4>
          <p className="text-sm font-semibold text-slate-600">
            Aquí puedes crecer tracking, fulfillment y seguimiento por pedido.
          </p>
        </div>
        <HelpTip
          title="Operación"
          text="Este bloque se puede ampliar con seguimiento por pedido, guía y estatus de entrega."
        />
      </div>

      <div className="mt-6 rounded-3xl border border-sky-100 bg-sky-50/40 p-4">
        <p className="text-sm font-semibold text-slate-700">
          Organización activa: <span className="font-black">{orgId}</span>
        </p>
      </div>
    </div>
  );
}