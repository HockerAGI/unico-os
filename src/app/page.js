/* eslint-disable react/no-unescaped-entities */
"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import clsx from "clsx";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  Megaphone,
  Settings,
  Shield,
  RefreshCcw,
  Search,
  Plus,
  X,
  Pencil,
  Trash2,
  HelpCircle,
  Copy,
  ExternalLink,
  Truck,
  CreditCard,
  PiggyBank,
  Wallet,
  Receipt,
  Clock,
  Activity,
  CheckCircle2,
  AlertTriangle,
  LogOut,
  Menu,
  ChevronDown,
} from "lucide-react";

import AiDock from "./ai-dock";
import { supabase, SUPABASE_CONFIGURED } from "@/lib/supabase";
import { hasPerm, canManageUsers } from "@/lib/authz";

/* =========================================================
   BRAND (white + pro)
========================================================= */
const BRAND = {
  name: "UnicOs",
  accent: "#0ea5e9", // sky-500
  accent2: "#2563eb", // blue-600
  grad: "linear-gradient(135deg, #0ea5e9 0%, #2563eb 100%)",
};

const SCORE_ORG_ID = "1f3b9980-a1c5-4557-b4eb-a75bb9a8aaa6";

/* =========================================================
   Helpers
========================================================= */
const isUuid = (s) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(s || "").trim());

const normEmail = (s) => String(s || "").trim().toLowerCase();
const num = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

const moneyMXN = (v) =>
  new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", maximumFractionDigits: 2 }).format(
    Number.isFinite(Number(v)) ? Number(v) : 0
  );

function BrandMark({ size = 36 }) {
  return (
    <div
      style={{ background: BRAND.grad, width: size, height: size }}
      className="rounded-2xl shadow-md flex items-center justify-center text-white font-black"
      aria-label="UnicOs"
    >
      U
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
    <div className="fixed top-5 left-1/2 -translate-x-1/2 z-[9999]">
      <div className={clsx("px-5 py-3 rounded-2xl border shadow-xl text-sm font-black", tone)}>{t.text}</div>
    </div>
  );
}

/**
 * HelpTip: icono "?" pequeño, click -> explicación
 * No usa librerías extra. Cierra al click fuera / Escape.
 */
