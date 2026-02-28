import "./globals.css";
import SwRegister from "./sw-register";
import AiDock from "./ai-dock";

/**
 * RootLayout (UnicOs)
 * - Light-first (alineado a branding)
 * - Mantener dynamic por arquitectura actual (y compatibilidad CSP nonce si aplica).
 */
export const dynamic = "force-dynamic";
export const revalidate = 0;

export const viewport = {
  themeColor: "#0EA5E9",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export const metadata = {
  title: "UnicOs Admin",
  description: "Central Command System para Score Store",
  manifest: "/manifest.json",
  icons: {
    icon: "/icon-192.png",
    apple: "/icon-192.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "UnicOs",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="es-MX" suppressHydrationWarning>
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased">
        <SwRegister />
        {children}
        {/* IA global: accesible desde cualquier pantalla sin tocar tu arquitectura */}
        <AiDock />
      </body>
    </html>
  );
}