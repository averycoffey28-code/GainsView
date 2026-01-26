"use client";

import Link from "next/link";
import { TrendingUp, TrendingDown, ArrowRight, Clock } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Trade, Position } from "@/hooks/useUserData";
import { Skeleton } from "@/components/ui/skeleton";

interface RecentActivityProps {
  trades: Trade[];
  positions: Position[];
  isLoading?: boolean;
}

type ActivityItem = {
  id: string;
  type: "trade" | "position";
  symbol: string;
  description: string;
  pnl: number | null;
  date: Date;
};

function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

export default function RecentActivity({
  trades,
  positions,
  isLoading = false,
}: RecentActivityProps) {
  // Combine and sort activities
  const activities: ActivityItem[] = [
    ...trades.slice(0, 5).map((trade) => ({
      id: trade.id,
      type: "trade" as const,
      symbol: trade.symbol,
      description: `${trade.trade_type === "buy" ? "Bought" : "Sold"} ${trade.quantity} ${trade.asset_type}${trade.quantity > 1 ? "s" : ""}`,
      pnl: trade.pnl,
      date: new Date(trade.trade_date || trade.created_at),
    })),
    ...positions.slice(0, 5).map((pos) => ({
      id: pos.id,
      type: "position" as const,
      symbol: pos.symbol,
      description: `${pos.position_type === "long" ? "Long" : "Short"} ${pos.contract_type} @ $${pos.strike_price}`,
      pnl: pos.realized_pnl,
      date: new Date(pos.created_at),
    })),
  ]
    .sort((a, b) => b.date.getTime() - a.date.getTime())
    .slice(0, 3);

  if (isLoading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.3 }}
        className="bg-brown-800/50 rounded-xl border border-brown-700/50 mb-6"
      >
        <div className="p-4 border-b border-brown-700/50">
          <Skeleton className="h-5 w-32" />
        </div>
        <div className="divide-y divide-brown-700/50">
          {[1, 2, 3].map((i) => (
            <div key={i} className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Skeleton className="w-10 h-10 rounded-lg" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-3 w-32" />
                  </div>
                </div>
                <Skeleton className="h-4 w-12" />
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    );
  }

  if (activities.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.3 }}
        className="bg-brown-800/50 rounded-xl border border-brown-700/50 mb-6"
      >
        <div className="p-4 border-b border-brown-700/50">
          <h3 className="text-sm font-medium text-brown-200">Recent Activity</h3>
        </div>
        <div className="p-8 text-center">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.3 }}
          >
            <Clock className="w-10 h-10 text-brown-600 mx-auto mb-3" />
          </motion.div>
          <p className="text-brown-400 text-sm">No recent activity</p>
          <p className="text-brown-500 text-xs mt-1">
            Your trades and calculations will appear here
          </p>
        </div>
      </motion.div>
    );
  }

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08,
        delayChildren: 0.1,
      },
    },
  };

  const item = {
    hidden: { opacity: 0, x: -10 },
    show: { opacity: 1, x: 0 },
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4, duration: 0.3 }}
      whileHover={{ boxShadow: "0 8px 30px rgba(212, 184, 150, 0.06)" }}
      className="bg-brown-800/50 rounded-xl border border-brown-700/50 mb-6 transition-colors"
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-brown-700/50">
        <h3 className="text-sm font-medium text-brown-200">Recent Activity</h3>
        <Link
          href="/pnl"
          className="text-xs text-gold-400 hover:text-gold-300 flex items-center gap-1 group"
        >
          View all
          <ArrowRight className="w-3 h-3 transition-transform group-hover:translate-x-1" />
        </Link>
      </div>

      {/* Activity List */}
      <motion.div
        className="divide-y divide-brown-700/50"
        variants={container}
        initial="hidden"
        animate="show"
      >
        {activities.map((activity) => {
          const hasPnl = activity.pnl !== null && activity.pnl !== undefined;
          const isPositive = hasPnl && activity.pnl! >= 0;

          return (
            <motion.div
              key={activity.id}
              variants={item}
              whileHover={{ backgroundColor: "rgba(52, 45, 40, 0.3)" }}
              className="flex items-center justify-between p-4 transition-colors cursor-default"
            >
              <div className="flex items-center gap-3">
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  className={cn(
                    "w-10 h-10 rounded-lg flex items-center justify-center font-bold text-sm",
                    activity.type === "trade"
                      ? "bg-gold-400/10 text-gold-400"
                      : "bg-blue-400/10 text-blue-400"
                  )}
                >
                  {activity.symbol.slice(0, 3)}
                </motion.div>
                <div>
                  <p className="text-sm font-medium text-brown-100">
                    {activity.symbol}
                  </p>
                  <p className="text-xs text-brown-400">{activity.description}</p>
                </div>
              </div>

              <div className="text-right">
                {hasPnl ? (
                  <motion.div
                    className="flex items-center gap-1"
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.3 }}
                  >
                    {isPositive ? (
                      <TrendingUp className="w-3 h-3 text-emerald-400" />
                    ) : (
                      <TrendingDown className="w-3 h-3 text-red-400" />
                    )}
                    <span
                      className={cn(
                        "text-sm font-medium",
                        isPositive ? "text-emerald-400" : "text-red-400"
                      )}
                    >
                      {isPositive ? "+" : ""}${Math.abs(activity.pnl!).toFixed(0)}
                    </span>
                  </motion.div>
                ) : (
                  <span className="text-xs text-brown-500">
                    {formatTimeAgo(activity.date)}
                  </span>
                )}
              </div>
            </motion.div>
          );
        })}
      </motion.div>
    </motion.div>
  );
}
