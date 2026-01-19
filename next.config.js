/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [{ protocol: "https", hostname: "lpbzndnavkbpxwnlbqgb.supabase.co" }]
  }
};

module.exports = nextConfig;