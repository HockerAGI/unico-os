/** @type {import('next').NextConfig} */
const nextConfig = {
  // Le dice a Next.js que genere archivos independientes optimizados (vital para Netlify Functions)
  output: 'standalone',
  images: {
    remotePatterns: [
      { 
        protocol: "https", 
        hostname: "lpbzndnavkbpxwnlbqgb.supabase.co" 
      }
    ]
  }
};

module.exports = nextConfig;