"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { Flame, Snowflake, Trophy } from "lucide-react";
import { Trade } from "@/hooks/useUserData";
import { computeStreakData } from "@/lib/trade-analytics";

interface StreakBannerProps {
  trades: Trade[];
}

const MILESTONES = [3, 5, 7, 10];

export default function StreakBanner({ trades }: StreakBannerProps) {
  const streak = useMemo(() => computeStreakData(trades), [trades]);

  if (streak.streakType === "none" || streak.currentStreak === 0) return null;

  const isWin = streak.streakType === "win";

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className={`relative overflow-hidden rounded-xl border p-4 ${
        isWin
          ? "border-emerald-500/30 bg-gradient-to-r from-emerald-500/10 to-emerald-600/5"
          : "border-red-500/30 bg-gradient-to-r from-red-500/10 to-red-600/5"
      }`}
    >
      <div className="flex items-center justify-between">
        {/* Left: streak info */}
        <div className="flex items-center gap-3">
          <motion.div
            className={`p-2 rounded-lg ${isWin ? "bg-emerald-500/20" : "bg-red-500/20"}`}
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            {isWin ? (
              <Flame className="w-5 h-5 text-emerald-400" />
            ) : (
              <Snowflake className="w-5 h-5 text-red-400" />
            )}
          </motion.div>
          <div>
            <div className="flex items-center gap-2">
              <span className={`text-lg font-bold ${isWin ? "text-emerald-400" : "text-red-400"}`}>
                {streak.currentStreak}-Day {isWin ? "Win" : "Loss"} Streak
              </span>
            </div>
            <p className="text-xs text-brown-400">
              Best win streak: {streak.bestWinStreak} day{streak.bestWinStreak !== 1 ? "s" : ""}
            </p>
          </div>
        </div>

        {/* Right: milestone badges */}
        <div className="flex items-center gap-1.5">
          {MILESTONES.map((m) => (
            <div
              key={m}
              className={`flex items-center justify-center w-7 h-7 rounded-full text-[10px] font-bold transition-all ${
                streak.currentStreak >= m
                  ? isWin
                    ? "bg-emerald-500/30 text-emerald-300 ring-1 ring-emerald-500/50"
                    : "bg-red-500/30 text-red-300 ring-1 ring-red-500/50"
                  : "bg-brown-800/40 text-brown-600"
              }`}
            >
              {m}
            </div>
          ))}
          {streak.currentStreak >= 10 && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="ml-1"
            >
              <Trophy className={`w-5 h-5 ${isWin ? "text-emerald-400" : "text-red-400"}`} />
            </motion.div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
