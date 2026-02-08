"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Medal, ChevronDown, ChevronUp } from "lucide-react";
import { Trade } from "@/hooks/useUserData";
import { computeTickerLeaderboard, TickerStat } from "@/lib/trade-analytics";

interface TickerLeaderboardProps {
  trades: Trade[];
}

type SortKey = "pnl" | "tradeCount" | "winRate";

const SORT_LABELS: Record<SortKey, string> = {
  pnl: "P&L",
  tradeCount: "# Trades",
  winRate: "Win %",
};

const PODIUM_COLORS = [
  "text-yellow-400 bg-yellow-500/15 border-yellow-500/30", // 1st
  "text-gray-300 bg-gray-500/15 border-gray-500/30",        // 2nd
  "text-amber-600 bg-amber-700/15 border-amber-600/30",     // 3rd
];

export default function TickerLeaderboard({ trades }: TickerLeaderboardProps) {
  const [sortKey, setSortKey] = useState<SortKey>("pnl");
  const [showAll, setShowAll] = useState(false);

  const allTickers = useMemo(() => computeTickerLeaderboard(trades), [trades]);

  const sorted = useMemo(() => {
    let copy = [...allTickers];
    switch (sortKey) {
      case "pnl":
        return copy.sort((a, b) => b.pnl - a.pnl);
      case "tradeCount":
        return copy.sort((a, b) => b.tradeCount - a.tradeCount);
      case "winRate":
        // Filter to only tickers with 3+ trades for meaningful win rate
        copy = copy.filter((t) => t.tradeCount >= 3);
        return copy.sort((a, b) => {
          if (b.winRate === a.winRate) {
            // Tiebreaker: more trades ranked higher
            return b.tradeCount - a.tradeCount;
          }
          return b.winRate - a.winRate;
        });
    }
  }, [allTickers, sortKey]);

  if (trades.length === 0) return null;

  const top3 = sorted.slice(0, 3);
  const visibleList = sorted.slice(3, 5); // #4 and #5
  const remaining = sorted.slice(5);       // #6+

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="rounded-xl border border-brown-700/50 bg-gradient-to-br from-brown-800/60 to-brown-900/60 p-5"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Medal className="w-4 h-4 text-gold-400" />
          <span className="text-sm font-medium text-brown-200">Ticker Leaderboard</span>
        </div>

        <div className="flex gap-1 p-0.5 bg-brown-800/50 rounded-lg">
          {(Object.keys(SORT_LABELS) as SortKey[]).map((k) => (
            <button
              key={k}
              onClick={() => setSortKey(k)}
              className={`px-2 py-1 text-[10px] font-medium rounded-md transition-all flex items-center gap-1 ${
                sortKey === k ? "bg-gold-500 text-brown-900" : "text-brown-400 hover:text-brown-200"
              }`}
            >
              {SORT_LABELS[k]}
            </button>
          ))}
        </div>
      </div>
      {sortKey === "winRate" && (
        <p className="text-xs text-brown-500 mb-4">Minimum 3 trades per ticker</p>
      )}
      {sortKey !== "winRate" && <div className="mb-2" />}

      {/* Podium - show if we have at least 1 ticker */}
      {top3.length > 0 && (
        <div className={`grid gap-2 mb-4 ${
          top3.length === 1 ? "grid-cols-1 max-w-[200px] mx-auto" :
          top3.length === 2 ? "grid-cols-2 max-w-[400px] mx-auto" :
          "grid-cols-3"
        }`}>
          {top3.map((t, i) => (
            <div
              key={t.symbol}
              className={`text-center p-3 rounded-lg border ${PODIUM_COLORS[i]}`}
            >
              <span className="text-lg font-bold">#{i + 1}</span>
              <p className="text-sm font-semibold mt-1 truncate">{t.symbol}</p>
              <p
                className={`text-xs font-medium mt-0.5 ${
                  t.pnl >= 0 ? "text-emerald-400" : "text-red-400"
                }`}
              >
                {t.pnl >= 0 ? "+" : ""}${Math.abs(t.pnl).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
              </p>
              <p className="text-[10px] text-brown-500 mt-0.5">
                {t.tradeCount}t &middot; {t.winRate}%
              </p>
            </div>
          ))}
        </div>
      )}
      {/* No tickers message when filtered */}
      {sorted.length === 0 && sortKey === "winRate" && (
        <p className="text-center text-sm text-brown-500 py-4">
          No tickers with 3+ trades yet
        </p>
      )}

      {/* #4 and #5 — always visible */}
      {visibleList.length > 0 && (
        <div className="space-y-1">
          {visibleList.map((t, i) => (
            <div
              key={t.symbol}
              className="flex items-center justify-between py-1.5 px-2 rounded-lg hover:bg-brown-800/30 transition-colors"
            >
              <div className="flex items-center gap-2">
                <span className="text-xs text-brown-500 w-5 text-right">#{i + 4}</span>
                <span className="text-sm font-medium text-brown-200">{t.symbol}</span>
              </div>
              <div className="flex items-center gap-3">
                <span
                  className={`text-xs font-semibold ${
                    t.pnl >= 0 ? "text-emerald-400" : "text-red-400"
                  }`}
                >
                  {t.pnl >= 0 ? "+" : ""}${Math.abs(t.pnl).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                </span>
                <span className="text-[10px] text-brown-500 w-12 text-right">
                  {t.tradeCount}t
                </span>
                <span className="text-[10px] text-brown-500 w-10 text-right">
                  {t.winRate}%
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Expandable remaining tickers */}
      {remaining.length > 0 && (
        <>
          {showAll && (
            <div className="space-y-1 mt-1">
              {remaining.map((t, i) => (
                <div
                  key={t.symbol}
                  className="flex items-center justify-between py-1.5 px-2 rounded-lg hover:bg-brown-800/30 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-brown-500 w-5 text-right">#{i + 6}</span>
                    <span className="text-sm font-medium text-brown-200">{t.symbol}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span
                      className={`text-xs font-semibold ${
                        t.pnl >= 0 ? "text-emerald-400" : "text-red-400"
                      }`}
                    >
                      {t.pnl >= 0 ? "+" : ""}${Math.abs(t.pnl).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                    </span>
                    <span className="text-[10px] text-brown-500 w-12 text-right">
                      {t.tradeCount}t
                    </span>
                    <span className="text-[10px] text-brown-500 w-10 text-right">
                      {t.winRate}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          <button
            onClick={() => setShowAll(!showAll)}
            className="w-full mt-4 py-2.5 flex items-center justify-center gap-2 text-sm font-medium text-[#D4AF37] border border-[#D4AF37]/30 rounded-xl hover:bg-[#D4AF37]/10 transition"
          >
            {showAll ? (
              <>
                <ChevronUp className="w-4 h-4" />
                Show Less
              </>
            ) : (
              <>
                <ChevronDown className="w-4 h-4" />
                Show All ({remaining.length} more)
              </>
            )}
          </button>
        </>
      )}
    </motion.div>
  );
}
