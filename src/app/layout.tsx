import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { GoogleCastProvider } from "@/components/google-cast-provider";
import { cn } from "@/lib/utils";
import { isGoogleCastConfigured } from "@/lib/google-cast";

const geistSans = Geist({
  subsets: ["latin"],
  variable: "--font-sans",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "MovieFlix - Watch Movies & TV Shows Online",
  description: "Stream thousands of movies and TV shows online. Powered by TMDB and embed players.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={cn("h-full", "antialiased", geistSans.variable, geistMono.variable, "font-sans")}
    >
      <body className="min-h-full flex flex-col">
        <GoogleCastProvider />
        {children}
        {isGoogleCastConfigured() && (
          <Script
            src="https://www.gstatic.com/cv/js/sender/v1/cast_sender.js?loadCastFramework=1"
            strategy="afterInteractive"
          />
        )}
        <Script
          src="http://localhost:3001/widget.js"
          strategy="afterInteractive"
          data-project-id="pj_3FI1CydEDW8bhFgCSSdqv0vz"
          data-convex-url="https://stoic-dalmatian-918.convex.cloud"
          data-dashboard-url="http://localhost:3001"
        />
      </body>
    </html>
  );
}
