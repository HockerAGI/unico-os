"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import clsx from "clsx";
import {
  Activity,
  ArrowRight,
  BadgeCheck,
  BarChart3,
  Boxes,
  CreditCard,
  ExternalLink,
  HelpCircle,
  LayoutDashboard,
  Lock,
  Package,
  PiggyBank,
  RefreshCcw,
  Search,
  Settings,
  Shield,
  Sparkles,
  Store,
  Truck,
  Wallet,
} from "lucide-react";
import { supabase, SUPABASE_CONFIGURED } from "@/lib/supabase";

const SCORE_ORG_ID = "1f3b9980-a1c5-4557-b4eb-a75bb9a8aaa6";

const safeStr = (v, d = "") => (typeof v === "string" ? v : v == null ? d : String(v));
const safeNum = (v, d = 0) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : d;
};

const money = (v) =>
  new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    maximumFractionDigits: 2,
  }).format(safeNum(v, 0));

const compactMoney = (v) =>
  new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(safeNum(v, 0));

const shortDateTime = (value) => {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return new Intl.DateTimeFormat("es-MX", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(d);
};

function useMounted() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return mounted;
}

function StatusPill({ ok = true, children, tone = "blue" }) {
  const tones = {
    blue: ok
      ? "bg-[rgba(42,168,255,0.14)] text-sky-200 border-white/10"
      : "bg-[rgba(245,158,11,0.16)] text-amber-200 border-white/10",
    emerald: ok
      ? "bg-[rgba(34,197,94,0.14)] text-emerald-200 border-white/10"
      : "bg-[rgba(245,158,11,0.16)] text-amber-200 border-white/10",
    rose: ok
      ? "bg-[rgba(251,113,133,0.14)] text-rose-200 border-white/10"
      : "bg-[rgba(245,158,11,0.16)] text-amber-200 border-white/10",
  };

  return (
    <span
      className={clsx(
        "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.16em]",
        tones[tone]
      )}
    >
      <span
        className={clsx(
          "h-2.5 w-2.5 rounded-full",
          ok ? "bg-sky-400 animate-unicos-pulse" : "bg-amber-400"
        )}
      />
      {children}
    </span>
  );
}

function GlassButton({ children, className = "", variant = "secondary", ...props }) {
  return (
    <button
      {...props}
      className={clsx(
        "unicos-btn inline-flex items-center justify-center gap-2 px-4 py-3 text-sm",
        variant === "primary" ? "unicos-btn-primary" : "unicos-btn-secondary",
        className
      )}
    >
      {children}
    </button>
  );
}

function Panel({ className = "", children }) {
  return <div className={clsx("unicos-panel", className)}>{children}</div>;
}

function Card({ className = "", children }) {
  return <div className={clsx("unicos-card", className)}>{children}</div>;
}

