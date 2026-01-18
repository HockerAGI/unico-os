"use client";
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { 
  LayoutDashboard, Package, Settings, ShoppingCart, 
  LogOut, ChevronDown, Plus, Search, Save, X, HelpCircle, Info 
} from 'lucide-react';

// --- COMPONENTE PRINCIPAL ---
export default function AdminDashboard() {
  const [orgs, setOrgs] = useState([]);
  const [selectedOrg, setSelectedOrg] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(true);
  const [helpMsg, setHelpMsg] = useState(null); // Estado para las ayudas visuales

  // Carga inicial
  useEffect(() => {
    async function init() {
      try {
        const { data } = await supabase.from('organizations').select('*');
        if (data && data.length > 0) {
          setOrgs(data);
          // Por defecto busca la que sea "Score Store", si no, la primera
          const score = data.find(o => o.slug === 'score-store');
          setSelectedOrg(score || data[0]);
        }
      } catch (e) {
        console.error("Error:", e);
      } finally {
        setLoading(false);
      }
    }
    init();
  }, []);

  if (loading) return <LoadingScreen />;
  if (!selectedOrg) return <EmptyState />;

  return (
    <div className="flex h-screen bg-slate-50 font-sans overflow-hidden">
      
      {/* === SIDEBAR (JERARQUÍA: ÚNICO ES EL SISTEMA) === */}
      <aside className="w-72 bg-white border-r border-slate-200 hidden md:flex flex-col z-20 shadow-sm relative">
        <div className="p-6 border-b border-slate-100">
          {/* Aquí va el LOGO DE ÚNICO (Jerarquía Superior) */}
          <div className="flex items-center gap-3">
             <div className="h-10 w-10 bg-unico-600 rounded-lg flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-red-200">
               U
             </div>
             <div>
               <h1 className="text-lg font-extrabold tracking-tight text-slate-900 leading-tight">
                 ÚNICO <span className="text-unico-600">OS</span>
               </h1>
               <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">
                 Admin Console v2.0
               </p>
             </div>
          </div>
        </div>

        {/* Selector de Empresa (Contexto actual) */}
        <div className="px-6 mt-6">
          <label className="text-xs font-bold text-slate-400 uppercase mb-2 block ml-1">Estás administrando:</label>
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
          {/* Nota solo para el dueño */}
          <p className="text-[10px] text-slate-400 mt-2 px-1 leading-tight">
            * Cambia aquí si deseas administrar otra marca de Único Uniformes en el futuro.
          </p>
        </div>

        <nav className="flex-1 px-4 space-y-2 mt-8">
          <NavBtn 
            icon={<LayoutDashboard size={20}/>} 
            label="Vista General" 
            active={activeTab === 'dashboard'} 
            onClick={() => setActiveTab('dashboard')} 
          />
          <NavBtn 
            icon={<Package size={20}/>} 
            label="Mis Productos" 
            active={activeTab === 'products'} 
            onClick={() => setActiveTab('products')} 
          />
          <NavBtn 
            icon={<Settings size={20}/>} 
            label="Editar Página Web" 
            active={activeTab === 'settings'} 
            onClick={() => setActiveTab('settings')} 
          />
        </nav>

        <div className="p-6">
          <button className="flex items-center gap-3 text-sm font-medium text-slate-500 hover:text-unico-600 transition-colors w-full px-4 py-3 rounded-xl hover:bg-red-50">
            <LogOut size={18}/> Salir del Sistema
          </button>
        </div>
      </aside>

      {/* === ÁREA PRINCIPAL === */}
      <main className="flex-1 overflow-y-auto relative bg-slate-50/50">
        {/* Header Superior */}
        <header className="bg-white/90 backdrop-blur sticky top-0 z-10 border-b border-slate-200 px-8 py-5 flex justify-between items-center shadow-sm">
          <div>
            <h2 className="text-2xl font-bold text-slate-800 tracking-tight">
              {activeTab === 'dashboard' && 'Resumen de Ventas'}
              {activeTab === 'products' && 'Inventario de Productos'}
              {activeTab === 'settings' && 'Configuración de la Tienda'}
            </h2>
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 mt-1">
               <div className={`h-2 w-2 rounded-full ${selectedOrg.slug === 'score-store' ? 'bg-green-500' : 'bg-gray-300'}`}></div>
               {selectedOrg.name.toUpperCase()}
            </div>
          </div>
          {/* Aquí puedes poner el logo de SCORE STORE si está seleccionado */}
          <div className="opacity-80 grayscale hover:grayscale-0 transition-all">
             {selectedOrg.slug === 'score-store' && (
                <span className="font-black text-2xl italic tracking-tighter text-slate-300 select-none">SCORE<span className="text-unico-600">STORE</span></span>
             )}
          </div>
        </header>

        <div className="p-8 max-w-6xl mx-auto pb-24">
          {activeTab === 'dashboard' && <DashboardView orgId={selectedOrg.id} setHelp={setHelpMsg} />}
          {activeTab === 'products' && <ProductsView orgId={selectedOrg.id} setHelp={setHelpMsg} />}
          {activeTab === 'settings' && <SettingsView orgId={selectedOrg.id} setHelp={setHelpMsg} />}
        </div>
      </main>

      {/* === SISTEMA DE AYUDA FLOTANTE (UX OWNER-PROOF) === */}
      {helpMsg && (
        <div className="fixed bottom-6 right-6 max-w-sm bg-slate-900 text-white p-5 rounded-2xl shadow-2xl z-50 animate-in slide-in-from-bottom-5 duration-300 flex gap-4 items-start">
           <Info className="text-unico-600 shrink-0 mt-1" size={24} />
           <div>
             <h4 className="font-bold text-sm mb-1 text-unico-100">¿Para qué sirve esto?</h4>
             <p className="text-sm leading-relaxed opacity-90">{helpMsg}</p>
             <button onClick={() => setHelpMsg(null)} className="text-xs font-bold mt-3 hover:text-unico-600 underline">Entendido</button>
           </div>
        </div>
      )}
    </div>
  );
}

