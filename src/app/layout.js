import './globals.css'

export const viewport = {
  themeColor: '#0f0f10',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
}

export const metadata = {
  title: 'UnicOs Admin',
  description: 'Central Command System para Score Store',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'UnicOs',
  },
}

export default function RootLayout({ children }) {
  return (
    <html lang="es-MX">
      <body>{children}</body>
    </html>
  )
}