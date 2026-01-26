"use client";

import { useState } from "react";
import { DollarSign, TrendingUp, TrendingDown, RefreshCw, Plus, Search } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import Logo from "@/components/shared/Logo";

// Placeholder data - will be replaced with Tradier API data
const mockPositions = [
  {
    symbol: "AAPL",
    name: "Apple Inc.",
    type: "stock",
    quantity: 100,
    avgCost: 178.50,
    currentPrice: 185.20,
    change: 2.35,
    changePercent: 1.29,
  },
  {
    symbol: "AAPL 190C 02/21",
    name: "AAPL Call Option",
    type: "option",
    quantity: 5,
    avgCost: 3.50,
    currentPrice: 4.25,
    change: 0.75,
    changePercent: 21.43,
  },
  {
    symbol: "TSLA",
    name: "Tesla Inc.",
    type: "stock",
    quantity: 50,
    avgCost: 245.00,
    currentPrice: 238.50,
    change: -4.20,
    changePercent: -1.73,
  },
  {
    symbol: "SPY 480P 02/14",
    name: "SPY Put Option",
    type: "option",
    quantity: 10,
    avgCost: 2.80,
    currentPrice: 2.15,
    change: -0.65,
    changePercent: -23.21,
  },
];

export default function PortfolioPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = () => {
    setIsRefreshing(true);
    // Simulate API call
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  const totalValue = mockPositions.reduce(
    (sum, pos) => sum + pos.currentPrice * pos.quantity * (pos.type === "option" ? 100 : 1),
    0
  );

  const totalGainLoss = mockPositions.reduce(
    (sum, pos) =>
      sum + (pos.currentPrice - pos.avgCost) * pos.quantity * (pos.type === "option" ? 100 : 1),
    0
  );

  const filteredPositions = mockPositions.filter(
    (pos) =>
      pos.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
      pos.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-full bg-gradient-to-br from-brown-950 via-brown-900 to-brown-950 text-brown-50 p-4">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex-shrink-0">
              <Logo size="medium" glow />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-brown-50">Portfolio</h1>
              <p className="text-brown-400 text-sm">Live market data from Tradier</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleRefresh}
            className="text-brown-400 hover:text-gold-400"
          >
            <RefreshCw className={`w-5 h-5 ${isRefreshing ? "animate-spin" : ""}`} />
          </Button>
        </div>

        {/* Portfolio Summary */}
        <Card className="bg-brown-800/50 border-brown-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-brown-400">Total Value</p>
                <p className="text-3xl font-bold text-brown-50">
                  ${totalValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-brown-400">Total P&L</p>
                <p
                  className={`text-xl font-bold ${
                    totalGainLoss >= 0 ? "text-emerald-400" : "text-rose-400"
                  }`}
                >
                  {totalGainLoss >= 0 ? "+" : ""}${totalGainLoss.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Search & Add */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brown-500" />
            <Input
              placeholder="Search positions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-brown-800/50 border-brown-700 text-brown-100"
            />
          </div>
          <Button className="bg-gold-500 hover:bg-gold-600 text-brown-900">
            <Plus className="w-4 h-4" />
          </Button>
        </div>

        {/* Positions List */}
        <div className="space-y-3">
          {filteredPositions.map((position) => (
            <Card
              key={position.symbol}
              className="bg-brown-800/50 border-brown-700 hover:border-brown-600 transition-colors"
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className={`p-2 rounded-lg ${
                        position.type === "option"
                          ? "bg-gold-400/20"
                          : "bg-brown-700/50"
                      }`}
                    >
                      <DollarSign
                        className={`w-5 h-5 ${
                          position.type === "option"
                            ? "text-gold-400"
                            : "text-brown-300"
                        }`}
                      />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-brown-50">
                          {position.symbol}
                        </p>
                        <Badge
                          variant="outline"
                          className={`text-xs ${
                            position.type === "option"
                              ? "border-gold-500/50 text-gold-400"
                              : "border-brown-600 text-brown-400"
                          }`}
                        >
                          {position.type}
                        </Badge>
                      </div>
                      <p className="text-xs text-brown-500">
                        {position.quantity} {position.type === "option" ? "contracts" : "shares"} @ ${position.avgCost.toFixed(2)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-brown-50">
                      ${position.currentPrice.toFixed(2)}
                    </p>
                    <div
                      className={`flex items-center justify-end gap-1 text-sm ${
                        position.change >= 0 ? "text-emerald-400" : "text-rose-400"
                      }`}
                    >
                      {position.change >= 0 ? (
                        <TrendingUp className="w-3 h-3" />
                      ) : (
                        <TrendingDown className="w-3 h-3" />
                      )}
                      <span>
                        {position.change >= 0 ? "+" : ""}
                        {position.changePercent.toFixed(2)}%
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Empty state */}
        {filteredPositions.length === 0 && (
          <div className="text-center py-12">
            <DollarSign className="w-12 h-12 text-brown-600 mx-auto mb-4" />
            <p className="text-brown-400">No positions found</p>
            <p className="text-sm text-brown-500 mt-1">
              Add stocks and options to track your portfolio
            </p>
          </div>
        )}

        {/* Coming Soon Notice */}
        <Card className="bg-gold-400/10 border-gold-400/20">
          <CardContent className="p-4">
            <p className="text-sm text-gold-400 text-center">
              Real-time portfolio tracking with Tradier API coming soon
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
