"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Camera,
  FileText,
  PenLine,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  Upload,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const STORAGE_KEY = "pnl_tutorial_completed";

interface PnLTutorialProps {
  tradesCount: number;
  onOpenImportModal: () => void;
  onOpenScreenshotUpload: () => void;
  onOpenLogTrade: () => void;
  forceOpen?: boolean;
  onForceClose?: () => void;
}

export default function PnLTutorial({
  tradesCount,
  onOpenImportModal,
  onOpenScreenshotUpload,
  onOpenLogTrade,
  forceOpen = false,
  onForceClose,
}: PnLTutorialProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState(1);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Check if tutorial should show automatically
  useEffect(() => {
    if (!mounted) return;

    // If forced open (from help button), show it
    if (forceOpen) {
      setStep(1);
      setIsOpen(true);
      return;
    }

    // Don't auto-show if user has trades
    if (tradesCount > 0) {
      setIsOpen(false);
      return;
    }

    // Check localStorage
    const completed = localStorage.getItem(STORAGE_KEY);
    if (completed === "true") {
      setIsOpen(false);
      return;
    }

    // Show tutorial for first-time users with no trades
    setIsOpen(true);
  }, [mounted, tradesCount, forceOpen]);

  const handleClose = () => {
    localStorage.setItem(STORAGE_KEY, "true");
    setIsOpen(false);
    setStep(1);
    onForceClose?.();
  };

  const handleSkip = () => {
    handleClose();
  };

  const handleComplete = (action?: "screenshot" | "csv" | "manual" | "later") => {
    localStorage.setItem(STORAGE_KEY, "true");
    setIsOpen(false);
    setStep(1);
    onForceClose?.();

    if (action === "screenshot") {
      onOpenScreenshotUpload();
    } else if (action === "csv") {
      onOpenImportModal();
    } else if (action === "manual") {
      onOpenLogTrade();
    }
  };

  if (!mounted || !isOpen) return null;

  const totalSteps = 5;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-lg max-h-[90vh] bg-brown-900 border border-gold-500/30 rounded-2xl shadow-2xl flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-brown-700/50">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-gold-400" />
            <span className="text-sm font-medium text-gold-400">Tutorial</span>
          </div>
          <button
            onClick={handleClose}
            className="p-2 text-brown-400 hover:text-brown-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <AnimatePresence mode="wait">
            {step === 1 && (
              <Step1Welcome
                key="step1"
                onNext={() => setStep(2)}
                onSkip={handleSkip}
              />
            )}
            {step === 2 && (
              <Step2Screenshot
                key="step2"
                onNext={() => setStep(3)}
                onBack={() => setStep(1)}
              />
            )}
            {step === 3 && (
              <Step3Manual
                key="step3"
                onNext={() => setStep(4)}
                onBack={() => setStep(2)}
              />
            )}
            {step === 4 && (
              <Step4CSV
                key="step4"
                onNext={() => setStep(5)}
                onBack={() => setStep(3)}
              />
            )}
            {step === 5 && (
              <Step5Done
                key="step5"
                onComplete={handleComplete}
              />
            )}
          </AnimatePresence>
        </div>

        {/* Progress dots */}
        <div className="flex items-center justify-center gap-2 p-4 border-t border-brown-700/50">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <div
              key={i}
              className={`w-2 h-2 rounded-full transition-colors ${
                i + 1 === step ? "bg-gold-400" : "bg-brown-700"
              }`}
            />
          ))}
        </div>
      </motion.div>
    </div>
  );
}

