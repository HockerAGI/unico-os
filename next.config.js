/** @type {import('next').NextConfig} */
const nextConfig = {
  // Necesario para Netlify (Next Runtime) y despliegues serverless
  output: "standalone",

  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "lpbzndnavkbpxwnlbqgb.supabase.co",
      },
    ],
  },
};

module.exports = nextConfig;