function HelpTip({ title = "Ayuda", text }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const onDown = (e) => {
      if (!open) return;
      if (e.key === "Escape") setOpen(false);
    };
    const onClick = (e) => {
      if (!open) return;
      if (!ref.current) return;
      if (!ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("keydown", onDown);
    document.addEventListener("mousedown", onClick);
    return () => {
      document.removeEventListener("keydown", onDown);
      document.removeEventListener("mousedown", onClick);
    };
  }, [open]);

  return (
    <span className="relative inline-flex" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center justify-center w-7 h-7 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600"
        aria-label="Ayuda"
        title="¿Qué es esto?"
      >
        <HelpCircle size={16} />
      </button>

      {open ? (
        <div className="absolute z-[9999] top-9 right-0 w-[320px] max-w-[85vw]">
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

/* =========================================================
   Supabase “org-safe” accessors (org_id / organization_id)
========================================================= */
async function selectAdminRole(orgId, user) {
  const email = normEmail(user?.email);
  const uid = user?.id || "00000000-0000-0000-0000-000000000000";

  // Try org_id first
  const q1 = await supabase
    .from("admin_users")
    .select("role,is_active,email,user_id,org_id,organization_id")
    .eq("org_id", orgId)
    .eq("is_active", true)
    .or(`user_id.eq.${uid},email.ilike.${email}`)
    .limit(1)
    .maybeSingle();

  if (!q1.error && q1.data?.is_active) return String(q1.data.role || "").toLowerCase();

  // Fallback organization_id
  const q2 = await supabase
    .from("admin_users")
    .select("role,is_active,email,user_id,org_id,organization_id")
    .eq("organization_id", orgId)
    .eq("is_active", true)
    .or(`user_id.eq.${uid},email.ilike.${email}`)
    .limit(1)
    .maybeSingle();

  if (!q2.error && q2.data?.is_active) return String(q2.data.role || "").toLowerCase();
  return null;
}

function ImgBadge({ src, alt }) {
  // “cuadradas con fondo blanco” -> contenedor pro
  return (
    <div className="w-12 h-12 rounded-2xl border border-slate-200 bg-white shadow-sm flex items-center justify-center overflow-hidden relative">
      <div className="absolute inset-0 bg-gradient-to-br from-slate-50 to-white" />
      {src ? (
        <Image src={src} alt={alt || "img"} fill className="object-contain p-2 relative" />
      ) : (
        <span className="text-xs font-black text-slate-400 relative">IMG</span>
      )}
    </div>
  );
}

function MiniKPI({ label, value, icon, note }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">{label}</p>
          <p className="text-lg font-black text-slate-900 mt-1 truncate">{value}</p>
          {note ? <p className="text-[11px] font-semibold text-slate-500 mt-1">{note}</p> : null}
        </div>
        <div className="w-9 h-9 rounded-2xl bg-sky-50 text-sky-700 flex items-center justify-center border border-sky-100">
          {icon}
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   Views
========================================================= */
function DashboardView({ orgId, role, token, toast }) {
  const [busy, setBusy] = useState(false);
  const [kpi, setKpi] = useState({
    gross: 0,
    net: 0,
    orders: 0,
    avg: 0,
    stripeFee: 0,
    stripeMode: "estimate",
    enviaCost: 0,
    updatedAt: null,
    lastOrders: [],
  });

  const canDash = hasPerm(role, "dashboard");

  const load = useCallback(async () => {
    if (!orgId || !canDash) return;

    setBusy(true);
    try {
      // Orders (real)
      const qOrders1 = await supabase
        .from("orders")
        .select("id, amount_total_mxn, status, stripe_session_id, created_at")
        .or(`org_id.eq.${orgId},organization_id.eq.${orgId}`)
        .in("status", ["paid", "fulfilled"])
        .order("created_at", { ascending: false })
        .limit(650);

      if (qOrders1.error) throw qOrders1.error;
      const list = qOrders1.data || [];

      const gross = list.reduce((a, o) => a + num(o.amount_total_mxn), 0);
      const orders = list.length;
      const avg = orders ? gross / orders : 0;

      // Envía cost: shipping_labels.raw (real)
      const qLabels = await supabase
        .from("shipping_labels")
        .select("raw, created_at")
        .or(`org_id.eq.${orgId},organization_id.eq.${orgId}`)
        .order("created_at", { ascending: false })
        .limit(900);

      const labelList = qLabels?.data || [];
      const enviaCost = labelList.reduce((acc, r) => {
        const raw = r?.raw || {};
        const total =
          num(raw?.totalAmount) ||
          num(raw?.data?.totalAmount) ||
          num(raw?.shipment?.totalAmount) ||
          num(raw?.amount) ||
          0;
        return acc + total;
      }, 0);

      // Stripe fee real (endpoint) o fallback estimate
      let stripeFee = 0;
      let stripeMode = "estimate";
      try {
        const stripeSessions = list.map((o) => o.stripe_session_id).filter(Boolean).slice(0, 120);
        if (stripeSessions.length && token) {
          const res = await fetch("/api/stripe/fees", {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
            body: JSON.stringify({ org_id: orgId, stripe_session_ids: stripeSessions }),
          });
          const j = await res.json().catch(() => ({}));
          if (res.ok && j?.ok) {
            stripeFee = num(j.total_fee_mxn);
            stripeMode = "stripe";
          } else {
            stripeFee = Math.round(gross * 0.039);
            stripeMode = "estimate";
          }
        } else {
          stripeFee = Math.round(gross * 0.039);
          stripeMode = "estimate";
        }
      } catch {
        stripeFee = Math.round(gross * 0.039);
        stripeMode = "estimate";
      }

      // GANANCIA “presentada”: 70% del neto (sin mencionarlo)
      const netRaw = Math.max(0, gross - stripeFee - enviaCost);
      const net = Math.max(0, netRaw * 0.7);

      setKpi({
        gross,
        net,
        orders,
        avg,
        stripeFee,
        stripeMode,
        enviaCost,
        updatedAt: new Date().toISOString(),
        lastOrders: list.slice(0, 12),
      });
    } catch (e) {
      toast?.({ type: "bad", text: String(e?.message || e) });
    } finally {
      setBusy(false);
    }
  }, [orgId, canDash, token, toast]);

  useEffect(() => {
    load();
  }, [load]);

  if (!canDash) {
    return (
      <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm font-black text-slate-900">No tienes permisos para ver el dashboard.</p>
        <p className="text-sm font-semibold text-slate-600 mt-2">Pide acceso a un admin.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-[2rem] border border-slate-200 bg-white shadow-sm p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-3">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
                <PiggyBank size={14} className="text-sky-600" /> Ganancia Score Store
              </p>

              <HelpTip
                title="¿Qué es esta ganancia?"
                text="Este número resume ingresos y costos principales en tiempo real (ventas pagadas, comisión de pago y costo logístico). Úsalo como indicador rápido de salud del negocio."
              />
            </div>

            <h3 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight mt-1">
              {moneyMXN(kpi.net)}
            </h3>

            <p className="text-sm font-semibold text-slate-600 mt-1">
              Resumen en vivo: ventas pagadas, comisiones y logística.
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
          <MiniKPI label="Ganancia" value={moneyMXN(kpi.net)} icon={<Wallet size={14} />} />
          <MiniKPI
            label="Comisión Stripe"
            value={moneyMXN(kpi.stripeFee)}
            note={kpi.stripeMode === "stripe" ? "Real" : "Estimado"}
            icon={<CreditCard size={14} />}
          />
          <MiniKPI label="Costo Envía.com" value={moneyMXN(kpi.enviaCost)} icon={<Truck size={14} />} />
          <MiniKPI label="Ventas pagadas" value={moneyMXN(kpi.gross)} icon={<Receipt size={14} />} />
          <MiniKPI label="Pedidos" value={String(kpi.orders)} icon={<ShoppingCart size={14} />} />
          <MiniKPI label="Ticket promedio" value={moneyMXN(kpi.avg)} icon={<Activity size={14} />} />
          <MiniKPI label="Estado" value={busy ? "Cargando…" : "Listo"} icon={<CheckCircle2 size={14} />} />
          <MiniKPI label="Hora" value={kpi.updatedAt ? new Date(kpi.updatedAt).toLocaleTimeString("es-MX") : "—"} icon={<Clock size={14} />} />
        </div>
      </div>

      <div className="rounded-[2rem] border border-slate-200 bg-white shadow-sm p-6">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <p className="text-sm font-black text-slate-900">Últimos pedidos pagados</p>
            <HelpTip
              title="¿Para qué sirve?"
              text="Te deja ver actividad reciente. Si esto se queda en cero por mucho tiempo, el sitio podría tener fricción en pago o tráfico bajo."
            />
          </div>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[720px]">
            <thead>
              <tr className="text-left text-[10px] font-black uppercase tracking-widest text-slate-500">
                <th className="py-2 pr-3">Fecha</th>
                <th className="py-2 pr-3">ID</th>
                <th className="py-2 pr-3">Monto</th>
                <th className="py-2 pr-3">Estado</th>
              </tr>
            </thead>
            <tbody>
              {(kpi.lastOrders || []).map((o) => (
                <tr key={o.id} className="border-t border-slate-200">
                  <td className="py-3 pr-3 text-sm font-semibold text-slate-700">
                    {o.created_at ? new Date(o.created_at).toLocaleString("es-MX") : "—"}
                  </td>
                  <td className="py-3 pr-3 text-sm font-black text-slate-900">{String(o.id).slice(0, 10)}…</td>
                  <td className="py-3 pr-3 text-sm font-black text-slate-900">{moneyMXN(o.amount_total_mxn || 0)}</td>
                  <td className="py-3 pr-3">
                    <span className="inline-flex items-center px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-[11px] font-black border border-emerald-200">
                      {String(o.status || "").toUpperCase()}
                    </span>
                  </td>
                </tr>
              ))}

              {!kpi.lastOrders?.length ? (
                <tr>
                  <td colSpan={4} className="py-10">
                    <p className="text-sm font-semibold text-slate-500">Sin pedidos recientes.</p>
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

function ProductsView({ orgId, role, toast }) {
  const canWrite = hasPerm(role, "catalog");
  const [busy, setBusy] = useState(false);
  const [rows, setRows] = useState([]);
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  const emptyForm = useMemo(
    () => ({
      sku: "",
      name: "",
      description: "",
      price_mxn: "",
      stock: "",
      section_id: "EDICION_2025",
      sub_section: "GENERAL",
      category: "BAJA_1000",
      rank: "999",
      is_active: true,
      sizes_csv: "S,M,L,XL,XXL",
      image_url: "",
      images_lines: "",
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
          "id, sku, name, description, price_mxn, base_mxn, price_cents, stock, section_id, sub_section, category, rank, images, sizes, image_url, img, is_active, active, deleted_at, created_at"
        )
        .or(`org_id.eq.${orgId},organization_id.eq.${orgId}`)
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
      const t = `${r?.name || ""} ${r?.sku || ""} ${r?.section_id || ""} ${r?.category || ""}`.toLowerCase();
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
      sku: row?.sku || "",
      name: row?.name || "",
      description: row?.description || "",
      price_mxn: String(row?.price_mxn ?? row?.base_mxn ?? ""),
      stock: String(row?.stock ?? ""),
      section_id: row?.section_id || "EDICION_2025",
      sub_section: row?.sub_section || "GENERAL",
      category: row?.category || "BAJA_1000",
      rank: String(row?.rank ?? "999"),
      is_active: !!(row?.is_active ?? row?.active ?? true),
      sizes_csv: sizes || "S,M,L,XL,XXL",
      images_lines: images || "",
      image_url: row?.image_url || row?.img || "",
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
    if (!canWrite) return toast?.({ type: "bad", text: "No tienes permisos para editar catálogo." });

    const sku = String(form.sku || "").trim();
    const name = String(form.name || "").trim();
    if (!sku) return toast?.({ type: "bad", text: "Falta SKU." });
    if (!name) return toast?.({ type: "bad", text: "Falta nombre." });

    const price = Number(form.price_mxn);
    if (!Number.isFinite(price) || price <= 0) return toast?.({ type: "bad", text: "Precio MXN inválido." });

    const stock = Number(form.stock);
    const sizes = String(form.sizes_csv || "")
      .split(",")
      .map((x) => String(x || "").trim())
      .filter(Boolean);

    const images = String(form.images_lines || "")
      .split("\n")
      .map((x) => String(x || "").trim())
      .filter(Boolean);

    const image_url = String(form.image_url || "").trim() || images[0] || null;

    const payload = {
      // compat org columns
      org_id: orgId,
      organization_id: orgId,

      sku,
      name,
      description: String(form.description || "").trim() || null,

      // schema real: base_mxn NOT NULL (y price_mxn exists)
      base_mxn: price,
      price_mxn: price,
      price_cents: Math.round(price * 100),

      stock: Number.isFinite(stock) ? Math.max(0, Math.floor(stock)) : 0,

      section_id: String(form.section_id || "EDICION_2025").trim() || "EDICION_2025",
      sub_section: String(form.sub_section || "GENERAL").trim() || "GENERAL",
      category: String(form.category || "BAJA_1000").trim() || "BAJA_1000",
      rank: Number.isFinite(Number(form.rank)) ? Number(form.rank) : 999,

      is_active: !!form.is_active,
      active: !!form.is_active,

      sizes: sizes.length ? sizes : [],
      images: images.length ? images : [],
      image_url,
      img: image_url, // compat

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
    if (!canWrite) return toast?.({ type: "bad", text: "No tienes permisos para eliminar." });

    const ok = confirm(`¿Eliminar "${row?.name || row?.sku || "producto"}"? (Se puede recuperar reactivando)`);
    if (!ok) return;

    setBusy(true);
    try {
      const { error } = await supabase
        .from("products")
        .update({ deleted_at: new Date().toISOString(), is_active: false, active: false, updated_at: new Date().toISOString() })
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
        <div className="min-w-0">
          <div className="flex items-center gap-3">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">Catálogo</p>
            <HelpTip
              title="Catálogo (en vivo)"
              text="Estos productos alimentan Score Store en tiempo real. Si aquí cambias precio/stock/imágenes, Score Store lo refleja al cargar catálogo."
            />
          </div>
          <h4 className="text-lg font-black text-slate-900">Productos</h4>
          <p className="text-sm font-semibold text-slate-600">
            Control total sin tocar código: precio, stock, imágenes, sección y orden.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
          <div className="flex items-center gap-2 px-4 py-2 rounded-2xl border border-slate-200 bg-white">
            <Search size={16} className="text-slate-500" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Buscar por nombre / SKU / sección…"
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
              canWrite ? "text-white hover:opacity-95" : "bg-slate-200 text-slate-500 cursor-not-allowed"
            )}
            style={canWrite ? { background: BRAND.grad } : {}}
          >
            <Plus size={16} /> Nuevo
          </button>
        </div>
      </div>

      <div className="mt-5 overflow-x-auto">
        <table className="w-full min-w-[1100px]">
          <thead>
            <tr className="text-left text-[10px] font-black uppercase tracking-widest text-slate-500">
              <th className="py-2 pr-3">Producto</th>
              <th className="py-2 pr-3">SKU</th>
              <th className="py-2 pr-3">Sección</th>
              <th className="py-2 pr-3">Precio</th>
              <th className="py-2 pr-3">Stock</th>
              <th className="py-2 pr-3">Activo</th>
              <th className="py-2 pr-3 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {(filtered || []).map((r) => {
              const imgSrc = r?.image_url || r?.img || (Array.isArray(r?.images) ? r.images[0] : null);
              const active = !!(r?.is_active ?? r?.active ?? true);

              return (
                <tr key={r.id} className="border-t border-slate-200">
                  <td className="py-3 pr-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <ImgBadge src={imgSrc} alt={r?.name || "Producto"} />
                      <div className="min-w-0">
                        <p className="text-sm font-black text-slate-900 truncate">{r?.name || "—"}</p>
                        <p className="text-xs font-semibold text-slate-500 truncate">
                          Rank: {String(r?.rank ?? "—")} · Cat: {String(r?.category || "—")}
                        </p>
                      </div>
                    </div>
                  </td>

                  <td className="py-3 pr-3">
                    <p className="text-sm font-black text-slate-900">{r?.sku || "—"}</p>
                  </td>

                  <td className="py-3 pr-3">
                    <p className="text-sm font-black text-slate-900">{r?.section_id || "—"}</p>
                    <p className="text-xs font-semibold text-slate-500">{r?.sub_section || "—"}</p>
                  </td>

                  <td className="py-3 pr-3">
                    <p className="text-sm font-black text-slate-900">
                      {moneyMXN(r?.price_mxn ?? r?.base_mxn ?? 0)}
                    </p>
                  </td>

                  <td className="py-3 pr-3">
                    <p className="text-sm font-black text-slate-900">{Number(r?.stock ?? 0)}</p>
                  </td>

                  <td className="py-3 pr-3">
                    <span
                      className={clsx(
                        "inline-flex items-center px-3 py-1 rounded-full text-[11px] font-black border",
                        active ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-slate-100 text-slate-600 border-slate-200"
                      )}
                    >
                      {active ? "Sí" : "No"}
                    </span>
                  </td>

                  <td className="py-3 pr-3 text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => openEdit(r)}
                        disabled={!canWrite}
                        className={clsx(
                          "px-3 py-2 rounded-2xl font-black text-sm border flex items-center gap-2",
                          canWrite
                            ? "border-slate-200 bg-white hover:bg-slate-50 text-slate-900"
                            : "border-slate-200 bg-slate-100 text-slate-400 cursor-not-allowed"
                        )}
                      >
                        <Pencil size={14} /> Editar
                      </button>

                      <button
                        onClick={() => softDelete(r)}
                        disabled={!canWrite}
                        className={clsx(
                          "px-3 py-2 rounded-2xl font-black text-sm border flex items-center gap-2",
                          canWrite
                            ? "border-red-200 bg-red-50 hover:bg-red-100 text-red-700"
                            : "border-slate-200 bg-slate-100 text-slate-400 cursor-not-allowed"
                        )}
                      >
                        <Trash2 size={14} /> Eliminar
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}

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

      {/* Modal */}
      {open ? (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={closeModal} role="button" aria-label="Cerrar modal" />
          <div className="relative w-full max-w-3xl rounded-[2rem] border border-slate-200 bg-white shadow-2xl p-6">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">
                  {editing?.id ? "Editar" : "Nuevo"} producto
                </p>
                <h4 className="text-lg font-black text-slate-900 truncate">
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
                <div className="flex items-center justify-between gap-2">
                  <label className="text-xs font-black text-slate-700">Nombre</label>
                  <HelpTip title="Nombre" text="Este es el nombre visible en Score Store. Mantén nombres claros y cortos." />
                </div>
                <input
                  value={form.name}
                  onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                  className="mt-1 w-full px-4 py-3 rounded-2xl border border-slate-200 bg-white font-semibold text-slate-900 outline-none"
                />
              </div>

              <div>
                <div className="flex items-center justify-between gap-2">
                  <label className="text-xs font-black text-slate-700">SKU</label>
                  <HelpTip title="SKU" text="Identificador único. Score Store usa SKU para carrito y checkout. No lo cambies si ya vendiste." />
                </div>
                <input
                  value={form.sku}
                  onChange={(e) => setForm((p) => ({ ...p, sku: e.target.value }))}
                  className="mt-1 w-full px-4 py-3 rounded-2xl border border-slate-200 bg-white font-semibold text-slate-900 outline-none"
                />
              </div>

              <div>
                <div className="flex items-center justify-between gap-2">
                  <label className="text-xs font-black text-slate-700">Precio MXN</label>
                  <HelpTip title="Precio" text="Este precio se usa en catálogo y en checkout (Stripe). Siempre en MXN." />
                </div>
                <input
                  value={form.price_mxn}
                  onChange={(e) => setForm((p) => ({ ...p, price_mxn: e.target.value }))}
                  inputMode="decimal"
                  className="mt-1 w-full px-4 py-3 rounded-2xl border border-slate-200 bg-white font-semibold text-slate-900 outline-none"
                />
                <p className="text-[11px] font-semibold text-slate-500 mt-1">Stripe usa centavos automáticamente.</p>
              </div>

              <div>
                <div className="flex items-center justify-between gap-2">
                  <label className="text-xs font-black text-slate-700">Stock</label>
                  <HelpTip title="Stock" text="Si stock = 0, Score Store puede marcarlo como agotado. Úsalo para control real." />
                </div>
                <input
                  value={form.stock}
                  onChange={(e) => setForm((p) => ({ ...p, stock: e.target.value }))}
                  inputMode="numeric"
                  className="mt-1 w-full px-4 py-3 rounded-2xl border border-slate-200 bg-white font-semibold text-slate-900 outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-black text-slate-700">section_id</label>
                <input
                  value={form.section_id}
                  onChange={(e) => setForm((p) => ({ ...p, section_id: e.target.value }))}
                  className="mt-1 w-full px-4 py-3 rounded-2xl border border-slate-200 bg-white font-semibold text-slate-900 outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-black text-slate-700">sub_section</label>
                <input
                  value={form.sub_section}
                  onChange={(e) => setForm((p) => ({ ...p, sub_section: e.target.value }))}
                  className="mt-1 w-full px-4 py-3 rounded-2xl border border-slate-200 bg-white font-semibold text-slate-900 outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-black text-slate-700">category</label>
                <input
                  value={form.category}
                  onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))}
                  className="mt-1 w-full px-4 py-3 rounded-2xl border border-slate-200 bg-white font-semibold text-slate-900 outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-black text-slate-700">Rank</label>
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
                      "px-4 py-3 rounded-2xl font-black text-sm text-white",
                      busy ? "opacity-70" : "hover:opacity-95"
                    )}
                    style={{ background: BRAND.grad }}
                  >
                    Guardar
                  </button>
                </div>
              </div>
            </div>

            <p className="text-[11px] font-semibold text-slate-500 mt-4">
              Nota: Score Store consume estos datos vía <code>/.netlify/functions/catalog</code> y valida precios en checkout.
            </p>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function MarketingView({ orgId, role, token, toast }) {
  const canMarketing = hasPerm(role, "marketing") || hasPerm(role, "integrations");
  const [busy, setBusy] = useState(false);
  const [settings, setSettings] = useState({
    promo_active: false,
    promo_text: "",
    pixel_id: "",
    hero_title: "",
  });

  const load = useCallback(async () => {
    if (!orgId) return;
    setBusy(true);
    try {
      const { data, error } = await supabase
        .from("site_settings")
        .select("promo_active,promo_text,pixel_id,hero_title,updated_at")
        .or(`org_id.eq.${orgId},organization_id.eq.${orgId}`)
        .limit(1)
        .maybeSingle();

      if (error && error.code !== "PGRST116") throw error;

      setSettings({
        promo_active: !!data?.promo_active,
        promo_text: String(data?.promo_text || ""),
        pixel_id: String(data?.pixel_id || ""),
        hero_title: String(data?.hero_title || ""),
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
    if (!canMarketing) return toast?.({ type: "bad", text: "No tienes permisos de Marketing/Integraciones." });

    setBusy(true);
    try {
      const payload = {
        org_id: orgId,
        organization_id: orgId,
        promo_active: !!settings.promo_active,
        promo_text: String(settings.promo_text || "").trim() || null,
        pixel_id: String(settings.pixel_id || "").trim() || null,
        hero_title: String(settings.hero_title || "").trim() || null,
        updated_at: new Date().toISOString(),
      };

      // onConflict puede variar, hacemos 2 intentos
      let ok = false;
      try {
        const r1 = await supabase.from("site_settings").upsert(payload, { onConflict: "org_id" });
        if (r1.error) throw r1.error;
        ok = true;
      } catch {
        const r2 = await supabase.from("site_settings").upsert(payload, { onConflict: "organization_id" });
        if (r2.error) throw r2.error;
        ok = true;
      }

      if (ok) toast?.({ type: "ok", text: "Marketing guardado." });
    } catch (e) {
      toast?.({ type: "bad", text: String(e?.message || e) });
    } finally {
      setBusy(false);
      load();
    }
  };

  return (
    <div className="rounded-[2rem] border border-slate-200 bg-white shadow-sm p-6">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-3">
            <h3 className="text-lg font-black text-slate-900">Marketing (Score Store)</h3>
            <HelpTip
              title="¿Qué hago aquí?"
              text="Controlas mensajes visibles en Score Store sin tocar código: megáfono (barra promo), Pixel Meta y título del hero (si se habilita)."
            />
          </div>
          <p className="text-sm font-semibold text-slate-600 mt-1">
            Cambios en vivo a través de <code>/.netlify/functions/site_settings</code>.
          </p>
        </div>

        <button
          onClick={load}
          className="px-4 py-2 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 font-black text-sm flex items-center gap-2"
        >
          <RefreshCcw size={16} className={busy ? "animate-spin" : ""} /> Recargar
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-black text-slate-900 flex items-center gap-2">
              <Megaphone size={16} className="text-sky-700" /> Megáfono (Promo Bar)
            </p>
            <HelpTip title="Megáfono" text="Activa un mensaje fijo arriba del sitio. Ideal para promos, envíos gratis o urgencia." />
          </div>

          <label className="mt-4 flex items-center gap-2 text-sm font-black text-slate-800">
            <input
              type="checkbox"
              checked={!!settings.promo_active}
              onChange={(e) => setSettings((p) => ({ ...p, promo_active: e.target.checked }))}
              className="w-4 h-4"
            />
            Activar promo
          </label>

          <textarea
            value={settings.promo_text}
            onChange={(e) => setSettings((p) => ({ ...p, promo_text: e.target.value }))}
            rows={3}
            className="mt-3 w-full px-4 py-3 rounded-2xl border border-slate-200 bg-white font-semibold text-slate-900 outline-none"
            placeholder="Ej: Envío gratis en compras mayores a $999 — hoy"
          />

          <p className="text-[11px] font-semibold text-slate-500 mt-2">
            Tip: mensajes cortos, directos y con urgencia real.
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-black text-slate-900 flex items-center gap-2">
              <Activity size={16} className="text-sky-700" /> Pixel / Hero
            </p>
            <HelpTip
              title="Pixel y Hero"
              text="Pixel se usa para tracking de Meta Ads (solo si el usuario acepta cookies). Hero title permite ajustar título principal sin redeploy (si se usa en frontend)."
            />
          </div>

          <label className="text-xs font-black text-slate-700 mt-4 block">Pixel Meta (ID)</label>
          <input
            value={settings.pixel_id}
            onChange={(e) => setSettings((p) => ({ ...p, pixel_id: e.target.value }))}
            className="mt-1 w-full px-4 py-3 rounded-2xl border border-slate-200 bg-white font-semibold text-slate-900 outline-none"
            placeholder="Ej: 1234567890"
          />

          <label className="text-xs font-black text-slate-700 mt-4 block">Hero Title (opcional)</label>
          <input
            value={settings.hero_title}
            onChange={(e) => setSettings((p) => ({ ...p, hero_title: e.target.value }))}
            className="mt-1 w-full px-4 py-3 rounded-2xl border border-slate-200 bg-white font-semibold text-slate-900 outline-none"
            placeholder="Ej: Merch oficial SCORE — Baja Series"
          />
        </div>
      </div>

      <div className="flex items-center justify-end gap-2 mt-6">
        <button
          onClick={save}
          disabled={!canMarketing || busy}
          className={clsx(
            "px-5 py-3 rounded-2xl font-black text-sm text-white",
            (!canMarketing || busy) ? "opacity-60 cursor-not-allowed" : "hover:opacity-95"
          )}
          style={{ background: BRAND.grad }}
        >
          Guardar cambios
        </button>
      </div>
    </div>
  );
}

function UsersView({ orgId, role, token, toast }) {
  const canUsers = canManageUsers(role);
  const [busy, setBusy] = useState(false);
  const [rows, setRows] = useState([]);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("viewer");

  const load = useCallback(async () => {
    if (!orgId) return;
    setBusy(true);
    try {
      const { data, error } = await supabase
        .from("admin_users")
        .select("id,email,role,is_active,created_at,updated_at,org_id,organization_id")
        .or(`org_id.eq.${orgId},organization_id.eq.${orgId}`)
        .order("created_at", { ascending: false })
        .limit(300);

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

  const invite = async () => {
    if (!canUsers) return toast?.({ type: "bad", text: "No tienes permisos para invitar usuarios." });
    const email = normEmail(inviteEmail);
    if (!email || !email.includes("@")) return toast?.({ type: "bad", text: "Email inválido." });
    if (!token) return toast?.({ type: "bad", text: "Falta token de sesión." });

    setBusy(true);
    try {
      const res = await fetch("/api/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ org_id: orgId, email, role: inviteRole }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok || !j?.ok) throw new Error(j?.error || "No se pudo invitar.");

      toast?.({ type: "ok", text: "Invitación registrada." });
      setInviteEmail("");
      setInviteRole("viewer");
      load();
    } catch (e) {
      toast?.({ type: "bad", text: String(e?.message || e) });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="rounded-[2rem] border border-slate-200 bg-white shadow-sm p-6">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-3">
            <h3 className="text-lg font-black text-slate-900">Usuarios</h3>
            <HelpTip
              title="Usuarios"
              text="Aquí controlas quién puede entrar al panel. Roles típicos: owner/admin (todo), marketing (promos/pixel), ops/support (pedidos/soporte), viewer (solo ver)."
            />
          </div>
          <p className="text-sm font-semibold text-slate-600 mt-1">Gestión real a través de Supabase (admin_users).</p>
        </div>

        <button
          onClick={load}
          className="px-4 py-2 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 font-black text-sm flex items-center gap-2"
        >
          <RefreshCcw size={16} className={busy ? "animate-spin" : ""} /> Recargar
        </button>
      </div>

      <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-5">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-black text-slate-900 flex items-center gap-2">
            <Users size={16} className="text-sky-700" /> Invitar usuario
          </p>
          <HelpTip title="Invitar" text="Ingresa el correo y asigna rol. El acceso se controla por email y/o user_id según sesión." />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-4">
          <input
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            placeholder="correo@dominio.com"
            className="px-4 py-3 rounded-2xl border border-slate-200 bg-white font-semibold text-slate-900 outline-none"
          />
          <select
            value={inviteRole}
            onChange={(e) => setInviteRole(e.target.value)}
            className="px-4 py-3 rounded-2xl border border-slate-200 bg-white font-black text-slate-900 outline-none"
          >
            <option value="viewer">viewer</option>
            <option value="support">support</option>
            <option value="ops">ops</option>
            <option value="marketing">marketing</option>
            <option value="admin">admin</option>
            <option value="owner">owner</option>
          </select>

          <button
            onClick={invite}
            disabled={!canUsers || busy}
            className={clsx(
              "px-5 py-3 rounded-2xl font-black text-sm text-white",
              (!canUsers || busy) ? "opacity-60 cursor-not-allowed" : "hover:opacity-95"
            )}
            style={{ background: BRAND.grad }}
          >
            Invitar
          </button>
        </div>
      </div>

      <div className="mt-5 overflow-x-auto">
        <table className="w-full min-w-[900px]">
          <thead>
            <tr className="text-left text-[10px] font-black uppercase tracking-widest text-slate-500">
              <th className="py-2 pr-3">Email</th>
              <th className="py-2 pr-3">Rol</th>
              <th className="py-2 pr-3">Activo</th>
              <th className="py-2 pr-3">Creado</th>
            </tr>
          </thead>
          <tbody>
            {(rows || []).map((r) => (
              <tr key={r.id} className="border-t border-slate-200">
                <td className="py-3 pr-3 text-sm font-black text-slate-900">{r.email || "—"}</td>
                <td className="py-3 pr-3 text-sm font-black text-slate-900">{r.role || "—"}</td>
                <td className="py-3 pr-3">
                  <span
                    className={clsx(
                      "inline-flex items-center px-3 py-1 rounded-full text-[11px] font-black border",
                      r.is_active ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-slate-100 text-slate-600 border-slate-200"
                    )}
                  >
                    {r.is_active ? "Sí" : "No"}
                  </span>
                </td>
                <td className="py-3 pr-3 text-sm font-semibold text-slate-700">
                  {r.created_at ? new Date(r.created_at).toLocaleString("es-MX") : "—"}
                </td>
              </tr>
            ))}

            {!rows?.length ? (
              <tr>
                <td colSpan={4} className="py-10">
                  <p className="text-sm font-semibold text-slate-500">Sin usuarios.</p>
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function SettingsView({ orgId, role, toast }) {
  const canSee = hasPerm(role, "dashboard") || hasPerm(role, "catalog") || hasPerm(role, "marketing");
  return (
    <div className="rounded-[2rem] border border-slate-200 bg-white shadow-sm p-6">
      <div className="flex items-center gap-3">
        <h3 className="text-lg font-black text-slate-900">Configuración</h3>
        <HelpTip
          title="Config"
          text="Aquí pondremos ajustes finos. Lo importante: tus variables de Netlify + Supabase están OK si ya ves datos reales en Dashboard/Catálogo."
        />
      </div>

      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
          <p className="text-sm font-black text-slate-900">Estado del sistema</p>
          <div className="mt-3 space-y-2">
            <div className="flex items-center justify-between rounded-xl bg-white border border-slate-200 px-4 py-3">
              <span className="text-sm font-black text-slate-800">Supabase</span>
              <span
                className={clsx(
                  "text-xs font-black px-3 py-1 rounded-full border",
                  SUPABASE_CONFIGURED ? "bg-emerald-50 text-emerald-900 border-emerald-200" : "bg-rose-50 text-rose-900 border-rose-200"
                )}
              >
                {SUPABASE_CONFIGURED ? "OK" : "FALTA"}
              </span>
            </div>

            <div className="flex items-center justify-between rounded-xl bg-white border border-slate-200 px-4 py-3">
              <span className="text-sm font-black text-slate-800">Org activa</span>
              <span className="text-xs font-black px-3 py-1 rounded-full border bg-sky-50 text-sky-900 border-sky-200">
                {orgId ? String(orgId).slice(0, 8) + "…" : "—"}
              </span>
            </div>

            <div className="flex items-center justify-between rounded-xl bg-white border border-slate-200 px-4 py-3">
              <span className="text-sm font-black text-slate-800">Permisos</span>
              <span className="text-xs font-black px-3 py-1 rounded-full border bg-slate-100 text-slate-700 border-slate-200">
                {role || "—"}
              </span>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
          <p className="text-sm font-black text-slate-900">Ayuda rápida</p>
          <p className="text-sm font-semibold text-slate-600 mt-2 leading-relaxed">
            Si algo no se ve o no carga, casi siempre es:
          </p>
          <ul className="mt-3 text-sm font-semibold text-slate-700 space-y-1">
            <li>• Org incorrecta (elige Score Store)</li>
            <li>• Falta variable en Netlify</li>
            <li>• RLS bloqueando (pero ya ejecutaste el fix)</li>
            <li>• No tienes rol/permiso para esa sección</li>
          </ul>
          {!canSee ? (
            <p className="mt-4 text-sm font-black text-rose-700">Tu rol actual no puede ver casi nada. Pide acceso.</p>
          ) : null}
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   Main Page
========================================================= */
export default function Page() {
  const { toast, show } = useToast();

  const [boot, setBoot] = useState({ ready: false, user: null, session: null });
  const [role, setRole] = useState(null);

  const [orgs, setOrgs] = useState([]);
  const [orgId, setOrgId] = useState(SCORE_ORG_ID);

  const [active, setActive] = useState("dashboard");
  const [mobileNav, setMobileNav] = useState(false);

  const token = boot?.session?.access_token || null;

  // Auth state
  useEffect(() => {
    if (!SUPABASE_CONFIGURED) return;

    let unsub = null;
    (async () => {
      const { data } = await supabase.auth.getSession();
      const s = data?.session || null;
      setBoot({ ready: true, user: s?.user || null, session: s });

      unsub = supabase.auth.onAuthStateChange((_event, session) => {
        setBoot({ ready: true, user: session?.user || null, session });
      })?.data?.subscription;
    })();

    return () => {
      try {
        unsub?.unsubscribe?.();
      } catch {}
    };
  }, []);

  // Load orgs (real)
  const loadOrgs = useCallback(async () => {
    if (!boot?.user) return;

    try {
      // organizations list
      const { data: o, error: oe } = await supabase
        .from("organizations")
        .select("id,name,slug,created_at")
        .order("created_at", { ascending: true })
        .limit(50);

      if (oe) throw oe;

      const list = (o || []).filter((x) => isUuid(x.id));
      setOrgs(list);

      // default to Score Store if exists
      const score = list.find((x) => x.id === SCORE_ORG_ID);
      if (score) setOrgId(SCORE_ORG_ID);
      else if (list[0]?.id) setOrgId(list[0].id);
    } catch (e) {
      show({ type: "bad", text: String(e?.message || e) });
    }
  }, [boot?.user, show]);

  // Resolve role for selected org
  const resolveRole = useCallback(async () => {
    if (!boot?.user || !orgId) return;

    try {
      const r = await selectAdminRole(orgId, boot.user);
      setRole(r);
      if (!r) {
        show({
          type: "warn",
          text: "Sin rol para esta organización. Pide acceso a un admin.",
        });
      }
    } catch (e) {
      show({ type: "bad", text: String(e?.message || e) });
    }
  }, [boot?.user, orgId, show]);

  useEffect(() => {
    loadOrgs();
  }, [loadOrgs]);

  useEffect(() => {
    resolveRole();
  }, [resolveRole]);

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      show({ type: "ok", text: "Sesión cerrada." });
    } catch {
      show({ type: "bad", text: "No se pudo cerrar sesión." });
    }
  };

  if (!SUPABASE_CONFIGURED) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="max-w-xl w-full bg-white border border-slate-200 rounded-[2rem] shadow-2xl p-8">
          <div className="flex items-center gap-3">
            <BrandMark size={44} />
            <div className="min-w-0">
              <h1 className="text-lg font-black text-slate-900 tracking-tight">UnicOs — Setup requerido</h1>
              <p className="text-xs font-semibold text-slate-600">Faltan variables NEXT_PUBLIC_* de Supabase.</p>
            </div>
          </div>

          <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <p className="text-sm font-black text-slate-900">Checklist</p>
            <ul className="mt-3 text-sm font-semibold text-slate-700 space-y-1">
              <li>• NEXT_PUBLIC_SUPABASE_URL</li>
              <li>• NEXT_PUBLIC_SUPABASE_ANON_KEY</li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  if (!boot.ready) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="rounded-[2rem] border border-slate-200 bg-white shadow-sm p-6">
          <p className="text-sm font-black text-slate-900">Cargando…</p>
        </div>
      </div>
    );
  }

  if (!boot.user) {
    // Mantengo simple: si tu repo ya tiene login UI en otro lado, aquí solo informamos.
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white border border-slate-200 rounded-[2rem] shadow-2xl p-8 text-center">
          <div className="mx-auto h-16 w-16 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center mb-6">
            <Shield size={32} />
          </div>
          <h2 className="text-xl font-black text-slate-900 mb-2">Sesión requerida</h2>
          <p className="text-sm text-slate-500 font-semibold leading-relaxed">
            Inicia sesión en tu flujo actual (Supabase Auth). Si ya lo hiciste y no te reconoce, recarga.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="mt-6 px-5 py-3 rounded-2xl text-white font-black shadow-sm hover:opacity-95"
            style={{ background: BRAND.grad }}
          >
            Recargar
          </button>
        </div>
      </div>
    );
  }

  const nav = [
    { id: "dashboard", name: "Dashboard", icon: <LayoutDashboard size={18} /> },
    { id: "products", name: "Productos", icon: <Package size={18} /> },
    { id: "marketing", name: "Marketing", icon: <Megaphone size={18} /> },
    { id: "users", name: "Usuarios", icon: <Users size={18} /> },
    { id: "settings", name: "Config", icon: <Settings size={18} /> },
  ];

  const View = () => {
    if (active === "dashboard") return <DashboardView orgId={orgId} role={role} token={token} toast={show} />;
    if (active === "products") return <ProductsView orgId={orgId} role={role} toast={show} />;
    if (active === "marketing") return <MarketingView orgId={orgId} role={role} token={token} toast={show} />;
    if (active === "users") return <UsersView orgId={orgId} role={role} token={token} toast={show} />;
    return <SettingsView orgId={orgId} role={role} toast={show} />;
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Toast t={toast} />

      {/* Topbar */}
      <div className="sticky top-0 z-40 border-b border-slate-200 bg-white/85 backdrop-blur">
        <div className="max-w-[1400px] mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => setMobileNav((v) => !v)}
              className="md:hidden w-10 h-10 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 flex items-center justify-center"
              aria-label="Abrir menú"
            >
              <Menu size={18} />
            </button>

            <BrandMark size={40} />

            <div className="min-w-0">
              <p className="text-sm font-black text-slate-900 leading-tight">{BRAND.name}</p>
              <p className="text-xs font-semibold text-slate-500 leading-tight">
                Panel operativo — {orgId === SCORE_ORG_ID ? "Score Store" : "Organización"}
              </p>
            </div>
          </div>

          {/* Org selector */}
          <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-2">
              <HelpTip
                title="Organización"
                text="Selecciona el negocio que quieres administrar. Si eliges Score Store, todo lo que edites afecta al e-commerce."
              />
              <div className="relative">
                <select
                  value={orgId || ""}
                  onChange={(e) => setOrgId(e.target.value)}
                  className="px-4 py-2 rounded-2xl border border-slate-200 bg-white font-black text-slate-900 outline-none pr-10"
                >
                  {(orgs || []).map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.name || o.slug || String(o.id).slice(0, 8)}
                    </option>
                  ))}
                </select>
                <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
              </div>
            </div>

            <button
              onClick={signOut}
              className="px-4 py-2 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 font-black text-sm flex items-center gap-2"
            >
              <LogOut size={16} /> Salir
            </button>
          </div>
        </div>
      </div>

      {/* Layout */}
      <div className="max-w-[1400px] mx-auto px-4 py-6 grid grid-cols-1 md:grid-cols-[260px_1fr] gap-6">
        {/* Sidebar */}
        <aside className={clsx("md:block", mobileNav ? "block" : "hidden md:block")}>
          <div className="rounded-[2rem] border border-slate-200 bg-white shadow-sm p-4">
            <div className="flex items-center justify-between gap-3 mb-3">
              <p className="text-xs font-black uppercase tracking-widest text-slate-500">Navegación</p>
              <HelpTip
                title="Tip"
                text="Si el dueño no entiende una sección, que toque el ícono “?” para ver explicación."
              />
            </div>

            <div className="grid gap-2">
              {nav.map((n) => (
                <button
                  key={n.id}
                  onClick={() => {
                    setActive(n.id);
                    setMobileNav(false);
                  }}
                  className={clsx(
                    "w-full flex items-center gap-3 px-4 py-3 rounded-2xl border font-black text-sm transition",
                    active === n.id
                      ? "bg-slate-900 text-white border-slate-900"
                      : "bg-white text-slate-800 border-slate-200 hover:bg-slate-50"
                  )}
                >
                  <span className={clsx("w-9 h-9 rounded-2xl flex items-center justify-center border",
                    active === n.id ? "bg-white/10 border-white/10" : "bg-slate-50 border-slate-200"
                  )}>
                    {n.icon}
                  </span>
                  <span className="truncate">{n.name}</span>
                </button>
              ))}
            </div>

            <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-black text-slate-900">Acceso</p>
              <p className="text-xs font-semibold text-slate-600 mt-1 break-words">{normEmail(boot.user?.email)}</p>
              <div className="flex items-center gap-2 mt-3">
                <span className="text-[11px] font-black px-3 py-1 rounded-full border bg-slate-100 text-slate-700 border-slate-200">
                  {role || "sin rol"}
                </span>
                {!role ? (
                  <span className="text-[11px] font-black px-3 py-1 rounded-full border bg-amber-50 text-amber-800 border-amber-200">
                    pide acceso
                  </span>
                ) : null}
              </div>
            </div>
          </div>

          {/* AI Dock (mantengo tu módulo existente) */}
          <div className="mt-6">
            <AiDock orgId={orgId} role={role} token={token} />
          </div>
        </aside>

        {/* Main */}
        <main className="space-y-6">
          <View />
        </main>
      </div>
    </div>
  );
}