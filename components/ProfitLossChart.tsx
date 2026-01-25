"use client";

import { useMemo, useCallback } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BarChart3 } from "lucide-react";
import { ContractType, Position } from "@/lib/calculations";

interface ProfitLossChartProps {
  data: { price: number; pnl: number }[];
  breakEven: number;
  strikePrice: number;
  currentPrice: number;
  targetPrice: number;
  contractType: ContractType;
  position: Position;
}

interface TooltipPayload {
  value: number;
  dataKey: string;
  payload: { price: number; pnl: number };
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: TooltipPayload[];
  label?: number;
}

function CustomTooltip({ active, payload }: CustomTooltipProps) {
  if (active && payload && payload.length) {
    const pnl = payload[0].value;
    const price = payload[0].payload.price;
    return (
      <div className="bg-brown-900/95 border border-brown-600 rounded-lg p-3 shadow-2xl backdrop-blur-sm">
        <p className="text-brown-400 text-sm">
          Stock Price: <span className="text-brown-50 font-mono font-semibold">${price.toFixed(2)}</span>
        </p>
        <p className="text-brown-400 text-sm mt-1">
          P&L:{" "}
          <span
            className={`font-mono font-bold text-lg ${
              pnl >= 0 ? "text-emerald-400" : "text-rose-400"
            }`}
          >
            {pnl >= 0 ? "+" : ""}${pnl.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </p>
      </div>
    );
  }
  return null;
}

export default function ProfitLossChart({
  data,
  breakEven,
  strikePrice,
  currentPrice,
  targetPrice,
  contractType,
  position,
}: ProfitLossChartProps) {
  // Memoize gradient offset calculation
  const gradientOffset = useMemo(() => {
    if (!data || data.length === 0) return 0.5;

    const dataMax = Math.max(...data.map((d) => d.pnl));
    const dataMin = Math.min(...data.map((d) => d.pnl));

    if (dataMax <= 0) return 0;
    if (dataMin >= 0) return 1;

    return dataMax / (dataMax - dataMin);
  }, [data]);

  // Memoize axis tick formatter
  const formatAxisTick = useCallback((value: number) => `$${value}`, []);

  // Memoize reference lines to prevent re-renders
  const referenceLines = useMemo(() => ({
    breakEven: Number(breakEven.toFixed(2)),
    strikePrice: Number(strikePrice.toFixed(2)),
    currentPrice: Number(currentPrice.toFixed(2)),
    targetPrice: Number(targetPrice.toFixed(2)),
  }), [breakEven, strikePrice, currentPrice, targetPrice]);

  return (
    <Card className="bg-brown-800/50 border-brown-700 backdrop-blur-xl">
      <CardHeader className="pb-2">
        <CardTitle className="text-brown-50 flex items-center justify-between">
          <span className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-gold-400" />
            Profit & Loss at Expiration
          </span>
          <Badge
            variant="outline"
            className={`${
              contractType === "call"
                ? "border-emerald-500 text-emerald-400"
                : "border-rose-500 text-rose-400"
            }`}
          >
            {position.toUpperCase()} {contractType.toUpperCase()}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={data}
              margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
            >
              <defs>
                <linearGradient id="splitColor" x1="0" y1="0" x2="0" y2="1">
                  <stop offset={gradientOffset} stopColor="#10b981" stopOpacity={0.8} />
                  <stop offset={gradientOffset} stopColor="#f43f5e" stopOpacity={0.8} />
                </linearGradient>
                <linearGradient id="strokeGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset={gradientOffset} stopColor="#34d399" stopOpacity={1} />
                  <stop offset={gradientOffset} stopColor="#fb7185" stopOpacity={1} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#4A403A" opacity={0.5} />
              <XAxis
                dataKey="price"
                stroke="#9A8F85"
                tickFormatter={formatAxisTick}
                fontSize={12}
                tickCount={8}
              />
              <YAxis
                stroke="#9A8F85"
                tickFormatter={formatAxisTick}
                fontSize={12}
              />
              <Tooltip
                content={<CustomTooltip />}
                cursor={{
                  stroke: "#D4B896",
                  strokeWidth: 1,
                  strokeDasharray: "4 4",
                }}
                isAnimationActive={false}
              />
              <ReferenceLine y={0} stroke="#9A8F85" strokeWidth={2} />
              <ReferenceLine
                x={referenceLines.breakEven}
                stroke="#D4B896"
                strokeDasharray="5 5"
                label={{
                  value: "B/E",
                  position: "top",
                  fill: "#D4B896",
                  fontSize: 12,
                }}
              />
              <ReferenceLine
                x={referenceLines.strikePrice}
                stroke="#E8C87A"
                strokeDasharray="5 5"
                label={{
                  value: "Strike",
                  position: "top",
                  fill: "#E8C87A",
                  fontSize: 12,
                }}
              />
              <ReferenceLine
                x={referenceLines.currentPrice}
                stroke="#B8A894"
                strokeDasharray="5 5"
                label={{
                  value: "Current",
                  position: "top",
                  fill: "#B8A894",
                  fontSize: 12,
                }}
              />
              <ReferenceLine
                x={referenceLines.targetPrice}
                stroke="#C4A67A"
                strokeDasharray="5 5"
                label={{
                  value: "Target",
                  position: "top",
                  fill: "#C4A67A",
                  fontSize: 12,
                }}
              />
              <Area
                type="monotone"
                dataKey="pnl"
                stroke="url(#strokeGradient)"
                fill="url(#splitColor)"
                strokeWidth={2.5}
                isAnimationActive={true}
                animationDuration={300}
                animationEasing="ease-out"
                activeDot={{
                  r: 6,
                  fill: "#D4B896",
                  stroke: "#141210",
                  strokeWidth: 2,
                }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-4 mt-4 pt-4 border-t border-brown-700/50">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-gold-400" />
            <span className="text-xs text-brown-400">Break Even</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-gold-300" />
            <span className="text-xs text-brown-400">Strike Price</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-brown-300" />
            <span className="text-xs text-brown-400">Current Price</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-gold-500" />
            <span className="text-xs text-brown-400">Target Price</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
