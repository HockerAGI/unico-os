// src/app/error.js
"use client";

import { useEffect } from "react";
import { ShieldAlert, RefreshCcw } from "lucide-react";

function hardReloadOnce() {
  try {
    if (sessionStorage.getItem("__unicos_hard_reload__") === "1") return;
    sessionStorage.setItem("__unicos_hard_reload__", "1");
  } catch {}

  window.location.reload();
}

export default function GlobalError({ error }) {
  useEffect(() => {
    const msg = String(error?.message || "");

    if (
      msg.includes("Failed to fetch dynamically imported module") ||
      msg.toLowerCase().includes("chunk") ||
      msg.toLowerCase().includes("chunkload")
    ) {
      hardReloadOnce();
    }
  }, [error]);

  return (
    <div className="h-screen w-full flex items-center justify-center bg-[#0a0f1c] text-white p-6 font-sans">
      <div className="text-center max-w-md bg-white/5 p-10 rounded-3xl border border-white/10 shadow-2xl backdrop-blur-md">
        <div className="w-20 h-20 bg-blue-500/20 text-blue-400 rounded-full flex items-center justify-center mx-auto mb-6">
          <ShieldAlert size={40} />
        </div>
        <h2 className="text-2xl font-black mb-2 tracking-tight">Sincronizando Sistema…</h2>
        <p className="text-slate-400 text-sm mb-8 leading-relaxed">
          Detecté un desajuste temporal de módulos (actualización en curso). Para continuar, refresca la app.
        </p>
        <button
          onClick={hardReloadOnce}
          className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black py-4 rounded-xl transition-all shadow-lg flex items-center justify-center gap-2"
        >
          <RefreshCcw size={18} /> Refrescar
        </button>
      </div>
    </div>
  );
}