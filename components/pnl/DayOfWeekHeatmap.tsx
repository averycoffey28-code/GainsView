"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { CalendarDays, Trophy, Flame } from "lucide-react";
import { Trade } from "@/hooks/useUserData";
import { computeDayOfWeekStats, DayOfWeekStat } from "@/lib/trade-analytics";

interface DayOfWeekHeatmapProps {
  trades: Trade[];
}

export default function DayOfWeekHeatmap({ trades }: DayOfWeekHeatmapProps) {
  const stats = useMemo(() => computeDayOfWeekStats(trades), [trades]);

  if (trades.length === 0) return null;

  const maxAbsPnl = Math.max(...stats.map((s) => Math.abs(s.pnl)), 1);

  // Find best and worst with trades
  const activeDays = stats.filter((s) => s.tradeCount > 0);
  const bestDay = activeDays.find((s) => s.isBest);
  const worstDay = activeDays.find((s) => s.isWorst);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="rounded-xl border border-brown-700/50 bg-gradient-to-br from-brown-800/60 to-brown-900/60 p-5"
    >
      <div className="flex items-center gap-2 mb-4">
        <CalendarDays className="w-4 h-4 text-gold-400" />
        <span className="text-sm font-medium text-brown-200">Day-of-Week Performance</span>
      </div>

      <div className="space-y-2">
        {stats.map((s, i) => {
          const barWidth = s.tradeCount > 0 ? Math.max(4, (Math.abs(s.pnl) / maxAbsPnl) * 100) : 0;
          const isPositive = s.pnl >= 0;

          return (
            <div key={s.day} className="flex items-center gap-3">
              <span className="w-8 text-xs font-medium text-brown-400 shrink-0">{s.day}</span>

              <div className="flex-1 relative h-6">
                {s.tradeCount > 0 && (
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${barWidth}%` }}
                    transition={{ duration: 0.6, delay: i * 0.05 }}
                    className={`absolute inset-y-0 rounded ${
                      isPositive ? "bg-emerald-500/30" : "bg-red-500/30"
                    }`}
                  />
                )}
                <div className="relative h-full flex items-center px-2 gap-2">
                  {s.tradeCount > 0 ? (
                    <>
                      <span
                        className={`text-xs font-semibold ${
                          isPositive ? "text-emerald-400" : "text-red-400"
                        }`}
                      >
                        {isPositive ? "+" : ""}${Math.abs(s.pnl).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                      </span>
                      <span className="text-[10px] text-brown-500">
                        {s.tradeCount}t &middot; {s.winRate}% WR
                      </span>
                      {s.isBest && <Trophy className="w-3 h-3 text-emerald-400 ml-auto" />}
                      {s.isWorst && <Flame className="w-3 h-3 text-red-400 ml-auto" />}
                    </>
                  ) : (
                    <span className="text-[10px] text-brown-600">No trades</span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Insight */}
      {bestDay && worstDay && bestDay.day !== worstDay.day && (
        <p className="mt-4 text-xs text-brown-500">
          Your best day is <span className="text-emerald-400 font-medium">{bestDay.day}</span> and
          worst is <span className="text-red-400 font-medium">{worstDay.day}</span>.
        </p>
      )}
    </motion.div>
  );
}
