import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/hooks/useAuth";
import { ToastProvider } from "@/components/ui/Toast";
import { CookieBanner } from "@/components/ui/CookieBanner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "InSicuri - Mappa pericoli ciclisti",
  description: "Segnala i punti pericolosi per ciclisti a Udine e dintorni",
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#dc2626",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="it">
      <head>
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
      </head>
      <body className={`${geistSans.variable} antialiased`}>
        <AuthProvider>
          <ToastProvider>
            {children}
            <CookieBanner />
          </ToastProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
