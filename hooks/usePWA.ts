"use client";

import { useState, useEffect, useCallback } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

interface PWAState {
  isInstallable: boolean;
  isInstalled: boolean;
  isIOS: boolean;
  isStandalone: boolean;
}

export function usePWA() {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [pwaState, setPwaState] = useState<PWAState>({
    isInstallable: false,
    isInstalled: false,
    isIOS: false,
    isStandalone: false,
  });

  useEffect(() => {
    // Check if running as standalone (installed PWA)
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as Navigator & { standalone?: boolean }).standalone === true;

    // Check if iOS
    const isIOS =
      /iPad|iPhone|iPod/.test(navigator.userAgent) &&
      !(window as Window & { MSStream?: unknown }).MSStream;

    // Check if already installed (localStorage flag)
    const isInstalled = localStorage.getItem("pwa-installed") === "true";

    setPwaState((prev) => ({
      ...prev,
      isStandalone,
      isIOS,
      isInstalled: isInstalled || isStandalone,
    }));

    // Listen for beforeinstallprompt event
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setPwaState((prev) => ({ ...prev, isInstallable: true }));
    };

    // Listen for app installed event
    const handleAppInstalled = () => {
      localStorage.setItem("pwa-installed", "true");
      setDeferredPrompt(null);
      setPwaState((prev) => ({
        ...prev,
        isInstallable: false,
        isInstalled: true,
      }));
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstall);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  const promptInstall = useCallback(async () => {
    if (!deferredPrompt) return false;

    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;

      if (outcome === "accepted") {
        localStorage.setItem("pwa-installed", "true");
        setPwaState((prev) => ({
          ...prev,
          isInstallable: false,
          isInstalled: true,
        }));
      }

      setDeferredPrompt(null);
      return outcome === "accepted";
    } catch {
      return false;
    }
  }, [deferredPrompt]);

  const dismissPrompt = useCallback(() => {
    const dismissCount = parseInt(
      localStorage.getItem("pwa-dismiss-count") || "0"
    );
    localStorage.setItem("pwa-dismiss-count", String(dismissCount + 1));
    localStorage.setItem("pwa-last-dismiss", Date.now().toString());
  }, []);

  const dismissPermanently = useCallback(() => {
    localStorage.setItem("pwa-last-dismiss", "permanent");
  }, []);

  const shouldShowPrompt = useCallback(() => {
    // Don't show if already installed or in standalone mode
    if (pwaState.isInstalled || pwaState.isStandalone) return false;

    // Check if permanently dismissed
    const lastDismiss = localStorage.getItem("pwa-last-dismiss");
    if (lastDismiss === "permanent") return false;

    // Check last dismiss time (don't show for 7 days after dismiss)
    if (lastDismiss) {
      const daysSinceDismiss =
        (Date.now() - parseInt(lastDismiss)) / (1000 * 60 * 60 * 24);
      if (daysSinceDismiss < 7) return false;
    }

    return pwaState.isInstallable || pwaState.isIOS;
  }, [pwaState]);

  // Track visits
  useEffect(() => {
    const visitCount = parseInt(localStorage.getItem("pwa-visit-count") || "0");
    localStorage.setItem("pwa-visit-count", String(visitCount + 1));
  }, []);

  return {
    ...pwaState,
    promptInstall,
    dismissPrompt,
    dismissPermanently,
    shouldShowPrompt,
    canPrompt: !!deferredPrompt,
  };
}
