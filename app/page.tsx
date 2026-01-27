"use client";

import { useEffect, useState, useMemo } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import dynamic from "next/dynamic";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText,
  CandlestickChart,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  X,
  Sparkles,
} from "lucide-react";
import Logo from "@/components/shared/Logo";
import { useTrades } from "@/hooks/useUserData";

// Dynamic import for the chart to avoid SSR issues
const AccountSummaryChart = dynamic(
  () => import("@/components/home/AccountSummaryChart"),
  {
    ssr: false,
    loading: () => (
      <div className="h-48 bg-brown-800/30 rounded-lg animate-pulse" />
    ),
  }
);

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export default function Home() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [showWelcome, setShowWelcome] = useState(false);
  const [onboardingChecked, setOnboardingChecked] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<string>("1M");

  // Get trades data
  const { trades, totalPnL, loading: tradesLoading } = useTrades();

  const greeting = getGreeting();
  const firstName = user?.firstName || "Trader";

  // Calculate today's change (trades from today)
  const todayChange = useMemo(() => {
    const today = new Date().toDateString();
    const todayTrades = trades.filter(
      (t) => new Date(t.trade_date).toDateString() === today
    );
    const todayPnL = todayTrades.reduce((sum, t) => sum + (t.pnl || 0), 0);
    const percentage = totalPnL !== 0 ? (todayPnL / Math.abs(totalPnL)) * 100 : 0;
    return { value: todayPnL, percentage };
  }, [trades, totalPnL]);

  // Get recent trades for the journal preview (last 4)
  const recentTrades = useMemo(() => {
    return trades.slice(0, 4);
  }, [trades]);

  // Check onboarding status
  useEffect(() => {
    async function checkOnboarding() {
      if (!isLoaded || !user) {
        setOnboardingChecked(true);
        return;
      }

      try {
        const res = await fetch("/api/onboarding");
        if (res.ok) {
          const { onboarding_completed } = await res.json();
          if (!onboarding_completed) {
            router.push("/onboarding");
            return;
          }
        }
      } catch (error) {
        console.error("Error checking onboarding:", error);
      }
      setOnboardingChecked(true);
    }

    checkOnboarding();
  }, [isLoaded, user, router]);

  // Show welcome message if just completed onboarding
  useEffect(() => {
    if (searchParams.get("welcome") === "true") {
      setShowWelcome(true);
      window.history.replaceState({}, "", "/");
    }
  }, [searchParams]);

  // Show loading while checking onboarding
  if (!onboardingChecked && isLoaded && user) {
    return (
      <div className="min-h-full h-full bg-gradient-to-br from-brown-950 via-brown-900 to-brown-950 flex items-center justify-center">
        <div className="text-center">
          <Logo size="hero" glow animate />
          <p className="mt-4 text-brown-400">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  const periods = ["1W", "1M", "3M", "1Y", "ALL"];

  return (
    <div className="min-h-full bg-gradient-to-br from-brown-950 via-brown-900 to-brown-950 text-brown-50 p-4 md:p-6">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Welcome Banner */}
        <AnimatePresence>
          {showWelcome && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="p-4 bg-gradient-to-r from-gold-500/20 to-gold-600/10 rounded-xl border border-gold-500/30 flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <motion.div
                  className="p-2 bg-gold-500/20 rounded-lg"
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                >
                  <Sparkles className="w-5 h-5 text-gold-400" />
                </motion.div>
                <div>
                  <p className="text-brown-50 font-medium">Welcome to GainsView!</p>
                  <p className="text-brown-400 text-sm">Your trading dashboard is ready.</p>
                </div>
              </div>
              <motion.button
                onClick={() => setShowWelcome(false)}
                className="p-2 hover:bg-brown-800/50 rounded-lg transition-colors"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <X className="w-5 h-5 text-brown-400" />
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Header - Greeting */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <h1 className="text-3xl font-bold text-brown-50">
            {greeting},{" "}
            <span className="text-gold-400">{firstName}</span>
          </h1>
          <div className="w-16 h-1 bg-gradient-to-r from-gold-400 to-gold-600 rounded-full mt-2" />
        </motion.div>

        {/* Account Summary Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="relative overflow-hidden rounded-2xl border border-gold-500/30 bg-gradient-to-br from-brown-800/80 to-brown-900/80 backdrop-blur-xl"
        >
          {/* Glass effect overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-gold-400/5 to-transparent pointer-events-none" />

          <div className="relative p-5">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-brown-100">Account Summary</h2>
              {/* Period selector */}
              <div className="flex gap-1 p-1 bg-brown-800/50 rounded-lg">
                {periods.map((period) => (
                  <button
                    key={period}
                    onClick={() => setSelectedPeriod(period)}
                    className={`px-2.5 py-1 text-xs font-medium rounded-md transition-all ${
                      selectedPeriod === period
                        ? "bg-gold-500 text-brown-900"
                        : "text-brown-400 hover:text-brown-200"
                    }`}
                  >
                    {period}
                  </button>
                ))}
              </div>
            </div>

            {/* Chart */}
            <div className="h-48 mb-4">
              {tradesLoading ? (
                <div className="h-full bg-brown-800/30 rounded-lg animate-pulse" />
              ) : (
                <AccountSummaryChart trades={trades} period={selectedPeriod} />
              )}
            </div>

            {/* Stats */}
            <div className="flex items-center justify-between pt-4 border-t border-brown-700/50">
              <div>
                <p className="text-xs text-brown-400 mb-1">Total P&L</p>
                <p
                  className={`text-2xl font-bold ${
                    totalPnL >= 0 ? "text-emerald-400" : "text-rose-400"
                  }`}
                >
                  {totalPnL >= 0 ? "+" : ""}${Math.abs(totalPnL).toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-brown-400 mb-1">Today&apos;s Change</p>
                <div
                  className={`flex items-center justify-end gap-1 ${
                    todayChange.value >= 0 ? "text-emerald-400" : "text-rose-400"
                  }`}
                >
                  {todayChange.value >= 0 ? (
                    <TrendingUp className="w-4 h-4" />
                  ) : (
                    <TrendingDown className="w-4 h-4" />
                  )}
                  <span className="text-lg font-semibold">
                    {todayChange.percentage >= 0 ? "+" : ""}
                    {todayChange.percentage.toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Two Cards Side by Side */}
        <div className="grid grid-cols-2 gap-4">
          {/* Trading Journal Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
          >
            <Link href="/pnl">
              <div className="h-full relative overflow-hidden rounded-xl border border-brown-700/50 bg-gradient-to-br from-brown-800/60 to-brown-900/60 backdrop-blur-xl hover:border-gold-500/30 transition-all group">
                <div className="absolute inset-0 bg-gradient-to-br from-gold-400/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

                <div className="relative p-4">
                  {/* Header */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="p-2 bg-brown-700/50 rounded-lg group-hover:bg-gold-500/20 transition-colors">
                      <FileText className="w-5 h-5 text-brown-300 group-hover:text-gold-400 transition-colors" />
                    </div>
                    <ChevronRight className="w-4 h-4 text-brown-500 group-hover:text-gold-400 transition-colors" />
                  </div>

                  <h3 className="font-semibold text-brown-100 mb-3">Trading Journal</h3>

                  {/* Recent trades preview */}
                  <div className="space-y-2">
                    {tradesLoading ? (
                      <>
                        <div className="h-3 bg-brown-700/50 rounded animate-pulse" />
                        <div className="h-3 bg-brown-700/50 rounded animate-pulse w-3/4" />
                        <div className="h-3 bg-brown-700/50 rounded animate-pulse w-1/2" />
                      </>
                    ) : recentTrades.length > 0 ? (
                      recentTrades.map((trade) => (
                        <div
                          key={trade.id}
                          className="flex items-center justify-between text-xs"
                        >
                          <span className="text-brown-400 truncate">
                            {trade.symbol}
                          </span>
                          <span
                            className={
                              (trade.pnl || 0) >= 0
                                ? "text-emerald-400"
                                : "text-rose-400"
                            }
                          >
                            {(trade.pnl || 0) >= 0 ? "+" : ""}${Math.abs(trade.pnl || 0).toFixed(0)}
                          </span>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-brown-500">No trades yet</p>
                    )}
                  </div>

                  {/* View All */}
                  <p className="text-xs text-gold-400 mt-3 group-hover:text-gold-300 transition-colors">
                    View All
                  </p>
                </div>
              </div>
            </Link>
          </motion.div>

          {/* Strategy Builder Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.3 }}
          >
            <Link href="/portfolio">
              <div className="h-full relative overflow-hidden rounded-xl border border-brown-700/50 bg-gradient-to-br from-brown-800/60 to-brown-900/60 backdrop-blur-xl hover:border-gold-500/30 transition-all group">
                <div className="absolute inset-0 bg-gradient-to-br from-gold-400/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

                <div className="relative p-4">
                  {/* Header */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="p-2 bg-brown-700/50 rounded-lg group-hover:bg-gold-500/20 transition-colors">
                      <CandlestickChart className="w-5 h-5 text-brown-300 group-hover:text-gold-400 transition-colors" />
                    </div>
                    <ChevronRight className="w-4 h-4 text-brown-500 group-hover:text-gold-400 transition-colors" />
                  </div>

                  <h3 className="font-semibold text-brown-100 mb-3">Strategy Builder</h3>

                  {/* Strategy visualization */}
                  <div className="flex items-end justify-center gap-1 h-16 mb-2">
                    {/* Candlestick visualization */}
                    <div className="flex flex-col items-center">
                      <div className="w-0.5 h-3 bg-emerald-400/60" />
                      <div className="w-2 h-5 bg-emerald-400 rounded-sm" />
                      <div className="w-0.5 h-2 bg-emerald-400/60" />
                    </div>
                    <div className="flex flex-col items-center">
                      <div className="w-0.5 h-2 bg-rose-400/60" />
                      <div className="w-2 h-6 bg-rose-400 rounded-sm" />
                      <div className="w-0.5 h-3 bg-rose-400/60" />
                    </div>
                    <div className="flex flex-col items-center">
                      <div className="w-0.5 h-4 bg-emerald-400/60" />
                      <div className="w-2 h-4 bg-emerald-400 rounded-sm" />
                      <div className="w-0.5 h-2 bg-emerald-400/60" />
                    </div>
                    <div className="flex flex-col items-center">
                      <div className="w-0.5 h-2 bg-emerald-400/60" />
                      <div className="w-2 h-7 bg-emerald-400 rounded-sm" />
                      <div className="w-0.5 h-1 bg-emerald-400/60" />
                    </div>
                    <div className="flex flex-col items-center">
                      <div className="w-0.5 h-3 bg-rose-400/60" />
                      <div className="w-2 h-4 bg-rose-400 rounded-sm" />
                      <div className="w-0.5 h-4 bg-rose-400/60" />
                    </div>
                  </div>

                  {/* Strategy types */}
                  <div className="flex flex-wrap gap-1">
                    <span className="text-[10px] px-1.5 py-0.5 bg-brown-700/50 text-brown-400 rounded">
                      Calls
                    </span>
                    <span className="text-[10px] px-1.5 py-0.5 bg-brown-700/50 text-brown-400 rounded">
                      Puts
                    </span>
                    <span className="text-[10px] px-1.5 py-0.5 bg-brown-700/50 text-brown-400 rounded">
                      Spreads
                    </span>
                  </div>

                  {/* CTA */}
                  <p className="text-xs text-gold-400 mt-3 group-hover:text-gold-300 transition-colors">
                    Build Strategy
                  </p>
                </div>
              </div>
            </Link>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
