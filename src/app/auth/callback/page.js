"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function AuthCallbackPage() {
  const router = useRouter();
  const [message, setMessage] = useState("Validando tu acceso...");

  useEffect(() => {
    let active = true;

    const run = async () => {
      try {
        const url = new URL(window.location.href);
        const code = url.searchParams.get("code");
        const tokenHash = url.searchParams.get("token_hash");
        const type = url.searchParams.get("type") || "magiclink";

        if (code && supabase) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) throw error;
        } else if (tokenHash && supabase) {
          const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type });
          if (error) throw error;
        }

        if (!active) return;
        setMessage("Acceso confirmado. Entrando al panel...");
        router.replace("/");
      } catch (e) {
        if (!active) return;
        setMessage(String(e?.message || "No pude validar tu acceso. Pide un nuevo enlace."));
      }
    };

    run();
    return () => {
      active = false;
    };
  }, [router]);

  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-10">
      <div className="unicos-wrap w-full max-w-xl">
        <section className="unicos-panel p-8 md:p-10 text-center">
          <div className="mx-auto mb-5 h-20 w-20 unicos-brand-frame p-3">
            <img src="/logo-unico.png" alt="UnicOs" className="h-full w-full object-contain rounded-[20px]" />
          </div>
          <p className="text-[11px] font-black uppercase tracking-[0.22em] text-sky-300">Acceso seguro</p>
          <h1 className="mt-3 text-3xl font-black text-white">Estamos abriendo tu panel</h1>
          <p className="mt-4 text-sm leading-relaxed text-slate-300">{message}</p>
        </section>
      </div>
    </main>
  );
}