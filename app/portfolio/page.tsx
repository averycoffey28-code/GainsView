"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  Star,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  X,
  ChevronRight,
  Calculator,
  Loader2,
  Clock,
  BarChart2,
  Activity,
} from "lucide-react";
import {
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
} from "recharts";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Logo from "@/components/shared/Logo";
import MarketDataDisclaimer from "@/components/MarketDataDisclaimer";
import { useWatchlist, useUserSettings } from "@/hooks/useUserData";
import { cn } from "@/lib/utils";

interface SearchResult {
  symbol: string;
  name: string;
  exchange: string;
}

interface StockQuote {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  high: number;
  low: number;
  volume: number;
  description: string;
  open?: number;
  prevClose?: number;
  marketCap?: number;
  week52High?: number;
  week52Low?: number;
}

interface HistoryPoint {
  date: string;
  close: number;
  open?: number;
  high?: number;
  low?: number;
  volume?: number;
}

interface OptionContract {
  symbol: string;
  strike: number;
  bid: number;
  ask: number;
  last: number;
  change: number;
  changePercent: number;
  volume: number;
  openInterest: number;
  delta?: number | null;
  gamma?: number | null;
  theta?: number | null;
  vega?: number | null;
  iv?: number | null;
}

const CHART_RANGES = ["1D", "1W", "1M", "3M", "1Y", "ALL"] as const;
type ChartRange = (typeof CHART_RANGES)[number];

// Major market indices
const MARKET_INDICES = [
  { symbol: "SPY", name: "S&P 500" },
  { symbol: "QQQ", name: "Nasdaq" },
  { symbol: "DIA", name: "Dow Jones" },
  { symbol: "IWM", name: "Russell 2000" },
];