function SectionHeading({ eyebrow, title, text, action }) {
  return (
    <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
      <div>
        {eyebrow ? (
          <p className="text-[11px] font-black uppercase tracking-[0.24em] text-cyan-300">{eyebrow}</p>
        ) : null}
        <h2 className="unicos-title mt-2 text-2xl md:text-3xl font-black">{title}</h2>
        {text ? <p className="mt-2 max-w-3xl text-sm md:text-[15px] text-slate-300">{text}</p> : null}
      </div>
      {action ? <div>{action}</div> : null}
    </div>
  );
}

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
        <HelpCircle size={16} />
      </button>

      {open ? (
        <div className="absolute right-0 top-12 z-[80] w-[340px] max-w-[88vw]">
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

function LoadingShell({ label = "Cargando datos reales..." }) {
  return (
    <div className="flex min-h-[48vh] items-center justify-center">
      <Panel className="max-w-lg w-full p-8">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-3xl bg-[rgba(42,168,255,0.14)] text-sky-300 border border-white/10">
            <RefreshCcw className="animate-spin" size={20} />
          </div>
          <div>
            <p className="text-lg font-black text-white">UnicOs</p>
            <p className="text-sm text-slate-300">{label}</p>
          </div>
        </div>
      </Panel>
    </div>
  );
}

function EmptyState({ icon, title, text, action }) {
  return (
    <Panel className="p-8 text-center">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl border border-white/10 bg-white/5 text-cyan-300">
        {icon}
      </div>
      <h3 className="mt-5 text-xl font-black text-white">{title}</h3>
      <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-slate-300">{text}</p>
      {action ? <div className="mt-6">{action}</div> : null}
    </Panel>
  );
}

function MetricCard({ icon, label, value, sub, tone = "blue" }) {
  const tones = {
    blue: "from-sky-500/18 to-blue-500/8 text-sky-200",
    emerald: "from-emerald-500/18 to-teal-500/8 text-emerald-200",
    amber: "from-amber-500/18 to-orange-500/8 text-amber-200",
    rose: "from-rose-500/18 to-pink-500/8 text-rose-200",
    slate: "from-white/8 to-white/4 text-slate-200",
  };

  return (
    <Card className="p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">{label}</p>
          <p className="mt-3 break-words text-2xl md:text-[28px] font-black text-white">{value}</p>
          {sub ? <p className="mt-2 text-xs font-semibold text-slate-400">{sub}</p> : null}
        </div>
        <div
          className={clsx(
            "flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-gradient-to-br",
            tones[tone]
          )}
        >
          {icon}
        </div>
      </div>
    </Card>
  );
}

function TopNav({ currentTab, setCurrentTab, onRefresh, refreshing }) {
  const tabs = [
    { key: "dashboard", label: "Dashboard", icon: <LayoutDashboard size={16} /> },
    { key: "products", label: "Productos", icon: <Boxes size={16} /> },
    { key: "settings", label: "Ajustes", icon: <Settings size={16} /> },
  ];

  return (
    <Panel className="sticky top-3 z-40 p-4 md:p-5">
      <div className="absolute -left-10 top-6 h-20 w-20 rounded-full bg-sky-400/10 blur-2xl" />
      <div className="absolute right-0 top-0 h-28 w-28 rounded-full bg-cyan-400/10 blur-3xl" />

      <div className="relative flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex min-w-0 items-center gap-4">
          <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-[22px] border border-white/10 bg-white/10 shadow-2xl">
            <Image src="/logo-unico.png" alt="UnicOs" fill className="object-contain p-2" sizes="56px" priority />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-black uppercase tracking-[0.24em] text-cyan-300">Centro maestro</p>
            <h1 className="unicos-title mt-1 text-2xl md:text-3xl font-black">
              <span className="unicos-blue-text">UnicOs</span>
            </h1>
            <p className="truncate text-sm text-slate-300">Operación central, visual, financiera y táctica.</p>
          </div>
        </div>

        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="flex flex-wrap items-center gap-2 rounded-[22px] border border-white/10 bg-white/5 p-1.5 backdrop-blur-xl">
            {tabs.map((tab) => {
              const active = currentTab === tab.key;
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setCurrentTab(tab.key)}
                  className={clsx(
                    "inline-flex items-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-black transition",
                    active
                      ? "bg-gradient-to-r from-sky-500 to-cyan-400 text-slate-950 shadow-[0_12px_30px_rgba(42,168,255,0.25)]"
                      : "text-slate-300 hover:bg-white/10 hover:text-white"
                  )}
                >
                  {tab.icon}
                  {tab.label}
                </button>
              );
            })}
          </div>

          <GlassButton variant="secondary" onClick={onRefresh}>
            <RefreshCcw size={16} className={refreshing ? "animate-spin" : ""} />
            Actualizar
          </GlassButton>
        </div>
      </div>
    </Panel>
  );
}

