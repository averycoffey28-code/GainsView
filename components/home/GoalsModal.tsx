"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Target, Trash2, Trophy, Plus, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Goal, Trade } from "@/hooks/useUserData";

interface GoalsModalProps {
  isOpen: boolean;
  onClose: () => void;
  goals: Goal[];
  trades: Trade[];
  onAddGoal: (goal: Omit<Goal, "id" | "user_id" | "created_at" | "status">) => Promise<Goal | null>;
  onDeleteGoal: (id: string) => Promise<boolean>;
}

type GoalType = "weekly" | "monthly" | "yearly" | "custom";

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

// Format a local Date object to "YYYY-MM-DD"
function toLocalDateStr(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function formatDateRange(start: string | null | undefined, end: string | null | undefined): string {
  const startDate = safeParseDate(start);
  const endDate = safeParseDate(end);
  if (!startDate || !endDate) return "Invalid dates";
  const opts: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" };
  const yearOpts: Intl.DateTimeFormatOptions = { year: "numeric" };
  return `${startDate.toLocaleDateString("en-US", opts)} - ${endDate.toLocaleDateString("en-US", opts)}, ${endDate.toLocaleDateString("en-US", yearOpts)}`;
}

function getPresetDates(type: GoalType): { start: string; end: string } {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  switch (type) {
    case "weekly": {
      const dayOfWeek = today.getDay();
      const start = new Date(today);
      start.setDate(today.getDate() - dayOfWeek);
      const end = new Date(start);
      end.setDate(start.getDate() + 6);
      return { start: toLocalDateStr(start), end: toLocalDateStr(end) };
    }
    case "monthly": {
      const start = new Date(today.getFullYear(), today.getMonth(), 1);
      const end = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      return { start: toLocalDateStr(start), end: toLocalDateStr(end) };
    }
    case "yearly": {
      const start = new Date(today.getFullYear(), 0, 1);
      const end = new Date(today.getFullYear(), 11, 31);
      return { start: toLocalDateStr(start), end: toLocalDateStr(end) };
    }
    default:
      return { start: toLocalDateStr(today), end: toLocalDateStr(today) };
  }
}

export default function GoalsModal({
  isOpen,
  onClose,
  goals,
  trades,
  onAddGoal,
  onDeleteGoal,
}: GoalsModalProps) {
  const safeGoals = goals && Array.isArray(goals) ? goals : [];
  const safeTrades = trades && Array.isArray(trades) ? trades : [];

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [goalType, setGoalType] = useState<GoalType>("monthly");
  const [targetAmount, setTargetAmount] = useState("");
  const [goalName, setGoalName] = useState("");
  const [customDuration, setCustomDuration] = useState("1");
  const [customUnit, setCustomUnit] = useState<"weeks" | "months" | "years">("months");
  const [startDate, setStartDate] = useState(toLocalDateStr(new Date()));
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Lock body scroll when modal is open
  const scrollYRef = useRef(0);
  useEffect(() => {
    if (isOpen) {
      scrollYRef.current = window.scrollY;
      document.body.style.position = "fixed";
      document.body.style.top = `-${scrollYRef.current}px`;
      document.body.style.left = "0";
      document.body.style.right = "0";
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.position = "";
        document.body.style.top = "";
        document.body.style.left = "";
        document.body.style.right = "";
        document.body.style.overflow = "";
        window.scrollTo(0, scrollYRef.current);
      };
    }
  }, [isOpen]);

  const activeGoals = useMemo(() => {
    try {
      return safeGoals.filter((g) => g && g.status === "active");
    } catch {
      return [];
    }
  }, [safeGoals]);

  const completedGoals = useMemo(() => {
    try {
      return safeGoals.filter((g) => g && (g.status === "completed" || g.status === "failed"));
    } catch {
      return [];
    }
  }, [safeGoals]);

  const calculateProgress = (goal: Goal) => {
    try {
      const startDate = safeParseDate(goal?.start_date);
      const endDate = safeParseDate(goal?.end_date);
      const now = new Date();

      if (!startDate || !endDate) {
        return { currentPnL: 0, percent: 0, daysRemaining: 0 };
      }

      const goalTrades = safeTrades.filter((t) => {
        if (!t?.trade_date) return false;
        const tradeDate = safeParseDate(t.trade_date);
        if (!tradeDate) return false;
        return tradeDate >= startDate && tradeDate <= endDate;
      });

      const currentPnL = goalTrades.reduce((sum, t) => sum + safeParsePnL(t.pnl), 0);
      const target = safeParseNumber(goal?.target) || 1;
      const percent = target > 0 ? (currentPnL / target) * 100 : 0;
      const daysRemaining = Math.max(0, Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));

      return { currentPnL, percent, daysRemaining };
    } catch {
      return { currentPnL: 0, percent: 0, daysRemaining: 0 };
    }
  };

  const handleCreateGoal = async () => {
    if (!targetAmount || parseFloat(targetAmount) <= 0) return;
    setIsSubmitting(true);

    try {
      let dates: { start: string; end: string };
      if (goalType === "custom") {
        const start = safeParseDate(startDate);
        if (!start) {
          setIsSubmitting(false);
          return;
        }
        const duration = parseInt(customDuration) || 1;
        const end = new Date(start);
        if (customUnit === "weeks") end.setDate(end.getDate() + duration * 7);
        else if (customUnit === "months") end.setMonth(end.getMonth() + duration);
        else if (customUnit === "years") end.setFullYear(end.getFullYear() + duration);
        dates = { start: startDate, end: toLocalDateStr(end) };
      } else {
        dates = getPresetDates(goalType);
      }

      const defaultLabel =
        goalType === "weekly"
          ? "Weekly Profit Goal"
          : goalType === "monthly"
          ? "Monthly Profit Goal"
          : goalType === "yearly"
          ? "Yearly Profit Goal"
          : "Custom Goal";

      await onAddGoal({
        label: goalName.trim() || defaultLabel,
        type: goalType,
        target: parseFloat(targetAmount),
        start_date: dates.start,
        end_date: dates.end,
      });

      setTargetAmount("");
      setGoalName("");
      setGoalType("monthly");
      setShowCreateForm(false);
    } catch (error) {
      console.error("Error creating goal:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-lg max-h-[85vh] bg-brown-900 border border-gold-500/30 rounded-2xl shadow-2xl flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gold-500/20">
          <div className="flex items-center gap-3">
            {showCreateForm && (
              <button
                onClick={() => setShowCreateForm(false)}
                className="p-1 text-brown-400 hover:text-brown-200 transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
            )}
            <div className="p-2 bg-gold-500/10 rounded-lg">
              <Target className="w-5 h-5 text-gold-400" />
            </div>
            <h2 className="text-lg font-semibold text-brown-50">
              {showCreateForm ? "Create Goal" : "Goals"}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-brown-400 hover:text-brown-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          <AnimatePresence mode="wait">
            {showCreateForm ? (
              <motion.div
                key="create"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                {/* Goal Type Presets */}
                <div>
                  <label className="text-sm text-brown-400 mb-2 block">Timeframe</label>
                  <div className="grid grid-cols-3 gap-2 mb-2">
                    {(["weekly", "monthly", "yearly"] as const).map((type) => (
                      <button
                        key={type}
                        onClick={() => setGoalType(type)}
                        className={`py-3 rounded-xl text-sm font-medium border transition-all ${
                          goalType === type
                            ? "bg-gold-500 text-brown-900 border-gold-500"
                            : "border-brown-700 text-brown-400 hover:border-brown-600"
                        }`}
                      >
                        {type.charAt(0).toUpperCase() + type.slice(1)}
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={() => setGoalType("custom")}
                    className={`w-full py-3 rounded-xl text-sm font-medium border transition-all ${
                      goalType === "custom"
                        ? "bg-gold-500 text-brown-900 border-gold-500"
                        : "border-brown-700 text-brown-400 hover:border-brown-600"
                    }`}
                  >
                    Custom Timeframe
                  </button>
                </div>

                {/* Custom Timeframe Options */}
                {goalType === "custom" && (
                  <div className="space-y-3 p-3 bg-brown-800/50 rounded-xl">
                    <div>
                      <label className="text-sm text-brown-400 mb-2 block">Duration</label>
                      <div className="flex gap-2">
                        <input
                          type="number"
                          value={customDuration}
                          onChange={(e) => setCustomDuration(e.target.value)}
                          min="1"
                          max="24"
                          className="w-20 px-3 py-2 bg-brown-900 border border-brown-700 rounded-lg text-brown-100 focus:outline-none focus:border-gold-500"
                        />
                        <select
                          value={customUnit}
                          onChange={(e) => setCustomUnit(e.target.value as typeof customUnit)}
                          className="flex-1 px-3 py-2 bg-brown-900 border border-brown-700 rounded-lg text-brown-100 focus:outline-none focus:border-gold-500"
                        >
                          <option value="weeks">Weeks</option>
                          <option value="months">Months</option>
                          <option value="years">Years</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="text-sm text-brown-400 mb-2 block">Start Date</label>
                      <input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="w-full px-3 py-2 bg-brown-900 border border-brown-700 rounded-lg text-brown-100 focus:outline-none focus:border-gold-500"
                      />
                    </div>
                  </div>
                )}

                {/* Target Amount */}
                <div>
                  <label className="text-sm text-brown-400 mb-2 block">Profit Target</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-brown-400">$</span>
                    <input
                      type="number"
                      value={targetAmount}
                      onChange={(e) => setTargetAmount(e.target.value)}
                      placeholder="1,000"
                      className="w-full pl-8 pr-4 py-3 bg-brown-800 border border-brown-700 rounded-xl text-lg font-medium text-brown-100 focus:outline-none focus:border-gold-500"
                    />
                  </div>
                  <div className="flex gap-2 mt-2">
                    {[500, 1000, 2500, 5000, 10000].map((amount) => (
                      <button
                        key={amount}
                        onClick={() => setTargetAmount(amount.toString())}
                        className="flex-1 py-2 text-xs font-medium rounded-lg border border-brown-700 text-brown-400 hover:border-gold-500 hover:text-gold-400 transition-colors"
                      >
                        ${amount >= 1000 ? `${amount / 1000}k` : amount}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Goal Name */}
                <div>
                  <label className="text-sm text-brown-400 mb-2 block">Goal Name (optional)</label>
                  <input
                    type="text"
                    value={goalName}
                    onChange={(e) => setGoalName(e.target.value)}
                    placeholder={
                      goalType === "weekly"
                        ? "Weekly Profit Goal"
                        : goalType === "monthly"
                        ? "Monthly Profit Goal"
                        : goalType === "yearly"
                        ? "Yearly Profit Goal"
                        : "Custom Goal"
                    }
                    className="w-full px-4 py-3 bg-brown-800 border border-brown-700 rounded-xl text-brown-100 focus:outline-none focus:border-gold-500"
                  />
                </div>

                {/* Create Button */}
                <Button
                  onClick={handleCreateGoal}
                  disabled={!targetAmount || parseFloat(targetAmount) <= 0 || isSubmitting}
                  className="w-full py-3.5 bg-gold-500 hover:bg-gold-600 text-brown-900 font-semibold rounded-xl disabled:opacity-50"
                >
                  {isSubmitting ? "Creating..." : "Create Goal"}
                </Button>
              </motion.div>
            ) : (
              <motion.div
                key="list"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-4"
              >
                {/* Create Goal Button */}
                <button
                  onClick={() => setShowCreateForm(true)}
                  className="w-full py-3 flex items-center justify-center gap-2 border-2 border-dashed border-brown-700 hover:border-gold-500 text-brown-400 hover:text-gold-400 rounded-xl transition-colors"
                >
                  <Plus className="w-5 h-5" />
                  <span className="font-medium">Create New Goal</span>
                </button>

                {/* Active Goals */}
                {activeGoals.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium text-brown-400 mb-3">Active Goals</h3>
                    <div className="space-y-3">
                      {activeGoals.map((goal) => {
                        const { currentPnL, percent, daysRemaining } = calculateProgress(goal);
                        const isAchieved = percent >= 100;

                        return (
                          <div
                            key={goal.id}
                            className="p-4 bg-brown-800/50 border border-brown-700 rounded-xl"
                          >
                            <div className="flex items-center justify-between mb-1">
                              <h4 className="font-semibold text-brown-100">{goal.label || "Goal"}</h4>
                              <button
                                onClick={() => onDeleteGoal(goal.id)}
                                className="p-1 text-brown-500 hover:text-rose-400 transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>

                            <p className="text-xs text-brown-500 mb-3">
                              {formatDateRange(goal.start_date, goal.end_date)}
                            </p>

                            <div className="flex items-center justify-between text-sm mb-2">
                              <span className="text-brown-400">Progress</span>
                              <span className="font-medium">
                                <span className={currentPnL >= 0 ? "text-emerald-400" : "text-rose-400"}>
                                  {currentPnL >= 0 ? "" : "-"}${Math.abs(currentPnL).toFixed(2)}
                                </span>
                                <span className="text-brown-500"> / </span>
                                <span className="text-[#D4AF37]">
                                  ${safeParseNumber(goal.target).toFixed(2)}
                                </span>
                              </span>
                            </div>

                            <div className={`h-3 rounded-full overflow-hidden mb-2 ${
                              currentPnL < 0 ? "bg-rose-500/20" : "bg-brown-900"
                            }`}>
                              <div
                                className={`h-full rounded-full transition-all ${
                                  percent >= 100
                                    ? "bg-emerald-400"
                                    : percent >= 75
                                    ? "bg-gold-500"
                                    : percent >= 50
                                    ? "bg-amber-600"
                                    : percent > 0
                                    ? "bg-orange-400"
                                    : ""
                                }`}
                                style={{ width: `${Math.max(0, Math.min(percent, 100))}%` }}
                              />
                            </div>

                            <div className="flex items-center justify-between">
                              <span
                                className={`text-sm font-bold ${
                                  percent >= 0 ? "text-emerald-400" : "text-rose-400"
                                }`}
                              >
                                {percent >= 0 ? "" : "-"}{Math.abs(percent).toFixed(0)}%
                              </span>
                              <span className="text-xs text-brown-500">
                                {daysRemaining > 0 ? `${daysRemaining} days remaining` : "Goal period ended"}
                              </span>
                            </div>

                            {isAchieved && (
                              <div className="mt-3 flex items-center gap-2 px-3 py-2 bg-emerald-400/10 border border-emerald-400/30 rounded-lg">
                                <Trophy className="w-4 h-4 text-emerald-400" />
                                <span className="text-sm text-emerald-400 font-medium">Goal Achieved!</span>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Completed Goals */}
                {completedGoals.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium text-brown-400 mb-3">History</h3>
                    <div className="space-y-2">
                      {completedGoals.slice(0, 5).map((goal) => {
                        const { percent } = calculateProgress(goal);
                        return (
                          <div
                            key={goal.id}
                            className="flex items-center justify-between p-3 bg-brown-800/30 border border-brown-700/50 rounded-lg"
                          >
                            <div>
                              <span className="text-sm text-brown-300">{goal.label || "Goal"}</span>
                              <span className="text-xs text-brown-500 ml-2">
                                ${safeParseNumber(goal.target).toFixed(0)}
                              </span>
                            </div>
                            <span
                              className={`text-sm font-medium ${
                                goal.status === "completed" ? "text-emerald-400" : "text-brown-500"
                              }`}
                            >
                              {goal.status === "completed" ? (
                                <span className="flex items-center gap-1">
                                  <Trophy className="w-3 h-3" />
                                  {percent.toFixed(0)}%
                                </span>
                              ) : (
                                `${percent.toFixed(0)}%`
                              )}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Empty State */}
                {activeGoals.length === 0 && completedGoals.length === 0 && (
                  <div className="text-center py-8">
                    <Target className="w-12 h-12 text-brown-600 mx-auto mb-3" />
                    <p className="text-brown-400 mb-2">No goals yet</p>
                    <p className="text-sm text-brown-500">
                      Create your first goal to track your trading progress
                    </p>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
