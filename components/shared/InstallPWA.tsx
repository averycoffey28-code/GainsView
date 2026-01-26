"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Download, Share, Plus, Smartphone } from "lucide-react";
import { usePWA } from "@/hooks/usePWA";
import { cn } from "@/lib/utils";
import Logo from "./Logo";

export default function InstallPWA() {
  const {
    isIOS,
    isInstalled,
    isStandalone,
    promptInstall,
    dismissPrompt,
    shouldShowPrompt,
    canPrompt,
  } = usePWA();

  const [showBanner, setShowBanner] = useState(false);
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  useEffect(() => {
    // Delay showing the banner for better UX
    const timer = setTimeout(() => {
      if (shouldShowPrompt()) {
        setShowBanner(true);
      }
    }, 3000); // Show after 3 seconds

    return () => clearTimeout(timer);
  }, [shouldShowPrompt]);

  const handleInstall = async () => {
    if (isIOS) {
      setShowIOSGuide(true);
    } else if (canPrompt) {
      const installed = await promptInstall();
      if (installed) {
        setShowBanner(false);
      }
    }
  };

  const handleDismiss = () => {
    dismissPrompt();
    setShowBanner(false);
    setShowIOSGuide(false);
  };

  // Don't render if already installed or in standalone mode
  if (isInstalled || isStandalone) return null;

  return (
    <>
      {/* Install Banner */}
      <AnimatePresence>
        {showBanner && !showIOSGuide && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed bottom-20 md:bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 z-50"
          >
            <div className="bg-brown-800 border border-brown-700 rounded-2xl p-4 shadow-xl shadow-black/20">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 p-2 bg-gold-500/20 rounded-xl">
                  <Logo size="sm" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-brown-50 font-semibold text-sm">
                    Install GainsView
                  </h3>
                  <p className="text-brown-400 text-xs mt-0.5">
                    Add to your home screen for the best experience
                  </p>
                </div>
                <motion.button
                  onClick={handleDismiss}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  className="p-1 text-brown-500 hover:text-brown-300 transition-colors"
                >
                  <X className="w-4 h-4" />
                </motion.button>
              </div>

              <div className="flex gap-2 mt-3">
                <motion.button
                  onClick={handleDismiss}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="flex-1 py-2 px-3 text-sm text-brown-400 hover:text-brown-200 transition-colors"
                >
                  Not now
                </motion.button>
                <motion.button
                  onClick={handleInstall}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={cn(
                    "flex-1 py-2 px-3 rounded-xl text-sm font-medium",
                    "bg-gradient-to-r from-gold-500 to-gold-600",
                    "text-brown-950 flex items-center justify-center gap-2"
                  )}
                >
                  <Download className="w-4 h-4" />
                  Install
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* iOS Installation Guide */}
      <AnimatePresence>
        {showIOSGuide && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          >
            <motion.div
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="w-full max-w-sm bg-brown-800 border border-brown-700 rounded-2xl overflow-hidden"
            >
              {/* Header */}
              <div className="p-4 border-b border-brown-700 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Smartphone className="w-5 h-5 text-gold-400" />
                  <h3 className="text-brown-50 font-semibold">
                    Add to Home Screen
                  </h3>
                </div>
                <motion.button
                  onClick={handleDismiss}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  className="p-1 text-brown-500 hover:text-brown-300 transition-colors"
                >
                  <X className="w-5 h-5" />
                </motion.button>
              </div>

              {/* Steps */}
              <div className="p-4 space-y-4">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gold-500/20 flex items-center justify-center">
                    <span className="text-gold-400 font-bold text-sm">1</span>
                  </div>
                  <div>
                    <p className="text-brown-200 text-sm">
                      Tap the{" "}
                      <Share className="w-4 h-4 inline text-blue-400 -mt-0.5" />{" "}
                      <span className="text-blue-400 font-medium">Share</span>{" "}
                      button in Safari
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gold-500/20 flex items-center justify-center">
                    <span className="text-gold-400 font-bold text-sm">2</span>
                  </div>
                  <div>
                    <p className="text-brown-200 text-sm">
                      Scroll down and tap{" "}
                      <Plus className="w-4 h-4 inline text-brown-50 -mt-0.5" />{" "}
                      <span className="text-brown-50 font-medium">
                        Add to Home Screen
                      </span>
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gold-500/20 flex items-center justify-center">
                    <span className="text-gold-400 font-bold text-sm">3</span>
                  </div>
                  <div>
                    <p className="text-brown-200 text-sm">
                      Tap{" "}
                      <span className="text-blue-400 font-medium">Add</span> to
                      install GainsView
                    </p>
                  </div>
                </div>
              </div>

              {/* Preview */}
              <div className="px-4 pb-4">
                <div className="p-3 bg-brown-900/50 rounded-xl flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-brown-800 flex items-center justify-center overflow-hidden">
                    <Logo size="sm" />
                  </div>
                  <div>
                    <p className="text-brown-50 font-medium text-sm">
                      GainsView
                    </p>
                    <p className="text-brown-400 text-xs">Premium Trading</p>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="p-4 border-t border-brown-700">
                <motion.button
                  onClick={handleDismiss}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  className="w-full py-3 rounded-xl bg-brown-700 text-brown-200 font-medium text-sm hover:bg-brown-600 transition-colors"
                >
                  Got it
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
