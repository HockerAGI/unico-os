/** @type {import('next').NextConfig} */

const SUPABASE_HOST = "lpbzndnavkbpxwnlbqgb.supabase.co";

const csp = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'none'",
  "img-src 'self' data: blob: https://" + SUPABASE_HOST,
  // Next usa estilos inline en varios casos => mantenemos unsafe-inline
  "style-src 'self' 'unsafe-inline'",
  // Next incluye scripts inline de bootstrap => mantenemos unsafe-inline
  // (pero removemos unsafe-eval)
  "script-src 'self' 'unsafe-inline'",
  "connect-src 'self' https://" + SUPABASE_HOST + " wss://" + SUPABASE_HOST + " https://generativelanguage.googleapis.com",
  "font-src 'self' data:",
  "manifest-src 'self'",
  "worker-src 'self' blob:",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
  { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains; preload" },
];

const nextConfig = {
  output: "standalone",
  images: {
    remotePatterns: [{ protocol: "https", hostname: SUPABASE_HOST }],
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

module.exports = nextConfig;