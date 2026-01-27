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
import { Trade } from "@/hooks/useUserData";

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

export default function AccountSummaryChart({ trades, period }: AccountSummaryChartProps) {
  const chartData = useMemo(() => {
    if (!trades.length) {
      // Generate sample data when no trades exist
      return generateSampleData(period);
    }

    // Filter trades by period
    const now = new Date();
    let startDate: Date;

    switch (period) {
      case "1W":
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case "1M":
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case "3M":
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case "1Y":
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
      default: // ALL
        startDate = new Date(0);
    }

    // Filter and sort trades
    const filteredTrades = trades
      .filter((t) => new Date(t.trade_date) >= startDate)
      .sort((a, b) => new Date(a.trade_date).getTime() - new Date(b.trade_date).getTime());

    if (!filteredTrades.length) {
      return generateSampleData(period);
    }

    // Group by date and calculate cumulative P&L
    const dataMap = new Map<string, number>();
    let cumulative = 0;

    // Get all trades before the start date for initial cumulative value
    const priorTrades = trades.filter((t) => new Date(t.trade_date) < startDate);
    priorTrades.forEach((t) => {
      cumulative += t.pnl || 0;
    });

    filteredTrades.forEach((trade) => {
      const dateKey = new Date(trade.trade_date).toISOString().split("T")[0];
      cumulative += trade.pnl || 0;
      dataMap.set(dateKey, cumulative);
    });

    // Fill in gaps for smoother chart
    const result: ChartDataPoint[] = [];
    const sortedDates = Array.from(dataMap.keys()).sort();

    if (sortedDates.length === 0) {
      return generateSampleData(period);
    }

    // Generate data points for each day in the period
    let lastValue = 0;
    const days = Math.min(getDaysForPeriod(period), sortedDates.length > 0 ? 30 : 7);
    const startPoint = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

    for (let i = 0; i <= days; i++) {
      const date = new Date(startPoint.getTime() + i * 24 * 60 * 60 * 1000);
      const dateKey = date.toISOString().split("T")[0];
      const value = dataMap.get(dateKey);

      if (value !== undefined) {
        lastValue = value;
      }

      result.push({
        date: dateKey,
        displayDate: formatDate(date, period),
        pnl: value || 0,
        cumulativePnl: lastValue,
      });
    }

    return result;
  }, [trades, period]);

  const isPositive = chartData.length > 0 && chartData[chartData.length - 1].cumulativePnl >= 0;

  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
        <defs>
          <linearGradient id="colorPnlPositive" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#34D399" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#34D399" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="colorPnlNegative" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#FB7185" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#FB7185" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="colorPnlGold" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#D4AF37" stopOpacity={0.4} />
            <stop offset="95%" stopColor="#D4AF37" stopOpacity={0} />
          </linearGradient>
        </defs>
        <XAxis
          dataKey="displayDate"
          axisLine={false}
          tickLine={false}
          tick={{ fill: "#8B7355", fontSize: 10 }}
          interval="preserveStartEnd"
        />
        <YAxis
          axisLine={false}
          tickLine={false}
          tick={{ fill: "#8B7355", fontSize: 10 }}
          tickFormatter={(value) => `$${value >= 1000 ? `${(value / 1000).toFixed(0)}k` : value}`}
        />
        <Tooltip
          content={({ active, payload }) => {
            if (active && payload && payload.length) {
              const data = payload[0].payload as ChartDataPoint;
              return (
                <div className="bg-brown-800 border border-brown-700 rounded-lg p-3 shadow-xl">
                  <p className="text-xs text-brown-400 mb-1">{data.date}</p>
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
        <ReferenceLine y={0} stroke="#4A403A" strokeDasharray="3 3" />
        <Area
          type="monotone"
          dataKey="cumulativePnl"
          stroke={trades.length === 0 ? "#D4AF37" : isPositive ? "#34D399" : "#FB7185"}
          strokeWidth={2}
          fill={trades.length === 0 ? "url(#colorPnlGold)" : isPositive ? "url(#colorPnlPositive)" : "url(#colorPnlNegative)"}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

function getDaysForPeriod(period: string): number {
  switch (period) {
    case "1W":
      return 7;
    case "1M":
      return 30;
    case "3M":
      return 90;
    case "1Y":
      return 365;
    default:
      return 365;
  }
}

function formatDate(date: Date, period: string): string {
  const month = date.toLocaleDateString("en-US", { month: "short" });
  const day = date.getDate();

  if (period === "1W" || period === "1M") {
    return `${month} ${day}`;
  }
  if (period === "3M") {
    return month;
  }
  return month;
}

function generateSampleData(period: string): ChartDataPoint[] {
  const days = getDaysForPeriod(period);
  const now = new Date();
  const data: ChartDataPoint[] = [];

  // Generate realistic-looking sample data
  let cumulative = 0;
  const volatility = 100;
  const trend = 0.6; // Slight upward bias

  for (let i = 0; i <= Math.min(days, 30); i++) {
    const date = new Date(now.getTime() - (Math.min(days, 30) - i) * 24 * 60 * 60 * 1000);
    const change = (Math.random() - 0.5 + trend * 0.1) * volatility;
    cumulative += change;

    data.push({
      date: date.toISOString().split("T")[0],
      displayDate: formatDate(date, period),
      pnl: change,
      cumulativePnl: Math.round(cumulative * 100) / 100,
    });
  }

  return data;
}
