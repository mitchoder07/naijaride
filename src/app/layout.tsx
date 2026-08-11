import type { Metadata, Viewport } from "next";
import { Space_Grotesk, Plus_Jakarta_Sans, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { Toaster as ToastToaster } from "@/components/ui/toaster";
import { Providers } from "@/components/providers";

const display = Space_Grotesk({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  display: "swap",
});

const body = Plus_Jakarta_Sans({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

const mono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "NaijaRide — Carpooling across Nigeria",
  description:
    "Find trusted drivers and passengers travelling across Nigeria. Share rides, save money, and build community.",
  keywords: [
    "NaijaRide",
    "carpooling",
    "Nigeria",
    "ride share",
    "Lagos",
    "Abuja",
    "drivers",
    "passengers",
  ],
  authors: [{ name: "NaijaRide" }],
  icons: {
    icon: "/logo.svg",
  },
  openGraph: {
    title: "NaijaRide — Carpooling across Nigeria",
    description:
      "Find trusted drivers and passengers travelling across Nigeria.",
    siteName: "NaijaRide",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#FFF7ED" },
    { media: "(prefers-color-scheme: dark)", color: "#0F0A07" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link
          rel="stylesheet"
          href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
          integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY="
          crossOrigin=""
        />
      </head>
      <body
        className={`${display.variable} ${body.variable} ${mono.variable} antialiased bg-background text-foreground min-h-screen font-body`}
      >
        <Providers>
          {children}
          <Toaster richColors position="top-right" />
          <ToastToaster />
        </Providers>
      </body>
    </html>
  );
}
