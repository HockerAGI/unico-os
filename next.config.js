/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      // Supabase storage (tu proyecto)
      { protocol: "https", hostname: "lpbzndnavkbpxwnlbqgb.supabase.co" },

      // Si luego usas CDN/otros, los agregas aquí (mejor explícitos)
      // { protocol: "https", hostname: "cdn.tusitio.com" },
    ],
  },
};

module.exports = nextConfig;