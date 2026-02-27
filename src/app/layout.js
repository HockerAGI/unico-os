import "./globals.css";
import SwRegister from "./sw-register";

/**
 * RootLayout (UnicOs)
 * Nota: se mantiene dinámico porque en el repo actual se usa/prevé CSP Nonce por request.
 */
export const dynamic = "force-dynamic";
export const revalidate = 0;

export const viewport = {
  themeColor: "#0f0f10",
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
      <body className="min-h-screen bg-slate-900 text-slate-200 antialiased">
        <SwRegister />
        {children}
      </body>
    </html>
  );
}