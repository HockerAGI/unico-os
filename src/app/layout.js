// src/app/layout.js
import "./globals.css";
import { Inter } from "next/font/google";
import SwRegister from "./sw-register";

const inter = Inter({
  subsets: ["latin"],
  display: "swap"
});

export const metadata = {
  title: "ÚNICO OS · Admin",
  description: "Panel de administración",
  applicationName: "ÚNICO OS",
  robots: { index: false, follow: false }, // admin app: NOINDEX
  manifest: "/manifest.json",
  themeColor: "#E10600",
  icons: {
    icon: "/icon-192.png",
    apple: "/icon-192.png"
  }
};

export default function RootLayout({ children }) {
  return (
    <html lang="es" className={inter.className}>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <meta name="color-scheme" content="light" />
        {/* Admin app: evita indexación */}
        <meta name="robots" content="noindex,nofollow" />
      </head>
      <body>
        {children}
        <SwRegister />
      </body>
    </html>
  );
}