// Step 1: Welcome
function Step1Welcome({ onNext, onSkip }: { onNext: () => void; onSkip: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      <div className="text-center">
        <h2 className="text-2xl font-bold text-brown-50 mb-2">
          Let's learn how to log your trades
        </h2>
        <p className="text-brown-400">
          GainsView supports 3 ways to import your trades. We'll walk you through each one.
        </p>
      </div>

      <div className="space-y-3">
        <div className="flex items-center gap-4 p-4 bg-brown-800/50 rounded-xl border border-brown-700">
          <div className="p-3 bg-emerald-500/20 rounded-lg">
            <Camera className="w-6 h-6 text-emerald-400" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-brown-100">Screenshot</span>
              <span className="px-2 py-0.5 text-xs font-medium bg-emerald-500/20 text-emerald-400 rounded-full">
                Easiest
              </span>
            </div>
            <p className="text-sm text-brown-400">AI extracts trade data from screenshots</p>
          </div>
        </div>

        <div className="flex items-center gap-4 p-4 bg-brown-800/50 rounded-xl border border-brown-700">
          <div className="p-3 bg-blue-500/20 rounded-lg">
            <PenLine className="w-6 h-6 text-blue-400" />
          </div>
          <div className="flex-1">
            <span className="font-semibold text-brown-100">Manual Entry</span>
            <p className="text-sm text-brown-400">Log trades one at a time</p>
          </div>
        </div>

        <div className="flex items-center gap-4 p-4 bg-brown-800/50 rounded-xl border border-brown-700">
          <div className="p-3 bg-purple-500/20 rounded-lg">
            <FileText className="w-6 h-6 text-purple-400" />
          </div>
          <div className="flex-1">
            <span className="font-semibold text-brown-100">CSV Import</span>
            <p className="text-sm text-brown-400">Bulk import from your broker</p>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <Button
          onClick={onNext}
          className="w-full bg-gradient-to-r from-gold-500 to-gold-600 hover:from-gold-600 hover:to-gold-700 text-brown-900 font-semibold py-3"
        >
          Let's Get Started
          <ChevronRight className="w-4 h-4 ml-2" />
        </Button>
        <button
          onClick={onSkip}
          className="w-full text-sm text-brown-500 hover:text-brown-300 transition-colors"
        >
          Skip Tutorial
        </button>
      </div>
    </motion.div>
  );
}

// Step 2: Screenshot Import
function Step2Screenshot({ onNext, onBack }: { onNext: () => void; onBack: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-5"
    >
      <div>
        <div className="flex items-center gap-2 mb-2">
          <Camera className="w-6 h-6 text-emerald-400" />
          <h2 className="text-xl font-bold text-brown-50">Screenshot Import</h2>
          <span className="px-2 py-0.5 text-xs font-medium bg-emerald-500/20 text-emerald-400 rounded-full">
            Easiest
          </span>
        </div>
        <p className="text-brown-400 text-sm">
          Just screenshot your trade confirmations and we'll extract the data automatically.
        </p>
      </div>

      <div className="space-y-2">
        <p className="text-xs text-brown-500 font-medium uppercase tracking-wide">
          How to get screenshots from Robinhood:
        </p>
        <ol className="space-y-2 text-sm">
          <li className="flex items-start gap-3">
            <span className="flex-shrink-0 w-5 h-5 rounded-full bg-gold-500/20 text-gold-400 text-xs flex items-center justify-center font-medium">1</span>
            <span className="text-brown-300">Open Robinhood → tap <strong className="text-brown-100">Options</strong></span>
          </li>
          <li className="flex items-start gap-3">
            <span className="flex-shrink-0 w-5 h-5 rounded-full bg-gold-500/20 text-gold-400 text-xs flex items-center justify-center font-medium">2</span>
            <span className="text-brown-300">Go to <strong className="text-brown-100">Realized Profit and Loss</strong></span>
          </li>
          <li className="flex items-start gap-3">
            <span className="flex-shrink-0 w-5 h-5 rounded-full bg-gold-500/20 text-gold-400 text-xs flex items-center justify-center font-medium">3</span>
            <span className="text-brown-300">Tap on any individual order</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="flex-shrink-0 w-5 h-5 rounded-full bg-gold-500/20 text-gold-400 text-xs flex items-center justify-center font-medium">4</span>
            <span className="text-brown-300">Screenshot the order detail page</span>
          </li>
        </ol>
      </div>

      {/* Mock Robinhood Card */}
      <div className="space-y-1">
        <p className="text-xs text-brown-500">Example Robinhood Order Statement:</p>
        <div className="bg-white rounded-xl p-4 text-gray-900">
          <div className="mb-1">
            <p className="text-lg font-semibold text-gray-900">QQQ $527 Put 1/28</p>
            <p className="text-sm text-gray-500">Closed on Jan 28, 2026</p>
          </div>
          <div className="border-t border-gray-200 my-3" />
          <div className="flex justify-between items-start mb-1">
            <span className="text-gray-600">Cost at open</span>
            <div className="text-right">
              <p className="font-medium text-gray-900">-$52.00</p>
              <p className="text-xs text-gray-500">$0.52 avg x 100 x 1 contract</p>
            </div>
          </div>
          <div className="border-t border-gray-200 my-3" />
          <div className="flex justify-between items-start mb-1">
            <span className="text-gray-600">Credit at close</span>
            <div className="text-right">
              <p className="font-medium text-gray-900">+$59.00</p>
              <p className="text-xs text-gray-500">$0.59 avg x 100 x 1 contract</p>
            </div>
          </div>
          <div className="border-t border-gray-200 my-3" />
          <div className="flex justify-between items-start">
            <span className="font-semibold text-gray-900">Realized profit</span>
            <div className="text-right">
              <p className="font-bold text-emerald-600">+$7.00</p>
              <p className="text-xs text-emerald-600">+13.47%</p>
            </div>
          </div>
        </div>
      </div>

      <p className="text-sm text-brown-400 text-center">
        Screenshot pages like this and upload them — our AI extracts all the details automatically.
      </p>

      <div className="flex gap-3">
        <Button
          onClick={onBack}
          variant="outline"
          className="flex-1 border-brown-700 text-brown-300 hover:bg-brown-800"
        >
          <ChevronLeft className="w-4 h-4 mr-1" />
          Back
        </Button>
        <Button
          onClick={onNext}
          className="flex-1 bg-gradient-to-r from-gold-500 to-gold-600 hover:from-gold-600 hover:to-gold-700 text-brown-900 font-semibold"
        >
          Next
          <ChevronRight className="w-4 h-4 ml-1" />
        </Button>
      </div>
    </motion.div>
  );
}

