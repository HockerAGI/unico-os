/* UnicOs — Service Worker PRO (Next-safe) */

const VERSION = "unicos-sw-2026-02-27";
const STATIC_CACHE = `unicos-static-${VERSION}`;
const RUNTIME_CACHE = `unicos-runtime-${VERSION}`;

const PRECACHE = [
  "/offline.html",
  "/manifest.json",
  "/icon-192.png",
  "/icon-512.png",
  "/logo-unico.png", // puede no existir: lo intentamos sin romper
];

// Helper: precache sin fallar si un asset no existe (logo-unico.png)
async function safePrecache() {
  const cache = await caches.open(STATIC_CACHE);
  for (const path of PRECACHE) {
    try {
      const res = await fetch(path, { cache: "no-store" });
      if (res && res.ok) await cache.put(path, res.clone());
    } catch {
      // ignore
    }
  }
}

self.addEventListener("install", (event) => {
  event.waitUntil(safePrecache());
  // NO skipWaiting automático: evita cambios sorpresa durante auditorías
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.map((k) => (k.startsWith("unicos-") && k !== STATIC_CACHE && k !== RUNTIME_CACHE ? caches.delete(k) : null)));
      await self.clients.claim();
    })()
  );
});

self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") self.skipWaiting();
});

async function cacheFirst(req, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(req, { ignoreSearch: true });
  if (cached) return cached;

  const fresh = await fetch(req);
  if (fresh && fresh.ok) cache.put(req, fresh.clone());
  return fresh;
}

async function staleWhileRevalidate(req, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(req, { ignoreSearch: true });

  const fetchPromise = fetch(req)
    .then((fresh) => {
      if (fresh && fresh.ok) cache.put(req, fresh.clone());
      return fresh;
    })
    .catch(() => null);

  return cached || (await fetchPromise) || Response.error();
}

self.addEventListener("fetch", (event) => {
  const req = event.request;
  const url = new URL(req.url);

  if (req.method !== "GET") return;

  // Navegación: network-first + fallback offline (NO cacheamos HTML)
  if (req.mode === "navigate") {
    event.respondWith(
      fetch(req).catch(async () => {
        const cache = await caches.open(STATIC_CACHE);
        return (await cache.match("/offline.html")) || new Response("Offline", { status: 503 });
      })
    );
    return;
  }

  // Solo mismo origen
  if (url.origin !== self.location.origin) return;

  // Nunca cachear APIs ni data dinámica
  if (url.pathname.startsWith("/api/")) return;

  // Next static chunks (hash) => cache-first (seguro)
  if (url.pathname.startsWith("/_next/static/")) {
    event.respondWith(cacheFirst(req, STATIC_CACHE));
    return;
  }

  // Precache assets => cache-first
  if (PRECACHE.includes(url.pathname)) {
    event.respondWith(cacheFirst(req, STATIC_CACHE));
    return;
  }

  // Imágenes locales => stale-while-revalidate
  if (/\.(png|jpg|jpeg|webp|svg|ico)$/i.test(url.pathname)) {
    event.respondWith(staleWhileRevalidate(req, RUNTIME_CACHE));
    return;
  }
});