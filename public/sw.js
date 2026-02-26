/* ÚNICO OS — Service Worker (Admin Secure Mode) */
const CACHE_NAME = "unicos-admin-v2";

/**
 * FIX REAL:
 * - NO cacheamos "/" (HTML) para evitar pantallas en blanco por chunks viejos de Next.js.
 * - Solo cacheamos assets PWA (manifest + icons).
 */
const STATIC_ASSETS = [
  "/manifest.json",
  "/icon-192.png",
  "/icon-512.png"
];

self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
});

self.addEventListener("activate", (event) => {
  self.clients.claim();
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.map((k) => (k !== CACHE_NAME ? caches.delete(k) : null)))
    )
  );
});

self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") self.skipWaiting();
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // Solo GET
  if (req.method !== "GET") return;

  // No tocar navegación (evita HTML viejo)
  if (req.mode === "navigate") return;

  // SEGURIDAD: Jamás cachear Supabase, APIs, Next chunks o storage
  if (
    url.pathname.startsWith("/api/") ||
    url.pathname.startsWith("/_next/") ||
    url.origin.includes("supabase.co")
  ) {
    return; // Bypass network directo
  }

  // Solo cachear nuestros assets PWA declarados arriba
  if (!STATIC_ASSETS.includes(url.pathname)) return;

  event.respondWith(
    caches.open(CACHE_NAME).then(async (cache) => {
      const cached = await cache.match(req, { ignoreSearch: true });
      if (cached) return cached;

      const fresh = await fetch(req);
      if (fresh && (fresh.ok || fresh.type === "opaque")) {
        await cache.put(req, fresh.clone());
      }
      return fresh;
    })
  );
});