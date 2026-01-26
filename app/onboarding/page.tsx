"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  Shield,
  TrendingUp,
  BarChart3,
  Zap,
  Link2,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { cn } from "@/lib/utils";

const steps = [
  { id: 1, title: "Welcome" },
  { id: 2, title: "Risk Acknowledgment" },
  { id: 3, title: "Preferences" },
  { id: 4, title: "Connect" },
  { id: 5, title: "Complete" },
];

const riskDisclosures = [
  {
    id: "understand-risk",
    label: "I understand that options trading involves substantial risk of loss",
  },
  {
    id: "not-advice",
    label: "I understand GainsView does not provide financial or investment advice",
  },
  {
    id: "own-research",
    label: "I will conduct my own research before making any trading decisions",
  },
  {
    id: "age-confirm",
    label: "I confirm that I am at least 18 years of age",
  },
];

export default function OnboardingPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [showAnimation, setShowAnimation] = useState(true);

  // Form state
  const [riskChecks, setRiskChecks] = useState<Record<string, boolean>>({});
  const [tradingPreference, setTradingPreference] = useState<string>("");
  const [experienceLevel, setExperienceLevel] = useState<string>("");
  const [defaultContracts, setDefaultContracts] = useState<number>(1);

  // Check if user needs onboarding
  useEffect(() => {
    async function checkOnboarding() {
      if (!isLoaded || !user) return;

      try {
        const res = await fetch("/api/user?type=settings");
        if (res.ok) {
          const { data } = await res.json();
          if (data?.onboarding_completed) {
            router.push("/");
          }
        }
      } catch (error) {
        console.error("Error checking onboarding:", error);
      }
    }

    checkOnboarding();
  }, [isLoaded, user, router]);

  // Animation timing
  useEffect(() => {
    if (currentStep === 1) {
      const timer = setTimeout(() => setShowAnimation(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [currentStep]);

  const allRiskChecked = riskDisclosures.every((d) => riskChecks[d.id]);

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return true;
      case 2:
        return allRiskChecked;
      case 3:
        return tradingPreference && experienceLevel;
      case 4:
        return true;
      case 5:
        return true;
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (currentStep < 5) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = async () => {
    setIsLoading(true);
    try {
      // Save onboarding data
      const res = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          trading_preference: tradingPreference,
          experience_level: experienceLevel,
          default_contracts: defaultContracts,
          risk_acknowledged: true,
          onboarding_completed: true,
        }),
      });

      if (res.ok) {
        router.push("/?welcome=true");
      }
    } catch (error) {
      console.error("Error completing onboarding:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isLoaded) {
    return (
      <div className="min-h-full h-full bg-brown-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-gold-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-full h-full bg-gradient-to-br from-brown-950 via-brown-900 to-brown-950 flex flex-col">
      {/* Progress bar */}
      <div className="w-full bg-brown-800/50 h-1">
        <div
          className="h-full bg-gradient-to-r from-gold-500 to-gold-400 transition-all duration-500"
          style={{ width: `${(currentStep / 5) * 100}%` }}
        />
      </div>

      {/* Step indicators */}
      <div className="flex justify-center pt-8 pb-4 px-4">
        <div className="flex items-center gap-2">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-center">
              <div
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all duration-300",
                  currentStep > step.id
                    ? "bg-gold-500 text-brown-900"
                    : currentStep === step.id
                    ? "bg-gold-400/20 text-gold-400 border-2 border-gold-400"
                    : "bg-brown-800 text-brown-500"
                )}
              >
                {currentStep > step.id ? (
                  <CheckCircle2 className="w-5 h-5" />
                ) : (
                  step.id
                )}
              </div>
              {index < steps.length - 1 && (
                <div
                  className={cn(
                    "w-8 h-0.5 mx-1",
                    currentStep > step.id ? "bg-gold-500" : "bg-brown-700"
                  )}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-lg">
          {/* Step 1: Welcome */}
          {currentStep === 1 && (
            <div className="text-center">
              <div className="relative inline-block mb-8">
                <div
                  className={cn(
                    "absolute inset-0 blur-3xl bg-gold-400 rounded-full transition-all duration-1000",
                    showAnimation ? "opacity-50 scale-150" : "opacity-30 scale-125"
                  )}
                />
                <Image
                  src="/images/logo.png"
                  alt="GainsView"
                  width={160}
                  height={160}
                  className={cn(
                    "relative z-10 transition-all duration-1000",
                    showAnimation ? "scale-110" : "scale-100"
                  )}
                  priority
                />
              </div>

              <h1 className="text-3xl font-bold text-brown-50 mb-3">
                Welcome to GainsView
                {user?.firstName && (
                  <span className="text-gold-400">, {user.firstName}!</span>
                )}
              </h1>

              <p className="text-brown-400 text-lg mb-8">
                Let&apos;s get you set up in 30 seconds
              </p>

              <div className="grid grid-cols-3 gap-4 mb-8">
                {[
                  { icon: BarChart3, label: "P&L Calculator" },
                  { icon: TrendingUp, label: "Portfolio Tracking" },
                  { icon: Sparkles, label: "AI Insights" },
                ].map((feature) => {
                  const Icon = feature.icon;
                  return (
                    <div
                      key={feature.label}
                      className="p-4 bg-brown-800/30 rounded-xl border border-brown-700/30"
                    >
                      <div className="inline-flex p-2 bg-gold-400/10 rounded-lg mb-2">
                        <Icon className="w-5 h-5 text-gold-400" />
                      </div>
                      <p className="text-brown-300 text-sm">{feature.label}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Step 2: Risk Acknowledgment */}
          {currentStep === 2 && (
            <div>
              <div className="text-center mb-8">
                <div className="inline-flex p-4 bg-amber-500/10 rounded-2xl mb-4">
                  <Shield className="w-10 h-10 text-amber-500" />
                </div>
                <h2 className="text-2xl font-bold text-brown-50 mb-2">
                  Risk Acknowledgment
                </h2>
                <p className="text-brown-400">
                  Please review and acknowledge the following before continuing
                </p>
              </div>

              <div className="space-y-4 bg-brown-800/30 rounded-xl p-6 border border-brown-700/50">
                {riskDisclosures.map((disclosure) => (
                  <div key={disclosure.id} className="flex items-start gap-3">
                    <Checkbox
                      id={disclosure.id}
                      checked={riskChecks[disclosure.id] || false}
                      onCheckedChange={(checked) =>
                        setRiskChecks((prev) => ({
                          ...prev,
                          [disclosure.id]: checked as boolean,
                        }))
                      }
                      className="mt-0.5 border-brown-600 data-[state=checked]:bg-gold-500 data-[state=checked]:border-gold-500"
                    />
                    <Label
                      htmlFor={disclosure.id}
                      className="text-brown-200 text-sm leading-relaxed cursor-pointer"
                    >
                      {disclosure.label}
                    </Label>
                  </div>
                ))}
              </div>

              {!allRiskChecked && (
                <p className="text-center text-brown-500 text-sm mt-4">
                  Please acknowledge all items to continue
                </p>
              )}
            </div>
          )}

          {/* Step 3: Preferences */}
          {currentStep === 3 && (
            <div>
              <div className="text-center mb-8">
                <div className="inline-flex p-4 bg-gold-400/10 rounded-2xl mb-4">
                  <Zap className="w-10 h-10 text-gold-400" />
                </div>
                <h2 className="text-2xl font-bold text-brown-50 mb-2">
                  Quick Preferences
                </h2>
                <p className="text-brown-400">
                  Help us personalize your experience
                </p>
              </div>

              <div className="space-y-6">
                {/* Trading preference */}
                <div className="bg-brown-800/30 rounded-xl p-6 border border-brown-700/50">
                  <Label className="text-brown-200 font-medium mb-4 block">
                    What do you primarily trade?
                  </Label>
                  <RadioGroup
                    value={tradingPreference}
                    onValueChange={setTradingPreference}
                    className="grid grid-cols-3 gap-3"
                  >
                    {[
                      { value: "calls", label: "Calls" },
                      { value: "puts", label: "Puts" },
                      { value: "both", label: "Both" },
                    ].map((option) => (
                      <div key={option.value}>
                        <RadioGroupItem
                          value={option.value}
                          id={option.value}
                          className="peer sr-only"
                        />
                        <Label
                          htmlFor={option.value}
                          className={cn(
                            "flex items-center justify-center p-4 rounded-xl border-2 cursor-pointer transition-all",
                            tradingPreference === option.value
                              ? "border-gold-500 bg-gold-500/10 text-gold-400"
                              : "border-brown-700 bg-brown-800/50 text-brown-300 hover:border-brown-600"
                          )}
                        >
                          {option.label}
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>

                {/* Experience level */}
                <div className="bg-brown-800/30 rounded-xl p-6 border border-brown-700/50">
                  <Label className="text-brown-200 font-medium mb-4 block">
                    Your experience level?
                  </Label>
                  <RadioGroup
                    value={experienceLevel}
                    onValueChange={setExperienceLevel}
                    className="grid grid-cols-3 gap-3"
                  >
                    {[
                      { value: "beginner", label: "Beginner" },
                      { value: "intermediate", label: "Intermediate" },
                      { value: "advanced", label: "Advanced" },
                    ].map((option) => (
                      <div key={option.value}>
                        <RadioGroupItem
                          value={option.value}
                          id={`exp-${option.value}`}
                          className="peer sr-only"
                        />
                        <Label
                          htmlFor={`exp-${option.value}`}
                          className={cn(
                            "flex items-center justify-center p-4 rounded-xl border-2 cursor-pointer transition-all",
                            experienceLevel === option.value
                              ? "border-gold-500 bg-gold-500/10 text-gold-400"
                              : "border-brown-700 bg-brown-800/50 text-brown-300 hover:border-brown-600"
                          )}
                        >
                          {option.label}
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>

                {/* Default contracts */}
                <div className="bg-brown-800/30 rounded-xl p-6 border border-brown-700/50">
                  <Label className="text-brown-200 font-medium mb-4 block">
                    Default position size (contracts)
                  </Label>
                  <div className="flex items-center gap-4">
                    {[1, 5, 10, 25].map((num) => (
                      <button
                        key={num}
                        type="button"
                        onClick={() => setDefaultContracts(num)}
                        className={cn(
                          "flex-1 p-3 rounded-xl border-2 font-medium transition-all",
                          defaultContracts === num
                            ? "border-gold-500 bg-gold-500/10 text-gold-400"
                            : "border-brown-700 bg-brown-800/50 text-brown-300 hover:border-brown-600"
                        )}
                      >
                        {num}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Connect */}
          {currentStep === 4 && (
            <div>
              <div className="text-center mb-8">
                <div className="inline-flex p-4 bg-blue-500/10 rounded-2xl mb-4">
                  <Link2 className="w-10 h-10 text-blue-400" />
                </div>
                <h2 className="text-2xl font-bold text-brown-50 mb-2">
                  Connect Your Data
                </h2>
                <p className="text-brown-400">
                  Optional: Sync your portfolio for enhanced insights
                </p>
              </div>

              <div className="space-y-4">
                <div className="bg-brown-800/30 rounded-xl p-6 border border-brown-700/50 opacity-60">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-brown-700/50 rounded-xl">
                        <TrendingUp className="w-6 h-6 text-brown-400" />
                      </div>
                      <div>
                        <p className="text-brown-200 font-medium">Broker Integration</p>
                        <p className="text-brown-500 text-sm">Connect your brokerage account</p>
                      </div>
                    </div>
                    <span className="text-xs bg-brown-700 text-brown-400 px-3 py-1 rounded-full">
                      Coming Soon
                    </span>
                  </div>
                </div>

                <div className="bg-brown-800/30 rounded-xl p-6 border border-brown-700/50 opacity-60">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-brown-700/50 rounded-xl">
                        <BarChart3 className="w-6 h-6 text-brown-400" />
                      </div>
                      <div>
                        <p className="text-brown-200 font-medium">Import Trades</p>
                        <p className="text-brown-500 text-sm">Upload CSV from your broker</p>
                      </div>
                    </div>
                    <span className="text-xs bg-brown-700 text-brown-400 px-3 py-1 rounded-full">
                      Coming Soon
                    </span>
                  </div>
                </div>
              </div>

              <p className="text-center text-brown-500 text-sm mt-6">
                You can always connect these later from Settings
              </p>
            </div>
          )}

          {/* Step 5: Complete */}
          {currentStep === 5 && (
            <div className="text-center">
              <div className="relative inline-block mb-8">
                <div className="absolute inset-0 blur-3xl opacity-40 bg-emerald-400 rounded-full scale-150" />
                <div className="relative z-10 w-32 h-32 bg-emerald-500/20 rounded-full flex items-center justify-center">
                  <CheckCircle2 className="w-16 h-16 text-emerald-400" />
                </div>
              </div>

              <h2 className="text-3xl font-bold text-brown-50 mb-3">
                You&apos;re All Set!
              </h2>

              <p className="text-brown-400 text-lg mb-8">
                Your account is ready. Let&apos;s start making smarter trades.
              </p>

              <div className="bg-brown-800/30 rounded-xl p-6 border border-brown-700/50 mb-8">
                <h3 className="text-brown-200 font-medium mb-4">Quick Tips</h3>
                <ul className="text-left space-y-3 text-sm text-brown-400">
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-4 h-4 text-gold-400 mt-0.5 flex-shrink-0" />
                    <span>Use the P&L Calculator to visualize any trade before you execute</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-4 h-4 text-gold-400 mt-0.5 flex-shrink-0" />
                    <span>Track your positions in Portfolio to monitor real-time P&L</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-4 h-4 text-gold-400 mt-0.5 flex-shrink-0" />
                    <span>Ask the AI Assistant for strategy ideas and market insights</span>
                  </li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Navigation buttons */}
      <div className="p-6 border-t border-brown-800/50">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          {currentStep > 1 && currentStep < 5 ? (
            <Button
              type="button"
              variant="ghost"
              onClick={handleBack}
              className="text-brown-400 hover:text-brown-200"
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Back
            </Button>
          ) : (
            <div />
          )}

          {currentStep < 5 ? (
            <Button
              type="button"
              onClick={handleNext}
              disabled={!canProceed()}
              className="bg-gradient-to-r from-gold-500 to-gold-600 hover:from-gold-600 hover:to-gold-700 text-brown-900 font-semibold px-8 disabled:opacity-50"
            >
              {currentStep === 4 ? "Skip for Now" : "Continue"}
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          ) : (
            <Button
              type="button"
              onClick={handleComplete}
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-gold-500 to-gold-600 hover:from-gold-600 hover:to-gold-700 text-brown-900 font-semibold py-6 text-lg"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  Start Trading
                  <ChevronRight className="w-5 h-5 ml-2" />
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
