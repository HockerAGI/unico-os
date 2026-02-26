// src/app/page.js
"use client";

import { useEffect, useMemo, useState, useRef } from "react";
import { supabase } from "@/lib/supabase";
import Image from "next/image";
import {
  LayoutDashboard, Package, ShoppingCart, LogOut, ChevronDown, 
  Info, Megaphone, Menu, Shield, CheckCircle, DollarSign, Users, 
  AlertTriangle, XCircle, Bot, Sparkles, Send, X, Eye, TrendingUp, RefreshCcw
} from "lucide-react";

const moneyMXN = (v) => Number(v || 0).toLocaleString("es-MX", { style: "currency", currency: "MXN" });
const num = (v) => Number(v || 0).toLocaleString("en-US");

function LoginScreen({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const { data, error: loginError } = await supabase.auth.signInWithPassword({ email, password });
    if (loginError) setError(loginError.message);
    else if (data?.session) onLogin(data.session);
    setLoading(false);
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-slate-900 p-6 font-sans">
      <div className="max-w-md w-full bg-slate-800 border border-slate-700 rounded-3xl shadow-2xl p-10 overflow-hidden relative">
        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse animation-delay-2000"></div>

        <div className="relative z-10 flex flex-col items-center">
          <div className="w-20 h-20 bg-slate-900 rounded-2xl flex items-center justify-center mb-6 shadow-inner border border-slate-700">
            <Shield className="text-blue-500" size={40} strokeWidth={1.5} />
          </div>
          <h1 className="text-3xl font-black text-white mb-2 tracking-tight">UnicOs <span className="text-blue-500">Enterprise</span></h1>
          <p className="text-slate-400 text-sm mb-8 text-center font-medium">Centro de Control Global</p>

          {error && (
            <div className="w-full bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl mb-6 text-sm flex items-start">
              <AlertTriangle className="mr-3 flex-shrink-0 mt-0.5" size={16} />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="w-full space-y-5">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Correo Corporativo</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 text-white px-4 py-3 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all placeholder-slate-600"
                placeholder="operador@unicos.com"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Contraseña de Acceso</label>
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
                "Acceder al Sistema"
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
        <h2 className="text-xl font-black text-white mb-2">Acceso Denegado</h2>
        <p className="text-slate-400 text-sm mb-8 leading-relaxed">
          Tu cuenta no está vinculada a ninguna organización activa. Contacta al Administrador de UnicOs para solicitar acceso a un Tenant.
        </p>
        <button onClick={() => supabase.auth.signOut()} className="w-full bg-slate-700 text-white font-bold py-3 rounded-xl hover:bg-slate-600 transition-colors">
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
  const [memberships, setMemberships] = useState([]);
  
  const [activeTab, setActiveTab] = useState("dashboard");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    async function init() {
      try {
        const userEmail = String(session?.user?.email || "").trim().toLowerCase();
        console.log("🚀 Iniciando Login en God Mode para:", userEmail);
        
        // 1. God Mode: Buscar usuario ignorando mayúsculas (ilike) y SIN is_active por ahora
        const { data: mems, error: memError } = await supabase
          .from("admin_users")
          .select("organization_id, role")
          .ilike("email", userEmail);

        if (memError) throw new Error("Error en admin_users: " + JSON.stringify(memError));

        console.log("📦 Datos obtenidos de admin_users:", mems);

        const orgIds = Array.from(new Set((mems || []).map(m => m.organization_id).filter(Boolean)));
        setMemberships((mems || []).map(m => ({ org_id: m.organization_id, role: m.role })));

        if (orgIds.length > 0) {
          // 2. Buscar empresas asignadas
          const { data: orgData, error: orgError } = await supabase
            .from("organizations")
            .select("*")
            .in("id", orgIds)
            .order("name");
            
          if (orgError) throw new Error("Error en organizations: " + JSON.stringify(orgError));
          
          console.log("🏢 Organizaciones cargadas:", orgData);

          if (!orgData || orgData.length === 0) {
            console.error("🚨 CRÍTICO: admin_users devolvió orgIds pero organizations no regresó filas. Revisa si esos IDs existen en organizations.");
            alert("ERROR: Tu usuario sí está en admin_users, pero la organización NO existe o está mal ligada.\n\nSolución: verifica que admin_users.organization_id apunte a un organizations.id real.");
          }

          setOrgs(orgData || []);
          setSelectedOrgId(orgData?.[0]?.id || null);
        } else {
          console.error("🚨 CRÍTICO: Auth exitoso, pero admin_users devolvió 0 filas para:", userEmail);
          alert("ERROR: Tu correo (" + userEmail + ") no está vinculado a la organización.\n\nVerifica en Supabase que el email en 'admin_users' sea exactamente ese y no tenga espacios.");
        }
      } catch (err) {
        console.error("Error crítico en init():", err);
        alert("ERROR DEL SISTEMA:\n" + err.message);
      } finally {
        setLoading(false);
      }
    }
    
    // Evitamos ejecutar si la sesión no está lista
    if (session && session.user) {
      init();
    } else {
      setLoading(false);
    }
  }, [session]);

  const signOut = () => supabase.auth.signOut();

  if (loading) return <LoadingScreen text="Cargando Sistema Central..." />;
  if (!selectedOrgId) return <EmptyStateMultiTenant />;

  const TABS = [
    { id: "dashboard", label: "Salud del Negocio", icon: <LayoutDashboard size={20} /> },
    { id: "orders", label: "Órdenes (Stripe)", icon: <ShoppingCart size={20} /> },
    { id: "products", label: "Catálogo", icon: <Package size={20} /> },
    { id: "marketing", label: "Marketing / Megáfono", icon: <Megaphone size={20} /> },
  ];

  return (
    <div className="flex h-screen bg-slate-900 font-sans text-slate-200 overflow-hidden">
      {/* Sidebar Desktop */}
      <aside className="hidden md:flex flex-col w-72 bg-slate-950 border-r border-slate-800 shrink-0 relative z-20">
        <div className="h-20 flex items-center px-6 border-b border-slate-800">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center mr-3 shadow-lg shadow-blue-500/20">
            <Shield size={22} className="text-white" />
          </div>
          <div>
            <h2 className="font-black text-white text-lg tracking-tight">UnicOs</h2>
            <p className="text-xs text-slate-500 font-medium">Enterprise Admin</p>
          </div>
        </div>

        <div className="p-6 border-b border-slate-800">
          <label className="text-xs font-black text-slate-500 uppercase tracking-wider mb-2 block">Organización</label>
          <div className="relative">
            <select
              value={selectedOrgId}
              onChange={(e) => setSelectedOrgId(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 text-white font-bold px-4 py-3 rounded-xl appearance-none focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all cursor-pointer"
            >
              {orgs.map((org) => (
                <option key={org.id} value={org.id}>{org.name}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" size={18} />
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
            <LogOut size={18} />
            Cerrar Sesión
          </button>
        </div>
      </aside>

      {/* Mobile Header */}
      <header className="md:hidden fixed top-0 left-0 right-0 h-16 bg-slate-950 border-b border-slate-800 flex items-center justify-between px-4 z-30">
        <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2">
          <Menu size={24} className="text-slate-300" />
        </button>
        <h1 className="font-black text-white">UnicOs</h1>
        <button onClick={signOut} className="p-2">
          <LogOut size={22} className="text-slate-300" />
        </button>
      </header>

      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div className="md:hidden fixed inset-0 bg-black/60 z-40" onClick={() => setIsSidebarOpen(false)}>
          <aside className="w-72 h-full bg-slate-950 border-r border-slate-800 p-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-black text-white">Menú</h2>
              <button onClick={() => setIsSidebarOpen(false)}>
                <X size={20} className="text-slate-400" />
              </button>
            </div>

            <div className="mb-4">
              <label className="text-xs font-black text-slate-500 uppercase tracking-wider mb-2 block">Organización</label>
              <div className="relative">
                <select
                  value={selectedOrgId}
                  onChange={(e) => setSelectedOrgId(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 text-white font-bold px-4 py-3 rounded-xl appearance-none"
                >
                  {orgs.map((org) => (
                    <option key={org.id} value={org.id}>{org.name}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" size={18} />
              </div>
            </div>

            <nav className="space-y-2">
              {TABS.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => { setActiveTab(tab.id); setIsSidebarOpen(false); }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold ${
                    activeTab === tab.id ? "bg-blue-600 text-white" : "text-slate-400 hover:bg-slate-900"
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

      {/* Main Content */}
      <main className="flex-1 flex flex-col pt-16 md:pt-0 overflow-hidden">
        <div className="flex-1 overflow-y-auto p-6 md:p-10">
          {activeTab === "dashboard" && <ModuleDashboard orgId={selectedOrgId} />}
          {activeTab === "orders" && <ModuleOrders orgId={selectedOrgId} />}
          {activeTab === "products" && <ModuleProducts orgId={selectedOrgId} />}
          {activeTab === "marketing" && <ModuleMarketing orgId={selectedOrgId} />}
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
    const pending = (data || []).filter((o) => o.status === "pending");
    const total = paid.reduce((acc, o) => acc + Number(o.amount_total_mxn || 0), 0);

    setStats({
      paidCount: paid.length,
      pendingCount: pending.length,
      totalRevenue: total,
      totalOrders: (data || []).length
    });

    setLoading(false);
  };

  useEffect(() => { fetchStats(); }, [orgId]);

  if (loading) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-10 shadow-xl">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h3 className="text-2xl font-black text-white">Salud del Negocio</h3>
            <p className="text-slate-500 font-medium text-sm">Cargando métricas en tiempo real...</p>
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
          <h3 className="text-3xl font-black text-white mb-1">Salud del Negocio</h3>
          <p className="text-slate-500 font-medium text-sm">Indicadores principales de rendimiento.</p>
        </div>
        <button
          onClick={fetchStats}
          className="bg-slate-800 hover:bg-slate-700 text-slate-200 font-black px-4 py-2 rounded-xl flex items-center gap-2 transition-colors border border-slate-700"
        >
          <RefreshCcw size={16} /> Actualizar
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        <StatCard title="Ingresos Pagados" value={moneyMXN(stats.totalRevenue)} icon={<DollarSign size={22} />} color="blue" />
        <StatCard title="Órdenes Pagadas" value={num(stats.paidCount)} icon={<CheckCircle size={22} />} color="emerald" />
        <StatCard title="Órdenes Pendientes" value={num(stats.pendingCount)} icon={<AlertTriangle size={22} />} color="yellow" />
        <StatCard title="Total Órdenes" value={num(stats.totalOrders)} icon={<TrendingUp size={22} />} color="purple" />
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-xl">
        <div className="flex items-center mb-4">
          <div className="w-10 h-10 bg-blue-600/20 border border-blue-500/30 rounded-xl flex items-center justify-center mr-4">
            <Info size={18} className="text-blue-400" />
          </div>
          <div>
            <h4 className="font-black text-white">Resumen Ejecutivo</h4>
            <p className="text-slate-500 text-sm font-medium">Interpretación rápida de la IA.</p>
          </div>
        </div>
        <p className="text-slate-300 text-sm leading-relaxed">
          Tu negocio está operando con <span className="font-black text-white">{stats.paidCount}</span> órdenes pagadas y <span className="font-black text-white">{stats.pendingCount}</span> pendientes.
          Los ingresos confirmados son <span className="font-black text-blue-400">{moneyMXN(stats.totalRevenue)}</span>.
          Si deseas aumentar conversión hoy, activa un megáfono con una oferta simple y una fecha límite.
        </p>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon, color }) {
  const colors = {
    blue: "bg-blue-600/10 border-blue-500/20 text-blue-400",
    emerald: "bg-emerald-600/10 border-emerald-500/20 text-emerald-400",
    yellow: "bg-yellow-600/10 border-yellow-500/20 text-yellow-400",
    purple: "bg-purple-600/10 border-purple-500/20 text-purple-400",
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl relative overflow-hidden group hover:border-slate-700 transition-colors">
      <div className={`absolute top-0 right-0 w-32 h-32 blur-3xl opacity-30 ${colors[color]}`}></div>
      <div className="relative z-10 flex items-center justify-between mb-4">
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border ${colors[color]}`}>
          {icon}
        </div>
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

  useEffect(() => { fetchOrders(); }, [orgId]);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl shadow-xl overflow-hidden">
      <div className="p-6 md:p-8 border-b border-slate-800 flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-black text-white">Órdenes (Stripe)</h3>
          <p className="text-slate-500 text-sm font-medium">Últimas 50 órdenes registradas.</p>
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
            No hay órdenes registradas aún.
            <p className="text-sm mt-1">Las ventas de esta organización aparecerán aquí.</p>
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
                    <span className={`px-3 py-1 text-[10px] font-black uppercase tracking-wider rounded-full border ${
                      o.status === "paid" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" :
                      o.status === "pending" ? "bg-yellow-500/10 text-yellow-400 border-yellow-500/20" :
                      "bg-slate-800 text-slate-400 border-slate-700"
                    }`}>
                      {o.status}
                    </span>
                  </td>
                  <td className="p-4 text-xs text-slate-400 font-medium max-w-[200px] truncate" title={o.items_summary}>
                    {o.items_summary || "-"}
                  </td>
                  <td className="p-4 text-xs font-bold text-slate-500">
                    {new Date(o.created_at).toLocaleDateString("es-MX", { month: 'short', day: 'numeric', hour: '2-digit', minute:'2-digit' })}
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

function ModuleProducts({ orgId }) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-10 shadow-xl text-center">
      <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6">
        <Package className="text-blue-500" size={32} />
      </div>
      <h3 className="text-xl font-black text-white mb-2">Catálogo de Productos</h3>
      <p className="text-slate-400 text-sm max-w-md mx-auto leading-relaxed">
        Actualmente, el catálogo se lee directamente del JSON estático de alto rendimiento para maximizar la velocidad de carga (PWA). Para modificar el catálogo, actualiza el archivo en el repositorio.
      </p>
    </div>
  );
}

function ModuleMarketing({ orgId }) {
  const [promo, setPromo] = useState("");
  const [activePromo, setActivePromo] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchPromo = async () => {
    const { data } = await supabase.from("site_settings").select("value").eq("key", "active_promo").eq("organization_id", orgId).maybeSingle();
    setActivePromo(data?.value || null);
  };

  useEffect(() => { fetchPromo(); }, [orgId]);

  const savePromo = async () => {
    if (!promo.trim()) return;
    setLoading(true);
    await supabase.from("site_settings").upsert({
      organization_id: orgId,
      key: "active_promo",
      value: promo,
      updated_at: new Date().toISOString()
    }, { onConflict: "organization_id, key" });
    setPromo("");
    await fetchPromo();
    setLoading(false);
  };

  const removePromo = async () => {
    setLoading(true);
    await supabase.from("site_settings").delete().eq("organization_id", orgId).eq("key", "active_promo");
    await fetchPromo();
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
          <h3 className="text-2xl font-black text-white">Megáfono Global</h3>
          <p className="text-sm font-medium text-slate-400">Anuncia ofertas en la barra superior de tu tienda al instante.</p>
        </div>
      </div>

      <div className="relative z-10 max-w-2xl">
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <input
            type="text"
            className="flex-1 bg-slate-950 border border-slate-700 text-white font-bold px-4 py-3 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none placeholder-slate-600"
            placeholder="Ej: 🔥 20% DE DESCUENTO EN TODA LA TIENDA CON CÓDIGO: FLASH20"
            value={promo}
            onChange={(e) => setPromo(e.target.value)}
          />
          <button
            onClick={savePromo}
            disabled={loading || !promo.trim()}
            className="bg-purple-600 text-white font-black px-6 py-3 rounded-xl hover:bg-purple-500 transition-colors shadow-lg shadow-purple-500/20 disabled:opacity-50 flex-shrink-0"
          >
            {loading ? "Publicando..." : "Publicar Anuncio"}
          </button>
        </div>

        {activePromo && (
          <div className="bg-slate-950 border border-purple-500/30 rounded-2xl p-6 relative group">
            <h4 className="text-xs font-black text-purple-500 uppercase tracking-wider mb-3">Anuncio en Vivo Actualmente:</h4>
            <p className="text-lg font-bold text-white mb-4">{activePromo}</p>
            <button
              onClick={removePromo}
              className="text-xs font-bold bg-red-500/10 text-red-400 border border-red-500/20 px-4 py-2 rounded-lg hover:bg-red-500/20 transition-colors"
            >
              Quitar Anuncio (Apagar Megáfono)
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function UnicoIAWidget({ orgId }) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: "assistant", content: "Soy Unico IA. Estoy listo para ayudarte con reportes, marketing y operaciones. ¿Qué quieres hacer hoy?" }
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
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ message: userMsg, organization_id: orgId }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "Error IA");

      setMessages((prev) => [...prev, { role: "assistant", content: json.reply }]);
    } catch (e) {
      setMessages((prev) => [...prev, { role: "assistant", content: "Error: " + (e?.message || "No se pudo contactar a Unico IA.") }]);
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-50 bg-blue-600 hover:bg-blue-500 text-white rounded-full w-14 h-14 shadow-2xl shadow-blue-500/30 flex items-center justify-center"
        title="Abrir Unico IA"
      >
        <Bot size={26} />
      </button>

      {/* Panel */}
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
                  <p className="text-xs text-slate-500 font-medium">Agente Operativo Autónomo</p>
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
                onKeyDown={(e) => { if (e.key === "Enter") send(); }}
                className="flex-1 bg-slate-900 border border-slate-700 text-white font-bold px-4 py-3 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
                placeholder={orgId ? "Escribe una instrucción..." : "Selecciona una organización primero..."}
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