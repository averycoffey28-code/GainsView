"use client";

import { ReactNode } from "react";
import { ClerkProvider } from "@clerk/nextjs";
import { dark } from "@clerk/themes";
import { SWRConfig } from "swr";
import { ToastProvider } from "@/components/ui/toast";
import { swrConfig } from "@/lib/swr-config";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { TimezoneProvider } from "@/contexts/TimezoneContext";

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

interface ProvidersProps {
  children: ReactNode;
  withClerk?: boolean;
}

export function Providers({ children, withClerk = true }: ProvidersProps) {
  const content = (
    <ThemeProvider>
      <TimezoneProvider>
        <SWRConfig value={swrConfig}>
          <ToastProvider>{children}</ToastProvider>
        </SWRConfig>
      </TimezoneProvider>
    </ThemeProvider>
  );

  if (withClerk) {
    return (
      <ClerkProvider appearance={clerkAppearance}>
        {content}
      </ClerkProvider>
    );
  }

  return content;
}
