// src/app/sw-register.js
"use client";

import { useEffect } from "react";

/**
 * SW Register (Lighthouse-safe + Updates reales)
 * - Registra después de load/idle (evita falsos positivos en auditorías)
 * - Fuerza check de update y aplica cuando está listo (sin loops raros)
 */
export default function SwRegister() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator)) return;

    let refreshing = false;
    let intervalId = null;

    const activateUpdate = (waiting) => {
      if (!waiting) return;
      try {
        waiting.postMessage({ type: "SKIP_WAITING" });
      } catch {}
    };

    const register = async () => {
      try {
        const reg = await navigator.serviceWorker.register("/sw.js", { scope: "/" });

        // Si ya hay update esperando, actívalo
        if (reg.waiting) activateUpdate(reg.waiting);

        // Detecta updates
        reg.addEventListener("updatefound", () => {
          const nw = reg.installing;
          if (!nw) return;
          nw.addEventListener("statechange", () => {
            // installed + controller => update (no primera instalación)
            if (nw.state === "installed" && navigator.serviceWorker.controller) {
              activateUpdate(reg.waiting);
            }
          });
        });

        // Force update check (mitiga "se quedó en versión vieja")
        try {
          await reg.update();
        } catch {}

        // Chequeo periódico (1h)
        intervalId = window.setInterval(() => {
          try {
            reg.update();
          } catch {}
        }, 60 * 60 * 1000);
      } catch {
        // silence
      }
    };

    const onLoad = () => {
      if ("requestIdleCallback" in window) {
        window.requestIdleCallback(() => register(), { timeout: 2500 });
      } else {
        setTimeout(() => register(), 1200);
      }
    };

    const onControllerChange = () => {
      if (refreshing) return;
      refreshing = true;
      // recarga suave para aplicar nuevos chunks/estilos
      window.location.reload();
    };

    navigator.serviceWorker.addEventListener("controllerchange", onControllerChange);

    if (document.readyState === "complete") onLoad();
    else window.addEventListener("load", onLoad, { once: true });

    return () => {
      navigator.serviceWorker.removeEventListener("controllerchange", onControllerChange);
      window.removeEventListener("load", onLoad);
      if (intervalId) clearInterval(intervalId);
    };
  }, []);

  return null;
}