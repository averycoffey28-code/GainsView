"use client";

import { Card, CardContent } from "@/components/ui/card";
import {
  ArrowUpRight,
  ArrowDownRight,
  Target,
  TrendingUp,
  Percent,
} from "lucide-react";
import { Calculations, ContractType, Position } from "@/lib/calculations";

interface ResultsSummaryProps {
  calculations: Calculations;
  contractType: ContractType;
  position: Position;
  targetPrice: number;
}

const colorSchemes = {
  emerald: {
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/20",
    text: "text-emerald-400",
    icon: "text-emerald-400",
  },
  rose: {
    bg: "bg-rose-500/10",
    border: "border-rose-500/20",
    text: "text-rose-400",
    icon: "text-rose-400",
  },
  gold: {
    bg: "bg-gold-400/10",
    border: "border-gold-400/20",
    text: "text-gold-400",
    icon: "text-gold-400",
  },
  brown: {
    bg: "bg-brown-700/50",
    border: "border-brown-600",
    text: "text-brown-300",
    icon: "text-brown-400",
  },
};

export default function ResultsSummary({
  calculations,
  targetPrice,
}: ResultsSummaryProps) {
  const { breakEven, maxProfit, maxLoss, targetPnL, targetROI } = calculations;

  const pnlColor = targetPnL >= 0 ? colorSchemes.emerald : colorSchemes.rose;
  const roiColor = targetROI >= 0 ? colorSchemes.emerald : colorSchemes.rose;

  const cards = [
    {
      label: "P&L at Target",
      value:
        targetPnL >= 0
          ? `+$${targetPnL.toLocaleString()}`
          : `-$${Math.abs(targetPnL).toLocaleString()}`,
      subtext: `If stock reaches $${targetPrice.toFixed(2)}`,
      icon: targetPnL >= 0 ? ArrowUpRight : ArrowDownRight,
      color: pnlColor,
    },
    {
      label: "Return on Investment",
      value:
        targetROI >= 0
          ? `+${targetROI.toFixed(1)}%`
          : `${targetROI.toFixed(1)}%`,
      subtext: "Based on premium paid",
      icon: Percent,
      color: roiColor,
    },
    {
      label: "Break Even Price",
      value: `$${breakEven.toFixed(2)}`,
      subtext: "Price to break even",
      icon: Target,
      color: colorSchemes.gold,
    },
    {
      label: "Max Profit",
      value:
        maxProfit === "Unlimited"
          ? "Unlimited"
          : `$${maxProfit.toLocaleString()}`,
      subtext: "Best case scenario",
      icon: TrendingUp,
      color: colorSchemes.emerald,
    },
    {
      label: "Max Loss",
      value:
        maxLoss === "Unlimited"
          ? "Unlimited"
          : `$${maxLoss.toLocaleString()}`,
      subtext: "Worst case scenario",
      icon: ArrowDownRight,
      color: colorSchemes.rose,
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
      {cards.map((card, index) => {
        const Icon = card.icon;
        return (
          <Card
            key={index}
            className={`${card.color.bg} ${card.color.border} border backdrop-blur-xl`}
          >
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Icon className={`w-4 h-4 ${card.color.icon}`} />
                <span className="text-xs text-brown-400 uppercase tracking-wide">
                  {card.label}
                </span>
              </div>
              <div className={`text-xl font-bold ${card.color.text} font-mono`}>
                {card.value}
              </div>
              <p className="text-xs text-brown-500 mt-1">{card.subtext}</p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
