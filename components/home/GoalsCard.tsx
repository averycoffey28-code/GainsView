"use client";

import { useState, useMemo, useRef } from "react";
import { motion } from "framer-motion";
import { Target, ChevronRight, ChevronLeft, Plus } from "lucide-react";
import { Goal, Trade } from "@/hooks/useUserData";

interface GoalsCardProps {
  goals: Goal[];
  trades: Trade[];
  loading: boolean;
  onClick: () => void;
}

// Safe date parser that returns null for invalid dates
function safeParseDate(dateString: string | null | undefined): Date | null {
  if (!dateString || typeof dateString !== "string") return null;
  try {
    const clean = dateString.split("T")[0];
    const parts = clean.split("-");
    if (parts.length !== 3) return null;
    const [year, month, day] = parts.map(Number);
    if (isNaN(year) || isNaN(month) || isNaN(day)) return null;
    const date = new Date(year, month - 1, day);
    if (isNaN(date.getTime())) return null;
    return date;
  } catch {
    return null;
  }
}

// Safe P&L parser
function safeParsePnL(value: number | string | null | undefined): number {
  if (value === null || value === undefined) return 0;
  const parsed = typeof value === "string" ? parseFloat(value) : value;
  return isNaN(parsed) ? 0 : parsed;
}

// Safe number parser (for DECIMAL fields from Neon which come as strings)
function safeParseNumber(value: number | string | null | undefined): number {
  if (value === null || value === undefined) return 0;
  const parsed = typeof value === "string" ? parseFloat(value) : value;
  return isNaN(parsed) ? 0 : parsed;
}

