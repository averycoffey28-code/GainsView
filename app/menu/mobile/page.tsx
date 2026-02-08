"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronLeft,
  TrendingUp,
  Hash,
  Calendar,
  BarChart3,
  Type,
  Vibrate,
  Volume2,
  WifiOff,
  Trash2,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { useMobileSettings } from "@/hooks/useMobileSettings";

export default function MobileSettingsPage() {
  const router = useRouter();
  const { settings, updateSetting, triggerHaptic } = useMobileSettings();
  const [cacheSize, setCacheSize] = useState("...");

  // Estimate cache size on mount
  useEffect(() => {
    (async () => {
      if ("caches" in window) {
        try {
          const names = await caches.keys();
          let total = 0;
          for (const name of names) {
            const cache = await caches.open(name);
            const keys = await cache.keys();
            total += keys.length * 15000; // rough estimate per entry
          }
          setCacheSize(
            total > 1048576
              ? `${(total / 1048576).toFixed(1)} MB`
              : `${(total / 1024).toFixed(0)} KB`
          );
        } catch {
          setCacheSize("N/A");
        }
      } else {
        setCacheSize("N/A");
      }
    })();
  }, []);

  // Apply text size
  useEffect(() => {
    const sizes = { small: "14px", medium: "16px", large: "18px" } as const;
    document.documentElement.style.setProperty(
      "--base-font-size",
      sizes[settings.textSize]
    );
    document.body.style.fontSize = sizes[settings.textSize];
    return () => {
      document.body.style.fontSize = "";
    };
  }, [settings.textSize]);

  const clearCache = useCallback(async () => {
    try {
      if ("caches" in window) {
        const names = await caches.keys();
        await Promise.all(names.map((n) => caches.delete(n)));
      }
      setCacheSize("0 KB");
    } catch (error) {
      console.error("Failed to clear cache:", error);
    }
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-brown-950 via-brown-900 to-brown-950 text-brown-50 pb-24">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-brown-950/90 backdrop-blur-sm border-b border-brown-700/50 px-4 py-3">
        <div className="max-w-2xl mx-auto flex items-center gap-4">
          <button onClick={() => router.back()} className="p-2 -ml-2">
            <ChevronLeft className="w-6 h-6 text-brown-100" />
          </button>
          <h1 className="text-lg font-bold text-brown-50">Mobile Settings</h1>
        </div>
      </header>

      <div className="p-4 max-w-2xl mx-auto space-y-6">
        {/* DEFAULT SETTINGS */}
        <div>
          <h2 className="text-sm font-medium text-brown-400 mb-3 px-1">
            DEFAULT SETTINGS
          </h2>
          <Card className="bg-brown-800/50 border-brown-700">
            <CardContent className="p-0 divide-y divide-brown-700/50">
              {/* Default Trade Type */}
              <div className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-brown-700/50 rounded-lg">
                    <TrendingUp className="w-5 h-5 text-brown-300" />
                  </div>
                  <div>
                    <p className="font-medium text-brown-100">
                      Default Trade Type
                    </p>
                    <p className="text-xs text-brown-500">
                      Pre-selected when logging trades
                    </p>
                  </div>
                </div>
                <select
                  value={settings.defaultTradeType}
                  onChange={(e) => {
                    updateSetting(
                      "defaultTradeType",
                      e.target.value as "call" | "put"
                    );
                    triggerHaptic();
                  }}
                  className="px-3 py-1.5 bg-brown-900 border border-brown-700 rounded-lg text-sm text-brown-200"
                >
                  <option value="call">Call</option>
                  <option value="put">Put</option>
                </select>
              </div>

              {/* Default Quantity */}
              <div className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-brown-700/50 rounded-lg">
                    <Hash className="w-5 h-5 text-brown-300" />
                  </div>
                  <div>
                    <p className="font-medium text-brown-100">
                      Default Quantity
                    </p>
                    <p className="text-xs text-brown-500">
                      Number of contracts
                    </p>
                  </div>
                </div>
                <select
                  value={settings.defaultQuantity}
                  onChange={(e) => {
                    updateSetting("defaultQuantity", parseInt(e.target.value));
                    triggerHaptic();
                  }}
                  className="px-3 py-1.5 bg-brown-900 border border-brown-700 rounded-lg text-sm text-brown-200"
                >
                  {[1, 2, 3, 4, 5, 10, 15, 20, 25, 50].map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
              </div>

              {/* Default Expiration */}
              <div className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-brown-700/50 rounded-lg">
                    <Calendar className="w-5 h-5 text-brown-300" />
                  </div>
                  <div>
                    <p className="font-medium text-brown-100">
                      Default Expiration
                    </p>
                    <p className="text-xs text-brown-500">
                      Preferred expiration range
                    </p>
                  </div>
                </div>
                <select
                  value={settings.defaultExpiration}
                  onChange={(e) => {
                    updateSetting("defaultExpiration", e.target.value);
                    triggerHaptic();
                  }}
                  className="px-3 py-1.5 bg-brown-900 border border-brown-700 rounded-lg text-sm text-brown-200"
                >
                  <option value="daily">0DTE / Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="biweekly">Bi-Weekly</option>
                  <option value="monthly">Monthly</option>
                  <option value="leaps">LEAPS (1yr+)</option>
                </select>
              </div>

              {/* Preferred Chart Timeframe */}
              <div className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-brown-700/50 rounded-lg">
                    <BarChart3 className="w-5 h-5 text-brown-300" />
                  </div>
                  <div>
                    <p className="font-medium text-brown-100">
                      Chart Timeframe
                    </p>
                    <p className="text-xs text-brown-500">
                      Default view for P&L charts
                    </p>
                  </div>
                </div>
                <select
                  value={settings.preferredTimeframe}
                  onChange={(e) => {
                    updateSetting("preferredTimeframe", e.target.value);
                    triggerHaptic();
                  }}
                  className="px-3 py-1.5 bg-brown-900 border border-brown-700 rounded-lg text-sm text-brown-200"
                >
                  <option value="1W">1 Week</option>
                  <option value="1M">1 Month</option>
                  <option value="3M">3 Months</option>
                  <option value="1Y">1 Year</option>
                  <option value="ALL">All Time</option>
                </select>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* DISPLAY / TEXT SIZE */}
        <div>
          <h2 className="text-sm font-medium text-brown-400 mb-3 px-1">
            DISPLAY
          </h2>
          <Card className="bg-brown-800/50 border-brown-700">
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-brown-700/50 rounded-lg">
                  <Type className="w-5 h-5 text-brown-300" />
                </div>
                <div>
                  <p className="font-medium text-brown-100">Text Size</p>
                  <p className="text-xs text-brown-500">Adjust app font size</p>
                </div>
              </div>
              <div className="flex gap-2">
                {(["small", "medium", "large"] as const).map((size) => (
                  <button
                    key={size}
                    onClick={() => {
                      updateSetting("textSize", size);
                      triggerHaptic();
                    }}
                    className={`flex-1 py-2 px-3 rounded-lg font-medium capitalize transition-colors ${
                      settings.textSize === size
                        ? "bg-gold-400 text-brown-950"
                        : "bg-brown-900 text-brown-400 border border-brown-700"
                    }`}
                    style={{
                      fontSize:
                        size === "small"
                          ? "14px"
                          : size === "large"
                            ? "18px"
                            : "16px",
                    }}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* HAPTICS & SOUNDS */}
        <div>
          <h2 className="text-sm font-medium text-brown-400 mb-3 px-1">
            HAPTICS & SOUNDS
          </h2>
          <Card className="bg-brown-800/50 border-brown-700">
            <CardContent className="p-0 divide-y divide-brown-700/50">
              {/* Haptic Feedback */}
              <div className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-brown-700/50 rounded-lg">
                    <Vibrate className="w-5 h-5 text-brown-300" />
                  </div>
                  <div>
                    <p className="font-medium text-brown-100">
                      Haptic Feedback
                    </p>
                    <p className="text-xs text-brown-500">
                      Vibration on interactions
                    </p>
                  </div>
                </div>
                <Switch
                  checked={settings.hapticFeedback}
                  onCheckedChange={(val) => {
                    updateSetting("hapticFeedback", val);
                    if (val && navigator.vibrate) navigator.vibrate(10);
                  }}
                />
              </div>

              {/* Sound Effects */}
              <div className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-brown-700/50 rounded-lg">
                    <Volume2 className="w-5 h-5 text-brown-300" />
                  </div>
                  <div>
                    <p className="font-medium text-brown-100">Sound Effects</p>
                    <p className="text-xs text-brown-500">
                      Play sounds on actions
                    </p>
                  </div>
                </div>
                <Switch
                  checked={settings.soundEffects}
                  onCheckedChange={(val) => {
                    updateSetting("soundEffects", val);
                    triggerHaptic();
                  }}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* DATA & STORAGE */}
        <div>
          <h2 className="text-sm font-medium text-brown-400 mb-3 px-1">
            DATA & STORAGE
          </h2>
          <Card className="bg-brown-800/50 border-brown-700">
            <CardContent className="p-0 divide-y divide-brown-700/50">
              {/* Offline Mode */}
              <div className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-brown-700/50 rounded-lg">
                    <WifiOff className="w-5 h-5 text-brown-300" />
                  </div>
                  <div>
                    <p className="font-medium text-brown-100">Offline Mode</p>
                    <p className="text-xs text-brown-500">
                      Cache data for offline viewing
                    </p>
                  </div>
                </div>
                <Switch
                  checked={settings.offlineMode}
                  onCheckedChange={(val) => {
                    updateSetting("offlineMode", val);
                    triggerHaptic();
                  }}
                />
              </div>

              {/* Clear Cache */}
              <div className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-brown-700/50 rounded-lg">
                    <Trash2 className="w-5 h-5 text-brown-300" />
                  </div>
                  <div>
                    <p className="font-medium text-brown-100">Clear Cache</p>
                    <p className="text-xs text-brown-500">
                      Current size: {cacheSize}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    triggerHaptic();
                    clearCache();
                  }}
                  className="px-4 py-1.5 text-sm font-medium text-rose-400 border border-rose-400/30 rounded-lg hover:bg-rose-400/10 transition-colors"
                >
                  Clear
                </button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
