// src/app/sw-register.js
"use client";

import { useEffect } from "react";

export default function SwRegister() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator)) return;

    const register = async () => {
      try {
        // Ajusta si tu SW tiene otro nombre, pero según tu estructura es /sw.js
        await navigator.serviceWorker.register("/sw.js", { scope: "/" });
      } catch (e) {
        // Silencioso: no rompe UI
        console.warn("SW register failed:", e?.message || e);
      }
    };

    register();
  }, []);

  return null;
}