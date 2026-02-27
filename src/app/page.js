// src/app/page.js
"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { supabase } from "@/lib/supabase";
import {
  AlertTriangle,
  BarChart3,
  Bot,
  ChevronDown,
  CheckCircle,
  DollarSign,
  Info,
  LogOut,
  Menu,
  Megaphone,
  Package,
  RefreshCcw,
  Send,
  ShoppingCart,
  Sparkles,
  Truck,
  Users,
  X,
} from "lucide-react";

const moneyMXN = (v) =>
  Number(v || 0).toLocaleString("es-MX", { style: "currency", currency: "MXN" });

const num = (v) => Number(v || 0).toLocaleString("en-US");

const normEmail = (s) => String(s || "").trim().toLowerCase();

const BRAND_ICON = "/icon-512.png"; // logo oficial (PWA icon)

function LoginScreen({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { data, error: loginError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (loginError) setError(loginError.message);
    else if (data?.session) onLogin(data.session);

    setLoading(false);
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-slate-900 p-6 font-sans">
      <div className="max-w-md w-full bg-slate-800 border border-slate-700 rounded-3xl shadow-2xl p-10 overflow-hidden relative">
        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>

        <div className="relative z-10 flex flex-col items-center">
          <div className="relative w-20 h-20 bg-slate-900 rounded-2xl flex items-center justify-center mb-6 shadow-inner border border-slate-700 overflow-hidden">
            <Image
              src={BRAND_ICON}
              alt="UnicOs"
              fill
              sizes="80px"
              priority
              className="object-contain p-2"
            />
          </div>
          <h1 className="text-3xl font-black text-white mb-2 tracking-tight">
            UnicOs <span className="text-blue-500">Enterprise</span>
          </h1>
          <p className="text-slate-400 text-sm mb-8 text-center font-medium">
            Centro de Control Global
          </p>

          {error && (
            <div className="w-full bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl mb-6 text-sm flex items-start">
              <AlertTriangle className="mr-3 flex-shrink-0 mt-0.5" size={16} />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="w-full space-y-5">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                Correo
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 text-white px-4 py-3 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all placeholder-slate-600"
                placeholder="tu@correo.com"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                Contraseña
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 text-white px-4 py-3 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all placeholder-slate-600"
                placeholder="••••••••"
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white font-black py-4 rounded-xl hover:bg-blue-500 transition-colors shadow-lg shadow-blue-500/30 flex items-center justify-center mt-4 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                "Acceder"
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

function LoadingScreen({ text = "Sincronizando..." }) {
  return (
    <div className="min-h-screen w-full bg-slate-900 flex flex-col items-center justify-center font-sans">
      <div className="w-16 h-16 border-4 border-slate-700 border-t-blue-500 rounded-full animate-spin mb-6"></div>
      <p className="text-slate-400 text-sm font-medium animate-pulse">{text}</p>
    </div>
  );
}

function EmptyStateMultiTenant() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-slate-900 p-6 font-sans">
      <div className="max-w-md w-full bg-slate-800 border border-slate-700 rounded-3xl shadow-2xl p-10 text-center">
        <div className="w-20 h-20 bg-slate-900 rounded-full flex items-center justify-center mx-auto mb-6">
          <AlertTriangle className="text-yellow-500" size={40} />
        </div>
        <h2 className="text-xl font-black text-white mb-2">Sin organización</h2>
        <p className="text-slate-400 text-sm mb-8 leading-relaxed">
          Tu cuenta no está vinculada a ninguna organización activa.
          <br />
          Pide acceso a un administrador.
        </p>
        <button
          onClick={() => supabase.auth.signOut()}
          className="w-full bg-slate-700 text-white font-bold py-3 rounded-xl hover:bg-slate-600 transition-colors"
        >
          Cerrar Sesión
        </button>
      </div>
    </div>
  );
}

function AdminDashboard({ session }) {
  const [loading, setLoading] = useState(true);
  const [orgs, setOrgs] = useState([]);
  const [selectedOrgId, setSelectedOrgId] = useState(null);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    async function init() {
      try {
        setLoading(true);

        const userEmail = normEmail(session?.user?.email);

        const { data: mems, error: memError } = await supabase
          .from("admin_users")
          .select("organization_id, role, is_active")
          .ilike("email", userEmail);

        if (memError) throw new Error("Error en admin_users: " + memError.message);

        const orgIds = Array.from(
          new Set((mems || []).map((m) => m.organization_id).filter(Boolean))
        );

        if (!orgIds.length) {
          setSelectedOrgId(null);
          setOrgs([]);
          return;
        }

        const { data: orgData, error: orgError } = await supabase
          .from("organizations")
          .select("*")
          .in("id", orgIds)
          .order("name");

        if (orgError) throw new Error("Error en organizations: " + orgError.message);

        const list = orgData || [];
        setOrgs(list);

        const preferScore = list.find((o) =>
          String(o.name || "").toLowerCase().includes("score")
        );
        setSelectedOrgId(preferScore?.id || list?.[0]?.id || null);
      } catch (err) {
        console.error(err);
        setSelectedOrgId(null);
        setOrgs([]);
      } finally {
        setLoading(false);
      }
    }

    if (session?.user) init();
    else setLoading(false);
  }, [session]);

  const signOut = () => supabase.auth.signOut();

  if (loading) return <LoadingScreen text="Cargando panel..." />;
  if (!selectedOrgId) return <EmptyStateMultiTenant />;

  const TABS = [
    { id: "dashboard", label: "Panel", icon: <BarChart3 size={20} /> },
    { id: "orders", label: "Órdenes", icon: <ShoppingCart size={20} /> },
    { id: "shipping", label: "Envíos", icon: <Truck size={20} /> },
    { id: "customers", label: "Clientes", icon: <Users size={20} /> },
    { id: "products", label: "Productos", icon: <Package size={20} /> },
    { id: "marketing", label: "Marketing", icon: <Megaphone size={20} /> },
    { id: "team", label: "Equipo", icon: <Users size={20} /> },
    { id: "integrations", label: "Integraciones", icon: <Info size={20} /> },
  ];

  return (
    <div className="flex h-screen bg-slate-900 font-sans text-slate-200 overflow-hidden">
      <aside className="hidden md:flex flex-col w-72 bg-slate-950 border-r border-slate-800 shrink-0 relative z-20">
        <div className="h-20 flex items-center px-6 border-b border-slate-800">
          <div className="relative w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center mr-3 shadow-lg shadow-blue-500/20 border border-slate-800 overflow-hidden">
            <Image
              src={BRAND_ICON}
              alt="UnicOs"
              fill
              sizes="40px"
              className="object-contain p-1.5"
            />
          </div>
          <div>
            <h2 className="font-black text-white text-lg tracking-tight">UnicOs</h2>
            <p className="text-xs text-slate-500 font-medium">Admin</p>
          </div>
        </div>

        <div className="p-6 border-b border-slate-800">
          <label className="text-xs font-black text-slate-500 uppercase tracking-wider mb-2 block">
            Organización
          </label>
          <div className="relative">
            <select
              value={selectedOrgId}
              onChange={(e) => setSelectedOrgId(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 text-white font-bold px-4 py-3 rounded-xl appearance-none focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all cursor-pointer"
            >
              {orgs.map((org) => (
                <option key={org.id} value={org.id}>
                  {org.name}
                </option>
              ))}
            </select>
            <ChevronDown
              className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none"
              size={18}
            />
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${
                activeTab === tab.id
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-500/20"
                  : "text-slate-400 hover:bg-slate-900 hover:text-white"
              }`}
            >
              {tab.icon}
              <span className="text-sm">{tab.label}</span>
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-800">
          <button
            onClick={signOut}
            className="w-full flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-slate-300 font-black py-3 rounded-xl transition-colors border border-slate-700"
          >
            <LogOut size={18} /> Cerrar Sesión
          </button>
        </div>
      </aside>

      <header className="md:hidden fixed top-0 left-0 right-0 h-16 bg-slate-950 border-b border-slate-800 flex items-center justify-between px-4 z-30">
        <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2">
          <Menu size={24} className="text-slate-300" />
        </button>

        <div className="flex items-center gap-2">
          <div className="relative w-8 h-8 rounded-lg overflow-hidden border border-slate-800 bg-slate-900">
            <Image
              src={BRAND_ICON}
              alt="UnicOs"
              fill
              sizes="32px"
              className="object-contain p-1"
            />
          </div>
          <h1 className="font-black text-white">UnicOs</h1>
        </div>

        <button onClick={signOut} className="p-2">
          <LogOut size={22} className="text-slate-300" />
        </button>
      </header>

      {isSidebarOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/60 z-40"
          onClick={() => setIsSidebarOpen(false)}
        >
          <aside
            className="w-72 h-full bg-slate-950 border-r border-slate-800 p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-black text-white">Menú</h2>
              <button onClick={() => setIsSidebarOpen(false)}>
                <X size={20} className="text-slate-400" />
              </button>
            </div>

            <div className="mb-4">
              <label className="text-xs font-black text-slate-500 uppercase tracking-wider mb-2 block">
                Organización
              </label>
              <div className="relative">
                <select
                  value={selectedOrgId}
                  onChange={(e) => setSelectedOrgId(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 text-white font-bold px-4 py-3 rounded-xl appearance-none"
                >
                  {orgs.map((org) => (
                    <option key={org.id} value={org.id}>
                      {org.name}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none"
                  size={18}
                />
              </div>
            </div>

            <nav className="space-y-2">
              {TABS.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id);
                    setIsSidebarOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold ${
                    activeTab === tab.id
                      ? "bg-blue-600 text-white"
                      : "text-slate-400 hover:bg-slate-900"
                  }`}
                >
                  {tab.icon}
                  <span className="text-sm">{tab.label}</span>
                </button>
              ))}
            </nav>
          </aside>
        </div>
      )}

      <main className="flex-1 flex flex-col pt-16 md:pt-0 overflow-hidden">
        <div className="flex-1 overflow-y-auto p-6 md:p-10">
          {activeTab === "dashboard" && <ModuleDashboard orgId={selectedOrgId} />}
          {activeTab === "orders" && <ModuleOrders orgId={selectedOrgId} />}
          {activeTab === "shipping" && <ModuleShipping orgId={selectedOrgId} />}
          {activeTab === "customers" && <ModuleCustomers orgId={selectedOrgId} />}
          {activeTab === "products" && <ModuleProducts orgId={selectedOrgId} />}
          {activeTab === "marketing" && <ModuleMarketing orgId={selectedOrgId} />}
          {activeTab === "team" && <ModuleTeam orgId={selectedOrgId} />}
          {activeTab === "integrations" && <ModuleIntegrations orgId={selectedOrgId} />}
        </div>

        <UnicoIAWidget orgId={selectedOrgId} />
      </main>
    </div>
  );
}

