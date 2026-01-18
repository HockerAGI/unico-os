import { Inter } from 'next/font/google'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'ÚNICO OS | Panel de Control',
  description: 'Sistema de Gestión Empresarial',
}

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <head>
        <script src="https://cdn.tailwindcss.com"></script>
        <script dangerouslySetInnerHTML={{__html: `
          tailwind.config = {
            theme: {
              extend: {
                colors: {
                  unico: {
                    50: '#fff1f1', // Fondo muy suave
                    100: '#ffdfdf',
                    600: '#E10600', // ROJO OFICIAL ÚNICO
                    800: '#990400',
                    900: '#1a1a1a', // Negro suave para textos
                  },
                  score: {
                    blue: '#003366' // Azul complementario
                  }
                }
              }
            }
          }
        `}} />
      </head>
      <body className={`${inter.className} bg-slate-50 text-slate-800 antialiased`}>
        {children}
      </body>
    </html>
  )
}