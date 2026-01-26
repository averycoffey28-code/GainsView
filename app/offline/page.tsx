"use client";

import { motion } from "framer-motion";
import { WifiOff, RefreshCw } from "lucide-react";
import Logo from "@/components/shared/Logo";

export default function OfflinePage() {
  const handleRetry = () => {
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-brown-950 via-brown-900 to-brown-950 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center max-w-md"
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="mb-6"
        >
          <Logo size="hero" glow />
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="mb-6"
        >
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-brown-800/50 border border-brown-700 flex items-center justify-center">
            <WifiOff className="w-8 h-8 text-brown-400" />
          </div>
          <h1 className="text-2xl font-bold text-brown-50 mb-2">
            You're Offline
          </h1>
          <p className="text-brown-400">
            It looks like you've lost your internet connection. Check your
            connection and try again.
          </p>
        </motion.div>

        <motion.button
          onClick={handleRetry}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.5 }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-gold-500 to-gold-600 text-brown-950 font-semibold rounded-xl shadow-lg shadow-gold-500/20"
        >
          <RefreshCw className="w-5 h-5" />
          Try Again
        </motion.button>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8, duration: 0.5 }}
          className="mt-8 text-xs text-brown-500"
        >
          Some features may still be available offline
        </motion.p>
      </motion.div>
    </div>
  );
}