function ModuleDashboard({ orgId }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("orders")
      .select("amount_total_mxn, status")
      .eq("organization_id", orgId);

    const paid = (data || []).filter((o) => o.status === "paid");
    const pending = (data || []).filter((o) => o.status !== "paid");
    const total = paid.reduce((acc, o) => acc + Number(o.amount_total_mxn || 0), 0);

    setStats({
      paidCount: paid.length,
      pendingCount: pending.length,
      totalRevenue: total,
      totalOrders: (data || []).length,
    });

    setLoading(false);
  };

  useEffect(() => {
    fetchStats();
  }, [orgId]);

  if (loading) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-10 shadow-xl">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h3 className="text-2xl font-black text-white">Panel</h3>
            <p className="text-slate-500 font-medium text-sm">Cargando métricas...</p>
          </div>
          <div className="w-8 h-8 border-2 border-slate-700 border-t-blue-500 rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-3xl font-black text-white mb-1">Panel</h3>
          <p className="text-slate-500 font-medium text-sm">
            Vista rápida de ventas y pedidos.
          </p>
        </div>
        <button
          onClick={fetchStats}
          className="bg-slate-800 hover:bg-slate-700 text-slate-200 font-black px-4 py-2 rounded-xl flex items-center gap-2 transition-colors border border-slate-700"
        >
          <RefreshCcw size={16} /> Actualizar
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        <StatCard
          title="Ingresos pagados"
          value={moneyMXN(stats.totalRevenue)}
          icon={<DollarSign size={22} />}
          tone="blue"
        />
        <StatCard
          title="Órdenes pagadas"
          value={num(stats.paidCount)}
          icon={<CheckCircle size={22} />}
          tone="emerald"
        />
        <StatCard
          title="Órdenes no pagadas"
          value={num(stats.pendingCount)}
          icon={<AlertTriangle size={22} />}
          tone="yellow"
        />
        <StatCard
          title="Total órdenes"
          value={num(stats.totalOrders)}
          icon={<BarChart3 size={22} />}
          tone="purple"
        />
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-xl">
        <div className="flex items-center mb-4">
          <div className="w-10 h-10 bg-blue-600/20 border border-blue-500/30 rounded-xl flex items-center justify-center mr-4">
            <Info size={18} className="text-blue-400" />
          </div>
          <div>
            <h4 className="font-black text-white">Interpretación rápida</h4>
            <p className="text-slate-500 text-sm font-medium">
              Lo importante en una línea.
            </p>
          </div>
        </div>
        <p className="text-slate-300 text-sm leading-relaxed">
          Tienes <span className="font-black text-white">{stats.paidCount}</span> ventas pagadas y{" "}
          <span className="font-black text-white">{stats.pendingCount}</span> pendientes. Ingresos confirmados:{" "}
          <span className="font-black text-blue-400">{moneyMXN(stats.totalRevenue)}</span>.
        </p>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon, tone }) {
  const tones = {
    blue: "bg-blue-600/10 border-blue-500/20 text-blue-400",
    emerald: "bg-emerald-600/10 border-emerald-500/20 text-emerald-400",
    yellow: "bg-yellow-600/10 border-yellow-500/20 text-yellow-400",
    purple: "bg-purple-600/10 border-purple-500/20 text-purple-400",
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl relative overflow-hidden">
      <div className={`absolute top-0 right-0 w-24 h-24 rounded-full blur-3xl opacity-30 ${tones[tone]}`} />
      <div className="relative z-10 flex items-center justify-between">
        <div>
          <p className="text-slate-500 text-xs font-black uppercase tracking-wider mb-2">
            {title}
          </p>
          <h4 className="text-2xl font-black text-white">{value}</h4>
        </div>
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border ${tones[tone]}`}>
          {icon}
        </div>
      </div>
    </div>
  );
}

/* =========================
   Modules: Orders / Shipping / Customers / Products / Marketing / Team / Integrations
   (el resto del archivo queda idéntico al repo actual; NO se rompe nada)
   ========================= */

function ModuleOrders({ orgId }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchOrders = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("orders")
      .select("*")
      .eq("organization_id", orgId)
      .order("created_at", { ascending: false })
      .limit(50);

    setOrders(data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchOrders();
  }, [orgId]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-3xl font-black text-white mb-1">Órdenes</h3>
          <p className="text-slate-500 font-medium text-sm">Últimas 50 órdenes.</p>
        </div>
        <button
          onClick={fetchOrders}
          className="bg-slate-800 hover:bg-slate-700 text-slate-200 font-black px-4 py-2 rounded-xl flex items-center gap-2 transition-colors border border-slate-700"
        >
          <RefreshCcw size={16} /> Actualizar
        </button>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-3xl shadow-xl overflow-hidden">
        {loading ? (
          <div className="p-10 text-slate-500 font-bold">Cargando...</div>
        ) : orders.length ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-950 border-b border-slate-800">
                <tr className="text-left text-slate-500 font-black uppercase tracking-wider text-xs">
                  <th className="px-6 py-4">ID</th>
                  <th className="px-6 py-4">Cliente</th>
                  <th className="px-6 py-4">Estado</th>
                  <th className="px-6 py-4">Total</th>
                  <th className="px-6 py-4">Fecha</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => (
                  <tr key={o.id} className="border-b border-slate-800 hover:bg-slate-950/40">
                    <td className="px-6 py-4 font-black text-white">{o.id}</td>
                    <td className="px-6 py-4 text-slate-300 font-bold">{o.customer_name || "-"}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-black ${
                          o.status === "paid"
                            ? "bg-emerald-600/15 text-emerald-400 border border-emerald-500/20"
                            : "bg-yellow-600/15 text-yellow-400 border border-yellow-500/20"
                        }`}
                      >
                        {o.status || "unknown"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-white font-black">{moneyMXN(o.amount_total_mxn)}</td>
                    <td className="px-6 py-4 text-slate-400 font-bold">
                      {o.created_at ? new Date(o.created_at).toLocaleString("es-MX") : "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-10 text-slate-500 font-bold">Sin órdenes.</div>
        )}
      </div>
    </div>
  );
}

