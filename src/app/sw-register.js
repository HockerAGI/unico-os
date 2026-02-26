// src/app/sw-register.js
"use client";

import { useEffect } from "react";

export default function SwRegister() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator)) return;

    let refreshing = false;

    const onControllerChange = () => {
      if (refreshing) return;
      refreshing = true;
      window.location.reload();
    };

    const register = async () => {
      try {
        // Ajusta si tu SW tiene otro nombre, pero según tu estructura es /sw.js
        const reg = await navigator.serviceWorker.register("/sw.js", { scope: "/" });

        // Si hay un update esperando, lo activamos
        if (reg.waiting) reg.waiting.postMessage({ type: "SKIP_WAITING" });

        reg.addEventListener("updatefound", () => {
          const w = reg.installing;
          if (!w) return;

          w.addEventListener("statechange", () => {
            // Nuevo SW instalado y ya había uno controlando => actualizar YA
            if (w.state === "installed" && navigator.serviceWorker.controller) {
              w.postMessage({ type: "SKIP_WAITING" });
            }
          });
        });

        navigator.serviceWorker.addEventListener("controllerchange", onControllerChange);
      } catch (e) {
        // Silencioso: no rompe UI
        console.warn("SW register failed:", e?.message || e);
      }
    };

    register();

    return () => {
      navigator.serviceWorker.removeEventListener("controllerchange", onControllerChange);
    };
  }, []);

  return null;
}