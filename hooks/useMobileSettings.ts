"use client";

import { useState, useEffect, useCallback } from "react";

export interface MobileSettings {
  defaultTradeType: "call" | "put";
  defaultQuantity: number;
  defaultExpiration: string;
  preferredTimeframe: string;
  hapticFeedback: boolean;
  soundEffects: boolean;
  textSize: "small" | "medium" | "large";
  offlineMode: boolean;
}

const STORAGE_KEY = "gainsview-mobile-settings";

const DEFAULT_SETTINGS: MobileSettings = {
  defaultTradeType: "call",
  defaultQuantity: 1,
  defaultExpiration: "weekly",
  preferredTimeframe: "1M",
  hapticFeedback: true,
  soundEffects: false,
  textSize: "medium",
  offlineMode: false,
};

export function useMobileSettings() {
  const [settings, setSettings] = useState<MobileSettings>(DEFAULT_SETTINGS);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        setSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(saved) });
      }
    } catch {
      // ignore parse errors
    }
  }, []);

  const updateSetting = useCallback(
    <K extends keyof MobileSettings>(key: K, value: MobileSettings[K]) => {
      setSettings((prev) => {
        const next = { ...prev, [key]: value };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        return next;
      });
    },
    []
  );

  const triggerHaptic = useCallback(() => {
    if (settings.hapticFeedback && navigator.vibrate) {
      navigator.vibrate(10);
    }
  }, [settings.hapticFeedback]);

  return { settings, updateSetting, triggerHaptic };
}
