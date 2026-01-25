"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Target } from "lucide-react";

interface PriceScenarioSliderProps {
  targetPrice: number;
  setTargetPrice: (value: number) => void;
  strikePrice: number;
  targetPnL: number;
}

export default function PriceScenarioSlider({
  targetPrice,
  setTargetPrice,
  strikePrice,
  targetPnL,
}: PriceScenarioSliderProps) {
  const minPrice = Math.max(0, strikePrice * 0.5);
  const maxPrice = strikePrice * 1.5;

  return (
    <Card className="bg-brown-800/50 border-brown-700 backdrop-blur-xl">
      <CardHeader className="pb-2">
        <CardTitle className="text-brown-50 flex items-center gap-2 text-base">
          <Target className="w-4 h-4 text-gold-400" />
          Target Price Scenario
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex justify-between items-center">
          <Label className="text-brown-300">Target Price at Expiry</Label>
          <span className="text-gold-400 font-mono font-semibold text-lg">
            ${targetPrice.toFixed(2)}
          </span>
        </div>
        <Slider
          value={[targetPrice]}
          onValueChange={(v) => setTargetPrice(v[0])}
          min={minPrice}
          max={maxPrice}
          step={0.5}
          className="py-2"
        />
        <div className="flex justify-between text-xs text-brown-500">
          <span>${minPrice.toFixed(0)}</span>
          <span>${maxPrice.toFixed(0)}</span>
        </div>
        <div className="p-3 bg-brown-700/50 rounded-lg border border-brown-600/50">
          <div className="flex justify-between items-center">
            <span className="text-sm text-brown-400">Projected P&L</span>
            <span
              className={`font-mono font-bold ${
                targetPnL >= 0 ? "text-emerald-400" : "text-rose-400"
              }`}
            >
              {targetPnL >= 0 ? "+" : ""}${targetPnL.toLocaleString()}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
