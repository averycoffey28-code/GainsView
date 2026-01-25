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
    <Card className="bg-brown-800/50 border-brown-700 backdrop-blur-xl">
      <CardHeader className="pb-4">
        <CardTitle className="text-brown-50 flex items-center gap-2">
          <Target className="w-5 h-5 text-gold-400" />
          Contract Details
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Contract Type */}
        <div className="space-y-2">
          <Label className="text-brown-300">Contract Type</Label>
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant={contractType === "call" ? "default" : "outline"}
              className={
                contractType === "call"
                  ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                  : "border-brown-600 text-brown-300 hover:bg-brown-700"
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
                  : "border-brown-600 text-brown-300 hover:bg-brown-700"
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
          <Label className="text-brown-300">Position</Label>
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant={position === "long" ? "default" : "outline"}
              className={
                position === "long"
                  ? "bg-gold-600 hover:bg-gold-700 text-brown-900"
                  : "border-brown-600 text-brown-300 hover:bg-brown-700"
              }
              onClick={() => setPosition("long")}
            >
              Long (Buy)
            </Button>
            <Button
              variant={position === "short" ? "default" : "outline"}
              className={
                position === "short"
                  ? "bg-gold-500 hover:bg-gold-600 text-brown-900"
                  : "border-brown-600 text-brown-300 hover:bg-brown-700"
              }
              onClick={() => setPosition("short")}
            >
              Short (Sell)
            </Button>
          </div>
        </div>

        {/* Strike Price */}
        <div className="space-y-2">
          <Label className="text-brown-300">Strike Price</Label>
          <div className="relative">
            <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brown-500" />
            <Input
              type="number"
              value={strikePrice}
              onChange={(e) => setStrikePrice(Number(e.target.value))}
              className="pl-9 bg-brown-700/50 border-brown-600 text-brown-50"
            />
          </div>
        </div>

        {/* Premium */}
        <div className="space-y-2">
          <Label className="text-brown-300">Premium (per share)</Label>
          <div className="relative">
            <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brown-500" />
            <Input
              type="number"
              step="0.01"
              value={premium}
              onChange={(e) => setPremium(Number(e.target.value))}
              className="pl-9 bg-brown-700/50 border-brown-600 text-brown-50"
            />
          </div>
        </div>

        {/* Current Stock Price */}
        <div className="space-y-2">
          <Label className="text-brown-300">Current Stock Price</Label>
          <div className="relative">
            <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brown-500" />
            <Input
              type="number"
              value={currentPrice}
              onChange={(e) => setCurrentPrice(Number(e.target.value))}
              className="pl-9 bg-brown-700/50 border-brown-600 text-brown-50"
            />
          </div>
        </div>

        {/* Number of Contracts */}
        <div className="space-y-2">
          <Label className="text-brown-300">Number of Contracts</Label>
          <Input
            type="number"
            min="1"
            value={contracts}
            onChange={(e) => setContracts(Math.max(1, Number(e.target.value)))}
            className="bg-brown-700/50 border-brown-600 text-brown-50"
          />
        </div>

        {/* Total Investment */}
        <div className="p-4 bg-brown-700/50 rounded-xl border border-brown-600">
          <div className="flex justify-between items-center">
            <span className="text-brown-400">Total Investment</span>
            <span className="text-2xl font-bold text-gold-400">
              ${totalPremium.toLocaleString()}
            </span>
          </div>
          <p className="text-xs text-brown-500 mt-1">
            {contracts} contract{contracts > 1 ? "s" : ""} x 100 shares x $
            {premium} premium
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