export default function MarketsPage() {
  const router = useRouter();
  const { watchlist, addToWatchlist, removeFromWatchlist, loading: watchlistLoading } = useWatchlist();
  const { settings, updateSettings } = useUserSettings();

  // Disclaimer state
  const [showDisclaimer, setShowDisclaimer] = useState(false);
  const [disclaimerChecked, setDisclaimerChecked] = useState(false);

  useEffect(() => {
    const localAcknowledged = localStorage.getItem("gainsview-market-disclaimer");
    if (localAcknowledged === "true") {
      setDisclaimerChecked(true);
      return;
    }
    if (settings?.market_disclaimer_acknowledged) {
      localStorage.setItem("gainsview-market-disclaimer", "true");
      setDisclaimerChecked(true);
      return;
    }
    // Only show once settings have loaded (avoid flash)
    if (settings !== null && settings !== undefined) {
      setShowDisclaimer(true);
    }
  }, [settings]);

  const handleAcknowledge = async () => {
    localStorage.setItem("gainsview-market-disclaimer", "true");
    setShowDisclaimer(false);
    setDisclaimerChecked(true);
    try {
      await updateSettings({ market_disclaimer_acknowledged: true });
    } catch {
      // localStorage is already set, safe to continue
    }
  };

  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);

  // Selected stock state
  const [selectedSymbol, setSelectedSymbol] = useState<string | null>(null);
  const [stockQuote, setStockQuote] = useState<StockQuote | null>(null);
  const [priceHistory, setPriceHistory] = useState<HistoryPoint[]>([]);
  const [chartRange, setChartRange] = useState<ChartRange>("1M");
  const [isLoadingQuote, setIsLoadingQuote] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  // Options state
  const [showOptions, setShowOptions] = useState(false);
  const [expirations, setExpirations] = useState<string[]>([]);
  const [selectedExpiration, setSelectedExpiration] = useState<string | null>(null);
  const [calls, setCalls] = useState<OptionContract[]>([]);
  const [puts, setPuts] = useState<OptionContract[]>([]);
  const [isLoadingOptions, setIsLoadingOptions] = useState(false);
  const [optionsCurrentPrice, setOptionsCurrentPrice] = useState<number | null>(null);
  const [activeOptionTab, setActiveOptionTab] = useState<"calls" | "puts">("calls");

  // Watchlist prices
  const [watchlistPrices, setWatchlistPrices] = useState<Record<string, StockQuote>>({});
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Market indices
  const [indexPrices, setIndexPrices] = useState<Record<string, StockQuote>>({});

  // Check if symbol is in watchlist
  const isInWatchlist = useMemo(() => {
    if (!selectedSymbol) return false;
    return watchlist.some((w) => w.symbol.toUpperCase() === selectedSymbol.toUpperCase());
  }, [watchlist, selectedSymbol]);

  const watchlistItem = useMemo(() => {
    if (!selectedSymbol) return null;
    return watchlist.find((w) => w.symbol.toUpperCase() === selectedSymbol.toUpperCase());
  }, [watchlist, selectedSymbol]);

  // Search handler
  const handleSearch = useCallback(async (query: string) => {
    if (query.length < 1) {
      setSearchResults([]);
      setShowResults(false);
      return;
    }

    setIsSearching(true);
    setShowResults(true);

    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
      if (res.ok) {
        const data = await res.json();
        setSearchResults(data.results || []);
      }
    } catch (error) {
      console.error("Search error:", error);
    } finally {
      setIsSearching(false);
    }
  }, []);

  // Debounced search
  useEffect(() => {
    const timeout = setTimeout(() => {
      handleSearch(searchQuery);
    }, 300);
    return () => clearTimeout(timeout);
  }, [searchQuery, handleSearch]);

  // Fetch stock quote
  const fetchQuote = useCallback(async (symbol: string) => {
    setIsLoadingQuote(true);
    try {
      const res = await fetch(`/api/stock?symbol=${symbol}`);
      if (res.ok) {
        const data = await res.json();
        setStockQuote(data);
        return data;
      }
    } catch (error) {
      console.error("Quote error:", error);
    } finally {
      setIsLoadingQuote(false);
    }
    return null;
  }, []);

  // Fetch price history
  const fetchHistory = useCallback(async (symbol: string, range: ChartRange) => {
    setIsLoadingHistory(true);
    try {
      const res = await fetch(`/api/history?symbol=${symbol}&range=${range}`);
      if (res.ok) {
        const data = await res.json();
        setPriceHistory(data.history || []);
      }
    } catch (error) {
      console.error("History error:", error);
    } finally {
      setIsLoadingHistory(false);
    }
  }, []);

  // Fetch options expirations
  const fetchExpirations = useCallback(async (symbol: string) => {
    setIsLoadingOptions(true);
    try {
      const res = await fetch(`/api/options?symbol=${symbol}`);
      if (res.ok) {
        const data = await res.json();
        setExpirations(data.expirations || []);
        if (data.expirations?.length > 0) {
          setSelectedExpiration(data.expirations[0]);
        }
      }
    } catch (error) {
      console.error("Expirations error:", error);
    } finally {
      setIsLoadingOptions(false);
    }
  }, []);

  // Fetch options chain
  const fetchOptionsChain = useCallback(async (symbol: string, expiration: string) => {
    setIsLoadingOptions(true);
    try {
      const res = await fetch(`/api/options?symbol=${symbol}&expiration=${expiration}`);
      if (res.ok) {
        const data = await res.json();
        setCalls(data.calls || []);
        setPuts(data.puts || []);
        if (data.currentPrice) setOptionsCurrentPrice(data.currentPrice);
      }
    } catch (error) {
      console.error("Options chain error:", error);
    } finally {
      setIsLoadingOptions(false);
    }
  }, []);

  // Select a stock
  const handleSelectStock = useCallback(
    async (symbol: string) => {
      setSelectedSymbol(symbol);
      setSearchQuery("");
      setShowResults(false);
      setShowOptions(false);
      setCalls([]);
      setPuts([]);
      setExpirations([]);
      setSelectedExpiration(null);

      await Promise.all([
        fetchQuote(symbol),
        fetchHistory(symbol, chartRange),
      ]);
    },
    [fetchQuote, fetchHistory, chartRange]
  );

  // Change chart range
  useEffect(() => {
    if (selectedSymbol) {
      fetchHistory(selectedSymbol, chartRange);
    }
  }, [chartRange, selectedSymbol, fetchHistory]);

  // Fetch options when toggled
  useEffect(() => {
    if (showOptions && selectedSymbol && expirations.length === 0) {
      fetchExpirations(selectedSymbol);
    }
  }, [showOptions, selectedSymbol, expirations.length, fetchExpirations]);

  // Fetch options chain when expiration changes
  useEffect(() => {
    if (showOptions && selectedSymbol && selectedExpiration) {
      fetchOptionsChain(selectedSymbol, selectedExpiration);
    }
  }, [showOptions, selectedSymbol, selectedExpiration, fetchOptionsChain]);

  // Fetch watchlist prices
  const refreshWatchlistPrices = useCallback(async () => {
    if (watchlist.length === 0) return;

    setIsRefreshing(true);
    const prices: Record<string, StockQuote> = {};

    await Promise.all(
      watchlist.map(async (item) => {
        try {
          const res = await fetch(`/api/stock?symbol=${item.symbol}`);
          if (res.ok) {
            const data = await res.json();
            prices[item.symbol] = data;
          }
        } catch (error) {
          console.error(`Error fetching ${item.symbol}:`, error);
        }
      })
    );

    setWatchlistPrices(prices);
    setIsRefreshing(false);
  }, [watchlist]);

  // Fetch market indices
  const fetchIndices = useCallback(async () => {
    const prices: Record<string, StockQuote> = {};

    await Promise.all(
      MARKET_INDICES.map(async (index) => {
        try {
          const res = await fetch(`/api/stock?symbol=${index.symbol}`);
          if (res.ok) {
            const data = await res.json();
            prices[index.symbol] = data;
          }
        } catch (error) {
          console.error(`Error fetching ${index.symbol}:`, error);
        }
      })
    );

    setIndexPrices(prices);
  }, []);

  // Initial data fetch
  useEffect(() => {
    fetchIndices();
    refreshWatchlistPrices();
  }, [fetchIndices, refreshWatchlistPrices]);

  // Toggle watchlist
  const handleToggleWatchlist = async () => {
    if (!selectedSymbol) return;

    if (isInWatchlist && watchlistItem) {
      await removeFromWatchlist(watchlistItem.id);
    } else {
      await addToWatchlist(selectedSymbol.toUpperCase());
    }
  };

  // Navigate to calculator with prefilled data
  const handleCalculate = (contract: OptionContract, type: "call" | "put") => {
    // Store in sessionStorage for calculator to pick up
    sessionStorage.setItem(
      "calculatorPrefill",
      JSON.stringify({
        symbol: selectedSymbol,
        strikePrice: contract.strike,
        premium: (contract.bid + contract.ask) / 2,
        contractType: type,
        stockPrice: stockQuote?.price,
      })
    );
    router.push("/");
  };

  return (
    <div className="min-h-full bg-gradient-to-br from-brown-950 via-brown-900 to-brown-950 text-brown-50 p-4 pb-24">
      {/* Market Data Disclaimer Modal */}
      {showDisclaimer && (
        <MarketDataDisclaimer onAcknowledge={handleAcknowledge} />
      )}

      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Logo size="header" glow />
          <div>
            <h1 className="text-2xl font-bold text-brown-50">Markets</h1>
            <p className="text-brown-400 text-sm">Search stocks & track your watchlist</p>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-brown-500" />
            <Input
              placeholder="Search by ticker (AAPL, TSLA, SPY...)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value.toUpperCase())}
              onFocus={() => searchQuery && setShowResults(true)}
              className="pl-10 pr-10 py-6 text-lg bg-brown-800/50 border-brown-700 text-brown-100 placeholder:text-brown-500 focus:border-gold-500/50 uppercase"
            />
            {searchQuery && (
              <button
                onClick={() => {
                  setSearchQuery("");
                  setShowResults(false);
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-brown-500 hover:text-brown-300"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Search Results Dropdown */}
          {showResults && (
            <div className="absolute z-50 w-full mt-2 bg-brown-900 border border-brown-700 rounded-xl shadow-xl overflow-hidden">
              {isSearching ? (
                <div className="p-4 text-center">
                  <Loader2 className="w-5 h-5 text-gold-400 animate-spin mx-auto" />
                </div>
              ) : searchResults.length > 0 ? (
                <div className="max-h-64 overflow-y-auto">
                  {searchResults.map((result) => {
                    const upperQuery = searchQuery.toUpperCase();
                    const isTickerMatch = result.symbol.toUpperCase().startsWith(upperQuery);
                    return (
                      <button
                        key={result.symbol}
                        onClick={() => handleSelectStock(result.symbol)}
                        className="w-full flex items-center justify-between p-3 hover:bg-brown-800/50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <span className={cn(
                            "font-bold text-lg",
                            isTickerMatch ? "text-gold-400" : "text-brown-100"
                          )}>
                            {result.symbol}
                          </span>
                          <span className="text-brown-400 text-sm truncate max-w-[200px]">
                            {result.name}
                          </span>
                        </div>
                        <ChevronRight className="w-4 h-4 text-brown-500 flex-shrink-0" />
                      </button>
                    );
                  })}
                </div>
              ) : searchQuery.length > 0 ? (
                <div className="p-4 text-center text-brown-500">
                  No results for &quot;{searchQuery}&quot;
                </div>
              ) : null}
            </div>
          )}
        </div>

        {/* Stock Detail View */}
        {selectedSymbol && (
          <Card className="bg-brown-800/50 border-brown-700 overflow-hidden">
            <CardContent className="p-0">
              {isLoadingQuote ? (
                <div className="p-8 text-center">
                  <Loader2 className="w-8 h-8 text-gold-400 animate-spin mx-auto" />
                </div>
              ) : stockQuote ? (
                <>
                  {/* Stock Header */}
                  <div className="p-4 border-b border-brown-700">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <h2 className="text-2xl font-bold text-brown-50">
                            {stockQuote.symbol}
                          </h2>
                          <button
                            onClick={handleToggleWatchlist}
                            className={cn(
                              "p-1.5 rounded-lg transition-colors",
                              isInWatchlist
                                ? "bg-gold-500/20 text-gold-400"
                                : "text-brown-500 hover:text-gold-400 hover:bg-brown-700/50"
                            )}
                          >
                            <Star
                              className={cn("w-5 h-5", isInWatchlist && "fill-current")}
                            />
                          </button>
                        </div>
                        <p className="text-sm text-brown-400">{stockQuote.description}</p>
                      </div>
                      <button
                        onClick={() => setSelectedSymbol(null)}
                        className="p-2 text-brown-500 hover:text-brown-300"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>

                    {/* Price Display */}
                    <div className="mt-4">
                      <p className="text-4xl font-bold text-brown-50">
                        ${stockQuote.price?.toFixed(2) || "—"}
                      </p>
                      <div
                        className={cn(
                          "flex items-center gap-2 mt-1",
                          (stockQuote.change || 0) >= 0 ? "text-emerald-400" : "text-rose-400"
                        )}
                      >
                        {(stockQuote.change || 0) >= 0 ? (
                          <TrendingUp className="w-4 h-4" />
                        ) : (
                          <TrendingDown className="w-4 h-4" />
                        )}
                        <span className="font-semibold">
                          {(stockQuote.change || 0) >= 0 ? "+" : ""}
                          ${Math.abs(stockQuote.change || 0).toFixed(2)} (
                          {(stockQuote.changePercent || 0) >= 0 ? "+" : ""}
                          {(stockQuote.changePercent || 0).toFixed(2)}%)
                        </span>
                      </div>
                      <p className="text-xs text-brown-500 mt-1 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        Data delayed up to 15 min
                      </p>
                    </div>
                  </div>

                  {/* Chart */}
                  <div className="p-4 border-b border-brown-700">
                    {/* Range Selector */}
                    <div className="flex gap-1 mb-4">
                      {CHART_RANGES.map((range) => (
                        <button
                          key={range}
                          onClick={() => setChartRange(range)}
                          className={cn(
                            "px-3 py-1.5 text-xs font-medium rounded-lg transition-colors",
                            chartRange === range
                              ? "bg-gold-500 text-brown-900"
                              : "text-brown-400 hover:bg-brown-700/50"
                          )}
                        >
                          {range}
                        </button>
                      ))}
                    </div>

                    {/* Chart */}
                    <div className="h-48">
                      {isLoadingHistory ? (
                        <div className="h-full flex items-center justify-center">
                          <Loader2 className="w-6 h-6 text-gold-400 animate-spin" />
                        </div>
                      ) : priceHistory.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={priceHistory}>
                            <defs>
                              <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#D4AF37" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#D4AF37" stopOpacity={0} />
                              </linearGradient>
                            </defs>
                            <XAxis
                              dataKey="date"
                              axisLine={false}
                              tickLine={false}
                              tick={{ fill: "#8B7355", fontSize: 10 }}
                              tickFormatter={(value) => {
                                if (chartRange === "1D") {
                                  return new Date(value).toLocaleTimeString("en-US", {
                                    hour: "numeric",
                                    minute: "2-digit",
                                  });
                                }
                                return new Date(value).toLocaleDateString("en-US", {
                                  month: "short",
                                  day: "numeric",
                                });
                              }}
                              interval="preserveStartEnd"
                            />
                            <YAxis
                              domain={["auto", "auto"]}
                              axisLine={false}
                              tickLine={false}
                              tick={{ fill: "#8B7355", fontSize: 10 }}
                              tickFormatter={(v) => `$${v}`}
                              width={50}
                            />
                            <Tooltip
                              contentStyle={{
                                backgroundColor: "#2A2420",
                                border: "1px solid #4A403A",
                                borderRadius: "8px",
                              }}
                              labelStyle={{ color: "#D4B896" }}
                              formatter={(value) => [`$${Number(value).toFixed(2)}`, "Price"]}
                              labelFormatter={(label) => {
                                if (chartRange === "1D") {
                                  return new Date(label).toLocaleString();
                                }
                                return new Date(label).toLocaleDateString();
                              }}
                            />
                            <Area
                              type="monotone"
                              dataKey="close"
                              stroke="#D4AF37"
                              strokeWidth={2}
                              fill="url(#colorPrice)"
                            />
                          </AreaChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="h-full flex items-center justify-center text-brown-500">
                          No chart data available
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Key Stats */}
                  <div className="p-4 border-b border-brown-700">
                    <h3 className="text-sm font-medium text-brown-300 mb-3">Key Stats</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-brown-500">Day High</p>
                        <p className="font-medium text-brown-100">
                          ${stockQuote.high?.toFixed(2) || "—"}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-brown-500">Day Low</p>
                        <p className="font-medium text-brown-100">
                          ${stockQuote.low?.toFixed(2) || "—"}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-brown-500">Volume</p>
                        <p className="font-medium text-brown-100">
                          {stockQuote.volume
                            ? (stockQuote.volume / 1000000).toFixed(2) + "M"
                            : "—"}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-brown-500">Change</p>
                        <p
                          className={cn(
                            "font-medium",
                            (stockQuote.change || 0) >= 0 ? "text-emerald-400" : "text-rose-400"
                          )}
                        >
                          {(stockQuote.changePercent || 0) >= 0 ? "+" : ""}
                          {(stockQuote.changePercent || 0).toFixed(2)}%
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Options Chain Toggle */}
                  <div className="p-4">
                    <Button
                      onClick={() => setShowOptions(!showOptions)}
                      variant="outline"
                      className="w-full border-brown-700 text-brown-300 hover:bg-brown-700/50"
                    >
                      <BarChart2 className="w-4 h-4 mr-2" />
                      {showOptions ? "Hide Options Chain" : "View Options Chain"}
                    </Button>
                  </div>

                  {/* Options Chain */}
                  {showOptions && (
                    <div className="border-t border-brown-700">
                      {/* Expiration Selector */}
                      <div className="p-4 border-b border-brown-700">
                        <p className="text-xs text-brown-500 mb-2">Expiration Date</p>
                        <div className="flex gap-2 overflow-x-auto pb-1">
                          {expirations.slice(0, 8).map((exp) => {
                            const expDate = new Date(exp + "T00:00:00");
                            const today = new Date();
                            today.setHours(0, 0, 0, 0);
                            const diffDays = Math.ceil((expDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                            return (
                              <button
                                key={exp}
                                onClick={() => setSelectedExpiration(exp)}
                                className={cn(
                                  "px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap flex-shrink-0",
                                  selectedExpiration === exp
                                    ? "bg-gold-500 text-brown-900"
                                    : "bg-brown-700/50 text-brown-300 hover:bg-brown-700"
                                )}
                              >
                                {expDate.toLocaleDateString("en-US", {
                                  month: "short",
                                  day: "numeric",
                                })}
                                <span className="ml-1 opacity-60">({diffDays}d)</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Calls / Puts Tab */}
                      <div className="flex border-b border-brown-700">
                        <button
                          onClick={() => setActiveOptionTab("calls")}
                          className={cn(
                            "flex-1 py-2.5 text-sm font-medium transition-colors",
                            activeOptionTab === "calls"
                              ? "text-emerald-400 border-b-2 border-emerald-400"
                              : "text-brown-400 hover:text-brown-200"
                          )}
                        >
                          Calls
                        </button>
                        <button
                          onClick={() => setActiveOptionTab("puts")}
                          className={cn(
                            "flex-1 py-2.5 text-sm font-medium transition-colors",
                            activeOptionTab === "puts"
                              ? "text-rose-400 border-b-2 border-rose-400"
                              : "text-brown-400 hover:text-brown-200"
                          )}
                        >
                          Puts
                        </button>
                      </div>

                      {isLoadingOptions ? (
                        <div className="p-8 text-center">
                          <Loader2 className="w-6 h-6 text-gold-400 animate-spin mx-auto" />
                        </div>
                      ) : (() => {
                        const isCall = activeOptionTab === "calls";
                        const rawOptions = isCall ? calls : puts;
                        const refPrice = optionsCurrentPrice ?? stockQuote?.price ?? 0;

                        // Filter to strikes within ~12% of current price
                        const filtered = refPrice > 0
                          ? rawOptions.filter((opt) => {
                              const pct = Math.abs((opt.strike - refPrice) / refPrice) * 100;
                              return pct <= 12;
                            })
                          : rawOptions;

                        // Sort calls ascending, puts descending (high strikes first for puts)
                        const sorted = [...filtered].sort((a, b) =>
                          isCall ? a.strike - b.strike : b.strike - a.strike
                        );

                        if (sorted.length === 0) {
                          return (
                            <div className="p-8 text-center text-brown-500">
                              No options available
                            </div>
                          );
                        }

                        // Find where current price sits for the indicator
                        let priceInsertIndex = -1;
                        if (refPrice > 0 && isCall) {
                          priceInsertIndex = sorted.findIndex((opt) => opt.strike > refPrice);
                        } else if (refPrice > 0 && !isCall) {
                          priceInsertIndex = sorted.findIndex((opt) => opt.strike < refPrice);
                        }

                        return (
                          <div className="divide-y divide-brown-700/30 max-h-[420px] overflow-y-auto">
                            {/* Column Headers */}
                            <div className="grid grid-cols-[1fr_auto_auto_auto] gap-2 px-4 py-2 text-[10px] uppercase tracking-wider text-brown-500 sticky top-0 bg-brown-800/90 backdrop-blur-sm z-10">
                              <span>Strike</span>
                              <span className="text-right w-16">Breakeven</span>
                              <span className="text-right w-16">Change</span>
                              <span className="text-right w-20">Ask</span>
                            </div>

                            {sorted.map((opt, idx) => {
                              const ask = opt.ask || 0;
                              const breakeven = isCall
                                ? opt.strike + ask
                                : opt.strike - ask;
                              const toBreakevenPct = refPrice > 0
                                ? ((breakeven - refPrice) / refPrice) * 100
                                : 0;
                              const isITM = isCall
                                ? opt.strike < refPrice
                                : opt.strike > refPrice;
                              const isNearATM = refPrice > 0 && Math.abs((opt.strike - refPrice) / refPrice) < 0.015;

                              const showPriceLine = priceInsertIndex === idx;

                              return (
                                <div key={opt.symbol}>
                                  {showPriceLine && (
                                    <div className="flex items-center gap-2 px-4 py-1.5">
                                      <div className="flex-1 h-px bg-gold-400/60" />
                                      <span className="text-[11px] font-medium text-gold-400 bg-gold-400/10 px-2 py-0.5 rounded-full">
                                        ${refPrice.toFixed(2)}
                                      </span>
                                      <div className="flex-1 h-px bg-gold-400/60" />
                                    </div>
                                  )}
                                  <button
                                    onClick={() => handleCalculate(opt, isCall ? "call" : "put")}
                                    className={cn(
                                      "w-full grid grid-cols-[1fr_auto_auto_auto] gap-2 items-center px-4 py-3 hover:bg-brown-700/30 transition-colors",
                                      isNearATM && "bg-gold-400/5",
                                      isITM && "bg-emerald-500/5"
                                    )}
                                  >
                                    {/* Strike */}
                                    <div className="text-left">
                                      <span className={cn(
                                        "font-semibold text-sm",
                                        isNearATM ? "text-gold-400" : "text-brown-100"
                                      )}>
                                        ${opt.strike.toFixed(2)}
                                      </span>
                                      {isNearATM && (
                                        <span className="ml-1.5 text-[10px] text-gold-400/70 font-medium">ATM</span>
                                      )}
                                    </div>

                                    {/* Breakeven + To Breakeven */}
                                    <div className="text-right w-16">
                                      <p className="text-xs text-brown-200">${breakeven.toFixed(2)}</p>
                                      <p className={cn(
                                        "text-[10px]",
                                        (isCall ? toBreakevenPct >= 0 : toBreakevenPct <= 0)
                                          ? "text-brown-500"
                                          : "text-emerald-400"
                                      )}>
                                        {toBreakevenPct >= 0 ? "+" : ""}{toBreakevenPct.toFixed(1)}%
                                      </p>
                                    </div>

                                    {/* Change */}
                                    <div className="text-right w-16">
                                      <p className={cn(
                                        "text-xs font-medium",
                                        (opt.change || 0) >= 0 ? "text-emerald-400" : "text-rose-400"
                                      )}>
                                        {(opt.change || 0) >= 0 ? "+" : ""}${(opt.change || 0).toFixed(2)}
                                      </p>
                                      <p className={cn(
                                        "text-[10px]",
                                        (opt.changePercent || 0) >= 0 ? "text-emerald-400" : "text-rose-400"
                                      )}>
                                        {(opt.changePercent || 0) >= 0 ? "+" : ""}{(opt.changePercent || 0).toFixed(1)}%
                                      </p>
                                    </div>

                                    {/* Ask Price */}
                                    <div className="text-right w-20">
                                      <span className={cn(
                                        "inline-block px-2.5 py-1 rounded-md text-xs font-semibold border",
                                        isITM
                                          ? "border-emerald-500/40 text-emerald-400 bg-emerald-500/10"
                                          : "border-brown-600 text-brown-200 bg-brown-700/30"
                                      )}>
                                        ${ask.toFixed(2)}
                                      </span>
                                    </div>
                                  </button>
                                </div>
                              );
                            })}
                          </div>
                        );
                      })()}
                    </div>
                  )}
                </>
              ) : null}
            </CardContent>
          </Card>
        )}

        {/* Market Overview */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-medium text-brown-300">Market Overview</h2>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {MARKET_INDICES.map((index) => {
              const quote = indexPrices[index.symbol];
              return (
                <button
                  key={index.symbol}
                  onClick={() => handleSelectStock(index.symbol)}
                  className="p-3 bg-brown-800/50 border border-brown-700 rounded-xl hover:border-brown-600 transition-colors text-left"
                >
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-brown-100">{index.name}</p>
                    <p className="text-xs text-brown-500">{index.symbol}</p>
                  </div>
                  {quote ? (
                    <div className="mt-2">
                      <p className="text-lg font-semibold text-brown-50">
                        ${quote.price?.toFixed(2)}
                      </p>
                      <p
                        className={cn(
                          "text-xs",
                          (quote.change || 0) >= 0 ? "text-emerald-400" : "text-rose-400"
                        )}
                      >
                        {(quote.changePercent || 0) >= 0 ? "+" : ""}
                        {(quote.changePercent || 0).toFixed(2)}%
                      </p>
                    </div>
                  ) : (
                    <div className="mt-2 h-10 bg-brown-700/30 rounded animate-pulse" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Watchlist */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-medium text-brown-300">Your Watchlist</h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={refreshWatchlistPrices}
              disabled={isRefreshing}
              className="text-brown-400 hover:text-gold-400"
            >
              <RefreshCw className={cn("w-4 h-4", isRefreshing && "animate-spin")} />
            </Button>
          </div>

          {watchlistLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-16 bg-brown-800/30 rounded-xl animate-pulse"
                />
              ))}
            </div>
          ) : watchlist.length === 0 ? (
            <Card className="bg-brown-800/30 border-brown-700">
              <CardContent className="p-8 text-center">
                <Star className="w-10 h-10 text-brown-600 mx-auto mb-3" />
                <p className="text-brown-400">No watchlist items yet</p>
                <p className="text-sm text-brown-500 mt-1">
                  Search for stocks to add to your watchlist
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {watchlist.map((item) => {
                const quote = watchlistPrices[item.symbol];
                return (
                  <button
                    key={item.id}
                    onClick={() => handleSelectStock(item.symbol)}
                    className="w-full flex items-center justify-between p-3 bg-brown-800/50 border border-brown-700 rounded-xl hover:border-brown-600 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-gold-500/20 rounded-lg">
                        <Activity className="w-4 h-4 text-gold-400" />
                      </div>
                      <div className="text-left">
                        <p className="font-semibold text-brown-100">{item.symbol}</p>
                        {quote && (
                          <p className="text-sm text-brown-400">
                            ${quote.price?.toFixed(2)}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {quote && (
                        <div
                          className={cn(
                            "flex items-center gap-1",
                            (quote.change || 0) >= 0 ? "text-emerald-400" : "text-rose-400"
                          )}
                        >
                          {(quote.change || 0) >= 0 ? (
                            <TrendingUp className="w-4 h-4" />
                          ) : (
                            <TrendingDown className="w-4 h-4" />
                          )}
                          <span className="text-sm font-medium">
                            {(quote.changePercent || 0) >= 0 ? "+" : ""}
                            {(quote.changePercent || 0).toFixed(2)}%
                          </span>
                        </div>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removeFromWatchlist(item.id);
                        }}
                        className="p-1 text-brown-500 hover:text-rose-400 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Disclaimer */}
        <p className="text-center text-xs text-brown-600 pb-2">
          Market data may be delayed up to 15 minutes. Not intended as financial advice.
        </p>
      </div>
    </div>
  );
}