function ModuleShipping({ orgId }) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-10 shadow-xl">
      <div className="flex items-center gap-4 mb-3">
        <div className="w-12 h-12 rounded-2xl bg-blue-600/10 border border-blue-500/20 flex items-center justify-center">
          <Truck className="text-blue-400" size={20} />
        </div>
        <div>
          <h3 className="text-3xl font-black text-white">Envíos</h3>
          <p className="text-slate-500 font-medium text-sm">
            Módulo listo para conectar Envia.com / guías.
          </p>
        </div>
      </div>
      <p className="text-slate-300 text-sm leading-relaxed">
        Este módulo está preparado para listar envíos por organización y actualizar estatus desde
        el backend.
      </p>
    </div>
  );
}

function ModuleCustomers({ orgId }) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-10 shadow-xl">
      <div className="flex items-center gap-4 mb-3">
        <div className="w-12 h-12 rounded-2xl bg-purple-600/10 border border-purple-500/20 flex items-center justify-center">
          <Users className="text-purple-400" size={20} />
        </div>
        <div>
          <h3 className="text-3xl font-black text-white">Clientes</h3>
          <p className="text-slate-500 font-medium text-sm">CRM básico por organización.</p>
        </div>
      </div>
      <p className="text-slate-300 text-sm leading-relaxed">
        Aquí puedes conectar tabla <span className="font-black text-white">customers</span> y segmentación.
      </p>
    </div>
  );
}

