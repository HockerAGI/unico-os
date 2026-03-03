"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, AlertTriangle, RefreshCcw, Copy } from "lucide-react";

const Row = ({ ok, label }) => (
  <div className="flex items-center justify-between gap-3 py-2">
    <div className="text-sm font-bold text-slate-700">{label}</div>
    {ok ? (
      <span className="inline-flex items-center gap-2 text-emerald-700 font-black text-xs">
        <CheckCircle2 size={16} /> OK
      </span>
    ) : (
      <span className="inline-flex items-center gap-2 text-rose-700 font-black text-xs">
        <AlertTriangle size={16} /> FALTA
      </span>
    )}
  </div>
);

export default function SetupWizard() {
  const [env, setEnv] = useState(null);

  const load = async () => {
    const res = await fetch("/api/health", { cache: "no-store" }).catch(() => null);
    const j = res ? await res.json().catch(() => null) : null;
    setEnv(j?.env || null);
  };

  useEffect(() => {
    load();
  }, []);

  const copy = async (t) => {
    try { await navigator.clipboard.writeText(t); } catch {}
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="max-w-xl w-full bg-white border border-slate-200 rounded-[2rem] shadow-2xl p-8">
        <h1 className="text-xl font-black text-slate-900">UnicOs — Setup requerido</h1>
        <p className="text-sm font-semibold text-slate-600 mt-2">
          Tu Netlify no tiene variables de entorno o no apuntan al Supabase correcto. Por eso sale “No se encontró la organización”.
        </p>

        <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Checklist</p>
            <button
              onClick={load}
              className="px-3 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 font-black text-xs flex items-center gap-2"
            >
              <RefreshCcw size={14} /> Reintentar
            </button>
          </div>

          {env ? (
            <div className="mt-3 divide-y divide-slate-200">
              <Row ok={env.NEXT_PUBLIC_SUPABASE_URL} label="NEXT_PUBLIC_SUPABASE_URL" />
              <Row ok={env.NEXT_PUBLIC_SUPABASE_ANON_KEY} label="NEXT_PUBLIC_SUPABASE_ANON_KEY" />
              <Row ok={env.SUPABASE_SECRET_KEY} label="SUPABASE_SERVICE_ROLE_KEY (o SUPABASE_SECRET_KEY)" />
              <Row ok={env.STRIPE_SECRET_KEY} label="STRIPE_SECRET_KEY" />
              <Row ok={env.ENVIA_API_KEY} label="ENVIA_API_KEY" />
            </div>
          ) : (
            <p className="text-sm font-semibold text-slate-500 mt-3">Leyendo /api/health…</p>
          )}
        </div>

        <div className="mt-6">
          <p className="text-sm font-black text-slate-900">Qué poner en Netlify (UnicOs):</p>
          <div className="mt-3 grid gap-2">
            {[
              "NEXT_PUBLIC_SUPABASE_URL",
              "NEXT_PUBLIC_SUPABASE_ANON_KEY",
              "SUPABASE_SERVICE_ROLE_KEY",
              "STRIPE_SECRET_KEY",
              "ENVIA_API_KEY",
            ].map((v) => (
              <button
                key={v}
                onClick={() => copy(v)}
                className="w-full text-left px-4 py-3 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 font-black text-sm flex items-center justify-between"
              >
                {v} <Copy size={16} className="text-slate-400" />
              </button>
            ))}
          </div>
        </div>

        <p className="text-xs font-semibold text-slate-500 mt-6">
          Después de setear envs: redeploy en Netlify + corre el SQL “UNIFIED DB” en Supabase.
        </p>
      </div>
    </div>
  );
}