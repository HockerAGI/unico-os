/** @type {import('next').NextConfig} */

// Creamos los Escudos de Seguridad (La Lista VIP)
const securityHeaders = [
  {
    key: 'Content-Security-Policy',
    // Aquí le decimos al navegador qué conexiones son seguras:
    // 1. Supabase (Base de datos e imágenes)
    // 2. Google Gemini (Inteligencia Artificial)
    // 3. Todo el código interno de tu propia aplicación
    value: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' blob: data: https://lpbzndnavkbpxwnlbqgb.supabase.co; connect-src 'self' https://lpbzndnavkbpxwnlbqgb.supabase.co wss://lpbzndnavkbpxwnlbqgb.supabase.co https://generativelanguage.googleapis.com; font-src 'self' data:;"
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff' // Evita que los hackers disfracen código malicioso como si fueran imágenes
  },
  {
    key: 'X-Frame-Options',
    value: 'DENY' // Evita que clonen tu página en otro sitio falso
  }
];

const nextConfig = {
  // Necesario para Netlify y despliegues serverless
  output: "standalone",

  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "lpbzndnavkbpxwnlbqgb.supabase.co",
      },
    ],
  },

  // Inyectamos los escudos en todas las páginas de tu panel
  async headers() {
    return [
      {
        source: '/:path*',
        headers: securityHeaders,
      },
    ];
  },
};

module.exports = nextConfig;