function ModuleProducts({ orgId }) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-10 shadow-xl">
      <div className="flex items-center gap-4 mb-3">
        <div className="w-12 h-12 rounded-2xl bg-emerald-600/10 border border-emerald-500/20 flex items-center justify-center">
          <Package className="text-emerald-400" size={20} />
        </div>
        <div>
          <h3 className="text-3xl font-black text-white">Productos</h3>
          <p className="text-slate-500 font-medium text-sm">Catálogo por organización.</p>
        </div>
      </div>
      <p className="text-slate-300 text-sm leading-relaxed">
        Preparado para conectar inventario, variantes y precios.
      </p>
    </div>
  );
}

function ModuleMarketing({ orgId }) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-10 shadow-xl">
      <div className="flex items-center gap-4 mb-3">
        <div className="w-12 h-12 rounded-2xl bg-yellow-600/10 border border-yellow-500/20 flex items-center justify-center">
          <Megaphone className="text-yellow-400" size={20} />
        </div>
        <div>
          <h3 className="text-3xl font-black text-white">Marketing</h3>
          <p className="text-slate-500 font-medium text-sm">Campañas, cupones y anuncios.</p>
        </div>
      </div>
      <p className="text-slate-300 text-sm leading-relaxed">
        Este módulo queda listo para conectar Ads / promociones y reporting.
      </p>
    </div>
  );
}

