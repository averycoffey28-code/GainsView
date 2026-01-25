import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { dark } from "@clerk/themes";
import BottomNav from "@/components/BottomNav";
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
  title: "GainsView - Options P&L Calculator",
  description: "Visualize potential returns on options trades before you invest",
};

// Force dynamic rendering to avoid build-time Clerk initialization
export const dynamic = "force-dynamic";

const clerkAppearance = {
  baseTheme: dark,
  variables: {
    colorPrimary: "#D4A574",
    colorBackground: "#1a1512",
    colorInputBackground: "#2A2420",
    colorInputText: "#f5f0eb",
    colorTextOnPrimaryBackground: "#1a1512",
  },
  elements: {
    formButtonPrimary: "bg-gold-500 hover:bg-gold-600 text-brown-900",
    card: "bg-brown-900/50 border-brown-700",
    headerTitle: "text-brown-50",
    headerSubtitle: "text-brown-400",
    socialButtonsBlockButton: "border-brown-700 text-brown-100",
    formFieldLabel: "text-brown-300",
    formFieldInput: "bg-brown-800/50 border-brown-700 text-brown-100",
    footerActionLink: "text-gold-400 hover:text-gold-300",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Check if Clerk is configured
  const clerkKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

  const content = (
    <html lang="en" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
        <BottomNav />
      </body>
    </html>
  );

  // If Clerk is not configured, render without ClerkProvider
  if (!clerkKey) {
    return content;
  }

  return (
    <ClerkProvider appearance={clerkAppearance}>
      {content}
    </ClerkProvider>
  );
}
