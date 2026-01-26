"use client";

import { useMemo } from "react";
import { TrendingUp, TrendingDown, Clock, RefreshCw } from "lucide-react";
import { motion } from "framer-motion";
import useSWR from "swr";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { AnimatedNumber, AnimatedPercentage } from "@/components/ui/animated-number";
import { fetcher } from "@/lib/swr-config";
import { StockQuote } from "@/lib/types";

interface MarketQuote extends StockQuote {
  sparkline: number[];
}

function getMarketStatus(): { status: string; color: string } {
  const now = new Date();
  const nyTime = new Date(
    now.toLocaleString("en-US", { timeZone: "America/New_York" })
  );
  const day = nyTime.getDay();
  const hours = nyTime.getHours();
  const minutes = nyTime.getMinutes();
  const time = hours * 60 + minutes;

  // Weekend
  if (day === 0 || day === 6) {
    return { status: "Closed", color: "text-brown-400" };
  }

  // Pre-market: 4:00 AM - 9:30 AM ET
  if (time >= 240 && time < 570) {
    return { status: "Pre-Market", color: "text-amber-400" };
  }

  // Market hours: 9:30 AM - 4:00 PM ET
  if (time >= 570 && time < 960) {
    return { status: "Market Open", color: "text-emerald-400" };
  }

  // After-hours: 4:00 PM - 8:00 PM ET
  if (time >= 960 && time < 1200) {
    return { status: "After Hours", color: "text-blue-400" };
  }

  return { status: "Closed", color: "text-brown-400" };
}

function MiniSparkline({ data, isPositive }: { data: number[]; isPositive: boolean }) {
  if (!data || data.length < 2) return null;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const height = 24;
  const width = 60;

  const points = data
    .map((value, index) => {
      const x = (index / (data.length - 1)) * width;
      const y = height - ((value - min) / range) * height;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <svg width={width} height={height} className="overflow-visible" aria-hidden="true">
      <motion.polyline
        points={points}
        fill="none"
        stroke={isPositive ? "#34d399" : "#f87171"}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      />
    </svg>
  );
}

// Custom fetcher for market indices with parallel requests
async function fetchIndices() {
  const symbols = ["SPY", "QQQ", "VIX"];
  const results = await Promise.all(
    symbols.map(async (symbol) => {
      try {
        const res = await fetch(`/api/stock?symbol=${symbol}`);
        if (res.ok) {
          const data = await res.json();
          if (data.quote) {
            // Generate sparkline data
            const basePrice = data.quote.price;
            const sparkline = Array.from({ length: 12 }, (_, i) => {
              const variance = (Math.random() - 0.5) * 2;
              const trend = data.quote.change >= 0 ? i * 0.1 : -i * 0.1;
              return basePrice + variance + trend;
            });
            return { ...data.quote, sparkline };
          }
        }
      } catch {
        return null;
      }
      return null;
    })
  );
  return results.filter(Boolean) as MarketQuote[];
}

export default function MarketOverview() {
  const marketStatus = getMarketStatus();

  // Use SWR for automatic caching and revalidation
  const { data: quotes, isLoading, isValidating, mutate } = useSWR<MarketQuote[]>(
    "market-indices",
    fetchIndices,
    {
      refreshInterval: 30000, // Refresh every 30 seconds
      revalidateOnFocus: false,
      dedupingInterval: 10000,
    }
  );

  const lastUpdated = useMemo(() => {
    if (quotes && quotes.length > 0) {
      return new Date();
    }
    return null;
  }, [quotes]);

  if (isLoading && !quotes) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.3 }}
        className="bg-brown-800/50 rounded-xl p-4 border border-brown-700/50 mb-6"
      >
        <div className="flex items-center justify-between mb-4">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-4 w-24" />
        </div>
        <div className="grid grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-4 w-12" />
              <Skeleton className="h-6 w-20" />
              <Skeleton className="h-3 w-16" />
            </div>
          ))}
        </div>
      </motion.div>
    );
  }

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.1,
      },
    },
  };

  const item = {
    hidden: { opacity: 0, y: 10 },
    show: { opacity: 1, y: 0 },
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2, duration: 0.3 }}
      whileHover={{ boxShadow: "0 8px 30px rgba(212, 184, 150, 0.06)" }}
      className="bg-brown-800/50 rounded-xl p-4 border border-brown-700/50 mb-6 transition-colors"
      role="region"
      aria-label="Market Overview"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-brown-200">Market Overview</h3>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <motion.span
              className={cn(
                "w-2 h-2 rounded-full",
                marketStatus.status === "Market Open" && "bg-emerald-400",
                marketStatus.status === "Pre-Market" && "bg-amber-400",
                marketStatus.status === "After Hours" && "bg-blue-400",
                marketStatus.status === "Closed" && "bg-brown-500"
              )}
              animate={
                marketStatus.status === "Market Open"
                  ? { scale: [1, 1.2, 1], opacity: [1, 0.7, 1] }
                  : {}
              }
              transition={{ duration: 2, repeat: Infinity }}
              aria-hidden="true"
            />
            <span className={cn("text-xs font-medium", marketStatus.color)}>
              {marketStatus.status}
            </span>
          </div>
          <motion.button
            onClick={() => mutate()}
            disabled={isValidating}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className="p-1 text-brown-400 hover:text-brown-200 transition-colors disabled:opacity-50"
            aria-label="Refresh market data"
          >
            <RefreshCw className={cn("w-3.5 h-3.5", isValidating && "animate-spin")} />
          </motion.button>
        </div>
      </div>

      {/* Quotes Grid */}
      <motion.div
        className="grid grid-cols-3 gap-4"
        variants={container}
        initial="hidden"
        animate="show"
      >
        {(quotes || []).map((quote) => {
          const isPositive = quote.change >= 0;
          return (
            <motion.div
              key={quote.symbol}
              variants={item}
              whileHover={{ scale: 1.02 }}
              className="flex flex-col cursor-default"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium text-brown-400">
                  {quote.symbol}
                </span>
                <MiniSparkline data={quote.sparkline} isPositive={isPositive} />
              </div>
              <span className="text-lg font-bold text-brown-50">
                $<AnimatedNumber value={quote.price} formatOptions={{ minimumFractionDigits: 2, maximumFractionDigits: 2 }} />
              </span>
              <div className="flex items-center gap-1">
                {isPositive ? (
                  <TrendingUp className="w-3 h-3 text-emerald-400" aria-hidden="true" />
                ) : (
                  <TrendingDown className="w-3 h-3 text-red-400" aria-hidden="true" />
                )}
                <AnimatedPercentage
                  value={quote.changePercent}
                  className="text-xs font-medium"
                />
              </div>
            </motion.div>
          );
        })}
      </motion.div>

      {/* Last Updated - shows stale indicator when revalidating */}
      {lastUpdated && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="flex items-center gap-1 mt-3 pt-3 border-t border-brown-700/50"
        >
          <Clock className="w-3 h-3 text-brown-500" aria-hidden="true" />
          <span className="text-xs text-brown-500">
            Updated {lastUpdated.toLocaleTimeString()}
            {isValidating && " • Refreshing..."}
          </span>
        </motion.div>
      )}
    </motion.div>
  );
}