export default function GoalsCard({ goals, trades, loading, onClick }: GoalsCardProps) {
  // Ultra-safe defaults
  const safeGoals = goals && Array.isArray(goals) ? goals : [];
  const safeTrades = trades && Array.isArray(trades) ? trades : [];

  // State for goal navigation
  const [activeGoalIndex, setActiveGoalIndex] = useState(0);
  const touchStartX = useRef(0);

  // Get all active goals sorted by end date
  const activeGoals = useMemo(() => {
    try {
      const active = safeGoals.filter((g) => g && g.status === "active");
      if (active.length === 0) return [];

      // Sort by end date, closest first
      return [...active].sort((a, b) => {
        const endA = safeParseDate(a?.end_date);
        const endB = safeParseDate(b?.end_date);
        if (!endA && !endB) return 0;
        if (!endA) return 1;
        if (!endB) return -1;
        return endA.getTime() - endB.getTime();
      });
    } catch {
      return [];
    }
  }, [safeGoals]);

  // Current goal based on index
  const currentGoal = activeGoals[activeGoalIndex] || null;

  // Calculate progress for the current goal
  const { currentProgress, progressPercent, daysRemaining } = useMemo(() => {
    const defaultResult = { currentProgress: 0, progressPercent: 0, daysRemaining: 0 };

    if (!currentGoal) return defaultResult;

    try {
      const startDate = safeParseDate(currentGoal.start_date);
      const endDate = safeParseDate(currentGoal.end_date);

      if (!startDate || !endDate) return defaultResult;

      const now = new Date();

      const goalTrades = safeTrades.filter((t) => {
        if (!t?.trade_date) return false;
        const tradeDate = safeParseDate(t.trade_date);
        if (!tradeDate) return false;
        return tradeDate >= startDate && tradeDate <= endDate;
      });

      const progress = goalTrades.reduce((sum, t) => sum + safeParsePnL(t.pnl), 0);
      const target = safeParseNumber(currentGoal.target) || 1;
      const percent = target > 0 ? (progress / target) * 100 : 0;
      const days = Math.max(0, Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));

      return { currentProgress: progress, progressPercent: percent, daysRemaining: days };
    } catch {
      return defaultResult;
    }
  }, [currentGoal, safeTrades]);

  // Navigation handlers
  const prevGoal = (e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveGoalIndex((prev) => (prev > 0 ? prev - 1 : activeGoals.length - 1));
  };

  const nextGoal = (e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveGoalIndex((prev) => (prev < activeGoals.length - 1 ? prev + 1 : 0));
  };

  const goToGoal = (e: React.MouseEvent, index: number) => {
    e.stopPropagation();
    setActiveGoalIndex(index);
  };

  // Touch handlers for swipe support
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (activeGoals.length <= 1) return;
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) {
      if (diff > 0) {
        // Swiped left - next goal
        setActiveGoalIndex((prev) => (prev < activeGoals.length - 1 ? prev + 1 : 0));
      } else {
        // Swiped right - prev goal
        setActiveGoalIndex((prev) => (prev > 0 ? prev - 1 : activeGoals.length - 1));
      }
    }
  };

  // Get color class based on value
  const getPnLColorClass = (value: number) => {
    if (value > 0) return "text-emerald-400";
    if (value < 0) return "text-rose-400";
    return "text-brown-400";
  };

  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.3 }}
        className="h-full rounded-xl border border-brown-700/50 bg-gradient-to-br from-brown-800/60 to-brown-900/60 p-4"
      >
        <div className="space-y-3">
          <div className="h-10 w-10 bg-brown-700/50 rounded-xl" />
          <div className="h-5 w-20 bg-brown-700/50 rounded" />
          <div className="h-3 w-full bg-brown-700/50 rounded-full" />
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.3 }}
    >
      <div
        onClick={onClick}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        className="h-full relative overflow-hidden rounded-xl border border-brown-700/50 bg-gradient-to-br from-brown-800/60 to-brown-900/60 backdrop-blur-xl hover:border-gold-500/30 transition-all group cursor-pointer"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-gold-400/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

        <div className="relative p-4">
          {/* Header */}
          <div className="flex items-center justify-between mb-3">
            <div className="p-2 bg-gold-500/10 rounded-lg group-hover:bg-gold-500/20 transition-colors">
              <Target className="w-5 h-5 text-gold-400" />
            </div>
            <ChevronRight className="w-4 h-4 text-brown-500 group-hover:text-gold-400 transition-colors" />
          </div>

          <h3 className="font-semibold text-brown-100 mb-3">Goals</h3>

          {currentGoal ? (
            <div>
              {/* Goal label */}
              <div className="flex items-center justify-between text-sm mb-2 gap-2">
                <span className="text-brown-400 truncate flex-1 text-xs">{currentGoal.label || "Goal"}</span>
                <span className="font-medium whitespace-nowrap">
                  <span className={getPnLColorClass(currentProgress)}>
                    {currentProgress >= 0 ? "" : "-"}${Math.abs(currentProgress).toFixed(0)}
                  </span>
                  <span className="text-brown-500"> / </span>
                  <span className="text-[#D4AF37]">
                    ${safeParseNumber(currentGoal.target).toFixed(0)}
                  </span>
                </span>
              </div>

              {/* Progress bar */}
              <div className={`h-3 rounded-full overflow-hidden ${
                currentProgress < 0 ? "bg-rose-500/20" : "bg-brown-800"
              }`}>
                <motion.div
                  key={currentGoal.id}
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.max(0, Math.min(progressPercent, 100))}%` }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                  className={`h-full rounded-full transition-colors ${
                    progressPercent >= 100
                      ? "bg-emerald-400"
                      : progressPercent >= 50
                      ? "bg-gold-500"
                      : progressPercent > 0
                      ? "bg-amber-600"
                      : ""
                  }`}
                />
              </div>

              {/* Percentage and time remaining */}
              <div className="flex items-center justify-between mt-2">
                <span className={`text-sm font-medium ${getPnLColorClass(progressPercent)}`}>
                  {progressPercent >= 0 ? "" : "-"}{Math.abs(progressPercent).toFixed(0)}%
                </span>
                <span className="text-xs text-brown-500">
                  {daysRemaining > 0 ? `${daysRemaining} days left` : "Ended"}
                </span>
              </div>

              {/* Navigation - only show if more than 1 goal */}
              {activeGoals.length > 1 && (
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-brown-700/50">
                  <button
                    onClick={prevGoal}
                    className="p-1.5 rounded-lg text-brown-500 hover:text-[#D4AF37] hover:bg-[#D4AF37]/10 transition"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>

                  {/* Dots indicator */}
                  <div className="flex items-center gap-1.5">
                    {activeGoals.map((_, index) => (
                      <button
                        key={index}
                        onClick={(e) => goToGoal(e, index)}
                        className={`w-2 h-2 rounded-full transition ${
                          index === activeGoalIndex ? "bg-[#D4AF37]" : "bg-brown-600"
                        }`}
                      />
                    ))}
                  </div>

                  <button
                    onClick={nextGoal}
                    className="p-1.5 rounded-lg text-brown-500 hover:text-[#D4AF37] hover:bg-[#D4AF37]/10 transition"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-2">
              <p className="text-sm text-brown-400 mb-2">Set your first trading goal</p>
              <span className="inline-flex items-center gap-1 text-gold-400 text-sm font-medium group-hover:text-gold-300 transition-colors">
                <Plus className="w-4 h-4" />
                Create Goal
              </span>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