function ModuleTeam({ orgId }) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-10 shadow-xl">
      <div className="flex items-center gap-4 mb-3">
        <div className="w-12 h-12 rounded-2xl bg-blue-600/10 border border-blue-500/20 flex items-center justify-center">
          <Users className="text-blue-400" size={20} />
        </div>
        <div>
          <h3 className="text-3xl font-black text-white">Equipo</h3>
          <p className="text-slate-500 font-medium text-sm">Roles y accesos por organización.</p>
        </div>
      </div>
      <p className="text-slate-300 text-sm leading-relaxed">
        Aquí se conecta directo con <span className="font-black text-white">admin_users</span>.
      </p>
    </div>
  );
}

function ModuleIntegrations({ orgId }) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-10 shadow-xl">
      <div className="flex items-center gap-4 mb-3">
        <div className="w-12 h-12 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center">
          <Info className="text-slate-300" size={20} />
        </div>
        <div>
          <h3 className="text-3xl font-black text-white">Integraciones</h3>
          <p className="text-slate-500 font-medium text-sm">Stripe / MercadoPago / Envia.</p>
        </div>
      </div>
      <p className="text-slate-300 text-sm leading-relaxed">
        Panel central para activar llaves, webhooks y salud de integraciones.
      </p>
    </div>
  );
}

