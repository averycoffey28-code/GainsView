"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  TrendingUp,
  TrendingDown,
  Target,
  DollarSign,
} from "lucide-react";
import { ContractType, Position } from "@/lib/calculations";

interface ContractInputFormProps {
  contractType: ContractType;
  setContractType: (value: ContractType) => void;
  position: Position;
  setPosition: (value: Position) => void;
  strikePrice: number;
  setStrikePrice: (value: number) => void;
  premium: number;
  setPremium: (value: number) => void;
  currentPrice: number;
  setCurrentPrice: (value: number) => void;
  contracts: number;
  setContracts: (value: number) => void;
  totalPremium: number;
}

export default function ContractInputForm({
  contractType,
  setContractType,
  position,
  setPosition,
  strikePrice,
  setStrikePrice,
  premium,
  setPremium,
  currentPrice,
  setCurrentPrice,
  contracts,
  setContracts,
  totalPremium,
}: ContractInputFormProps) {
  return (
    <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-xl">
      <CardHeader className="pb-4">
        <CardTitle className="text-white flex items-center gap-2">
          <Target className="w-5 h-5 text-emerald-400" />
          Contract Details
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Contract Type */}
        <div className="space-y-2">
          <Label className="text-slate-300">Contract Type</Label>
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant={contractType === "call" ? "default" : "outline"}
              className={
                contractType === "call"
                  ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                  : "border-slate-700 text-slate-300 hover:bg-slate-800"
              }
              onClick={() => setContractType("call")}
            >
              <TrendingUp className="w-4 h-4 mr-2" />
              Call
            </Button>
            <Button
              variant={contractType === "put" ? "default" : "outline"}
              className={
                contractType === "put"
                  ? "bg-rose-600 hover:bg-rose-700 text-white"
                  : "border-slate-700 text-slate-300 hover:bg-slate-800"
              }
              onClick={() => setContractType("put")}
            >
              <TrendingDown className="w-4 h-4 mr-2" />
              Put
            </Button>
          </div>
        </div>

        {/* Position */}
        <div className="space-y-2">
          <Label className="text-slate-300">Position</Label>
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant={position === "long" ? "default" : "outline"}
              className={
                position === "long"
                  ? "bg-blue-600 hover:bg-blue-700 text-white"
                  : "border-slate-700 text-slate-300 hover:bg-slate-800"
              }
              onClick={() => setPosition("long")}
            >
              Long (Buy)
            </Button>
            <Button
              variant={position === "short" ? "default" : "outline"}
              className={
                position === "short"
                  ? "bg-amber-600 hover:bg-amber-700 text-white"
                  : "border-slate-700 text-slate-300 hover:bg-slate-800"
              }
              onClick={() => setPosition("short")}
            >
              Short (Sell)
            </Button>
          </div>
        </div>

        {/* Strike Price */}
        <div className="space-y-2">
          <Label className="text-slate-300">Strike Price</Label>
          <div className="relative">
            <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <Input
              type="number"
              value={strikePrice}
              onChange={(e) => setStrikePrice(Number(e.target.value))}
              className="pl-9 bg-slate-800/50 border-slate-700 text-white"
            />
          </div>
        </div>

        {/* Premium */}
        <div className="space-y-2">
          <Label className="text-slate-300">Premium (per share)</Label>
          <div className="relative">
            <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <Input
              type="number"
              step="0.01"
              value={premium}
              onChange={(e) => setPremium(Number(e.target.value))}
              className="pl-9 bg-slate-800/50 border-slate-700 text-white"
            />
          </div>
        </div>

        {/* Current Stock Price */}
        <div className="space-y-2">
          <Label className="text-slate-300">Current Stock Price</Label>
          <div className="relative">
            <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <Input
              type="number"
              value={currentPrice}
              onChange={(e) => setCurrentPrice(Number(e.target.value))}
              className="pl-9 bg-slate-800/50 border-slate-700 text-white"
            />
          </div>
        </div>

        {/* Number of Contracts */}
        <div className="space-y-2">
          <Label className="text-slate-300">Number of Contracts</Label>
          <Input
            type="number"
            min="1"
            value={contracts}
            onChange={(e) => setContracts(Math.max(1, Number(e.target.value)))}
            className="bg-slate-800/50 border-slate-700 text-white"
          />
        </div>

        {/* Total Investment */}
        <div className="p-4 bg-slate-800/50 rounded-xl border border-slate-700">
          <div className="flex justify-between items-center">
            <span className="text-slate-400">Total Investment</span>
            <span className="text-2xl font-bold text-white">
              ${totalPremium.toLocaleString()}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {contracts} contract{contracts > 1 ? "s" : ""} x 100 shares x $
            {premium} premium
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