// Step 3: Manual Entry
function Step3Manual({ onNext, onBack }: { onNext: () => void; onBack: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-5"
    >
      <div>
        <div className="flex items-center gap-2 mb-2">
          <PenLine className="w-6 h-6 text-blue-400" />
          <h2 className="text-xl font-bold text-brown-50">Manual Entry</h2>
        </div>
        <p className="text-brown-400 text-sm">
          Quickly log trades one at a time with our trade form.
        </p>
      </div>

      {/* Mock Form Preview */}
      <div className="bg-brown-800/50 rounded-xl border border-brown-700 p-4 space-y-3">
        <p className="text-xs text-brown-500 font-medium uppercase tracking-wide mb-3">
          Log Trade Form Preview:
        </p>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-xs text-brown-400">Date</label>
            <div className="h-8 bg-brown-700/50 rounded border border-brown-600 flex items-center px-2">
              <span className="text-xs text-brown-400">02/16/2026</span>
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-xs text-brown-400">Symbol</label>
            <div className="h-8 bg-brown-700/50 rounded border border-brown-600 flex items-center px-2">
              <span className="text-xs text-brown-400">SPY</span>
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-xs text-brown-400">Type</label>
            <div className="h-8 bg-brown-700/50 rounded border border-brown-600 flex items-center px-2">
              <span className="text-xs text-brown-400">Call</span>
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-xs text-brown-400">Quantity</label>
            <div className="h-8 bg-brown-700/50 rounded border border-brown-600 flex items-center px-2">
              <span className="text-xs text-brown-400">2</span>
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-xs text-brown-400">Entry Price</label>
            <div className="h-8 bg-brown-700/50 rounded border border-brown-600 flex items-center px-2">
              <span className="text-xs text-brown-400">$1.50</span>
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-xs text-brown-400">Exit Price</label>
            <div className="h-8 bg-brown-700/50 rounded border border-brown-600 flex items-center px-2">
              <span className="text-xs text-brown-400">$2.25</span>
            </div>
          </div>
        </div>
        <div className="pt-2 border-t border-brown-700">
          <div className="flex justify-between items-center">
            <span className="text-xs text-brown-400">Calculated P&L:</span>
            <span className="text-sm font-semibold text-emerald-400">+$150.00</span>
          </div>
        </div>
      </div>

      <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3">
        <p className="text-sm text-blue-300">
          <strong>Tip:</strong> Best for logging trades as you make them throughout the day.
        </p>
      </div>

      <div className="flex gap-3">
        <Button
          onClick={onBack}
          variant="outline"
          className="flex-1 border-brown-700 text-brown-300 hover:bg-brown-800"
        >
          <ChevronLeft className="w-4 h-4 mr-1" />
          Back
        </Button>
        <Button
          onClick={onNext}
          className="flex-1 bg-gradient-to-r from-gold-500 to-gold-600 hover:from-gold-600 hover:to-gold-700 text-brown-900 font-semibold"
        >
          Next
          <ChevronRight className="w-4 h-4 ml-1" />
        </Button>
      </div>
    </motion.div>
  );
}

