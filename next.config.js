/** @type {import('next').NextConfig} */
const nextConfig = {
  // Permite imágenes de cualquier dominio (necesario para fotos subidas por usuario)
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**' },
    ],
  },
}
module.exports = nextConfig
