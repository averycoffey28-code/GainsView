"use client";

import { useState, useMemo } from "react";
import {
  TrendingUp,
  TrendingDown,
  Plus,
  Calendar,
  Trash2,
  Download,
  Upload,
  ChevronUp,
  ChevronDown,
  X,
  Target,
  Percent,
  DollarSign,
  BarChart3,
  Loader2,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Logo from "@/components/shared/Logo";
import ImportTradesModal from "@/components/ImportTradesModal";
import { useTrades, Trade } from "@/hooks/useUserData";
import { cn } from "@/lib/utils";

type SortField = "trade_date" | "symbol" | "pnl" | "asset_type";
type SortDirection = "asc" | "desc";
type ChartRange = "week" | "month" | "all";

export default function PnLPage() {
  const { trades, loading, addTrade, deleteTrade, refetch } = useTrades();
  const [showAddModal, setShowAddModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sortField, setSortField] = useState<SortField>("trade_date");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [chartRange, setChartRange] = useState<ChartRange>("month");
  const [currentPage, setCurrentPage] = useState(1);
  const tradesPerPage = 10;

  // Form state
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split("T")[0],
    symbol: "",
    asset_type: "call" as "stock" | "call" | "put",
    trade_type: "sell" as "buy" | "sell",
    entry_price: "",
    exit_price: "",
    quantity: "",
    fees: "",
    notes: "",
  });

  // Helper to safely parse P&L (handles string/number/null from database)
  const parsePnL = (value: number | string | null | undefined): number => {
    if (value === null || value === undefined) return 0;
    const parsed = typeof value === 'string' ? parseFloat(value) : value;
    return isNaN(parsed) ? 0 : parsed;
  };

  // Calculate stats
  const stats = useMemo(() => {
    if (!trades.length) {
      return {
        totalPnL: 0,
        monthPnL: 0,
        winRate: 0,
        avgWin: 0,
        avgLoss: 0,
        winCount: 0,
        lossCount: 0,
      };
    }

    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const totalPnL = trades.reduce((sum, t) => sum + parsePnL(t.pnl), 0);
    const monthTrades = trades.filter(
      (t) => new Date(t.trade_date) >= monthStart
    );
    const monthPnL = monthTrades.reduce((sum, t) => sum + parsePnL(t.pnl), 0);

    const wins = trades.filter((t) => parsePnL(t.pnl) > 0);
    const losses = trades.filter((t) => parsePnL(t.pnl) < 0);
    const winRate = trades.length > 0 ? (wins.length / trades.length) * 100 : 0;
    const avgWin = wins.length > 0 ? wins.reduce((s, t) => s + parsePnL(t.pnl), 0) / wins.length : 0;
    const avgLoss = losses.length > 0 ? Math.abs(losses.reduce((s, t) => s + parsePnL(t.pnl), 0) / losses.length) : 0;

    return {
      totalPnL: Math.round(totalPnL * 100) / 100,
      monthPnL: Math.round(monthPnL * 100) / 100,
      winRate,
      avgWin: Math.round(avgWin * 100) / 100,
      avgLoss: Math.round(avgLoss * 100) / 100,
      winCount: wins.length,
      lossCount: losses.length,
    };
  }, [trades]);

  // Chart data
  const chartData = useMemo(() => {
    if (!trades.length) return [];

    const now = new Date();
    let filteredTrades = [...trades];

    if (chartRange === "week") {
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      filteredTrades = trades.filter((t) => new Date(t.trade_date) >= weekAgo);
    } else if (chartRange === "month") {
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      filteredTrades = trades.filter((t) => new Date(t.trade_date) >= monthAgo);
    }

    // Sort by date ascending for proper cumulative calculation
    filteredTrades.sort(
      (a, b) => new Date(a.trade_date).getTime() - new Date(b.trade_date).getTime()
    );

    // Calculate cumulative P&L with proper parsing
    let cumulative = 0;
    return filteredTrades.map((trade) => {
      const tradePnL = parsePnL(trade.pnl);
      cumulative += tradePnL;
      return {
        date: new Date(trade.trade_date).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        }),
        pnl: Math.round(cumulative * 100) / 100,
        dailyPnl: tradePnL,
      };
    });
  }, [trades, chartRange]);

  // Calendar heatmap data
  const calendarData = useMemo(() => {
    const days: Record<string, number> = {};
    trades.forEach((trade) => {
      const date = trade.trade_date.split("T")[0];
      days[date] = (days[date] || 0) + parsePnL(trade.pnl);
    });
    return days;
  }, [trades]);

  // Sorted and paginated trades
  const sortedTrades = useMemo(() => {
    return [...trades].sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case "trade_date":
          comparison = new Date(a.trade_date).getTime() - new Date(b.trade_date).getTime();
          break;
        case "symbol":
          comparison = a.symbol.localeCompare(b.symbol);
          break;
        case "pnl":
          comparison = parsePnL(a.pnl) - parsePnL(b.pnl);
          break;
        case "asset_type":
          comparison = a.asset_type.localeCompare(b.asset_type);
          break;
      }
      return sortDirection === "asc" ? comparison : -comparison;
    });
  }, [trades, sortField, sortDirection]);

  const paginatedTrades = useMemo(() => {
    const start = (currentPage - 1) * tradesPerPage;
    return sortedTrades.slice(start, start + tradesPerPage);
  }, [sortedTrades, currentPage]);

  const totalPages = Math.ceil(sortedTrades.length / tradesPerPage);

  // Handlers
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
  };

  const handleSubmit = async () => {
    if (!formData.symbol || !formData.quantity) return;

    setIsSubmitting(true);
    const entryPrice = parseFloat(formData.entry_price) || 0;
    const exitPrice = parseFloat(formData.exit_price) || 0;
    const quantity = parseInt(formData.quantity) || 0;
    const fees = parseFloat(formData.fees) || 0;

    // Validate inputs
    if (isNaN(entryPrice) || isNaN(exitPrice) || isNaN(quantity) || quantity <= 0) {
      setIsSubmitting(false);
      return;
    }

    // Calculate P&L with proper rounding
    const multiplier = formData.asset_type === "stock" ? 1 : 100;
    const grossPnL = (exitPrice - entryPrice) * quantity * multiplier;
    const netPnL = Math.round((grossPnL - fees) * 100) / 100;

    await addTrade({
      symbol: formData.symbol.toUpperCase(),
      trade_type: formData.trade_type,
      asset_type: formData.asset_type,
      quantity,
      price: Math.round(exitPrice * 100) / 100,
      total_value: Math.round(exitPrice * quantity * multiplier * 100) / 100,
      pnl: netPnL,
      notes: formData.notes || null,
      trade_date: formData.date,
    });

    setFormData({
      date: new Date().toISOString().split("T")[0],
      symbol: "",
      asset_type: "call",
      trade_type: "sell",
      entry_price: "",
      exit_price: "",
      quantity: "",
      fees: "",
      notes: "",
    });
    setShowAddModal(false);
    setIsSubmitting(false);
  };

  const handleExportCSV = () => {
    const headers = ["Date", "Symbol", "Type", "Quantity", "Price", "P&L", "Notes"];
    const rows = trades.map((t) => [
      t.trade_date,
      t.symbol,
      t.asset_type,
      t.quantity,
      t.price,
      t.pnl,
      t.notes || "",
    ]);

    const csv = [headers, ...rows].map((row) => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `gainsview-trades-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleBulkImport = async (tradesToImport: Omit<Trade, "id" | "user_id" | "created_at">[]) => {
    // Import trades one by one
    for (const trade of tradesToImport) {
      await addTrade(trade);
    }
    // Refetch to update the list
    refetch();
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return null;
    return sortDirection === "asc" ? (
      <ChevronUp className="w-3 h-3" />
    ) : (
      <ChevronDown className="w-3 h-3" />
    );
  };

  // Generate last 35 days for calendar
  const calendarDays = useMemo(() => {
    const days = [];
    const today = new Date();
    for (let i = 34; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split("T")[0];
      days.push({
        date: dateStr,
        pnl: calendarData[dateStr] || 0,
        dayOfWeek: date.getDay(),
      });
    }
    return days;
  }, [calendarData]);

  return (
    <div className="min-h-full bg-gradient-to-br from-brown-950 via-brown-900 to-brown-950 text-brown-50 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <Logo size="medium" glow />
            <div>
              <h1 className="text-2xl font-bold text-brown-50">P&L Tracker</h1>
              <p className="text-brown-400 text-sm">Track your trading performance</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setShowImportModal(true)}
              className="border-brown-700 text-brown-300 hover:bg-brown-800"
            >
              <Upload className="w-4 h-4 mr-2" />
              Import
            </Button>
            <Button
              variant="outline"
              onClick={handleExportCSV}
              disabled={trades.length === 0}
              className="border-brown-700 text-brown-300 hover:bg-brown-800"
            >
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
            <Button
              onClick={() => setShowAddModal(true)}
              className="bg-gold-500 hover:bg-gold-600 text-brown-900"
            >
              <Plus className="w-4 h-4 mr-2" />
              Log Trade
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Total P&L */}
          <Card className="bg-brown-800/50 border-brown-700">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="w-4 h-4 text-gold-400" />
                <span className="text-xs text-brown-400 uppercase">Total P&L</span>
              </div>
              <p
                className={cn(
                  "text-2xl font-bold",
                  stats.totalPnL >= 0 ? "text-emerald-400" : "text-red-400"
                )}
              >
                {stats.totalPnL >= 0 ? "+" : ""}${Math.abs(stats.totalPnL).toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </p>
            </CardContent>
          </Card>

          {/* This Month */}
          <Card className="bg-brown-800/50 border-brown-700">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="w-4 h-4 text-blue-400" />
                <span className="text-xs text-brown-400 uppercase">This Month</span>
              </div>
              <p
                className={cn(
                  "text-2xl font-bold",
                  stats.monthPnL >= 0 ? "text-emerald-400" : "text-red-400"
                )}
              >
                {stats.monthPnL >= 0 ? "+" : ""}${Math.abs(stats.monthPnL).toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </p>
            </CardContent>
          </Card>

          {/* Win Rate */}
          <Card className="bg-brown-800/50 border-brown-700">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Percent className="w-4 h-4 text-amber-400" />
                <span className="text-xs text-brown-400 uppercase">Win Rate</span>
              </div>
              <p className="text-2xl font-bold text-gold-400">
                {stats.winRate.toFixed(0)}%
              </p>
              <p className="text-xs text-brown-500 mt-1">
                {stats.winCount}W / {stats.lossCount}L
              </p>
            </CardContent>
          </Card>

          {/* Avg Win/Loss */}
          <Card className="bg-brown-800/50 border-brown-700">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Target className="w-4 h-4 text-purple-400" />
                <span className="text-xs text-brown-400 uppercase">Avg W/L</span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-lg font-bold text-emerald-400">
                  +${stats.avgWin.toFixed(0)}
                </span>
                <span className="text-brown-500">/</span>
                <span className="text-lg font-bold text-red-400">
                  -${stats.avgLoss.toFixed(0)}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Performance Chart */}
        <Card className="bg-brown-800/50 border-brown-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-gold-400" />
                <span className="text-sm font-medium text-brown-200">
                  Cumulative P&L
                </span>
              </div>
              <div className="flex gap-1">
                {(["week", "month", "all"] as ChartRange[]).map((range) => (
                  <button
                    key={range}
                    type="button"
                    onClick={() => setChartRange(range)}
                    className={cn(
                      "px-3 py-1 text-xs font-medium rounded-lg transition-colors",
                      chartRange === range
                        ? "bg-gold-500/20 text-gold-400"
                        : "text-brown-400 hover:bg-brown-700/50"
                    )}
                  >
                    {range === "week" ? "1W" : range === "month" ? "1M" : "All"}
                  </button>
                ))}
              </div>
            </div>

            {chartData.length > 0 ? (
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <XAxis
                      dataKey="date"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: "#8B7355", fontSize: 10 }}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: "#8B7355", fontSize: 10 }}
                      tickFormatter={(v) => `$${v}`}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#2A2420",
                        border: "1px solid #4A403A",
                        borderRadius: "8px",
                      }}
                      labelStyle={{ color: "#D4B896" }}
                      formatter={(value) => [
                        `$${Number(value).toLocaleString()}`,
                        "Cumulative P&L",
                      ]}
                    />
                    <ReferenceLine y={0} stroke="#4A403A" strokeDasharray="3 3" />
                    <Line
                      type="monotone"
                      dataKey="pnl"
                      stroke="#D4B896"
                      strokeWidth={2}
                      dot={false}
                      activeDot={{ r: 4, fill: "#D4B896" }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-48 flex items-center justify-center text-brown-500">
                No data for selected period
              </div>
            )}
          </CardContent>
        </Card>

        {/* Calendar Heatmap */}
        <Card className="bg-brown-800/50 border-brown-700">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-4">
              <Calendar className="w-4 h-4 text-gold-400" />
              <span className="text-sm font-medium text-brown-200">
                Trading Activity (Last 35 Days)
              </span>
            </div>
            <div className="flex flex-wrap gap-1">
              {calendarDays.map((day, i) => {
                const intensity = Math.min(Math.abs(day.pnl) / 500, 1);
                return (
                  <div
                    key={i}
                    title={`${day.date}: $${day.pnl.toLocaleString()}`}
                    className={cn(
                      "w-6 h-6 rounded-sm transition-colors cursor-default",
                      day.pnl === 0 && "bg-brown-700/50",
                      day.pnl > 0 && `bg-emerald-500`,
                      day.pnl < 0 && `bg-red-500`
                    )}
                    style={{
                      opacity: day.pnl === 0 ? 0.3 : 0.3 + intensity * 0.7,
                    }}
                  />
                );
              })}
            </div>
            <div className="flex items-center justify-end gap-2 mt-3 text-xs text-brown-500">
              <span>Loss</span>
              <div className="flex gap-0.5">
                <div className="w-3 h-3 rounded-sm bg-red-500 opacity-40" />
                <div className="w-3 h-3 rounded-sm bg-red-500 opacity-70" />
                <div className="w-3 h-3 rounded-sm bg-red-500" />
              </div>
              <div className="w-3 h-3 rounded-sm bg-brown-700/50" />
              <div className="flex gap-0.5">
                <div className="w-3 h-3 rounded-sm bg-emerald-500 opacity-40" />
                <div className="w-3 h-3 rounded-sm bg-emerald-500 opacity-70" />
                <div className="w-3 h-3 rounded-sm bg-emerald-500" />
              </div>
              <span>Profit</span>
            </div>
          </CardContent>
        </Card>

        {/* Trade History Table */}
        <Card className="bg-brown-800/50 border-brown-700 overflow-hidden">
          <div className="p-4 border-b border-brown-700">
            <h2 className="text-sm font-medium text-brown-200">Trade History</h2>
          </div>

          {loading ? (
            <div className="p-8 text-center">
              <Loader2 className="w-6 h-6 text-gold-400 animate-spin mx-auto" />
            </div>
          ) : trades.length === 0 ? (
            <div className="p-8 text-center">
              <TrendingUp className="w-10 h-10 text-brown-600 mx-auto mb-3" />
              <p className="text-brown-400">No trades logged yet</p>
              <p className="text-sm text-brown-500 mt-1">
                Start tracking your P&L by logging your first trade
              </p>
            </div>
          ) : (
            <>
              {/* Table Header */}
              <div className="grid grid-cols-12 gap-2 px-4 py-2 bg-brown-900/50 text-xs font-medium text-brown-400 uppercase">
                <button
                  type="button"
                  onClick={() => handleSort("trade_date")}
                  className="col-span-2 flex items-center gap-1 hover:text-brown-200"
                >
                  Date <SortIcon field="trade_date" />
                </button>
                <button
                  type="button"
                  onClick={() => handleSort("symbol")}
                  className="col-span-3 flex items-center gap-1 hover:text-brown-200"
                >
                  Symbol <SortIcon field="symbol" />
                </button>
                <button
                  type="button"
                  onClick={() => handleSort("asset_type")}
                  className="col-span-2 flex items-center gap-1 hover:text-brown-200"
                >
                  Type <SortIcon field="asset_type" />
                </button>
                <button
                  type="button"
                  onClick={() => handleSort("pnl")}
                  className="col-span-2 flex items-center gap-1 hover:text-brown-200"
                >
                  P&L <SortIcon field="pnl" />
                </button>
                <div className="col-span-2">Notes</div>
                <div className="col-span-1" />
              </div>

              {/* Table Body */}
              <div className="divide-y divide-brown-700/50">
                {paginatedTrades.map((trade) => (
                  <div
                    key={trade.id}
                    className="grid grid-cols-12 gap-2 px-4 py-3 items-center hover:bg-brown-700/20 transition-colors"
                  >
                    <div className="col-span-2 text-sm text-brown-300">
                      {new Date(trade.trade_date).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}
                    </div>
                    <div className="col-span-3">
                      <span className="font-medium text-brown-100">
                        {trade.symbol}
                      </span>
                    </div>
                    <div className="col-span-2">
                      <span
                        className={cn(
                          "text-xs px-2 py-0.5 rounded-full",
                          trade.asset_type === "call" &&
                            "bg-emerald-500/20 text-emerald-400",
                          trade.asset_type === "put" &&
                            "bg-red-500/20 text-red-400",
                          trade.asset_type === "stock" &&
                            "bg-blue-500/20 text-blue-400"
                        )}
                      >
                        {trade.asset_type}
                      </span>
                    </div>
                    <div className="col-span-2">
                      <span
                        className={cn(
                          "font-semibold",
                          parsePnL(trade.pnl) >= 0 ? "text-emerald-400" : "text-red-400"
                        )}
                      >
                        {parsePnL(trade.pnl) >= 0 ? "+" : ""}$
                        {Math.abs(parsePnL(trade.pnl)).toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </span>
                    </div>
                    <div className="col-span-2 text-xs text-brown-500 truncate">
                      {trade.notes || "—"}
                    </div>
                    <div className="col-span-1 text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteTrade(trade.id)}
                        className="h-7 w-7 text-brown-500 hover:text-red-400"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between px-4 py-3 border-t border-brown-700">
                  <span className="text-xs text-brown-500">
                    Page {currentPage} of {totalPages}
                  </span>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="h-7 text-brown-400"
                    >
                      Previous
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="h-7 text-brown-400"
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </Card>
      </div>

      {/* Add Trade Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-brown-900 border border-brown-700 rounded-2xl shadow-2xl">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-brown-700">
              <h2 className="text-lg font-semibold text-brown-50">Log New Trade</h2>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="p-1 text-brown-400 hover:text-brown-200 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 space-y-4">
              {/* Date & Symbol */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-brown-300">Date</Label>
                  <Input
                    type="date"
                    value={formData.date}
                    onChange={(e) =>
                      setFormData({ ...formData, date: e.target.value })
                    }
                    className="bg-brown-800 border-brown-700 text-brown-100"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-brown-300">Symbol</Label>
                  <Input
                    placeholder="AAPL, TSLA, etc."
                    value={formData.symbol}
                    onChange={(e) =>
                      setFormData({ ...formData, symbol: e.target.value })
                    }
                    className="bg-brown-800 border-brown-700 text-brown-100"
                  />
                </div>
              </div>

              {/* Asset Type */}
              <div className="space-y-2">
                <Label className="text-brown-300">Asset Type</Label>
                <div className="grid grid-cols-3 gap-2">
                  {(["call", "put", "stock"] as const).map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setFormData({ ...formData, asset_type: type })}
                      className={cn(
                        "py-2 px-4 rounded-lg border text-sm font-medium transition-colors capitalize",
                        formData.asset_type === type
                          ? "bg-gold-500/20 border-gold-500 text-gold-400"
                          : "bg-brown-800 border-brown-700 text-brown-300 hover:border-brown-600"
                      )}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              {/* Entry & Exit Price */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-brown-300">Entry Price ($)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="1.50"
                    value={formData.entry_price}
                    onChange={(e) =>
                      setFormData({ ...formData, entry_price: e.target.value })
                    }
                    className="bg-brown-800 border-brown-700 text-brown-100"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-brown-300">Exit Price ($)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="2.50"
                    value={formData.exit_price}
                    onChange={(e) =>
                      setFormData({ ...formData, exit_price: e.target.value })
                    }
                    className="bg-brown-800 border-brown-700 text-brown-100"
                  />
                </div>
              </div>

              {/* Quantity & Fees */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-brown-300">
                    Quantity {formData.asset_type !== "stock" && "(contracts)"}
                  </Label>
                  <Input
                    type="number"
                    placeholder="10"
                    value={formData.quantity}
                    onChange={(e) =>
                      setFormData({ ...formData, quantity: e.target.value })
                    }
                    className="bg-brown-800 border-brown-700 text-brown-100"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-brown-300">Fees ($) (optional)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="1.30"
                    value={formData.fees}
                    onChange={(e) =>
                      setFormData({ ...formData, fees: e.target.value })
                    }
                    className="bg-brown-800 border-brown-700 text-brown-100"
                  />
                </div>
              </div>

              {/* Calculated P&L Preview */}
              {formData.entry_price && formData.exit_price && formData.quantity && (
                <div className="p-3 bg-brown-800/50 rounded-lg border border-brown-700">
                  <span className="text-xs text-brown-400">Calculated P&L: </span>
                  {(() => {
                    const entry = parseFloat(formData.entry_price) || 0;
                    const exit = parseFloat(formData.exit_price) || 0;
                    const qty = parseInt(formData.quantity) || 0;
                    const fees = parseFloat(formData.fees) || 0;
                    const mult = formData.asset_type === "stock" ? 1 : 100;
                    const pnl = (exit - entry) * qty * mult - fees;
                    return (
                      <span
                        className={cn(
                          "font-bold",
                          pnl >= 0 ? "text-emerald-400" : "text-red-400"
                        )}
                      >
                        {pnl >= 0 ? "+" : ""}${pnl.toFixed(2)}
                      </span>
                    );
                  })()}
                </div>
              )}

              {/* Notes */}
              <div className="space-y-2">
                <Label className="text-brown-300">Notes (optional)</Label>
                <Input
                  placeholder="Trade notes, strategy, lessons learned..."
                  value={formData.notes}
                  onChange={(e) =>
                    setFormData({ ...formData, notes: e.target.value })
                  }
                  className="bg-brown-800 border-brown-700 text-brown-100"
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex gap-2 p-4 border-t border-brown-700">
              <Button
                variant="ghost"
                onClick={() => setShowAddModal(false)}
                className="flex-1 text-brown-400"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={!formData.symbol || !formData.quantity || isSubmitting}
                className="flex-1 bg-gold-500 hover:bg-gold-600 text-brown-900"
              >
                {isSubmitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  "Save Trade"
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Import Trades Modal */}
      <ImportTradesModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        existingTrades={trades}
        onImport={handleBulkImport}
      />
    </div>
  );
}
