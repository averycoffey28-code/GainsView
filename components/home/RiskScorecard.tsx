"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { ShieldCheck } from "lucide-react";
import { Trade } from "@/hooks/useUserData";
import { computeRiskScorecard, RiskScorecardData } from "@/lib/trade-analytics";

interface RiskScorecardProps {
  trades: Trade[];
}

const GRADE_COLORS: Record<string, string> = {
  "A+": "text-emerald-400 ring-emerald-500/50",
  A: "text-emerald-400 ring-emerald-500/50",
  "A-": "text-emerald-400 ring-emerald-500/50",
  "B+": "text-blue-400 ring-blue-500/50",
  B: "text-blue-400 ring-blue-500/50",
  "B-": "text-blue-400 ring-blue-500/50",
  "C+": "text-yellow-400 ring-yellow-500/50",
  C: "text-yellow-400 ring-yellow-500/50",
  "C-": "text-yellow-400 ring-yellow-500/50",
  "D+": "text-orange-400 ring-orange-500/50",
  D: "text-orange-400 ring-orange-500/50",
  "D-": "text-orange-400 ring-orange-500/50",
  F: "text-rose-400 ring-rose-500/50",
};

function ProgressBar({ label, value, max, suffix }: { label: string; value: number; max: number; suffix?: string }) {
  const pct = max > 0 ? (value / max) * 100 : 0;
  const color =
    pct >= 80 ? "bg-emerald-500" : pct >= 60 ? "bg-green-500" : pct >= 40 ? "bg-yellow-500" : pct >= 20 ? "bg-orange-500" : "bg-red-500";

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="text-brown-400">{label}{suffix && <span className="text-brown-500 ml-1">({suffix})</span>}</span>
        <span className="text-brown-300 font-medium">{value}/{max}</span>
      </div>
      <div className="h-1.5 bg-brown-800 rounded-full overflow-hidden">
        <motion.div
          className={`h-full rounded-full ${color}`}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        />
      </div>
    </div>
  );
}

export default function RiskScorecard({ trades }: RiskScorecardProps) {
  const [period, setPeriod] = useState<"week" | "month">("month");

  const data: RiskScorecardData | null = useMemo(
    () => computeRiskScorecard(trades, period),
    [trades, period]
  );

  if (!data) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="rounded-xl border border-brown-700/50 bg-gradient-to-br from-brown-800/60 to-brown-900/60 p-5"
      >
        <div className="flex items-center gap-2 mb-3">
          <ShieldCheck className="w-4 h-4 text-brown-500" />
          <span className="text-sm font-medium text-brown-400">Risk Scorecard</span>
        </div>
        <p className="text-xs text-brown-500">
          Log at least 3 trades in the selected period to see your risk score.
        </p>
      </motion.div>
    );
  }

  // Use exact grade match, fallback to base letter (A, B, C, D, F), then default
  const gradeStyle = GRADE_COLORS[data.grade] || GRADE_COLORS[data.grade.charAt(0)] || "text-brown-300 ring-brown-500/50";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="rounded-xl border border-brown-700/50 bg-gradient-to-br from-brown-800/60 to-brown-900/60 p-5"
    >
      {/* Header with toggle */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-gold-400" />
          <span className="text-sm font-medium text-brown-200">Risk Scorecard</span>
        </div>
        <div className="flex gap-1 p-0.5 bg-brown-800/50 rounded-lg">
          {(["week", "month"] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-all ${
                period === p ? "bg-gold-500 text-brown-900" : "text-brown-400 hover:text-brown-200"
              }`}
            >
              {p === "week" ? "Weekly" : "Monthly"}
            </button>
          ))}
        </div>
      </div>

      {/* Grade circle + Score */}
      <div className="flex items-center gap-5 mb-5">
        <div
          className={`flex items-center justify-center w-16 h-16 rounded-full ring-2 ${gradeStyle} bg-brown-800/50`}
        >
          <span className={`text-2xl font-black ${gradeStyle.split(" ")[0]}`}>{data.grade}</span>
        </div>
        <div>
          <p className="text-2xl font-bold text-brown-100">{data.totalScore}<span className="text-sm text-brown-500">/100</span></p>
          <p className="text-xs text-brown-400">Overall Risk Score</p>
        </div>
      </div>

      {/* Breakdown */}
      <div className="space-y-3">
        <ProgressBar label="Win Rate" value={data.breakdown.winRate} max={25} />
        <ProgressBar label="Risk / Reward" value={data.breakdown.riskReward} max={25} />
        <ProgressBar label="Position Sizing" value={data.breakdown.positionSizing} max={25} />
        <ProgressBar
          label="Max Drawdown"
          value={data.breakdown.maxDrawdown}
          max={25}
          suffix={data.maxDrawdownValue > 0 ? `$${Math.round(data.maxDrawdownValue)}` : undefined}
        />
      </div>
    </motion.div>
  );
}
