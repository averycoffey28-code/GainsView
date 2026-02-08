"use client";

import { useMemo } from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
} from "recharts";
import { TrendingUp } from "lucide-react";
import { Trade } from "@/hooks/useUserData";
import { useTheme } from "@/contexts/ThemeContext";
import { parseLocalDate, toLocalDateStr } from "@/lib/trade-analytics";

interface AccountSummaryChartProps {
  trades: Trade[];
  period: string;
}

interface ChartDataPoint {
  date: string;
  displayDate: string;
  pnl: number;
  cumulativePnl: number;
}

// Alias for backward compat within this file
const toDateKey = toLocalDateStr;

// Format display label based on period
function formatDate(date: Date, period: string): string {
  const month = date.toLocaleDateString("en-US", { month: "short" });
  const day = date.getDate();
  const year = date.getFullYear().toString().slice(-2);

  switch (period) {
    case "1W":
    case "1M":
    case "3M":
      return `${month} ${day}`;
    case "1Y":
    default: // ALL
      return `${month} '${year}`;
  }
}

export default function AccountSummaryChart({ trades, period }: AccountSummaryChartProps) {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const chartData = useMemo((): ChartDataPoint[] | null => {
    if (!trades.length) return null;

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // Sort all trades by date
    const sortedTrades = [...trades].sort(
      (a, b) => parseLocalDate(a.trade_date).getTime() - parseLocalDate(b.trade_date).getTime()
    );

    // Determine start date for the selected period
    let startDate: Date;
    switch (period) {
      case "1W":
        startDate = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 7);
        break;
      case "1M":
        startDate = new Date(today.getFullYear(), today.getMonth() - 1, today.getDate());
        break;
      case "3M":
        startDate = new Date(today.getFullYear(), today.getMonth() - 3, today.getDate());
        break;
      case "1Y":
        startDate = new Date(today.getFullYear() - 1, today.getMonth(), today.getDate());
        break;
      default: // ALL - start from first trade
        startDate = parseLocalDate(sortedTrades[0].trade_date);
        break;
    }

    // Cumulative P&L from trades before the start date
    let priorCumulative = 0;
    for (const t of sortedTrades) {
      if (parseLocalDate(t.trade_date) < startDate) {
        priorCumulative += t.pnl || 0;
      }
    }

    // Build daily P&L map for trades within range
    const dailyPnl = new Map<string, number>();
    for (const t of sortedTrades) {
      const td = parseLocalDate(t.trade_date);
      if (td >= startDate) {
        const key = toDateKey(td);
        dailyPnl.set(key, (dailyPnl.get(key) || 0) + (t.pnl || 0));
      }
    }

    if (dailyPnl.size === 0) return null;

    // Generate evenly-spaced data points across the full range
    const totalDays = Math.max(1, Math.ceil((today.getTime() - startDate.getTime()) / 86400000));
    const maxPoints = 50;
    const step = Math.max(1, Math.floor(totalDays / maxPoints));

    const result: ChartDataPoint[] = [];
    let cumulative = priorCumulative;

    // Walk day-by-day, accumulating P&L, emitting points at step intervals
    for (let i = 0; i <= totalDays; i++) {
      const date = new Date(startDate.getTime() + i * 86400000);
      const key = toDateKey(date);

      if (dailyPnl.has(key)) {
        cumulative += dailyPnl.get(key)!;
        dailyPnl.delete(key); // prevent double-counting
      }

      if (i % step === 0 || i === totalDays) {
        result.push({
          date: key,
          displayDate: formatDate(date, period),
          pnl: 0,
          cumulativePnl: Math.round(cumulative * 100) / 100,
        });
      }
    }

    return result;
  }, [trades, period]);

  // Empty state — no trade data
  if (!chartData) {
    return (
      <div className="relative w-full h-full flex flex-col items-center justify-center">
        {/* Faded zero line */}
        <div className="absolute left-0 right-0 top-1/2 border-t border-dashed border-brown-700/40" />
        <div className="relative z-10 text-center">
          <div className={`w-12 h-12 mx-auto mb-2 rounded-full flex items-center justify-center ${isDark ? "bg-brown-800/60" : "bg-gray-100"}`}>
            <TrendingUp className={`w-6 h-6 ${isDark ? "text-brown-500" : "text-gray-400"}`} />
          </div>
          <p className={`text-sm font-medium ${isDark ? "text-brown-400" : "text-gray-500"}`}>No Data Yet</p>
          <p className={`text-xs mt-0.5 ${isDark ? "text-brown-600" : "text-gray-400"}`}>
            Log trades to see your performance
          </p>
        </div>
      </div>
    );
  }

  // Show ~5-6 evenly spaced X-axis labels regardless of data point count
  const tickInterval = Math.max(0, Math.floor(chartData.length / 6) - 1);
  const isPositive = chartData.length > 0 && chartData[chartData.length - 1].cumulativePnl >= 0;

  const tickColor = isDark ? "#8B7355" : "#8B7E70";
  const refLineColor = isDark ? "#4A403A" : "#D4CCC0";
  const tooltipBg = isDark ? "bg-brown-800/95" : "bg-white/95";
  const tooltipBorder = isDark ? "border-brown-700" : "border-gray-200";
  const tooltipLabel = isDark ? "text-brown-400" : "text-gray-500";
  const cursorColor = isDark ? "#64748b" : "#B8AEA0";
  const dotStroke = isDark ? "#1A1410" : "#FFFFFF";

  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }} style={{ userSelect: "none", cursor: "crosshair" }}>
        <defs>
          <linearGradient id="colorPnlPositive" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={isDark ? "#34D399" : "#16A34A"} stopOpacity={0.3} />
            <stop offset="95%" stopColor={isDark ? "#34D399" : "#16A34A"} stopOpacity={0} />
          </linearGradient>
          <linearGradient id="colorPnlNegative" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={isDark ? "#FB7185" : "#DC2626"} stopOpacity={0.3} />
            <stop offset="95%" stopColor={isDark ? "#FB7185" : "#DC2626"} stopOpacity={0} />
          </linearGradient>
        </defs>
        <XAxis
          dataKey="date"
          axisLine={false}
          tickLine={false}
          tick={{ fill: tickColor, fontSize: 10 }}
          interval={tickInterval}
          tickFormatter={(dateStr) => {
            const d = parseLocalDate(String(dateStr));
            const month = d.toLocaleDateString("en-US", { month: "short" });
            const day = d.getDate();
            const yr = d.getFullYear().toString().slice(-2);
            if (period === "1W" || period === "1M" || period === "3M") return `${month} ${day}`;
            return `${month} '${yr}`;
          }}
        />
        <YAxis
          axisLine={false}
          tickLine={false}
          tick={{ fill: tickColor, fontSize: 10 }}
          tickFormatter={(value) => `$${value >= 1000 ? `${(value / 1000).toFixed(0)}k` : value}`}
        />
        <Tooltip
          cursor={{ stroke: cursorColor, strokeWidth: 1 }}
          isAnimationActive={false}
          content={({ active, payload }) => {
            if (active && payload && payload.length) {
              const data = payload[0].payload as ChartDataPoint;
              return (
                <div className={`${tooltipBg} backdrop-blur border ${tooltipBorder} rounded-lg p-3 shadow-xl`}>
                  <p className={`text-xs ${tooltipLabel} mb-1`}>{data.date}</p>
                  <p
                    className={`text-sm font-semibold ${
                      data.cumulativePnl >= 0 ? "text-emerald-400" : "text-rose-400"
                    }`}
                  >
                    {data.cumulativePnl >= 0 ? "+" : ""}$
                    {Math.abs(data.cumulativePnl).toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </p>
                </div>
              );
            }
            return null;
          }}
        />
        <ReferenceLine y={0} stroke={refLineColor} strokeDasharray="3 3" />
        <Area
          type="monotone"
          dataKey="cumulativePnl"
          stroke={isPositive ? (isDark ? "#34D399" : "#16A34A") : (isDark ? "#FB7185" : "#DC2626")}
          strokeWidth={2}
          fill={isPositive ? "url(#colorPnlPositive)" : "url(#colorPnlNegative)"}
          dot={false}
          activeDot={{ r: 5, fill: isPositive ? (isDark ? "#34D399" : "#16A34A") : (isDark ? "#FB7185" : "#DC2626"), stroke: dotStroke, strokeWidth: 2 }}
          isAnimationActive={false}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
