"use client"; // Importante para hooks
import { Inter } from 'next/font/google'
import { useEffect } from 'react'

const inter = Inter({ subsets: ['latin'] })

export default function RootLayout({ children }) {
  
  // Auto-registro del Service Worker al abrir la app
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
        .then(reg => console.log('SW registrado:', reg.scope))
        .catch(err => console.error('SW falló:', err));
    }
  }, []);

  return (
    <html lang="es">
      <head>
        <title>ÚNICO OS | Commander</title>
        <meta name="description" content="Sistema Operativo Enterprise" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#E10600" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <script src="https://cdn.tailwindcss.com"></script>
        <script dangerouslySetInnerHTML={{__html: `
          tailwind.config = {
            theme: {
              extend: {
                colors: {
                  unico: { 50:'#fff1f1', 100:'#ffdfdf', 600:'#E10600', 900:'#1a1a1a' },
                  score: { blue: '#003366' }
                }
              }
            }
          }
        `}} />
      </head>
      <body className={`${inter.className} bg-slate-50 text-slate-800 antialiased overflow-hidden select-none`}>
        {children}
      </body>
    </html>
  )
}