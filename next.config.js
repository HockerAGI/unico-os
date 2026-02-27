// @ts-check

/** @type {import('next').NextConfig} */
const nextConfig = {
  // vital para Netlify (standalone server build)
  output: "standalone",
  poweredByHeader: false,

  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "lpbzndnavkbpxwnlbqgb.supabase.co",
      },
    ],
  },

  /**
   * FIX Lighthouse (Best Practices -> charset):
   * Fuerza `Content-Type: text/html; charset=utf-8` SOLO para respuestas HTML,
   * usando `has` (match por header Accept).
   */
  async headers() {
    return [
      {
        // Solo para HTML (navegación)
        source: "/:path*",
        has: [
          {
            type: "header",
            key: "accept",
            value: "text/html.*",
          },
        ],
        headers: [
          {
            key: "Content-Type",
            value: "text/html; charset=utf-8",
          },
        ],
      },
      {
        // Service Worker: content-type correcto + sin cache
        source: "/sw.js",
        headers: [
          { key: "Content-Type", value: "application/javascript; charset=utf-8" },
          { key: "Cache-Control", value: "no-store, no-cache, must-revalidate, proxy-revalidate" },
          { key: "Pragma", value: "no-cache" },
          { key: "Expires", value: "0" },
        ],
      },
      {
        // Manifest: sin cache (updates inmediatos)
        source: "/manifest.json",
        headers: [
          { key: "Cache-Control", value: "no-store, no-cache, must-revalidate, proxy-revalidate" },
          { key: "Pragma", value: "no-cache" },
          { key: "Expires", value: "0" },
        ],
      },
    ];
  },
};

module.exports = nextConfig;