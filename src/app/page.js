"use client";
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { 
  LayoutDashboard, Package, Settings, ShoppingCart, Truck, 
  LogOut, ChevronDown, Plus, Search, Save, X, HelpCircle, 
  Info, MessageCircle, Megaphone, Bell, CheckCircle 
} from 'lucide-react';

export default function AdminDashboard() {
  const [orgs, setOrgs] = useState([]);
  const [selectedOrg, setSelectedOrg] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(true);
  const [helpMsg, setHelpMsg] = useState(null);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);

  // --- INICIALIZACIÓN Y AUTOMATIZACIÓN ---
  useEffect(() => {
    async function init() {
      try {
        const { data } = await supabase.from('organizations').select('*');
        if (data && data.length > 0) {
          setOrgs(data);
          const score = data.find(o => o.slug === 'score-store');
          setSelectedOrg(score || data[0]);
        }
        
        // Verificar permisos de notificación
        if ('Notification' in window && Notification.permission === 'granted') {
          setNotificationsEnabled(true);
        }
      } catch (e) { console.error(e); } finally { setLoading(false); }
    }
    init();
  }, []);

  // --- MOTOR DE NOTIFICACIONES INTELIGENTES (SCANNER) ---
  useEffect(() => {
    if (!selectedOrg || !notificationsEnabled) return;
    
    const runScanner = async () => {
      // 1. Escanear Stock Crítico
      const { data: lowStock } = await supabase
        .from('products')
        .select('name, stock')
        .eq('org_id', selectedOrg.id)
        .lt('stock', 5) // Menos de 5 piezas
        .limit(1);

      if (lowStock && lowStock.length > 0) {
        new Notification("⚠️ ALERTA DE STOCK", {
          body: `El producto "${lowStock[0].name}" se está agotando (${lowStock[0].stock} pzas).`,
          icon: '/icon-192.png'
        });
      }

      // 2. Escanear Pedidos Nuevos (Pagados pero no enviados)
      const { count: pendingOrders } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .eq('org_id', selectedOrg.id)
        .eq('status', 'paid'); // Status 'paid' significa pagado pero no 'shipped'

      if (pendingOrders > 0) {
        new Notification("💰 PEDIDOS PENDIENTES", {
          body: `Tienes ${pendingOrders} pedidos pagados esperando envío.`,
          icon: '/icon-192.png'
        });
      }
    };
    
    // Ejecutar scanner al abrir y cada 5 minutos
    runScanner();
    const interval = setInterval(runScanner, 300000); 
    return () => clearInterval(interval);

  }, [selectedOrg, notificationsEnabled]);

  const requestNotify = async () => {
    if (!('Notification' in window)) return alert("Tu dispositivo no soporta notificaciones.");
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      setNotificationsEnabled(true);
      new Notification("🔔 Único OS", { body: "Notificaciones activadas correctamente." });
    }
  };

  if (loading) return <LoadingScreen />;
  if (!selectedOrg) return <EmptyState />;

  return (
    <div className="flex h-screen bg-slate-50 font-sans overflow-hidden">
      
      {/* SIDEBAR */}
      <aside className="w-72 bg-white border-r border-slate-200 hidden md:flex flex-col z-20 shadow-sm relative">
        <div className="p-6 border-b border-slate-100">
          <div className="flex items-center gap-3">
             <div className="h-10 w-10 bg-unico-600 rounded-lg flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-red-200">U</div>
             <div>
               <h1 className="text-lg font-extrabold text-slate-900 leading-tight">ÚNICO <span className="text-unico-600">OS</span></h1>
               <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">Commander v4.0</p>
             </div>
          </div>
        </div>

        <div className="px-6 mt-6">
          <label className="text-xs font-bold text-slate-400 uppercase mb-2 block ml-1">Organización:</label>
          <div className="relative group">
            <select 
              className="w-full appearance-none bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-sm font-bold text-slate-700 cursor-pointer outline-none focus:ring-2 focus:ring-unico-600/20 transition-all shadow-sm"
              value={selectedOrg.id}
              onChange={(e) => setSelectedOrg(orgs.find(o => o.id === e.target.value))}
            >
              {orgs.map(org => <option key={org.id} value={org.id}>{org.name}</option>)}
            </select>
            <ChevronDown className="absolute right-4 top-3.5 text-slate-400 pointer-events-none" size={16} />
          </div>
        </div>

        <nav className="flex-1 px-4 space-y-2 mt-8">
          <NavBtn icon={<LayoutDashboard size={20}/>} label="Vista General" active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} />
          <NavBtn icon={<ShoppingCart size={20}/>} label="Pedidos y Envíos" active={activeTab === 'orders'} onClick={() => setActiveTab('orders')} />
          <NavBtn icon={<Package size={20}/>} label="Inventario" active={activeTab === 'products'} onClick={() => setActiveTab('products')} />
          <NavBtn icon={<Megaphone size={20}/>} label="Marketing & Ofertas" active={activeTab === 'marketing'} onClick={() => setActiveTab('marketing')} />
          <NavBtn icon={<Settings size={20}/>} label="Configuración Web" active={activeTab === 'settings'} onClick={() => setActiveTab('settings')} />
        </nav>

        <div className="p-6">
           {/* Botón rápido de Notificaciones */}
           {!notificationsEnabled && (
             <button onClick={requestNotify} className="mb-4 flex items-center gap-3 text-xs font-bold text-unico-600 bg-red-50 w-full px-4 py-3 rounded-xl border border-red-100 hover:bg-red-100 transition-all animate-pulse">
               <Bell size={16}/> Activar Alertas
             </button>
           )}
           <button className="flex items-center gap-3 text-sm font-medium text-slate-400 hover:text-slate-600 w-full px-4 py-2 rounded-xl transition-all">
             <LogOut size={18}/> Salir
           </button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 overflow-y-auto relative bg-slate-50/50">
        <header className="bg-white/90 backdrop-blur sticky top-0 z-10 border-b border-slate-200 px-8 py-5 flex justify-between items-center shadow-sm">
          <div>
            <h2 className="text-2xl font-bold text-slate-800 tracking-tight">
              {activeTab === 'dashboard' && 'Centro de Comando'}
              {activeTab === 'orders' && 'Gestión Logística'}
              {activeTab === 'products' && 'Inventario Global'}
              {activeTab === 'marketing' && 'Campañas y Ofertas'}
              {activeTab === 'settings' && 'Ajustes Técnicos'}
            </h2>
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 mt-1">
               <div className={`h-2 w-2 rounded-full ${selectedOrg.slug === 'score-store' ? 'bg-green-500' : 'bg-gray-300'}`}></div>
               {selectedOrg.name.toUpperCase()}
            </div>
          </div>
        </header>

        <div className="p-8 max-w-6xl mx-auto pb-32">
          {activeTab === 'dashboard' && <DashboardView orgId={selectedOrg.id} setHelp={setHelpMsg} />}
          {activeTab === 'orders' && <OrdersView orgId={selectedOrg.id} setHelp={setHelpMsg} />}
          {activeTab === 'products' && <ProductsView orgId={selectedOrg.id} setHelp={setHelpMsg} />}
          {activeTab === 'marketing' && <MarketingView orgId={selectedOrg.id} setHelp={setHelpMsg} />}
          {activeTab === 'settings' && <SettingsView orgId={selectedOrg.id} setHelp={setHelpMsg} />}
        </div>
      </main>

      {/* HELPER FLOTANTE */}
      {helpMsg && (
        <div className="fixed bottom-6 right-6 max-w-sm bg-slate-900 text-white p-5 rounded-2xl shadow-2xl z-50 animate-in slide-in-from-bottom-5 flex gap-4 items-start">
           <Info className="text-unico-600 shrink-0 mt-1" size={24} />
           <div>
             <h4 className="font-bold text-sm mb-1 text-unico-100">Ayuda Rápida</h4>
             <p className="text-sm leading-relaxed opacity-90">{helpMsg}</p>
             <button onClick={() => setHelpMsg(null)} className="text-xs font-bold mt-3 hover:text-unico-600 underline">Entendido</button>
           </div>
        </div>
      )}
    </div>
  );
}

