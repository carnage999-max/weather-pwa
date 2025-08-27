// app/layout.tsx
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

// client components
import ServiceWorkerRegister from "./components/ServiceWorkerRegister";
import PwaEntrance from "./components/PwaEntrance";
import ProtocolHandler from "./components/ProtocolHandler";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Weather App",
  description: "App that shows weather data based on Weather API",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#317EFB" />
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
      </head>

      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        {/* Register service worker and optionally seed caches (client-only) */}
        <ServiceWorkerRegister />

        {/* Inbound protocol payload handler: runs when app loads and will route if URL contains
            ?source=protocol&payload=... */
        }
        <ProtocolHandler />

        {/* Outbound UX: show install/open banner when appropriate
            - PwaEntrance will no-op inside standalone display-mode,
            - and show install or Open-App CTA in browser */}
        <PwaEntrance protocol="web+weather" autoTryUnknown={true} />

        {children}
      </body>
    </html>
  );
}