function HeaderHero({ orgName, role, email, onLogout }) {
  return (
    <Panel className="p-5 md:p-6 overflow-hidden">
      <div className="absolute -right-8 bottom-0 h-40 w-40 rounded-full bg-cyan-400/10 blur-3xl" />
      <div className="absolute left-1/3 top-0 h-28 w-28 rounded-full bg-sky-500/10 blur-2xl" />

      <div className="relative grid grid-cols-1 xl:grid-cols-[1.2fr_.8fr] gap-6">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <StatusPill ok tone="blue">Producción conectada</StatusPill>
            <StatusPill ok tone="emerald">Supabase</StatusPill>
            <StatusPill ok tone="blue">Stripe</StatusPill>
            <StatusPill ok tone="emerald">Envia</StatusPill>
          </div>

          <h2 className="mt-5 text-3xl md:text-4xl font-black text-white leading-[1.05]">
            Control total de{" "}
            <span className="unicos-blue-text">{orgName || "la operación"}</span>
          </h2>

          <p className="mt-4 max-w-3xl text-sm md:text-[15px] leading-relaxed text-slate-300">
            Panel ejecutivo con lectura real de órdenes, pagos, envíos, catálogo y settings. La idea aquí no es
            “ver bonito” solamente: es operar Score Store sin meterte a tocar código cada vez.
          </p>

          <div className="mt-5 flex flex-wrap gap-3">
            <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
              <p className="text-[11px] uppercase tracking-[0.18em] font-black text-slate-400">Correo</p>
              <p className="mt-1 text-sm font-bold text-white break-all">{email || "Sin correo"}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
              <p className="text-[11px] uppercase tracking-[0.18em] font-black text-slate-400">Rol</p>
              <p className="mt-1 text-sm font-bold text-white">{safeStr(role || "sin rol").toUpperCase()}</p>
            </div>
          </div>
        </div>

        <div className="grid gap-4 content-start">
          <Card className="p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-cyan-300">
                <Sparkles size={18} />
              </div>
              <div>
                <p className="text-sm font-black text-white">Nodo activo</p>
                <p className="text-xs text-slate-400">Listo para administrar tienda y settings reales.</p>
              </div>
            </div>
          </Card>

          <Card className="p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-black text-white">Salir de sesión</p>
                <p className="mt-1 text-xs text-slate-400">Cierra acceso del panel actual.</p>
              </div>
              <GlassButton onClick={onLogout} variant="secondary" className="px-3 py-2.5">
                <Lock size={16} />
                Salir
              </GlassButton>
            </div>
          </Card>
        </div>
      </div>
    </Panel>
  );
}

function LoginScreen({ onLogin, loading, error }) {
  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-10">
      <div className="unicos-wrap w-full max-w-6xl">
        <Panel className="overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-[1.05fr_.95fr]">
            <div className="relative p-8 md:p-12 unicos-grid-lines">
              <div className="unicos-orb unicos-orb-blue h-40 w-40 left-[-40px] top-[-20px]" />
              <div className="unicos-orb unicos-orb-teal h-36 w-36 right-[10%] bottom-[8%]" />

              <div className="relative max-w-2xl animate-unicos-slide-up">
                <div className="flex items-center gap-4">
                  <div className="relative h-20 w-20 overflow-hidden rounded-[26px] border border-white/10 bg-white/10 shadow-2xl animate-unicos-float">
                    <Image src="/logo-unico.png" alt="UnicOs" fill className="object-contain p-3" sizes="80px" priority />
                  </div>
                  <div>
                    <p className="text-[11px] font-black uppercase tracking-[0.24em] text-cyan-300">Control total</p>
                    <h1 className="mt-1 text-4xl md:text-5xl font-black leading-none">
                      <span className="unicos-blue-text">UnicOs</span>
                    </h1>
                  </div>
                </div>

                <h2 className="mt-10 text-3xl md:text-5xl font-black leading-[1.02] text-white">
                  Administra Score Store desde un panel maestro más serio.
                </h2>

                <p className="mt-5 max-w-xl text-sm md:text-[15px] leading-relaxed text-slate-300">
                  Esta versión ya está pensada como centro ejecutivo: visual premium, foco en métricas reales,
                  acceso a catálogo y control directo del contenido operativo de la tienda.
                </p>

                <div className="mt-8 flex flex-wrap gap-2">
                  <StatusPill ok tone="blue">Auth real</StatusPill>
                  <StatusPill ok tone="emerald">Supabase</StatusPill>
                  <StatusPill ok tone="blue">Store settings</StatusPill>
                </div>
              </div>
            </div>

            <div className="p-8 md:p-12 bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.02))] border-l border-white/10">
              <div className="mx-auto max-w-md animate-unicos-slide-up">
                <div className="rounded-[28px] border border-white/10 bg-white/5 p-6 md:p-7 shadow-2xl backdrop-blur-xl">
                  <p className="text-[11px] font-black uppercase tracking-[0.22em] text-cyan-300">Acceso seguro</p>
                  <h3 className="mt-2 text-2xl font-black text-white">Entrar al panel maestro</h3>
                  <p className="mt-3 text-sm leading-relaxed text-slate-300">
                    Usa tu acceso real de Supabase. El panel detecta permisos, organización activa y rutas conectadas.
                  </p>

                  {error ? (
                    <div className="mt-5 rounded-2xl border border-rose-400/20 bg-rose-500/10 px-4 py-3 text-sm font-semibold text-rose-200">
                      {error}
                    </div>
                  ) : null}

                  <button
                    type="button"
                    disabled={loading}
                    onClick={onLogin}
                    className={clsx(
                      "mt-6 w-full rounded-2xl px-4 py-3.5 text-sm font-black text-white transition",
                      loading
                        ? "bg-white/10 border border-white/10"
                        : "bg-gradient-to-r from-sky-500 via-blue-500 to-cyan-400 shadow-[0_18px_50px_rgba(42,168,255,0.28)] hover:brightness-110"
                    )}
                  >
                    {loading ? "Enviando acceso..." : "Entrar con magic link"}
                  </button>

                  <p className="mt-4 text-xs leading-relaxed text-slate-400">
                    Para evitar abuso, Supabase limita solicitudes frecuentes de magic link. Si sale un mensaje de
                    espera, toca esperar unos segundos y volver a intentarlo.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </Panel>
      </div>
    </main>
  );
}