// --- VISTAS DEL SISTEMA (MÓDULOS) ---

function DashboardView({ orgId, setHelp }) {
  const [stats, setStats] = useState({ products: 0, orders: 0, revenue: 0 });
  useEffect(() => {
    async function load() {
      const { count: p } = await supabase.from('products').select('*', { count: 'exact', head: true }).eq('org_id', orgId);
      const { data: orders } = await supabase.from('orders').select('total').eq('org_id', orgId).eq('status', 'paid');
      const totalRev = orders?.reduce((sum, o) => sum + (o.total || 0), 0) || 0;
      setStats({ products: p || 0, orders: orders?.length || 0, revenue: totalRev });
    }
    load();
  }, [orgId]);

  return (
    <div className="space-y-6">
       <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard title="Ventas del Mes" value={`$${stats.revenue.toLocaleString()}`} icon={<p className="text-2xl font-black text-green-600">$</p>} color="bg-green-50" onHelp={() => setHelp("Dinero total recaudado de pedidos con estatus 'Pagado' en el periodo actual.")}/>
        <StatCard title="Pedidos por Enviar" value={stats.orders} icon={<ShoppingCart className="text-blue-600"/>} color="bg-blue-50" onHelp={() => setHelp("Pedidos que ya fueron pagados pero aún no tienen guía de rastreo asignada.")}/>
        <StatCard title="Inventario Activo" value={stats.products} icon={<Package className="text-orange-600"/>} color="bg-orange-50" onHelp={() => setHelp("Número de fichas de producto visibles en la tienda.")}/>
      </div>
      
      {/* Accesos Rápidos (Quick Actions) */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <h3 className="font-bold text-slate-800 mb-4">Acciones Rápidas</h3>
        <div className="flex gap-4">
           <button onClick={() => alert("Función en desarrollo: Abre Envia.com")} className="flex items-center gap-2 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-100 transition-all">
             <Truck size={18}/> Cotizar Envío
           </button>
           <button onClick={() => window.open('https://analytics.google.com', '_blank')} className="flex items-center gap-2 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-100 transition-all">
             <Settings size={18}/> Ver Google Analytics
           </button>
        </div>
      </div>
    </div>
  );
}

function OrdersView({ orgId, setHelp }) {
  const [orders, setOrders] = useState([]);
  
  useEffect(() => {
    // Carga de pedidos reales (simulado con array vacío si no hay DB aun)
    supabase.from('orders').select('*').eq('org_id', orgId).order('created_at', { ascending: false })
      .then(({ data }) => setOrders(data || []));
  }, [orgId]);

  const sendWhatsApp = (order) => {
    const text = `Hola ${order.customer_name || 'Cliente'}, tu pedido #${order.id.slice(0,5)} de Score Store ya está en proceso. Te avisaremos cuando salga.`;
    window.open(`https://wa.me/${order.phone || ''}?text=${encodeURIComponent(text)}`, '_blank');
  };

  const updateTracking = async (id) => {
    const guide = prompt("Escanea o escribe el Número de Guía:");
    if(guide) {
      await supabase.from('orders').update({ tracking_number: guide, status: 'shipped' }).eq('id', id);
      alert("Guía guardada y pedido marcado como ENVIADO.");
      // Recargar
      const { data } = await supabase.from('orders').select('*').eq('org_id', orgId);
      setOrders(data || []);
    }
  };

  return (
    <div className="space-y-6">
       <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-slate-100">
         <h3 className="font-bold text-slate-700">Centro de Pedidos</h3>
         <button onClick={() => setHelp("Gestión logística. Usa 'WhatsApp' para avisar al cliente y 'Agregar Guía' para cerrar el pedido.")}><HelpCircle className="text-slate-300 hover:text-unico-600"/></button>
       </div>

       {orders.length === 0 ? (
         <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-slate-300">
           <div className="mx-auto w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4"><ShoppingCart className="text-slate-300" size={32}/></div>
           <p className="text-slate-500 font-bold">Todo está tranquilo</p>
           <p className="text-sm text-slate-400">No hay pedidos pendientes de procesar.</p>
         </div>
       ) : (
         <div className="grid gap-4">
           {orders.map(order => (
             <div key={order.id} className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm flex flex-col md:flex-row justify-between items-center gap-4">
               <div>
                 <div className="flex items-center gap-2">
                    <p className="font-bold text-slate-800 text-lg">Pedido #{order.id.slice(0,5).toUpperCase()}</p>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${order.status === 'paid' ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'}`}>
                      {order.status === 'paid' ? 'Por Enviar' : 'Enviado'}
                    </span>
                 </div>
                 <p className="text-sm text-slate-500">{order.customer_email} • Total: ${order.total}</p>
                 {order.tracking_number && <p className="text-xs font-mono text-slate-400 mt-1">Guía: {order.tracking_number}</p>}
               </div>
               <div className="flex gap-2 w-full md:w-auto">
                 <button onClick={() => sendWhatsApp(order)} className="flex-1 flex items-center justify-center gap-2 bg-green-500 text-white px-4 py-3 rounded-xl font-bold text-xs hover:bg-green-600 transition-all">
                   <MessageCircle size={16}/> WhatsApp
                 </button>
                 {order.status !== 'shipped' && (
                   <button onClick={() => updateTracking(order.id)} className="flex-1 flex items-center justify-center gap-2 bg-slate-800 text-white px-4 py-3 rounded-xl font-bold text-xs hover:bg-black transition-all">
                     <Truck size={16}/> Agregar Guía
                   </button>
                 )}
               </div>
             </div>
           ))}
         </div>
       )}
    </div>
  );
}

function ProductsView({ orgId, setHelp }) {
  const [products, setProducts] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [refresh, setRefresh] = useState(0);

  useEffect(() => {
    supabase.from('products').select('*').eq('org_id', orgId).order('created_at', { ascending: false })
      .then(({ data }) => setProducts(data || []));
  }, [orgId, refresh]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-slate-100">
        <div className="flex items-center gap-2"><Search className="text-slate-400" size={20}/><input type="text" placeholder="Buscar producto..." className="outline-none text-sm w-64 text-slate-600 placeholder:text-slate-300"/></div>
        <button onClick={() => setShowModal(true)} className="bg-unico-600 hover:bg-red-700 text-white px-5 py-3 rounded-xl text-sm font-bold flex items-center gap-2 shadow-lg shadow-red-100 transition-all hover:scale-105">
          <Plus size={18}/> Nuevo Producto
        </button>
      </div>
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200 uppercase text-xs">
            <tr><th className="px-6 py-4">Producto</th><th className="px-6 py-4">Precio</th><th className="px-6 py-4">Stock</th><th className="px-6 py-4 text-right">Estatus</th></tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {products.map(p => (
              <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-6 py-4 font-bold text-slate-800">{p.name}</td>
                <td className="px-6 py-4 text-slate-600 font-mono">${p.price}</td>
                <td className="px-6 py-4"><span className={`px-2 py-1 rounded text-xs font-bold ${p.stock > 10 ? 'bg-blue-50 text-blue-700' : 'bg-red-50 text-red-700'}`}>{p.stock} pzas</span></td>
                <td className="px-6 py-4 text-right"><span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded">Activo</span></td>
              </tr>
            ))}
            {products.length === 0 && <tr><td colSpan="4" className="px-6 py-20 text-center text-slate-400">Sin productos.</td></tr>}
          </tbody>
        </table>
      </div>
      {showModal && <CreateProductModal orgId={orgId} onClose={() => setShowModal(false)} onSuccess={() => { setShowModal(false); setRefresh(prev => prev + 1); }} setHelp={setHelp}/>}
    </div>
  );
}

function MarketingView({ orgId, setHelp }) {
  const [config, setConfig] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => { supabase.from('site_settings').select('*').eq('org_id', orgId).single().then(({ data }) => { if(data) setConfig(data); }); }, [orgId]);

  const handleSave = async () => { 
      setSaving(true); 
      await supabase.from('site_settings').upsert({ ...config, org_id: orgId }); 
      setTimeout(() => { setSaving(false); alert("Oferta actualizada en la web."); }, 800); 
  };

  return (
    <div className="max-w-2xl bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
        <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold text-slate-800">Cintillo de Ofertas</h3>
            <button onClick={() => setHelp("Activa la barra amarilla superior en la tienda para anuncios urgentes.")} className="text-unico-600"><HelpCircle size={20}/></button>
        </div>
        <div className="space-y-6">
            <div className={`p-4 rounded-xl border-2 transition-all ${config.promo_active ? 'border-green-500 bg-green-50' : 'border-slate-200 bg-slate-50'}`}>
                <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-700">Estado de la Promoción</span>
                    <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" checked={config.promo_active || false} onChange={e => setConfig({...config, promo_active: e.target.checked})} className="sr-only peer"/>
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                    </label>
                </div>
            </div>
            <FormInput label="Texto de la Oferta" placeholder="Ej. ¡ENVÍO GRATIS HOY!" value={config.promo_text} onChange={v => setConfig({...config, promo_text: v})} onHelp={() => setHelp("El texto que aparecerá en la barra superior.")}/>
            <button onClick={handleSave} disabled={saving} className="w-full bg-unico-600 text-white font-bold py-4 rounded-xl hover:bg-red-700 transition-all shadow-md">{saving ? 'Publicando...' : 'PUBLICAR OFERTA'}</button>
        </div>
    </div>
  );
}

