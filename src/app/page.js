// src/app/page.js
"use client";

import { useEffect, useRef, useState } from "react";
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
  Shield,
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
          <div className="w-20 h-20 bg-slate-900 rounded-2xl flex items-center justify-center mb-6 shadow-inner border border-slate-700">
            <Shield className="text-blue-500" size={40} strokeWidth={1.5} />
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
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center mr-3 shadow-lg shadow-blue-500/20">
            <Shield size={22} className="text-white" />
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
        <h1 className="font-black text-white">UnicOs</h1>
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
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl relative overflow-hidden group hover:border-slate-700 transition-colors">
      <div className={`absolute top-0 right-0 w-32 h-32 blur-3xl opacity-30 ${tones[tone]}`}></div>
      <div className="relative z-10 flex items-center justify-between mb-4">
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border ${tones[tone]}`}>{icon}</div>
      </div>
      <p className="text-slate-500 text-xs font-black uppercase tracking-wider mb-2">{title}</p>
      <h3 className="text-2xl font-black text-white">{value}</h3>
    </div>
  );
}

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
    <div className="bg-slate-900 border border-slate-800 rounded-3xl shadow-xl overflow-hidden">
      <div className="p-6 md:p-8 border-b border-slate-800 flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-black text-white">Órdenes</h3>
          <p className="text-slate-500 text-sm font-medium">Últimas 50 órdenes.</p>
        </div>
        <button
          onClick={fetchOrders}
          className="bg-slate-800 hover:bg-slate-700 text-slate-200 font-black px-4 py-2 rounded-xl flex items-center gap-2 transition-colors border border-slate-700"
        >
          <RefreshCcw size={16} /> Actualizar
        </button>
      </div>

      <div className="overflow-x-auto">
        {loading ? (
          <div className="p-10 text-center text-slate-400 font-medium">Cargando órdenes...</div>
        ) : orders.length === 0 ? (
          <div className="p-10 text-center text-slate-400 font-medium">
            No hay órdenes aún.
            <p className="text-sm mt-1">Cuando haya ventas, aparecerán aquí.</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-950 text-slate-500 uppercase text-[10px] tracking-wider font-black">
              <tr>
                <th className="p-4 text-left pl-6">Cliente</th>
                <th className="p-4 text-left">Total</th>
                <th className="p-4 text-left">Estado</th>
                <th className="p-4 text-left">Items</th>
                <th className="p-4 text-left">Fecha</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id} className="hover:bg-slate-800/30 transition-colors group">
                  <td className="p-4 pl-6">
                    <p className="font-bold text-slate-200">{o.customer_name || "Sin nombre"}</p>
                    <p className="text-xs text-slate-500 font-medium">{o.email}</p>
                  </td>
                  <td className="p-4 font-black text-white">{moneyMXN(o.amount_total_mxn)}</td>
                  <td className="p-4">
                    <span
                      className={`px-3 py-1 text-[10px] font-black uppercase tracking-wider rounded-full border ${
                        o.status === "paid"
                          ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                          : o.status === "pending"
                          ? "bg-yellow-500/10 text-yellow-400 border-yellow-500/20"
                          : "bg-slate-800 text-slate-400 border-slate-700"
                      }`}
                    >
                      {o.status}
                    </span>
                  </td>
                  <td
                    className="p-4 text-xs text-slate-400 font-medium max-w-[240px] truncate"
                    title={o.items_summary}
                  >
                    {o.items_summary || "-"}
                  </td>
                  <td className="p-4 text-xs font-bold text-slate-500">
                    {new Date(o.created_at).toLocaleDateString("es-MX", {
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function ModuleShipping({ orgId }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchRows = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("shipping_labels")
      .select("stripe_session_id,tracking_number,label_url,status,updated_at")
      .eq("org_id", orgId)
      .order("updated_at", { ascending: false })
      .limit(50);

    setRows(data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchRows();
  }, [orgId]);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl shadow-xl overflow-hidden">
      <div className="p-6 md:p-8 border-b border-slate-800 flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-black text-white">Envíos</h3>
          <p className="text-slate-500 text-sm font-medium">Guías creadas automáticamente.</p>
        </div>
        <button
          onClick={fetchRows}
          className="bg-slate-800 hover:bg-slate-700 text-slate-200 font-black px-4 py-2 rounded-xl flex items-center gap-2 transition-colors border border-slate-700"
        >
          <RefreshCcw size={16} /> Actualizar
        </button>
      </div>

      <div className="overflow-x-auto">
        {loading ? (
          <div className="p-10 text-center text-slate-400 font-medium">Cargando envíos...</div>
        ) : rows.length === 0 ? (
          <div className="p-10 text-center text-slate-400 font-medium">
            Todavía no hay guías.
            <p className="text-sm mt-1">Cuando Stripe confirme el pago, se genera la guía.</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-950 text-slate-500 uppercase text-[10px] tracking-wider font-black">
              <tr>
                <th className="p-4 text-left pl-6">Estatus</th>
                <th className="p-4 text-left">Tracking</th>
                <th className="p-4 text-left">Guía</th>
                <th className="p-4 text-left">Actualizado</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, idx) => (
                <tr key={idx} className="hover:bg-slate-800/30 transition-colors">
                  <td className="p-4 pl-6 font-bold text-slate-200">{r.status || "-"}</td>
                  <td className="p-4 text-slate-300 font-mono text-xs">{r.tracking_number || "-"}</td>
                  <td className="p-4">
                    {r.label_url ? (
                      <a className="text-blue-400 font-bold hover:underline" href={r.label_url} target="_blank" rel="noreferrer">
                        Abrir PDF
                      </a>
                    ) : (
                      <span className="text-slate-500">-</span>
                    )}
                  </td>
                  <td className="p-4 text-xs font-bold text-slate-500">
                    {r.updated_at ? new Date(r.updated_at).toLocaleString("es-MX") : "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function ModuleCustomers({ orgId }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchRows = async () => {
    setLoading(true);

    const { data } = await supabase
      .from("orders")
      .select("email,customer_name,amount_total_mxn,status")
      .eq("organization_id", orgId)
      .eq("status", "paid")
      .limit(800);

    const map = new Map();
    for (const o of data || []) {
      const email = normEmail(o.email);
      if (!email) continue;
      const rec = map.get(email) || {
        email,
        name: String(o.customer_name || "").trim() || email,
        orders: 0,
        total: 0,
      };
      rec.orders += 1;
      rec.total += Number(o.amount_total_mxn || 0);
      map.set(email, rec);
    }

    const list = Array.from(map.values()).sort((a, b) => b.total - a.total);
    setRows(list);
    setLoading(false);
  };

  useEffect(() => {
    fetchRows();
  }, [orgId]);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl shadow-xl overflow-hidden">
      <div className="p-6 md:p-8 border-b border-slate-800 flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-black text-white">Clientes</h3>
          <p className="text-slate-500 text-sm font-medium">Top por gasto (pagado).</p>
        </div>
        <button
          onClick={fetchRows}
          className="bg-slate-800 hover:bg-slate-700 text-slate-200 font-black px-4 py-2 rounded-xl flex items-center gap-2 transition-colors border border-slate-700"
        >
          <RefreshCcw size={16} /> Actualizar
        </button>
      </div>

      <div className="overflow-x-auto">
        {loading ? (
          <div className="p-10 text-center text-slate-400 font-medium">Cargando clientes...</div>
        ) : rows.length === 0 ? (
          <div className="p-10 text-center text-slate-400 font-medium">Todavía no hay ventas pagadas.</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-950 text-slate-500 uppercase text-[10px] tracking-wider font-black">
              <tr>
                <th className="p-4 text-left pl-6">Cliente</th>
                <th className="p-4 text-left">Correo</th>
                <th className="p-4 text-left">Compras</th>
                <th className="p-4 text-left">Total</th>
              </tr>
            </thead>
            <tbody>
              {rows.slice(0, 50).map((c) => (
                <tr key={c.email} className="hover:bg-slate-800/30 transition-colors">
                  <td className="p-4 pl-6 font-bold text-slate-200">{c.name}</td>
                  <td className="p-4 text-slate-400 text-xs font-mono">{c.email}</td>
                  <td className="p-4 font-bold text-slate-200">{num(c.orders)}</td>
                  <td className="p-4 font-black text-white">{moneyMXN(c.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function ModuleProducts() {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-10 shadow-xl text-center">
      <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6">
        <Package className="text-blue-500" size={32} />
      </div>
      <h3 className="text-xl font-black text-white mb-2">Productos</h3>
      <p className="text-slate-400 text-sm max-w-md mx-auto leading-relaxed">
        Este módulo queda listo para migrar a inventario dinámico (tabla <b>products</b>)
        sin tocar la tienda.
      </p>
    </div>
  );
}

function ModuleMarketing({ orgId }) {
  const [promoText, setPromoText] = useState("");
  const [pixelId, setPixelId] = useState("");
  const [live, setLive] = useState({ promo_active: false, promo_text: null, pixel_id: null });
  const [loading, setLoading] = useState(false);

  const fetchSettings = async () => {
    const { data } = await supabase
      .from("site_settings")
      .select("promo_active,promo_text,pixel_id")
      .eq("organization_id", orgId)
      .maybeSingle();

    setLive({
      promo_active: Boolean(data?.promo_active),
      promo_text: data?.promo_text || null,
      pixel_id: data?.pixel_id || null,
    });
  };

  useEffect(() => {
    fetchSettings();
  }, [orgId]);

  const savePromo = async () => {
    if (!promoText.trim()) return;
    setLoading(true);

    await supabase.from("site_settings").upsert(
      {
        organization_id: orgId,
        promo_active: true,
        promo_text: promoText.trim().slice(0, 160),
        updated_at: new Date().toISOString(),
      },
      { onConflict: "organization_id" }
    );

    setPromoText("");
    await fetchSettings();
    setLoading(false);
  };

  const removePromo = async () => {
    setLoading(true);
    await supabase.from("site_settings").upsert(
      {
        organization_id: orgId,
        promo_active: false,
        promo_text: null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "organization_id" }
    );
    await fetchSettings();
    setLoading(false);
  };

  const savePixel = async () => {
    if (!pixelId.trim()) return;
    setLoading(true);
    await supabase.from("site_settings").upsert(
      {
        organization_id: orgId,
        pixel_id: pixelId.trim().slice(0, 80),
        updated_at: new Date().toISOString(),
      },
      { onConflict: "organization_id" }
    );
    setPixelId("");
    await fetchSettings();
    setLoading(false);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-10 shadow-xl relative overflow-hidden">
      <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/10 blur-[100px] rounded-full pointer-events-none"></div>

      <div className="flex items-center mb-8 relative z-10">
        <div className="w-12 h-12 bg-purple-600/20 border border-purple-500/30 rounded-xl flex items-center justify-center mr-4">
          <Megaphone className="text-purple-400" size={24} />
        </div>
        <div>
          <h3 className="text-2xl font-black text-white">Marketing</h3>
          <p className="text-sm font-medium text-slate-400">
            Cambios que se reflejan en la tienda sin tocar código.
          </p>
        </div>
      </div>

      <div className="relative z-10 grid grid-cols-1 xl:grid-cols-2 gap-8">
        <div>
          <h4 className="text-xs font-black text-purple-500 uppercase tracking-wider mb-3">
            Megáfono (Anuncio superior)
          </h4>

          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <input
              type="text"
              className="flex-1 bg-slate-950 border border-slate-700 text-white font-bold px-4 py-3 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none placeholder-slate-600"
              placeholder="Ej: 🔥 20% OFF HOY CON CÓDIGO: BAJA20"
              value={promoText}
              onChange={(e) => setPromoText(e.target.value)}
            />
            <button
              onClick={savePromo}
              disabled={loading || !promoText.trim()}
              className="bg-purple-600 text-white font-black px-6 py-3 rounded-xl hover:bg-purple-500 transition-colors shadow-lg shadow-purple-500/20 disabled:opacity-50"
            >
              {loading ? "Guardando..." : "Publicar"}
            </button>
          </div>

          {live.promo_active && live.promo_text ? (
            <div className="bg-slate-950 border border-purple-500/30 rounded-2xl p-6">
              <p className="text-xs font-black text-purple-500 uppercase tracking-wider mb-3">
                En vivo:
              </p>
              <p className="text-lg font-bold text-white mb-4">{live.promo_text}</p>
              <button
                onClick={removePromo}
                disabled={loading}
                className="text-xs font-bold bg-red-500/10 text-red-400 border border-red-500/20 px-4 py-2 rounded-lg hover:bg-red-500/20 transition-colors disabled:opacity-60"
              >
                Apagar megáfono
              </button>
            </div>
          ) : (
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 text-slate-400 text-sm">
              El megáfono está apagado.
            </div>
          )}
        </div>

        <div>
          <h4 className="text-xs font-black text-blue-500 uppercase tracking-wider mb-3">
            Pixel (Meta)
          </h4>

          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <input
              type="text"
              className="flex-1 bg-slate-950 border border-slate-700 text-white font-bold px-4 py-3 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none placeholder-slate-600"
              placeholder="Ej: 123456789012345"
              value={pixelId}
              onChange={(e) => setPixelId(e.target.value)}
            />
            <button
              onClick={savePixel}
              disabled={loading || !pixelId.trim()}
              className="bg-blue-600 text-white font-black px-6 py-3 rounded-xl hover:bg-blue-500 transition-colors shadow-lg shadow-blue-500/20 disabled:opacity-50"
            >
              {loading ? "Guardando..." : "Guardar"}
            </button>
          </div>

          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 text-slate-300 text-sm">
            <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">Actual:</p>
            <p className="font-mono">{live.pixel_id || "(sin configurar)"}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function ModuleTeam({ orgId }) {
  const [rows, setRows] = useState([]);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("staff");
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchRows = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("admin_users")
      .select("email,role,is_active,created_at")
      .eq("organization_id", orgId)
      .order("created_at", { ascending: false })
      .limit(50);

    setRows(data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchRows();
  }, [orgId]);

  const invite = async () => {
    setMsg("");
    const cleanEmail = normEmail(email);
    if (!cleanEmail) return;

    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData?.session?.access_token;

    try {
      const res = await fetch("/api/invite", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ organization_id: orgId, email: cleanEmail, role }),
      });

      const j = await res.json();
      if (!res.ok) throw new Error(j?.error || "No se pudo invitar");

      setMsg("Invitación lista. Si el usuario no existe, se le mandó correo.");
      setEmail("");
      setRole("staff");
      await fetchRows();
    } catch (e) {
      setMsg("Error: " + String(e?.message || e));
    }
  };

  return (
    <div className="space-y-8">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl shadow-xl p-6 md:p-8">
        <h3 className="text-2xl font-black text-white mb-1">Equipo</h3>
        <p className="text-slate-500 text-sm font-medium mb-6">
          Agrega usuarios sin tocar base de datos.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <input
            className="bg-slate-950 border border-slate-700 text-white font-bold px-4 py-3 rounded-xl outline-none"
            placeholder="correo@empresa.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <select
            className="bg-slate-950 border border-slate-700 text-white font-bold px-4 py-3 rounded-xl outline-none"
            value={role}
            onChange={(e) => setRole(e.target.value)}
          >
            <option value="owner">Owner</option>
            <option value="admin">Admin</option>
            <option value="marketing">Marketing</option>
            <option value="ops">Ops</option>
            <option value="staff">Staff</option>
            <option value="viewer">Viewer</option>
            <option value="sales">Sales</option>
          </select>
          <button onClick={invite} className="bg-blue-600 hover:bg-blue-500 text-white font-black px-6 py-3 rounded-xl">
            Invitar
          </button>
        </div>

        {msg && (
          <div className="mt-4 text-sm text-slate-300 bg-slate-950 border border-slate-800 rounded-xl p-4">
            {msg}
          </div>
        )}
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-3xl shadow-xl overflow-hidden">
        <div className="p-6 md:p-8 border-b border-slate-800 flex items-center justify-between">
          <div>
            <h4 className="text-xl font-black text-white">Miembros</h4>
            <p className="text-slate-500 text-sm font-medium">Últimos 50.</p>
          </div>
          <button
            onClick={fetchRows}
            className="bg-slate-800 hover:bg-slate-700 text-slate-200 font-black px-4 py-2 rounded-xl flex items-center gap-2 transition-colors border border-slate-700"
          >
            <RefreshCcw size={16} /> Actualizar
          </button>
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-10 text-center text-slate-400 font-medium">Cargando equipo...</div>
          ) : rows.length === 0 ? (
            <div className="p-10 text-center text-slate-400 font-medium">No hay miembros.</div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-slate-950 text-slate-500 uppercase text-[10px] tracking-wider font-black">
                <tr>
                  <th className="p-4 text-left pl-6">Email</th>
                  <th className="p-4 text-left">Rol</th>
                  <th className="p-4 text-left">Activo</th>
                  <th className="p-4 text-left">Alta</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, idx) => (
                  <tr key={idx} className="hover:bg-slate-800/30 transition-colors">
                    <td className="p-4 pl-6 font-mono text-xs text-slate-300">{r.email}</td>
                    <td className="p-4 font-bold text-slate-200">{r.role}</td>
                    <td className="p-4 font-bold text-slate-200">{r.is_active ? "Sí" : "No"}</td>
                    <td className="p-4 text-xs font-bold text-slate-500">
                      {r.created_at ? new Date(r.created_at).toLocaleDateString("es-MX") : "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

function ModuleIntegrations() {
  const [state, setState] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchHealth = async () => {
    setLoading(true);
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData?.session?.access_token;

    try {
      const res = await fetch("/api/health", {
        headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      });
      const j = await res.json();
      setState(j);
    } catch {
      setState({ ok: false, error: "No se pudo leer estado." });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHealth();
  }, []);

  const Row = ({ label, ok }) => (
    <div className="flex items-center justify-between bg-slate-950 border border-slate-800 rounded-2xl p-4">
      <span className="font-bold text-slate-200">{label}</span>
      <span
        className={`text-xs font-black px-3 py-1 rounded-full border ${
          ok
            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
            : "bg-red-500/10 text-red-400 border-red-500/20"
        }`}
      >
        {ok ? "OK" : "FALTA"}
      </span>
    </div>
  );

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-10 shadow-xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-2xl font-black text-white">Integraciones</h3>
          <p className="text-slate-500 text-sm font-medium">Checklist para producción.</p>
        </div>
        <button
          onClick={fetchHealth}
          className="bg-slate-800 hover:bg-slate-700 text-slate-200 font-black px-4 py-2 rounded-xl flex items-center gap-2 transition-colors border border-slate-700"
        >
          <RefreshCcw size={16} /> Actualizar
        </button>
      </div>

      {loading ? (
        <div className="text-slate-400">Cargando...</div>
      ) : (
        <div className="space-y-3">
          <Row label="Supabase URL" ok={Boolean(state?.env?.SUPABASE_URL)} />
          <Row label="Supabase Secret" ok={Boolean(state?.env?.SUPABASE_SECRET_KEY)} />
          <Row label="Gemini (IA)" ok={Boolean(state?.env?.GEMINI_API_KEY)} />
          <div className="text-xs text-slate-500 mt-4">
            Si algo marca <b>FALTA</b>, configúralo en variables de Netlify.
          </div>
        </div>
      )}
    </div>
  );
}

function UnicoIAWidget({ orgId }) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content:
        "Soy Unico IA. Puedo: resumen de ventas, activar/apagar promo, guardar Pixel, revisar envíos y top clientes. ¿Qué hacemos?",
    },
  ]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, open]);

  const send = async () => {
    const userMsg = input.trim();
    if (!userMsg || !orgId) return;

    setSending(true);
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userMsg }]);

    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData?.session?.access_token;

    try {
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ message: userMsg, organization_id: orgId }),
      });

      const j = await res.json();
      if (!res.ok) throw new Error(j?.error || "Error IA");

      setMessages((prev) => [...prev, { role: "assistant", content: j.reply }]);
    } catch (e) {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Error: " + String(e?.message || e) },
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