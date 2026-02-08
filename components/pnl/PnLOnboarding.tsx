"use client";

import { useState, useEffect } from "react";
import {
  Upload,
  Camera,
  X,
  ChevronRight,
  ChevronLeft,
  FileText,
  Smartphone,
  Check,
  Clock,
  TrendingUp,
  BarChart3,
  Target,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "pnl_onboarding_status";

type OnboardingStatus = "completed" | "dismissed" | number; // number = remind timestamp

interface Broker {
  id: string;
  name: string;
  logo: string;
  color: string;
  instructions: string[];
  csvSupported: boolean;
  screenshotSupported: boolean;
}

const BROKERS: Broker[] = [
  {
    id: "robinhood",
    name: "Robinhood",
    logo: "RH",
    color: "bg-emerald-500",
    csvSupported: true,
    screenshotSupported: true,
    instructions: [
      "Open Robinhood app or website",
      "Go to Account → Statements & History",
      "Select 'Account' tab and tap 'Download CSV'",
      "Or visit robinhood.com → History → Export",
    ],
  },
  {
    id: "webull",
    name: "Webull",
    logo: "WB",
    color: "bg-orange-500",
    csvSupported: false,
    screenshotSupported: true,
    instructions: [
      "Open Webull app",
      "Go to your positions or order history",
      "Take a screenshot of your closed trade",
      "Upload the screenshot here",
    ],
  },
  {
    id: "thinkorswim",
    name: "thinkorswim",
    logo: "TOS",
    color: "bg-green-600",
    csvSupported: false,
    screenshotSupported: true,
    instructions: [
      "Open thinkorswim desktop or mobile",
      "Navigate to Monitor → Activity and Positions",
      "Take a screenshot of your trade details",
      "Upload the screenshot here",
    ],
  },
  {
    id: "other",
    name: "Other Broker",
    logo: "?",
    color: "bg-brown-600",
    csvSupported: false,
    screenshotSupported: true,
    instructions: [
      "Navigate to your broker's trade history",
      "Find your closed position details",
      "Take a clear screenshot showing P&L",
      "Upload the screenshot for AI extraction",
    ],
  },
];

interface PnLOnboardingProps {
  tradesCount: number;
  onOpenImportModal: () => void;
  onOpenScreenshotUpload: () => void;
}

export default function PnLOnboarding({
  tradesCount,
  onOpenImportModal,
  onOpenScreenshotUpload,
}: PnLOnboardingProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [selectedBroker, setSelectedBroker] = useState<Broker | null>(null);

  // Check if onboarding should show
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);

    if (!stored) {
      // First time seeing onboarding - show it
      setIsOpen(true);
      return;
    }

    if (stored === "completed" || stored === "dismissed") {
      setIsOpen(false);
      return;
    }

    // Check if remind later timestamp has passed (24 hours)
    const remindTime = parseInt(stored, 10);
    if (!isNaN(remindTime)) {
      const now = Date.now();
      if (now >= remindTime) {
        // 24 hours have passed, show again
        setIsOpen(true);
      } else {
        setIsOpen(false);
      }
    }
  }, []);

  const handleRemindLater = () => {
    // Set reminder for 24 hours from now
    const remindTime = Date.now() + 24 * 60 * 60 * 1000;
    localStorage.setItem(STORAGE_KEY, String(remindTime));
    setIsOpen(false);
  };

  const handleDismiss = () => {
    localStorage.setItem(STORAGE_KEY, "dismissed");
    setIsOpen(false);
  };

  const handleComplete = () => {
    localStorage.setItem(STORAGE_KEY, "completed");
    setIsOpen(false);
  };

  const handleImportCSV = () => {
    handleComplete();
    onOpenImportModal();
  };

  const handleUploadScreenshot = () => {
    handleComplete();
    onOpenScreenshotUpload();
  };

  const handleBrokerSelect = (broker: Broker) => {
    setSelectedBroker(broker);
    setStep(3);
  };

  const handleBack = () => {
    if (step === 3) setStep(2);
    else if (step === 2) setStep(1);
  };

  const handleClose = () => {
    setIsOpen(false);
    // Reset state for next time
    setStep(1);
    setSelectedBroker(null);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-lg bg-brown-900 border border-brown-700 rounded-2xl shadow-2xl overflow-hidden">
        {/* Step 1: Welcome */}
        {step === 1 && (
          <>
            <div className="p-6 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-gold-400 to-gold-600 flex items-center justify-center">
                <TrendingUp className="w-8 h-8 text-brown-900" />
              </div>
              <h2 className="text-2xl font-bold text-brown-50 mb-2">
                Welcome to P&L Tracking
              </h2>
              <p className="text-brown-400 mb-6">
                Import your trading history to unlock powerful analytics and insights.
              </p>

              {/* Benefits */}
              <div className="grid grid-cols-3 gap-3 mb-6">
                <div className="p-3 bg-brown-800/50 rounded-lg">
                  <BarChart3 className="w-5 h-5 text-gold-400 mx-auto mb-1" />
                  <p className="text-xs text-brown-300">Visual Calendar</p>
                </div>
                <div className="p-3 bg-brown-800/50 rounded-lg">
                  <Target className="w-5 h-5 text-emerald-400 mx-auto mb-1" />
                  <p className="text-xs text-brown-300">Win Rate Stats</p>
                </div>
                <div className="p-3 bg-brown-800/50 rounded-lg">
                  <TrendingUp className="w-5 h-5 text-blue-400 mx-auto mb-1" />
                  <p className="text-xs text-brown-300">P&L Analytics</p>
                </div>
              </div>

              <Button
                onClick={() => setStep(2)}
                className="w-full bg-gradient-to-r from-gold-500 to-gold-600 hover:from-gold-600 hover:to-gold-700 text-brown-900 font-semibold py-3"
              >
                Let's Import Your Trading History
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            </div>

            {/* Footer actions */}
            <div className="px-6 pb-6 flex items-center justify-between">
              <button
                onClick={handleRemindLater}
                className="flex items-center gap-1.5 text-sm text-brown-500 hover:text-brown-300 transition-colors"
              >
                <Clock className="w-4 h-4" />
                Remind Me Later
              </button>
              <button
                onClick={handleDismiss}
                className="text-sm text-brown-600 hover:text-brown-400 transition-colors"
              >
                No Thanks
              </button>
            </div>
          </>
        )}

        {/* Step 2: Broker Selection */}
        {step === 2 && (
          <>
            <div className="flex items-center justify-between p-4 border-b border-brown-700">
              <button
                onClick={handleBack}
                className="p-2 text-brown-400 hover:text-brown-200 transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <h2 className="text-lg font-semibold text-brown-50">Select Your Broker</h2>
              <button
                onClick={handleClose}
                className="p-2 text-brown-400 hover:text-brown-200 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 space-y-2">
              {BROKERS.map((broker) => (
                <button
                  key={broker.id}
                  onClick={() => handleBrokerSelect(broker)}
                  className="w-full flex items-center gap-4 p-4 bg-brown-800/50 hover:bg-brown-800 border border-brown-700 hover:border-brown-600 rounded-xl transition-all"
                >
                  <div
                    className={cn(
                      "w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-sm",
                      broker.color
                    )}
                  >
                    {broker.logo}
                  </div>
                  <div className="flex-1 text-left">
                    <p className="text-brown-100 font-medium">{broker.name}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      {broker.csvSupported && (
                        <span className="text-xs px-2 py-0.5 bg-emerald-500/20 text-emerald-400 rounded">
                          CSV Import
                        </span>
                      )}
                      {broker.screenshotSupported && (
                        <span className="text-xs px-2 py-0.5 bg-blue-500/20 text-blue-400 rounded">
                          Screenshot
                        </span>
                      )}
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-brown-500" />
                </button>
              ))}
            </div>

            <div className="px-4 pb-4">
              <p className="text-xs text-brown-500 text-center">
                Don't see your broker? Select "Other Broker" to use screenshot import.
              </p>
            </div>
          </>
        )}

        {/* Step 3: Instructions + Upload */}
        {step === 3 && selectedBroker && (
          <>
            <div className="flex items-center justify-between p-4 border-b border-brown-700">
              <button
                onClick={handleBack}
                className="p-2 text-brown-400 hover:text-brown-200 transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <div className="flex items-center gap-2">
                <div
                  className={cn(
                    "w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-xs",
                    selectedBroker.color
                  )}
                >
                  {selectedBroker.logo}
                </div>
                <h2 className="text-lg font-semibold text-brown-50">{selectedBroker.name}</h2>
              </div>
              <button
                onClick={handleClose}
                className="p-2 text-brown-400 hover:text-brown-200 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 space-y-4">
              {/* Instructions */}
              <div className="p-4 bg-brown-800/50 rounded-xl border border-brown-700">
                <p className="text-sm font-medium text-brown-200 mb-3">
                  How to export from {selectedBroker.name}:
                </p>
                <ol className="space-y-2">
                  {selectedBroker.instructions.map((instruction, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm">
                      <span className="flex-shrink-0 w-5 h-5 rounded-full bg-gold-500/20 text-gold-400 text-xs flex items-center justify-center font-medium">
                        {i + 1}
                      </span>
                      <span className="text-brown-300">{instruction}</span>
                    </li>
                  ))}
                </ol>
              </div>

              {/* Import Options */}
              <div className="space-y-2">
                {selectedBroker.csvSupported && (
                  <Button
                    onClick={handleImportCSV}
                    className="w-full bg-gradient-to-r from-gold-500 to-gold-600 hover:from-gold-600 hover:to-gold-700 text-brown-900 font-semibold py-3 h-auto"
                  >
                    <FileText className="w-5 h-5 mr-2" />
                    Import CSV File
                  </Button>
                )}

                {selectedBroker.screenshotSupported && (
                  <Button
                    onClick={handleUploadScreenshot}
                    variant="outline"
                    className={cn(
                      "w-full py-3 h-auto",
                      selectedBroker.csvSupported
                        ? "border-brown-700 text-brown-300 hover:bg-brown-800"
                        : "bg-gradient-to-r from-gold-500 to-gold-600 hover:from-gold-600 hover:to-gold-700 text-brown-900 font-semibold border-0"
                    )}
                  >
                    <Camera className="w-5 h-5 mr-2" />
                    Upload Screenshot
                  </Button>
                )}
              </div>

              {/* Skip option */}
              <div className="text-center pt-2">
                <button
                  onClick={handleComplete}
                  className="text-sm text-brown-500 hover:text-brown-300 transition-colors"
                >
                  Skip for now, I'll add trades manually
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