function SettingsView({ orgId, setHelp }) {
  const [config, setConfig] = useState({});
  const [saving, setSaving] = useState(false);
  useEffect(() => { supabase.from('site_settings').select('*').eq('org_id', orgId).single().then(({ data }) => { if(data) setConfig(data); }); }, [orgId]);
  const handleSave = async () => { setSaving(true); await supabase.from('site_settings').upsert({ ...config, org_id: orgId }); setTimeout(() => { setSaving(false); alert("✅ Cambios aplicados."); }, 800); };

  return (
    <div className="max-w-2xl bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
      <div className="flex justify-between items-center mb-8 border-b border-slate-100 pb-4">
          <h3 className="text-xl font-bold text-slate-800">Ajustes Web</h3>
          <button onClick={() => setHelp("Configuraciones técnicas.")} className="text-unico-600"><HelpCircle size={20}/></button>
      </div>
      <div className="space-y-8">
        <FormInput label="Título Portada" value={config.hero_title} onChange={v => setConfig({...config, hero_title: v})} placeholder="Ej. NUEVA COLECCIÓN" onHelp={() => setHelp("Texto principal de la página de inicio.")}/>
        <FormInput label="Pixel Facebook ID" value={config.pixel_id} onChange={v => setConfig({...config, pixel_id: v})} placeholder="Ej. 1234567890" isCode onHelp={() => setHelp("ID numérico de FB Business.")}/>
        <div className="pt-6 border-t border-slate-100">
          <button onClick={handleSave} disabled={saving} className="w-full bg-unico-600 text-white font-bold py-4 rounded-xl hover:bg-red-700 shadow-md">{saving ? 'Guardando...' : 'GUARDAR CAMBIOS'}</button>
        </div>
      </div>
    </div>
  );
}

