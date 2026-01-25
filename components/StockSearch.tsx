"use client";

import { useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { StockQuote } from "@/lib/types";

interface StockSearchProps {
  onQuoteLoaded: (quote: StockQuote) => void;
  onSymbolChange: (symbol: string) => void;
  quote: StockQuote | null;
  isLoading: boolean;
  error: string | null;
  lastUpdated: string | null;
}

export default function StockSearch({
  onQuoteLoaded,
  onSymbolChange,
  quote,
  isLoading,
  error,
  lastUpdated,
}: StockSearchProps) {
  const [symbol, setSymbol] = useState("");

  const handleSearch = useCallback(() => {
    if (symbol.trim()) {
      onSymbolChange(symbol.trim().toUpperCase());
    }
  }, [symbol, onSymbolChange]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  const handleRefresh = () => {
    if (quote?.symbol) {
      onSymbolChange(quote.symbol);
    }
  };

  return (
    <Card className="bg-brown-800/50 border-brown-700 backdrop-blur-xl">
      <CardHeader className="pb-3">
        <CardTitle className="text-brown-50 flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Search className="w-5 h-5 text-gold-400" />
            Stock Symbol
          </span>
          {lastUpdated && (
            <span className="text-xs text-brown-500 font-normal">
              Updated: {new Date(lastUpdated).toLocaleTimeString()}
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search Input */}
        <div className="flex gap-2">
          <Input
            type="text"
            placeholder="Enter symbol (e.g., AAPL)"
            value={symbol}
            onChange={(e) => setSymbol(e.target.value.toUpperCase())}
            onKeyDown={handleKeyDown}
            className="bg-brown-700/50 border-brown-600 text-brown-50 uppercase placeholder:text-brown-500"
            disabled={isLoading}
          />
          <Button
            onClick={handleSearch}
            disabled={isLoading || !symbol.trim()}
            className="bg-gold-600 hover:bg-gold-700 text-brown-900"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Search className="w-4 h-4" />
            )}
          </Button>
          {quote && (
            <Button
              variant="outline"
              onClick={handleRefresh}
              disabled={isLoading}
              className="border-brown-600 text-brown-300 hover:bg-brown-700"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
            </Button>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <div className="flex items-center gap-2 p-3 bg-rose-500/10 border border-rose-500/20 rounded-lg">
            <AlertCircle className="w-4 h-4 text-rose-400" />
            <span className="text-sm text-rose-400">{error}</span>
          </div>
        )}

        {/* Quote Display */}
        {quote && !error && (
          <div className="p-4 bg-brown-700/50 rounded-xl border border-brown-600">
            <div className="flex items-center justify-between mb-2">
              <div>
                <span className="text-2xl font-bold text-brown-50">
                  {quote.symbol}
                </span>
                <p className="text-xs text-brown-500 truncate max-w-[200px]">
                  {quote.description}
                </p>
              </div>
              <Badge
                className={
                  quote.change >= 0
                    ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                    : "bg-rose-500/20 text-rose-400 border-rose-500/30"
                }
              >
                {quote.change >= 0 ? (
                  <TrendingUp className="w-3 h-3 mr-1" />
                ) : (
                  <TrendingDown className="w-3 h-3 mr-1" />
                )}
                {quote.change >= 0 ? "+" : ""}
                {quote.changePercent?.toFixed(2)}%
              </Badge>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-gold-400 font-mono">
                ${quote.price?.toFixed(2)}
              </span>
              <span
                className={`text-sm font-mono ${
                  quote.change >= 0 ? "text-emerald-400" : "text-rose-400"
                }`}
              >
                {quote.change >= 0 ? "+" : ""}
                {quote.change?.toFixed(2)}
              </span>
            </div>
            <div className="flex gap-4 mt-2 text-xs text-brown-500">
              <span>H: ${quote.high?.toFixed(2)}</span>
              <span>L: ${quote.low?.toFixed(2)}</span>
              <span>Vol: {quote.volume?.toLocaleString()}</span>
            </div>
          </div>
        )}

        {/* Placeholder when no quote */}
        {!quote && !error && !isLoading && (
          <div className="p-4 bg-brown-700/30 rounded-xl border border-brown-600/50 text-center">
            <p className="text-sm text-brown-500">
              Enter a stock symbol to fetch live market data
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