// --- VISTAS INTERNAS ---

function DashboardView({ orgId, setHelp }) {
  const [stats, setStats] = useState({ products: 0, orders: 0 });

  useEffect(() => {
    async function load() {
      const { count: p } = await supabase.from('products').select('*', { count: 'exact', head: true }).eq('org_id', orgId);
      const { count: o } = await supabase.from('orders').select('*', { count: 'exact', head: true }).eq('org_id', orgId);
      setStats({ products: p || 0, orders: o || 0 });
    }
    load();
  }, [orgId]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <StatCard 
        title="Productos Activos" 
        value={stats.products} 
        icon={<Package className="text-blue-600"/>} 
        color="bg-blue-50"
        onHelp={() => setHelp("Este número indica cuántos modelos de ropa tienes visibles actualmente en la página web listos para venderse.")}
      />
      <StatCard 
        title="Pedidos del Mes" 
        value={stats.orders} 
        icon={<ShoppingCart className="text-green-600"/>} 
        color="bg-green-50"
        onHelp={() => setHelp("Total de compras realizadas exitosamente en los últimos 30 días.")}
      />
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-center items-center text-center col-span-1">
        <div className="h-12 w-12 bg-orange-50 rounded-full flex items-center justify-center mb-3">
          <Settings className="text-orange-500" size={24}/>
        </div>
        <h3 className="font-bold text-slate-800">Estado de la Tienda</h3>
        <span className="text-xs font-bold text-green-600 bg-green-100 px-3 py-1 rounded-full mt-2 border border-green-200">● EN LÍNEA Y VENDIENDO</span>
      </div>
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
        <div className="flex items-center gap-2">
            <Search className="text-slate-400" size={20}/>
            <input 
                type="text" 
                placeholder="Buscar por nombre..." 
                className="outline-none text-sm w-64 text-slate-600 placeholder:text-slate-300"
            />
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="bg-unico-600 hover:bg-red-700 text-white px-5 py-3 rounded-xl text-sm font-bold flex items-center gap-2 shadow-lg shadow-red-100 transition-all transform hover:scale-105"
        >
          <Plus size={18}/> Crear Nuevo Producto
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200 uppercase text-xs tracking-wider">
            <tr>
              <th className="px-6 py-4">Nombre del Producto</th>
              <th className="px-6 py-4">Precio (MXN)</th>
              <th className="px-6 py-4">Stock</th>
              <th className="px-6 py-4 text-right">Estatus</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {products.map(p => (
              <tr key={p.id} className="hover:bg-slate-50 transition-colors cursor-default">
                <td className="px-6 py-4 font-bold text-slate-800">{p.name}</td>
                <td className="px-6 py-4 text-slate-600 font-mono">${p.price}</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded text-xs font-bold ${p.stock > 10 ? 'bg-blue-50 text-blue-700' : 'bg-red-50 text-red-700'}`}>
                    {p.stock} pzas
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded border border-green-100">Activo</span>
                </td>
              </tr>
            ))}
            {products.length === 0 && (
              <tr><td colSpan="4" className="px-6 py-20 text-center text-slate-400">
                 <p className="font-bold text-lg mb-2">No tienes productos todavía</p>
                 <p className="text-sm">Usa el botón rojo de arriba para crear el primero.</p>
              </td></tr>
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <CreateProductModal 
          orgId={orgId} 
          onClose={() => setShowModal(false)} 
          onSuccess={() => { setShowModal(false); setRefresh(prev => prev + 1); }} 
          setHelp={setHelp}
        />
      )}
    </div>
  );
}

function SettingsView({ orgId, setHelp }) {
  const [config, setConfig] = useState({});
  const [saving, setSaving] = useState(false);
  
  useEffect(() => {
    supabase.from('site_settings').select('*').eq('org_id', orgId).single()
      .then(({ data }) => { if(data) setConfig(data); });
  }, [orgId]);

  const handleSave = async () => {
    setSaving(true);
    await supabase.from('site_settings').upsert({ ...config, org_id: orgId });
    setTimeout(() => { setSaving(false); alert("✅ Cambios aplicados en la tienda en vivo."); }, 800);
  };

  return (
    <div className="max-w-2xl bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
      <div className="flex justify-between items-center mb-8 border-b border-slate-100 pb-4">
          <h3 className="text-xl font-bold text-slate-800">Editar Apariencia Web</h3>
          <button 
            onClick={() => setHelp("Aquí puedes cambiar textos y configuraciones técnicas de la página web sin necesidad de llamar al programador.")}
            className="text-unico-600 hover:bg-red-50 p-2 rounded-full transition-colors"
          >
            <HelpCircle size={20}/>
          </button>
      </div>
      
      <div className="space-y-8">
        <FormInput 
          label="Título de la Portada (Hero)" 
          desc="Es el texto grande que ven los clientes al entrar."
          value={config.hero_title} 
          onChange={v => setConfig({...config, hero_title: v})}
          placeholder="Ej. NUEVA COLECCIÓN 2026"
          onHelp={() => setHelp("Escribe aquí frases cortas e impactantes. Ejemplo: 'BAJA 1000 - OFICIAL'. Esto reemplazará el texto principal de la página de inicio.")}
        />
        
        <FormInput 
          label="Pixel de Facebook (ID)" 
          desc="Código numérico para rastrear ventas en Meta Ads."
          value={config.pixel_id} 
          onChange={v => setConfig({...config, pixel_id: v})}
          placeholder="Ej. 1234567890"
          isCode
          onHelp={() => setHelp("Copia y pega aquí solo el ID numérico que te da Facebook Business Manager. Si no tienes campañas activas, puedes dejarlo en blanco.")}
        />

        <div className="pt-6 border-t border-slate-100">
          <button 
            onClick={handleSave} 
            disabled={saving}
            className={`w-full flex items-center justify-center gap-2 px-6 py-4 rounded-xl font-bold text-white transition-all shadow-md hover:shadow-lg ${saving ? 'bg-slate-400 cursor-wait' : 'bg-unico-600 hover:bg-red-700 active:scale-[0.98]'}`}
          >
            <Save size={20} />
            {saving ? 'Aplicando cambios...' : 'GUARDAR Y ACTUALIZAR WEB'}
          </button>
          <p className="text-center text-xs text-slate-400 mt-3">Los cambios son inmediatos.</p>
        </div>
      </div>
    </div>
  );
}

// --- UI COMPONENTS ---

function NavBtn({ icon, label, active, onClick }) {
  return (
    <button 
      onClick={onClick} 
      className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-xl text-sm font-bold transition-all duration-200 group ${active ? 'bg-unico-600 text-white shadow-md shadow-red-200' : 'text-slate-500 hover:bg-white hover:text-unico-600 hover:shadow-sm'}`}
    >
      <span className={active ? 'text-white' : 'text-slate-400 group-hover:text-unico-600'}>{icon}</span>
      {label}
    </button>
  );
}

function StatCard({ title, value, icon, color, onHelp }) {
  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-5 relative group hover:border-slate-300 transition-all">
      <button onClick={onHelp} className="absolute top-3 right-3 text-slate-300 hover:text-unico-600"><HelpCircle size={16}/></button>
      <div className={`h-14 w-14 rounded-2xl flex items-center justify-center ${color} bg-opacity-30`}>
        {icon}
      </div>
      <div>
        <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">{title}</p>
        <p className="text-3xl font-black text-slate-800 mt-1">{value}</p>
      </div>
    </div>
  );
}

function FormInput({ label, desc, value, onChange, placeholder, isCode, onHelp }) {
  return (
    <div className="relative">
      <div className="flex justify-between items-baseline mb-2">
        <label className="text-sm font-bold text-slate-800">{label}</label>
        {onHelp && <button onClick={onHelp} className="text-xs text-unico-600 font-bold hover:underline flex items-center gap-1"><HelpCircle size={12}/> ¿Qué es esto?</button>}
      </div>
      <input 
        className={`w-full border border-slate-200 bg-slate-50 p-4 rounded-xl focus:ring-2 focus:ring-unico-600/20 focus:border-unico-600 outline-none transition-all text-slate-700 font-bold placeholder:text-slate-300 ${isCode ? 'font-mono tracking-widest' : ''}`}
        value={value || ''}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
      />
      {desc && <p className="text-xs text-slate-400 mt-2 ml-1">{desc}</p>}
    </div>
  );
}

function CreateProductModal({ orgId, onClose, onSuccess, setHelp }) {
  const [form, setForm] = useState({ name: '', price: '', stock: '100' });
  const [submitting, setSubmitting] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if(!form.name || !form.price) return alert("Faltan datos");
    setSubmitting(true);
    await supabase.from('products').insert({
      org_id: orgId,
      name: form.name,
      price: parseFloat(form.price),
      stock: parseInt(form.stock),
      active: true
    });
    setSubmitting(false);
    onSuccess();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all scale-100">
        <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <h3 className="font-bold text-lg text-slate-800">Alta de Producto</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-red-500 bg-white p-2 rounded-full shadow-sm"><X size={20}/></button>
        </div>
        <form onSubmit={submit} className="p-8 space-y-6">
          <FormInput 
            label="Nombre del Artículo" 
            placeholder="Ej. Camiseta Negra Baja 1000" 
            value={form.name} 
            onChange={v => setForm({...form, name: v})} 
            onHelp={() => setHelp("Usa un nombre descriptivo que incluya el color o edición. Ejemplo: 'Hoodie Oficial 2026'")}
          />
          <div className="grid grid-cols-2 gap-6">
            <FormInput 
                label="Precio (MXN)" 
                placeholder="0.00" 
                value={form.price} 
                onChange={v => setForm({...form, price: v})} 
                onHelp={() => setHelp("Precio final al público en Pesos Mexicanos.")}
            />
            <FormInput 
                label="Inventario Inicial" 
                placeholder="100" 
                value={form.stock} 
                onChange={v => setForm({...form, stock: v})} 
                onHelp={() => setHelp("Cantidad de piezas físicas que tienes disponibles para vender hoy.")}
            />
          </div>
          <div className="pt-4">
            <button type="submit" disabled={submitting} className="w-full bg-unico-600 hover:bg-red-700 text-white font-bold py-4 rounded-xl shadow-lg shadow-red-100 transition-all active:scale-[0.98]">
              {submitting ? 'Creando ficha...' : 'CONFIRMAR Y GUARDAR'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function LoadingScreen() {
  return (
    <div className="h-screen w-screen flex flex-col items-center justify-center bg-white">
      <div className="h-16 w-16 bg-unico-600 rounded-2xl animate-pulse flex items-center justify-center shadow-xl shadow-red-200 mb-6">
        <span className="text-white font-black text-2xl">U</span>
      </div>
      <p className="text-sm font-bold tracking-widest text-slate-400">CARGANDO ÚNICO OS...</p>
    </div>
  );
}

function EmptyState() {
  return <div className="h-screen flex items-center justify-center text-slate-400">No se encontraron datos de la organización.</div>;
}