// --- UI COMPONENTS ---
function NavBtn({ icon, label, active, onClick }) { return <button onClick={onClick} className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-xl text-sm font-bold transition-all group ${active ? 'bg-unico-600 text-white shadow-md' : 'text-slate-500 hover:bg-white hover:text-unico-600'}`}><span className={active ? 'text-white' : 'text-slate-400 group-hover:text-unico-600'}>{icon}</span>{label}</button>; }
function StatCard({ title, value, icon, color, onHelp }) { return <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-5 relative"><button onClick={onHelp} className="absolute top-3 right-3 text-slate-300 hover:text-unico-600"><HelpCircle size={16}/></button><div className={`h-14 w-14 rounded-2xl flex items-center justify-center ${color} bg-opacity-30`}>{icon}</div><div><p className="text-slate-400 text-xs font-bold uppercase">{title}</p><p className="text-3xl font-black text-slate-800 mt-1">{value}</p></div></div>; }
function FormInput({ label, desc, value, onChange, placeholder, isCode, onHelp }) { return <div className="relative"><div className="flex justify-between items-baseline mb-2"><label className="text-sm font-bold text-slate-800">{label}</label>{onHelp && <button onClick={onHelp} className="text-xs text-unico-600 font-bold hover:underline flex items-center gap-1"><HelpCircle size={12}/> Ayuda</button>}</div><input className={`w-full border border-slate-200 bg-slate-50 p-4 rounded-xl focus:ring-2 focus:ring-unico-600/20 focus:border-unico-600 outline-none text-slate-700 font-bold ${isCode ? 'font-mono' : ''}`} value={value || ''} onChange={e => onChange(e.target.value)} placeholder={placeholder}/>{desc && <p className="text-xs text-slate-400 mt-2 ml-1">{desc}</p>}</div>; }
function CreateProductModal({ orgId, onClose, onSuccess, setHelp }) { const [form, setForm] = useState({ name: '', price: '', stock: '100' }); const [submitting, setSubmitting] = useState(false); const submit = async (e) => { e.preventDefault(); setSubmitting(true); await supabase.from('products').insert({ org_id: orgId, name: form.name, price: parseFloat(form.price), stock: parseInt(form.stock), active: true }); setSubmitting(false); onSuccess(); }; return <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in"><div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden"><div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-slate-50"><h3 className="font-bold text-lg text-slate-800">Alta de Producto</h3><button onClick={onClose}><X size={20}/></button></div><form onSubmit={submit} className="p-8 space-y-6"><FormInput label="Nombre" placeholder="Ej. Hoodie 2026" value={form.name} onChange={v => setForm({...form, name: v})} onHelp={() => setHelp("Nombre descriptivo.")}/><div className="grid grid-cols-2 gap-6"><FormInput label="Precio" placeholder="0.00" value={form.price} onChange={v => setForm({...form, price: v})} onHelp={() => setHelp("Precio final en Pesos.")}/><FormInput label="Stock" placeholder="100" value={form.stock} onChange={v => setForm({...form, stock: v})} onHelp={() => setHelp("Cantidad física.")}/></div><button type="submit" disabled={submitting} className="w-full bg-unico-600 text-white font-bold py-4 rounded-xl shadow-lg">{submitting ? 'Creando...' : 'CONFIRMAR'}</button></form></div></div>; }
function LoadingScreen() { return <div className="h-screen w-screen flex flex-col items-center justify-center bg-white"><div className="h-16 w-16 bg-unico-600 rounded-2xl animate-pulse flex items-center justify-center shadow-xl mb-6"><span className="text-white font-black text-2xl">U</span></div><p className="text-sm font-bold tracking-widest text-slate-400">CARGANDO...</p></div>; }
function EmptyState() { return <div className="h-screen flex items-center justify-center text-slate-400">Error de Organización.</div>; }