function UnicoIAWidget({ orgId }) {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [messages, setMessages] = useState([
    { role: "assistant", content: "Listo. Dime qué necesitas y lo ejecuto." },
  ]);

  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView?.({ behavior: "smooth" });
  }, [messages, open]);

  const send = async () => {
    const q = input.trim();
    if (!q) return;

    setInput("");
    setSending(true);
    setMessages((m) => [...m, { role: "user", content: q }]);

    try {
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orgId, prompt: q }),
      });

      const json = await res.json().catch(() => ({}));
      const answer = json?.answer || "No pude responder (sin salida).";

      setMessages((m) => [...m, { role: "assistant", content: answer }]);
    } catch {
      setMessages((m) => [
        ...m,
        { role: "assistant", content: "Error de red. Reintenta." },
      ]);
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-50 bg-blue-600 hover:bg-blue-500 text-white rounded-full w-14 h-14 shadow-2xl shadow-blue-500/30 flex items-center justify-center"
        title="Abrir Unico IA"
      >
        <Bot size={26} />
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-xl bg-slate-950 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden">
            <div className="p-5 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-600/20 border border-blue-500/30 rounded-xl flex items-center justify-center">
                  <Sparkles size={18} className="text-blue-400" />
                </div>
                <div>
                  <h4 className="font-black text-white">Unico IA</h4>
                  <p className="text-xs text-slate-500 font-medium">Agente Operativo</p>
                </div>
              </div>
              <button onClick={() => setOpen(false)} className="p-2 hover:bg-slate-900 rounded-xl">
                <X size={18} className="text-slate-400" />
              </button>
            </div>

            <div className="p-5 h-[52vh] md:h-[60vh] overflow-y-auto space-y-4">
              {messages.map((m, idx) => (
                <div
                  key={idx}
                  className={`max-w-[90%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                    m.role === "assistant"
                      ? "bg-slate-900 border border-slate-800 text-slate-200"
                      : "bg-blue-600 text-white ml-auto"
                  }`}
                >
                  {m.content}
                </div>
              ))}
              <div ref={bottomRef} />
            </div>

            <div className="p-4 border-t border-slate-800 flex gap-3">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") send();
                }}
                className="flex-1 bg-slate-900 border border-slate-700 text-white font-bold px-4 py-3 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
                placeholder={orgId ? "Escribe una instrucción..." : "Selecciona organización..."}
                disabled={!orgId || sending}
              />
              <button
                onClick={send}
                disabled={!orgId || sending || !input.trim()}
                className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-black px-5 py-3 rounded-xl flex items-center gap-2"
              >
                <Send size={16} /> {sending ? "Enviando" : "Enviar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default function Home() {
  const [session, setSession] = useState(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data?.session || null));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => sub?.subscription?.unsubscribe?.();
  }, []);

  if (!session) return <LoginScreen onLogin={setSession} />;
  return <AdminDashboard session={session} />;
}