// Step 4: CSV Import
function Step4CSV({ onNext, onBack }: { onNext: () => void; onBack: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-5"
    >
      <div>
        <div className="flex items-center gap-2 mb-2">
          <FileText className="w-6 h-6 text-purple-400" />
          <h2 className="text-xl font-bold text-brown-50">CSV Import</h2>
        </div>
        <p className="text-brown-400 text-sm">
          Import your entire trading history at once from your broker.
        </p>
      </div>

      <div className="space-y-2">
        <p className="text-xs text-brown-500 font-medium uppercase tracking-wide">
          How to export from Robinhood:
        </p>
        <ol className="space-y-2 text-sm">
          <li className="flex items-start gap-3">
            <span className="flex-shrink-0 w-5 h-5 rounded-full bg-gold-500/20 text-gold-400 text-xs flex items-center justify-center font-medium">1</span>
            <span className="text-brown-300">Open Robinhood → tap <strong className="text-brown-100">Account</strong></span>
          </li>
          <li className="flex items-start gap-3">
            <span className="flex-shrink-0 w-5 h-5 rounded-full bg-gold-500/20 text-gold-400 text-xs flex items-center justify-center font-medium">2</span>
            <span className="text-brown-300">Tap <strong className="text-brown-100">Reports & Statements</strong></span>
          </li>
          <li className="flex items-start gap-3">
            <span className="flex-shrink-0 w-5 h-5 rounded-full bg-gold-500/20 text-gold-400 text-xs flex items-center justify-center font-medium">3</span>
            <span className="text-brown-300">Tap <strong className="text-brown-100">Generate Report</strong></span>
          </li>
          <li className="flex items-start gap-3">
            <span className="flex-shrink-0 w-5 h-5 rounded-full bg-gold-500/20 text-gold-400 text-xs flex items-center justify-center font-medium">4</span>
            <span className="text-brown-300">Select your date range</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="flex-shrink-0 w-5 h-5 rounded-full bg-gold-500/20 text-gold-400 text-xs flex items-center justify-center font-medium">5</span>
            <span className="text-brown-300">Download the CSV when ready</span>
          </li>
        </ol>
      </div>

      <div className="bg-gold-500/10 border border-gold-500/30 rounded-lg p-3">
        <p className="text-sm text-gold-300">
          <strong>Note:</strong> Reports can take a few hours to generate.
        </p>
      </div>

      <div className="bg-brown-800/50 rounded-lg p-3 border border-brown-700">
        <p className="text-sm text-brown-300">
          <strong className="text-brown-100">Works with any broker!</strong> As long as your CSV has Date, Symbol, and P&L columns.
        </p>
      </div>

      <div className="flex gap-3">
        <Button
          onClick={onBack}
          variant="outline"
          className="flex-1 border-brown-700 text-brown-300 hover:bg-brown-800"
        >
          <ChevronLeft className="w-4 h-4 mr-1" />
          Back
        </Button>
        <Button
          onClick={onNext}
          className="flex-1 bg-gradient-to-r from-gold-500 to-gold-600 hover:from-gold-600 hover:to-gold-700 text-brown-900 font-semibold"
        >
          Get Started!
          <ChevronRight className="w-4 h-4 ml-1" />
        </Button>
      </div>
    </motion.div>
  );
}

// Step 5: Done
function Step5Done({ onComplete }: { onComplete: (action?: "screenshot" | "csv" | "manual" | "later") => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      <div className="text-center">
        <div className="text-4xl mb-3">🎉</div>
        <h2 className="text-2xl font-bold text-brown-50 mb-2">
          You're all set!
        </h2>
        <p className="text-brown-400">
          You now know all the ways to log your trades. Start importing to unlock your full trading analytics.
        </p>
      </div>

      <div className="space-y-3">
        <Button
          onClick={() => onComplete("screenshot")}
          className="w-full bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-semibold py-3 h-auto"
        >
          <Camera className="w-5 h-5 mr-2" />
          Upload Screenshot
          <span className="ml-2 px-2 py-0.5 text-xs bg-white/20 rounded-full">Recommended</span>
        </Button>

        <Button
          onClick={() => onComplete("csv")}
          variant="outline"
          className="w-full border-brown-700 text-brown-200 hover:bg-brown-800 py-3 h-auto"
        >
          <Upload className="w-5 h-5 mr-2" />
          Import CSV
        </Button>

        <Button
          onClick={() => onComplete("manual")}
          variant="outline"
          className="w-full border-brown-700 text-brown-200 hover:bg-brown-800 py-3 h-auto"
        >
          <PenLine className="w-5 h-5 mr-2" />
          Log a Trade
        </Button>
      </div>

      <button
        onClick={() => onComplete("later")}
        className="w-full text-sm text-brown-500 hover:text-brown-300 transition-colors"
      >
        I'll do this later
      </button>
    </motion.div>
  );
}