function FinanceSummary({ token, orgId, role }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [data, setData] = useState(null);

  const canView = ["owner", "admin", "marketing"].includes(safeStr(role).toLowerCase());

  const load = useCallback(async () => {
    if (!token || !orgId || !canView) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError("");

      const res = await fetch(`/api/stripe/summary?org_id=${encodeURIComponent(orgId)}&days=30`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const payload = await res.json().catch(() => ({}));
      if (!res.ok || !payload?.ok) throw new Error(payload?.error || "No se pudo leer el resumen financiero.");

      setData(payload);
    } catch (e) {
      setError(String(e?.message || e));
    } finally {
      setLoading(false);
    }
  }, [token, orgId, canView]);

  useEffect(() => {
    load();
  }, [load]);

  if (!canView) return null;

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="p-5 animate-pulse">
            <div className="h-3 w-24 rounded bg-white/10" />
            <div className="mt-4 h-9 w-40 rounded bg-white/10" />
            <div className="mt-3 h-3 w-28 rounded bg-white/10" />
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <EmptyState
        icon={<Wallet size={20} />}
        title="No pude cargar el resumen financiero"
        text={error}
        action={
          <GlassButton variant="secondary" onClick={load}>
            <RefreshCcw size={16} />
            Reintentar
          </GlassButton>
        }
      />
    );
  }

  const kpi = data?.kpi || {};

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
      <MetricCard
        icon={<PiggyBank size={20} />}
        label="Ventas"
        value={money(kpi.sales_mxn)}
        sub="Últimos 30 días"
        tone="blue"
      />
      <MetricCard
        icon={<CreditCard size={20} />}
        label="Comisión Stripe"
        value={money(kpi.stripe_fee_mxn)}
        sub="Cargos de pago"
        tone="amber"
      />
      <MetricCard
        icon={<Truck size={20} />}
        label="Costo envíos"
        value={money(kpi.envia_cost_mxn)}
        sub="Costo operativo"
        tone="slate"
      />
      <MetricCard
        icon={<Wallet size={20} />}
        label="Ganancia"
        value={money(kpi.visible_profit_mxn)}
        sub="Lectura ejecutiva"
        tone="emerald"
      />
    </div>
  );
}

