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
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
    >
      <motion.div
        className="w-full max-w-md bg-brown-900 border border-brown-700 rounded-2xl overflow-hidden shadow-2xl"
        initial={{ scale: 0.95, opacity: 0, y: 10 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
      >
        {/* Header */}
        <div className="p-4 bg-amber-500/10 border-b border-brown-700 flex items-center gap-3">
          <div className="p-2 bg-amber-500/20 rounded-full">
            <AlertTriangle className="w-6 h-6 text-amber-500" />
          </div>
          <h2 className="text-xl font-bold text-brown-50">Market Data Notice</h2>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <p className="text-brown-200">
            Before accessing market data, please be aware of the following:
          </p>

          <div className="space-y-3 text-brown-400">
            <div className="flex items-start gap-2">
              <span className="text-amber-500 mt-0.5">&#8226;</span>
              <p>
                Market data displayed in GainsView may be{" "}
                <span className="text-brown-100 font-semibold">delayed up to 15 minutes</span>.
              </p>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-amber-500 mt-0.5">&#8226;</span>
              <p>
                This data is provided for{" "}
                <span className="text-brown-100 font-semibold">reference purposes only</span>.
              </p>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-amber-500 mt-0.5">&#8226;</span>
              <p>Do not use this data to predict market trends or make real-time trading decisions.</p>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-amber-500 mt-0.5">&#8226;</span>
              <p>Always verify prices with your broker before executing trades.</p>
            </div>
          </div>

          {/* Acknowledgment Checkbox */}
          <div className="pt-4 border-t border-brown-700">
            <label className="flex items-start gap-3 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={isChecked}
                onChange={(e) => setIsChecked(e.target.checked)}
                className="mt-1 w-5 h-5 rounded border-brown-600 bg-brown-800 text-gold-500 focus:ring-gold-500 focus:ring-offset-0 cursor-pointer accent-gold-500"
              />
              <span className="text-brown-200 text-sm leading-relaxed">
                I understand that market data may be delayed up to 15 minutes and should be used as
                a reference only, not for making real-time trading decisions.
              </span>
            </label>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-brown-950/50 border-t border-brown-700">
          <button
            onClick={onAcknowledge}
            disabled={!isChecked}
            className={`w-full py-3 px-4 rounded-xl font-semibold transition-all ${
              isChecked
                ? "bg-gold-500 text-brown-900 hover:bg-gold-400 cursor-pointer"
                : "bg-brown-700/50 text-brown-500 cursor-not-allowed"
            }`}
          >
            Continue to Markets
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
