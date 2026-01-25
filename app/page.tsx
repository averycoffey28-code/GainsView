"use client";

import { useState, useMemo } from "react";
import { BarChart3, Info } from "lucide-react";
import ContractInputForm from "@/components/ContractInputForm";
import ResultsSummary from "@/components/ResultsSummary";
import PriceScenarioSlider from "@/components/PriceScenarioSlider";
import ProfitLossChart from "@/components/ProfitLossChart";
import {
  ContractType,
  Position,
  calculateAll,
} from "@/lib/calculations";

export default function Home() {
  const [contractType, setContractType] = useState<ContractType>("call");
  const [position, setPosition] = useState<Position>("long");
  const [strikePrice, setStrikePrice] = useState(100);
  const [premium, setPremium] = useState(5);
  const [currentPrice, setCurrentPrice] = useState(100);
  const [contracts, setContracts] = useState(1);
  const [targetPrice, setTargetPrice] = useState(110);

  const calculations = useMemo(() => {
    return calculateAll({
      contractType,
      position,
      strikePrice,
      premium,
      currentPrice,
      contracts,
      targetPrice,
    });
  }, [contractType, position, strikePrice, premium, currentPrice, contracts, targetPrice]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-emerald-500/20 rounded-xl">
              <BarChart3 className="w-6 h-6 text-emerald-400" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
              Options P&L Calculator
            </h1>
          </div>
          <p className="text-slate-400 text-lg">
            Visualize potential returns before you trade
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Input Panel */}
          <div className="space-y-6">
            <ContractInputForm
              contractType={contractType}
              setContractType={setContractType}
              position={position}
              setPosition={setPosition}
              strikePrice={strikePrice}
              setStrikePrice={setStrikePrice}
              premium={premium}
              setPremium={setPremium}
              currentPrice={currentPrice}
              setCurrentPrice={setCurrentPrice}
              contracts={contracts}
              setContracts={setContracts}
              totalPremium={calculations.totalPremium}
            />

            <PriceScenarioSlider
              targetPrice={targetPrice}
              setTargetPrice={setTargetPrice}
              strikePrice={strikePrice}
              targetPnL={calculations.targetPnL}
            />
          </div>

          {/* Chart & Results */}
          <div className="lg:col-span-2 space-y-6">
            {/* Summary Cards */}
            <ResultsSummary
              calculations={calculations}
              contractType={contractType}
              position={position}
              targetPrice={targetPrice}
            />

            {/* P&L Chart */}
            <ProfitLossChart
              data={calculations.priceRange}
              breakEven={calculations.breakEven}
              strikePrice={strikePrice}
              currentPrice={currentPrice}
              targetPrice={targetPrice}
              contractType={contractType}
              position={position}
            />
          </div>
        </div>

        {/* Footer Note */}
        <div className="mt-8 p-4 bg-slate-800/30 rounded-xl border border-slate-700/50 flex items-start gap-3">
          <Info className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-slate-400">
            This calculator shows profit/loss at expiration. Options can also be
            sold before expiration, where time value and implied volatility
            affect pricing. This tool is for educational purposes only and
            should not be considered financial advice.
          </p>
        </div>
      </div>
    </div>
  );
}
