import "./globals.css";
import SwRegister from "./sw-register";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#0b1f3b",
};

export const metadata = {
  metadataBase: new URL("https://unicoapps.netlify.app"),
  title: {
    default: "UnicOs",
    template: "%s | UnicOs",
  },
  description:
    "Centro de mando de Único para administrar operación, contenido, campañas, seguimiento y sitios conectados desde un solo panel.",
  applicationName: "UnicOs",
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/icon-192.png", sizes: "192x192", type: "image/png" }],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "UnicOs",
  },
  openGraph: {
    title: "UnicOs",
    description:
      "Centro de mando de Único para administrar operación, contenido, campañas, seguimiento y sitios conectados desde un solo panel.",
    url: "https://unicoapps.netlify.app",
    siteName: "UnicOs",
    type: "website",
    locale: "es_MX",
    images: [
      {
        url: "/logo-unico.png",
        width: 1024,
        height: 1024,
        alt: "UnicOs",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "UnicOs",
    description:
      "Centro de mando de Único para administrar operación, contenido, campañas, seguimiento y sitios conectados desde un solo panel.",
    images: ["/logo-unico.png"],
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="es-MX" suppressHydrationWarning>
      <body className="unicos-shell">
        <SwRegister />
        {children}
      </body>
    </html>
  );
}