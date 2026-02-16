"use client";

import { useState } from "react";
import { AlertTriangle } from "lucide-react";
import { motion } from "framer-motion";

interface MarketDataDisclaimerProps {
  onAcknowledge: () => void;
}

export default function MarketDataDisclaimer({ onAcknowledge }: MarketDataDisclaimerProps) {
  const [isChecked, setIsChecked] = useState(false);

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
    >
      <motion.div
        className="w-full max-w-md bg-brown-900 border border-brown-700 rounded-xl overflow-hidden shadow-2xl"
        initial={{ scale: 0.95, opacity: 0, y: 10 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
      >
        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Icon */}
          <div className="flex justify-center">
            <div className="p-3 bg-gold-500/20 rounded-full">
              <AlertTriangle className="w-8 h-8 text-gold-400" />
            </div>
          </div>

          {/* Title */}
          <h2 className="text-lg font-bold text-brown-50 text-center">
            Market Data Disclaimer
          </h2>

          {/* Message */}
          <p className="text-sm text-brown-400 text-center leading-relaxed">
            Market data displayed on this page is for reference purposes only and may be delayed up to 15 minutes. This information should not be used as the sole basis for any trading decisions.
          </p>

          {/* Checkbox */}
          <label className="flex items-center gap-3 cursor-pointer select-none justify-center pt-2">
            <input
              type="checkbox"
              checked={isChecked}
              onChange={(e) => setIsChecked(e.target.checked)}
              className="w-5 h-5 rounded border-brown-600 bg-brown-800 text-gold-500 focus:ring-gold-500 focus:ring-offset-0 cursor-pointer accent-gold-500"
            />
            <span className="text-brown-300 text-sm">
              I understand, don't show this again
            </span>
          </label>
        </div>

        {/* Footer */}
        <div className="p-4 pt-0">
          <button
            onClick={onAcknowledge}
            disabled={!isChecked}
            className={`w-full py-3 px-4 rounded-xl font-semibold transition-all ${
              isChecked
                ? "bg-gold-500 text-brown-900 hover:bg-gold-400 cursor-pointer"
                : "bg-brown-700/50 text-brown-500 cursor-not-allowed"
            }`}
          >
            Continue
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
