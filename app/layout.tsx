import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Providers } from "@/components/Providers";
import BottomNav from "@/components/BottomNav";
import InstallPWA from "@/components/shared/InstallPWA";
import "./globals.css";

// Optimized font loading with display swap and preload
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
  preload: true,
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
  preload: false, // Secondary font, don't preload
});

export const metadata: Metadata = {
  title: "GainsView - Premium Options Trading Platform",
  description: "Visualize potential returns on options trades with live market data, AI-powered insights, and professional P&L tracking.",
  keywords: ["options trading", "P&L calculator", "options calculator", "stock options", "trading platform", "investment tools"],
  authors: [{ name: "GainsView" }],
  creator: "GainsView",
  publisher: "GainsView",
  robots: "index, follow",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://options-calculator-one.vercel.app",
    siteName: "GainsView",
    title: "GainsView - Premium Options Trading Platform",
    description: "Visualize potential returns on options trades with live market data, AI-powered insights, and professional P&L tracking.",
    images: [
      {
        url: "/images/logo.png",
        width: 512,
        height: 512,
        alt: "GainsView Logo",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "GainsView - Premium Options Trading Platform",
    description: "Visualize potential returns on options trades with live market data and AI-powered insights.",
    images: ["/images/logo.png"],
  },
  icons: {
    icon: [
      { url: "/icons/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png" },
    ],
    shortcut: "/icons/favicon-32x32.png",
    apple: "/icons/apple-touch-icon.png",
  },
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "GainsView",
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#1a1512",
};

// Force dynamic rendering to avoid build-time Clerk initialization
export const dynamic = "force-dynamic";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Check if Clerk is configured
  const clerkKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

  return (
    <html lang="en" className="dark">
      <head>
        {/* Preconnect to external domains */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* DNS prefetch for API domains */}
        <link rel="dns-prefetch" href="https://api.clerk.com" />

        {/* PWA - Apple specific meta tags */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="GainsView" />
        <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />

        {/* PWA - Splash screens for iOS */}
        <link
          rel="apple-touch-startup-image"
          href="/icons/icon-512x512.png"
          media="(device-width: 430px) and (device-height: 932px) and (-webkit-device-pixel-ratio: 3)"
        />
        <link
          rel="apple-touch-startup-image"
          href="/icons/icon-512x512.png"
          media="(device-width: 393px) and (device-height: 852px) and (-webkit-device-pixel-ratio: 3)"
        />
        <link
          rel="apple-touch-startup-image"
          href="/icons/icon-512x512.png"
          media="(device-width: 390px) and (device-height: 844px) and (-webkit-device-pixel-ratio: 3)"
        />
        <link
          rel="apple-touch-startup-image"
          href="/icons/icon-512x512.png"
          media="(device-width: 375px) and (device-height: 812px) and (-webkit-device-pixel-ratio: 3)"
        />

        {/* Mobile optimizations */}
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="format-detection" content="telephone=no" />

        {/* Service Worker Registration */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js')
                    .then(function(registration) {
                      console.log('SW registered: ', registration.scope);
                    })
                    .catch(function(error) {
                      console.log('SW registration failed: ', error);
                    });
                });
              }
            `,
          }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased h-screen flex flex-col overflow-hidden`}
      >
        <Providers withClerk={!!clerkKey}>
          {/* Main content area - scrollable, takes remaining space */}
          <main className="flex-1 overflow-y-auto overscroll-none">
            {children}
          </main>
          {/* Bottom nav - fixed height, never overlaps content */}
          <BottomNav />
          {/* PWA Install Prompt */}
          <InstallPWA />
        </Providers>
      </body>
    </html>
  );
}
