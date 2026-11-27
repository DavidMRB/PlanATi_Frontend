import type { Metadata } from "next";
import type { Viewport } from "next";
import type { ReactNode } from "react";
import { Geist, Geist_Mono } from "next/font/google";
import { FavoritesProvider } from "@/components/favorites/FavoritesProvider";
import ConsentGate from "@/components/privacy/ConsentGate";
import { NotificationsProvider } from "@/components/notifications/NotificationsProvider";
import { AuthProvider } from "@/components/providers/AuthProvider";
import ServiceWorkerRegistration from "@/components/ServiceWorkerRegistration";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "PlanATi",
  description:
    "Aquí puedes hallar las experiencias cercanas a ti que se ajusten a tus necesidades",
};

export const viewport: Viewport = {
  themeColor: "#4648D4",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <ServiceWorkerRegistration />
        <AuthProvider>
          <NotificationsProvider>
            <FavoritesProvider>
              <div className="flex-1">{children}</div>
              <ConsentGate />
            </FavoritesProvider>
          </NotificationsProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
