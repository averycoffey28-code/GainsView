"use client";

import { TrendingUp, TrendingDown, Briefcase, Bell } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { AnimatedCurrency, AnimatedNumber } from "@/components/ui/animated-number";
import { Skeleton } from "@/components/ui/skeleton";

interface QuickStatsProps {
  todayPnL: number;
  openPositions: number;
  watchlistAlerts: number;
  isLoading?: boolean;
}

export default function QuickStats({
  todayPnL,
  openPositions,
  watchlistAlerts,
  isLoading = false,
}: QuickStatsProps) {
  const isPositive = todayPnL >= 0;

  if (isLoading) {
    return (
      <div className="grid grid-cols-3 gap-3 mb-6">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="bg-brown-800/50 rounded-xl p-4 border border-brown-700/50"
          >
            <Skeleton className="h-4 w-20 mb-2" />
            <Skeleton className="h-6 w-16" />
          </div>
        ))}
      </div>
    );
  }

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.3, ease: [0.25, 0.1, 0.25, 1] as const } },
  };

  return (
    <motion.div
      className="grid grid-cols-3 gap-3 mb-6"
      variants={container}
      initial="hidden"
      animate="show"
    >
      {/* Today's P&L */}
      <motion.div
        variants={item}
        whileHover={{ y: -2, boxShadow: "0 8px 30px rgba(212, 184, 150, 0.08)" }}
        transition={{ duration: 0.2 }}
        className={cn(
          "rounded-xl p-4 border transition-colors cursor-default",
          isPositive
            ? "bg-emerald-500/10 border-emerald-500/20"
            : "bg-red-500/10 border-red-500/20"
        )}
      >
        <div className="flex items-center gap-2 mb-1">
          {isPositive ? (
            <TrendingUp className="w-4 h-4 text-emerald-400" />
          ) : (
            <TrendingDown className="w-4 h-4 text-red-400" />
          )}
          <span className="text-xs text-brown-400 uppercase tracking-wide">
            Today&apos;s P&L
          </span>
        </div>
        <AnimatedCurrency
          value={todayPnL}
          className="text-xl font-bold"
        />
      </motion.div>

      {/* Open Positions */}
      <motion.div
        variants={item}
        whileHover={{ y: -2, boxShadow: "0 8px 30px rgba(212, 184, 150, 0.08)" }}
        transition={{ duration: 0.2 }}
        className="bg-brown-800/50 rounded-xl p-4 border border-brown-700/50 cursor-default"
      >
        <div className="flex items-center gap-2 mb-1">
          <Briefcase className="w-4 h-4 text-gold-400" />
          <span className="text-xs text-brown-400 uppercase tracking-wide">
            Open
          </span>
        </div>
        <AnimatedNumber
          value={openPositions}
          className="text-xl font-bold text-brown-50"
        />
      </motion.div>

      {/* Watchlist Alerts */}
      <motion.div
        variants={item}
        whileHover={{ y: -2, boxShadow: "0 8px 30px rgba(212, 184, 150, 0.08)" }}
        transition={{ duration: 0.2 }}
        className="bg-brown-800/50 rounded-xl p-4 border border-brown-700/50 cursor-default"
      >
        <div className="flex items-center gap-2 mb-1">
          <Bell className="w-4 h-4 text-blue-400" />
          <span className="text-xs text-brown-400 uppercase tracking-wide">
            Watching
          </span>
        </div>
        <AnimatedNumber
          value={watchlistAlerts}
          className="text-xl font-bold text-brown-50"
        />
      </motion.div>
    </motion.div>
  );
}