function DashboardView({ token, orgId, role }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [orders, setOrders] = useState([]);
  const [enviaSummary, setEnviaSummary] = useState(null);

  const load = useCallback(async () => {
    if (!supabase || !orgId) return;

    try {
      setLoading(true);
      setError("");

      const { data: ordersData, error: ordersErr } = await supabase
        .from("orders")
        .select("id, amount_total_mxn, stripe_session_id, status, created_at, org_id, organization_id")
        .or(`org_id.eq.${orgId},organization_id.eq.${orgId}`)
        .in("status", ["paid", "fulfilled"])
        .order("created_at", { ascending: false })
        .limit(800);

      if (ordersErr) throw ordersErr;

      let enviaData = null;
      try {
        const res = await fetch(`/api/envia/summary?org_id=${encodeURIComponent(orgId)}&days=30`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        const payload = await res.json().catch(() => ({}));
        if (res.ok && payload?.ok) enviaData = payload;
      } catch {}

      setOrders(Array.isArray(ordersData) ? ordersData : []);
      setEnviaSummary(enviaData);
    } catch (e) {
      setError(String(e?.message || e));
    } finally {
      setLoading(false);
    }
  }, [orgId, token]);

  useEffect(() => {
    load();
  }, [load]);

  const totalSales = useMemo(
    () => orders.reduce((acc, row) => acc + safeNum(row?.amount_total_mxn, 0), 0),
    [orders]
  );

  const totalOrders = orders.length;
  const fulfilledCount = orders.filter((o) => safeStr(o?.status).toLowerCase() === "fulfilled").length;
  const paidCount = orders.filter((o) => safeStr(o?.status).toLowerCase() === "paid").length;

  if (loading) return <LoadingShell label="Leyendo órdenes, pagos y envíos..." />;

  if (error) {
    return (
      <EmptyState
        icon={<Shield size={20} />}
        title="No pude cargar el dashboard"
        text={error}
        action={
          <GlassButton variant="secondary" onClick={load}>
            <RefreshCcw size={16} />
            Reintentar
          </GlassButton>
        }
      />
    );
  }

  return (
    <div className="space-y-5">
      <SectionHeading
        eyebrow="Vista general"
        title="Operación conectada en tiempo real"
        text="Aquí ves el resumen ejecutivo de la tienda, con datos reales de órdenes, pagos, envíos y estado operativo."
        action={
          <HelpTip
            title="Dashboard ejecutivo"
            text="Este bloque centraliza la lectura de métricas sin tocar código: ventas, comisiones, envíos y órdenes recientes."
          />
        }
      />

      <FinanceSummary token={token} orgId={orgId} role={role} />

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <MetricCard
          icon={<Package size={20} />}
          label="Pedidos pagados"
          value={String(paidCount)}
          sub="Pendientes de flujo posterior"
          tone="blue"
        />
        <MetricCard
          icon={<BadgeCheck size={20} />}
          label="Pedidos enviados"
          value={String(fulfilledCount)}
          sub="Marcados como fulfilled"
          tone="emerald"
        />
        <MetricCard
          icon={<Activity size={20} />}
          label="Pedidos totales"
          value={String(totalOrders)}
          sub="Ventana cargada"
          tone="slate"
        />
        <MetricCard
          icon={<Truck size={20} />}
          label="Eventos de envío"
          value={String(safeNum(enviaSummary?.summary?.shipments_count, 0))}
          sub={
            enviaSummary?.summary?.last_shipment_at
              ? `Último: ${shortDateTime(enviaSummary.summary.last_shipment_at)}`
              : "Sin movimientos recientes"
          }
          tone="amber"
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1.4fr_.8fr] gap-5">
        <Panel className="p-5 md:p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[11px] uppercase tracking-[0.18em] font-black text-slate-400">Actividad reciente</p>
              <h3 className="mt-2 text-xl font-black text-white">Últimos pedidos</h3>
            </div>
            <div className="text-sm font-black text-cyan-200">{compactMoney(totalSales)}</div>
          </div>

          {!orders.length ? (
            <div className="mt-5">
              <EmptyState
                icon={<Package size={20} />}
                title="Todavía no hay pedidos cargados"
                text="Cuando entren ventas reales y estén marcadas como pagadas o enviadas, aparecerán aquí."
              />
            </div>
          ) : (
            <div className="mt-5 overflow-x-auto">
              <table className="w-full min-w-[680px]">
                <thead>
                  <tr className="text-left text-[11px] uppercase tracking-[0.16em] text-slate-400">
                    <th className="pb-3 font-black">Pedido</th>
                    <th className="pb-3 font-black">Estado</th>
                    <th className="pb-3 font-black">Monto</th>
                    <th className="pb-3 font-black">Fecha</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.slice(0, 12).map((row) => {
                    const status = safeStr(row?.status).toLowerCase();
                    const statusClass =
                      status === "fulfilled"
                        ? "bg-emerald-500/14 text-emerald-200"
                        : "bg-sky-500/14 text-sky-200";

                    return (
                      <tr key={row.id} className="border-t border-white/6">
                        <td className="py-4 text-sm font-black text-white">{safeStr(row.id).slice(0, 8)}...</td>
                        <td className="py-4">
                          <span className={clsx("inline-flex rounded-full px-3 py-1 text-xs font-black", statusClass)}>
                            {status || "—"}
                          </span>
                        </td>
                        <td className="py-4 text-sm font-black text-white">{money(row?.amount_total_mxn)}</td>
                        <td className="py-4 text-sm text-slate-400">{shortDateTime(row?.created_at)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Panel>

        <Panel className="p-5 md:p-6">
          <p className="text-[11px] uppercase tracking-[0.18em] font-black text-slate-400">Salud del sistema</p>
          <h3 className="mt-2 text-xl font-black text-white">Lectura rápida</h3>

          <div className="mt-5 space-y-3">
            <Card className="p-4">
              <p className="text-sm font-black text-white">Supabase</p>
              <p className="mt-1 text-sm text-slate-400">Conexión lista para auth, settings, productos y órdenes.</p>
            </Card>
            <Card className="p-4">
              <p className="text-sm font-black text-white">Stripe</p>
              <p className="mt-1 text-sm text-slate-400">Resumen financiero y comisiones visibles desde el panel.</p>
            </Card>
            <Card className="p-4">
              <p className="text-sm font-black text-white">Envia</p>
              <p className="mt-1 text-sm text-slate-400">Seguimiento y resumen operativo de envíos conectado.</p>
            </Card>
            <Card className="p-4">
              <p className="text-sm font-black text-white">Rol actual</p>
              <p className="mt-1 text-sm text-slate-400">{safeStr(role || "sin rol").toUpperCase()}</p>
            </Card>
          </div>
        </Panel>
      </div>
    </div>
  );
}

function ProductsView({ orgId }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [rows, setRows] = useState([]);
  const [q, setQ] = useState("");

  const load = useCallback(async () => {
    if (!supabase || !orgId) return;

    try {
      setLoading(true);
      setError("");

      const { data, error } = await supabase
        .from("products")
        .select("id,name,sku,price_mxn,stock,section_id,sub_section,rank,image_url,is_active,deleted_at,org_id,organization_id")
        .or(`org_id.eq.${orgId},organization_id.eq.${orgId}`)
        .is("deleted_at", null)
        .order("rank", { ascending: true })
        .limit(800);

      if (error) throw error;
      setRows(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(String(e?.message || e));
    } finally {
      setLoading(false);
    }
  }, [orgId]);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    const term = safeStr(q).trim().toLowerCase();
    if (!term) return rows;

    return rows.filter((row) =>
      [row?.name, row?.sku, row?.section_id, row?.sub_section].some((value) =>
        safeStr(value).toLowerCase().includes(term)
      )
    );
  }, [rows, q]);

  if (loading) return <LoadingShell label="Leyendo catálogo real..." />;

  if (error) {
    return (
      <EmptyState
        icon={<Boxes size={20} />}
        title="No pude cargar productos"
        text={error}
        action={
          <GlassButton variant="secondary" onClick={load}>
            <RefreshCcw size={16} />
            Reintentar
          </GlassButton>
        }
      />
    );
  }

  return (
    <div className="space-y-5">
      <SectionHeading
        eyebrow="Catálogo"
        title="Productos conectados"
        text="Vista real de productos enlazados a Supabase. Aquí revisas stock, precio, actividad y orden visual."
        action={
          <HelpTip
            title="Catálogo real"
            text="Se consulta directo la tabla products usando compatibilidad org_id / organization_id para no perder registros."
          />
        }
      />

      <Panel className="p-5 md:p-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Buscar por nombre, SKU o sección"
              className="unicos-input pl-11"
            />
          </div>

          <GlassButton variant="secondary" onClick={load}>
            <RefreshCcw size={16} />
            Actualizar
          </GlassButton>
        </div>

        {!filtered.length ? (
          <div className="mt-5">
            <EmptyState
              icon={<Package size={20} />}
              title="No encontré productos"
              text="No hay productos para esta organización o el filtro actual no devolvió resultados."
            />
          </div>
        ) : (
          <div className="mt-6 overflow-x-auto">
            <table className="w-full min-w-[920px]">
              <thead>
                <tr className="text-left text-[11px] uppercase tracking-[0.16em] text-slate-400">
                  <th className="pb-3 font-black">Producto</th>
                  <th className="pb-3 font-black">SKU</th>
                  <th className="pb-3 font-black">Precio</th>
                  <th className="pb-3 font-black">Stock</th>
                  <th className="pb-3 font-black">Sección</th>
                  <th className="pb-3 font-black">Activo</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((row) => (
                  <tr key={row.id} className="border-t border-white/6">
                    <td className="py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-14 w-14 shrink-0 overflow-hidden rounded-2xl border border-white/10 bg-white/5">
                          {row?.image_url ? (
                            <img src={row.image_url} alt={row?.name || "Producto"} className="h-full w-full object-cover" />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-slate-400">
                              <Package size={18} />
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-black text-white">{safeStr(row?.name, "Sin nombre")}</p>
                          <p className="text-xs text-slate-400">Rank: {safeNum(row?.rank, 0)}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 text-sm font-semibold text-slate-300">{safeStr(row?.sku, "—")}</td>
                    <td className="py-4 text-sm font-black text-white">{money(row?.price_mxn)}</td>
                    <td className="py-4 text-sm font-semibold text-slate-300">{safeNum(row?.stock, 0)}</td>
                    <td className="py-4 text-sm font-semibold text-slate-300">
                      {safeStr(row?.section_id, "—")}
                      {row?.sub_section ? ` / ${row.sub_section}` : ""}
                    </td>
                    <td className="py-4">
                      <span
                        className={clsx(
                          "inline-flex rounded-full px-3 py-1 text-xs font-black",
                          row?.is_active
                            ? "bg-emerald-500/14 text-emerald-200"
                            : "bg-white/10 text-slate-300"
                        )}
                      >
                        {row?.is_active ? "Sí" : "No"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </div>
  );
}

function SettingsShortcut() {
  return (
    <div className="space-y-5">
      <SectionHeading
        eyebrow="Ajustes"
        title="Centro de configuración"
        text="Accesos rápidos para operar Score Store desde UnicOs sin tocar archivos manualmente."
        action={
          <HelpTip
            title="Settings conectados"
            text="Aquí saltas al panel especializado de site_settings, que sí controla contenido real consumido por la tienda."
          />
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <Panel className="p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.22em] text-cyan-300">Score Store</p>
              <h3 className="mt-2 text-2xl font-black text-white">Contenido y datos reales</h3>
              <p className="mt-3 text-sm leading-relaxed text-slate-300">
                Hero, promo, contacto, redes, portada, notas operativas y otros datos visibles del storefront.
              </p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-cyan-300">
              <Store size={18} />
            </div>
          </div>

          <a
            href="/scorestore-settings"
            className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-sky-500 via-blue-500 to-cyan-400 px-4 py-3 text-sm font-black text-slate-950 shadow-[0_18px_50px_rgba(42,168,255,0.25)] hover:brightness-110"
          >
            Abrir ajustes
            <ArrowRight size={16} />
          </a>
        </Panel>

        <Panel className="p-6">
          <p className="text-[11px] font-black uppercase tracking-[0.22em] text-cyan-300">Estado actual</p>
          <h3 className="mt-2 text-2xl font-black text-white">Producción conectada</h3>
          <p className="mt-3 text-sm leading-relaxed text-slate-300">
            El panel ya está orientado a flujo real: auth, catálogo, órdenes, finanzas, envíos y settings conectados.
          </p>

          <div className="mt-5 flex flex-wrap gap-2">
            <StatusPill ok tone="blue">Auth</StatusPill>
            <StatusPill ok tone="emerald">Site settings</StatusPill>
            <StatusPill ok tone="blue">Products</StatusPill>
            <StatusPill ok tone="emerald">Orders</StatusPill>
          </div>
        </Panel>
      </div>
    </div>
  );
}

export default function Page() {
  const mounted = useMounted();

  const [checking, setChecking] = useState(true);
  const [authLoading, setAuthLoading] = useState(false);
  const [globalError, setGlobalError] = useState("");
  const [sessionEmail, setSessionEmail] = useState("");
  const [accessToken, setAccessToken] = useState("");
  const [activeOrgId, setActiveOrgId] = useState("");
  const [activeOrgName, setActiveOrgName] = useState("");
  const [role, setRole] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [currentTab, setCurrentTab] = useState("dashboard");

  const loadSessionAndOrg = useCallback(async () => {
    if (!SUPABASE_CONFIGURED || !supabase) {
      setGlobalError("Faltan variables públicas de Supabase para operar UnicOs.");
      setChecking(false);
      return;
    }

    try {
      setChecking(true);
      setGlobalError("");

      const {
        data: { session },
        error: sessionErr,
      } = await supabase.auth.getSession();

      if (sessionErr) throw sessionErr;

      if (!session?.access_token || !session?.user) {
        setAccessToken("");
        setSessionEmail("");
        setActiveOrgId("");
        setActiveOrgName("");
        setRole("");
        return;
      }

      setAccessToken(session.access_token);

      const storedOrg =
        typeof window !== "undefined" ? safeStr(window.localStorage.getItem("unicos.org_id"), "") : "";

      const whoRes = await fetch("/api/me", {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      const who = await whoRes.json().catch(() => ({}));
      if (!whoRes.ok || !who?.ok) throw new Error(who?.error || "No autorizado.");

      const email = safeStr(who.email || "");
      if (email) setSessionEmail(email);

      const organizations = Array.isArray(who?.organizations) ? who.organizations : [];
      let targetOrg = storedOrg || safeStr(who?.organization_id || "");

      if (!targetOrg && organizations.length) {
        targetOrg = safeStr(organizations[0]?.organization_id || "");
      }

      if (!targetOrg) {
        targetOrg = SCORE_ORG_ID;
      }

      let orgName = safeStr(
        organizations.find((org) => safeStr(org?.organization_id) === targetOrg)?.organization_name || ""
      );

      if (!orgName) {
        const { data: orgRow } = await supabase
          .from("organizations")
          .select("id,name")
          .eq("id", targetOrg)
          .limit(1)
          .maybeSingle();

        if (orgRow?.name) orgName = orgRow.name;
      }

      const adminRole =
        safeStr(
          organizations.find((org) => safeStr(org?.organization_id) === targetOrg)?.role || who?.role || ""
        ).toLowerCase() || "support";

      setActiveOrgId(targetOrg);
      setActiveOrgName(orgName || "Organización");
      setRole(adminRole);

      if (typeof window !== "undefined") {
        window.localStorage.setItem("unicos.org_id", targetOrg);
      }
    } catch (e) {
      setGlobalError(String(e?.message || e));
    } finally {
      setChecking(false);
    }
  }, []);

  useEffect(() => {
    if (!mounted) return;

    loadSessionAndOrg();

    if (!supabase) return;

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      loadSessionAndOrg();
    });

    return () => subscription?.unsubscribe?.();
  }, [mounted, loadSessionAndOrg]);

  const handleLogin = useCallback(async () => {
    if (!supabase) return;

    try {
      setAuthLoading(true);
      setGlobalError("");

      const email = window.prompt("Escribe tu correo autorizado para entrar a UnicOs:");
      if (!email) return;

      const origin =
        typeof window !== "undefined" && window.location?.origin
          ? window.location.origin
          : "http://localhost:3000";

      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${origin}/`,
        },
      });

      if (error) throw error;

      alert("Te mandé el magic link a tu correo.");
    } catch (e) {
      setGlobalError(String(e?.message || e));
    } finally {
      setAuthLoading(false);
    }
  }, []);

  const handleLogout = useCallback(async () => {
    try {
      if (!supabase) return;
      await supabase.auth.signOut();

      if (typeof window !== "undefined") {
        window.localStorage.removeItem("unicos.org_id");
      }

      setAccessToken("");
      setSessionEmail("");
      setActiveOrgId("");
      setActiveOrgName("");
      setRole("");
      setCurrentTab("dashboard");
    } catch (e) {
      setGlobalError(String(e?.message || e));
    }
  }, []);

  const handleRefresh = useCallback(async () => {
    try {
      setRefreshing(true);
      await loadSessionAndOrg();
    } finally {
      setRefreshing(false);
    }
  }, [loadSessionAndOrg]);

  if (!mounted) return null;

  if (!SUPABASE_CONFIGURED) {
    return (
      <main className="min-h-screen flex items-center justify-center px-4">
        <div className="unicos-wrap max-w-4xl">
          <EmptyState
            icon={<Shield size={20} />}
            title="Falta configuración pública de Supabase"
            text="Agrega NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY o NEXT_PUBLIC_SUPABASE_ANON_KEY para operar el panel."
          />
        </div>
      </main>
    );
  }

  if (checking) {
    return (
      <main className="min-h-screen px-4 py-8">
        <div className="unicos-wrap">
          <LoadingShell label="Validando acceso, organización y permisos..." />
        </div>
      </main>
    );
  }

  if (!accessToken || !activeOrgId) {
    return <LoginScreen onLogin={handleLogin} loading={authLoading} error={globalError} />;
  }

  return (
    <main className="min-h-screen px-4 py-4 md:py-6">
      <div className="unicos-wrap space-y-4 md:space-y-5">
        <TopNav
          currentTab={currentTab}
          setCurrentTab={setCurrentTab}
          onRefresh={handleRefresh}
          refreshing={refreshing}
        />

        <HeaderHero orgName={activeOrgName} role={role} email={sessionEmail} onLogout={handleLogout} />

        {globalError ? (
          <div className="rounded-2xl border border-rose-400/20 bg-rose-500/10 px-4 py-3 text-sm font-semibold text-rose-200">
            {globalError}
          </div>
        ) : null}

        {currentTab === "dashboard" ? (
          <DashboardView token={accessToken} orgId={activeOrgId} role={role} />
        ) : null}

        {currentTab === "products" ? <ProductsView orgId={activeOrgId} /> : null}

        {currentTab === "settings" ? <SettingsShortcut /> : null}
      </div>
    </main>
  );
}