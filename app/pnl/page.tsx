"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import {
  Plus,
  Calendar,
  Trash2,
  Download,
  Upload,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  X,
  DollarSign,
  Percent,
  Target,
  TrendingUp,
  TrendingDown,
  Loader2,
  Pencil,
  Camera,
  Image as ImageIcon,
  Share2,
  AlertCircle,
  List,
  BarChart3,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Logo from "@/components/shared/Logo";
import ImportTradesModal from "@/components/ImportTradesModal";
import DayOfWeekHeatmap from "@/components/pnl/DayOfWeekHeatmap";
import TickerLeaderboard from "@/components/pnl/TickerLeaderboard";
import SocialShareModal, { DayShareData, TradeShareData } from "@/components/pnl/SocialShareModal";
import PnLOnboarding from "@/components/pnl/PnLOnboarding";
import BatchScreenshotUpload from "@/components/pnl/BatchScreenshotUpload";
import { useTrades, Trade } from "@/hooks/useUserData";
import { useTimezone } from "@/contexts/TimezoneContext";
import { parseLocalDate, toLocalDateStr } from "@/lib/trade-analytics";
import { cn } from "@/lib/utils";

type ViewMode = "calendar" | "list";

interface DayData {
  date: string;
  trades: Trade[];
  totalPnL: number;
  isCurrentMonth: boolean;
  isToday: boolean;
}

interface WeekData {
  weekNumber: number;
  startDate: string;
  endDate: string;
  days: DayData[];
  trades: Trade[];
  totalPnL: number;
  tradeCount: number;
  winCount: number;
  lossCount: number;
  winRate: number;
}

interface ExtractedTrade {
  symbol: string;
  strikePrice: number | null;
  optionType: "call" | "put" | "stock";
  expirationDate: string | null;
  quantity: number;
  entryPrice: number | null;
  exitPrice: number | null;
  totalCost: number | null;
  totalCredit: number | null;
  profitLoss: number;
  profitLossPercent: number | null;
  closeDate: string;
  isProfit: boolean;
}

// Format P&L for desktop (full amount with cents)
const formatPnLDesktop = (amount: number): string => {
  const abs = Math.abs(amount);
  const sign = amount > 0 ? "+" : amount < 0 ? "-" : "";
  return `${sign}$${abs.toFixed(2)}`;
};

// Format P&L for mobile (compact - no cents, k format for 1000+)
const formatPnLMobile = (amount: number): string => {
  const abs = Math.abs(amount);
  const sign = amount > 0 ? "+" : amount < 0 ? "-" : "";
  if (abs >= 1000) {
    return `${sign}$${(abs / 1000).toFixed(1)}k`;
  }
  return `${sign}$${Math.round(abs)}`;
};

export default function PnLPage() {
  const { trades, loading, addTrade, updateTrade, deleteTrade, refetch } = useTrades();
  const { getToday } = useTimezone();

  // View mode
  const [viewMode, setViewMode] = useState<ViewMode>("calendar");

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showDayModal, setShowDayModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showWeekModal, setShowWeekModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showScreenshotModal, setShowScreenshotModal] = useState(false);
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [showImportDropdown, setShowImportDropdown] = useState(false);

  // Selected data
  const [selectedDay, setSelectedDay] = useState<DayData | null>(null);
  const [selectedWeek, setSelectedWeek] = useState<WeekData | null>(null);
  const [editingTrade, setEditingTrade] = useState<Trade | null>(null);

  // Share modal state
  const [shareMode, setShareMode] = useState<"overview" | "day" | "trade">("overview");
  const [shareDayData, setShareDayData] = useState<DayShareData | null>(null);
  const [shareTradeData, setShareTradeData] = useState<TradeShareData | null>(null);
  const [shareWeekData, setShareWeekData] = useState<WeekData | null>(null);

  // Screenshot state
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null);
  const [extractedTrade, setExtractedTrade] = useState<ExtractedTrade | null>(null);
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractionError, setExtractionError] = useState<string | null>(null);
  const screenshotInputRef = useRef<HTMLInputElement>(null);

  // Form states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [calendarDate, setCalendarDate] = useState(new Date());

  const [formData, setFormData] = useState({
    date: "",
    symbol: "",
    asset_type: "call" as "stock" | "call" | "put",
    trade_type: "sell" as "buy" | "sell",
    entry_price: "",
    exit_price: "",
    quantity: "",
    fees: "",
    notes: "",
  });

  const [editFormData, setEditFormData] = useState({
    date: "",
    symbol: "",
    asset_type: "call" as "stock" | "call" | "put",
    quantity: "",
    entry_price: "",
    exit_price: "",
    pnl: "",
    notes: "",
  });

  // Lock body scroll when modal is open
  const anyModalOpen = showAddModal || showDayModal || showEditModal || showWeekModal || showShareModal || showScreenshotModal || showBatchModal || showImportModal;
  const scrollYRef = useRef(0);

  useEffect(() => {
    if (anyModalOpen) {
      scrollYRef.current = window.scrollY;
      document.body.style.position = "fixed";
      document.body.style.top = `-${scrollYRef.current}px`;
      document.body.style.left = "0";
      document.body.style.right = "0";
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.position = "";
        document.body.style.top = "";
        document.body.style.left = "";
        document.body.style.right = "";
        document.body.style.overflow = "";
        window.scrollTo(0, scrollYRef.current);
      };
    }
  }, [anyModalOpen]);

  // Calculate stats
  const stats = useMemo(() => {
    const totalPnL = trades.reduce((sum, t) => sum + (t.pnl || 0), 0);
    const wins = trades.filter((t) => (t.pnl || 0) > 0);
    const losses = trades.filter((t) => (t.pnl || 0) < 0);
    const winRate = trades.length > 0 ? (wins.length / trades.length) * 100 : 0;
    const avgWin = wins.length > 0 ? wins.reduce((s, t) => s + (t.pnl || 0), 0) / wins.length : 0;
    const avgLoss = losses.length > 0 ? Math.abs(losses.reduce((s, t) => s + (t.pnl || 0), 0) / losses.length) : 0;

    // This month's P&L
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const thisMonthTrades = trades.filter((t) => new Date(t.trade_date) >= monthStart);
    const thisMonthPnL = thisMonthTrades.reduce((sum, t) => sum + (t.pnl || 0), 0);

    return { totalPnL, wins: wins.length, losses: losses.length, winRate, avgWin, avgLoss, thisMonthPnL };
  }, [trades]);

  // Calculate monthly P&L for the calendar view
  const monthlyPnL = useMemo(() => {
    const year = calendarDate.getFullYear();
    const month = calendarDate.getMonth();
    const monthStart = new Date(year, month, 1);
    const monthEnd = new Date(year, month + 1, 0);

    const monthTrades = trades.filter((t) => {
      const d = parseLocalDate(t.trade_date.split("T")[0]);
      return d >= monthStart && d <= monthEnd;
    });

    return monthTrades.reduce((sum, t) => sum + (t.pnl || 0), 0);
  }, [trades, calendarDate]);

  // Generate calendar data
  const calendarWeeks = useMemo(() => {
    const year = calendarDate.getFullYear();
    const month = calendarDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const today = getToday();

    // Group trades by date
    const tradesByDate = new Map<string, Trade[]>();
    trades.forEach((trade) => {
      const dateStr = trade.trade_date.split("T")[0];
      if (!tradesByDate.has(dateStr)) {
        tradesByDate.set(dateStr, []);
      }
      tradesByDate.get(dateStr)!.push(trade);
    });

    const weeks: WeekData[] = [];
    let currentWeek: DayData[] = [];
    let weekNumber = 1;

    // Get the week number of the first day of the month
    const getWeekOfYear = (date: Date) => {
      const startOfYear = new Date(date.getFullYear(), 0, 1);
      const days = Math.floor((date.getTime() - startOfYear.getTime()) / (24 * 60 * 60 * 1000));
      return Math.ceil((days + startOfYear.getDay() + 1) / 7);
    };
    weekNumber = getWeekOfYear(firstDay);

    // Fill in days before the first of the month
    const startPadding = firstDay.getDay();
    for (let i = 0; i < startPadding; i++) {
      const prevDate = new Date(year, month, -(startPadding - i - 1));
      const dateStr = toLocalDateStr(prevDate);
      const dayTrades = tradesByDate.get(dateStr) || [];
      currentWeek.push({
        date: dateStr,
        trades: dayTrades,
        totalPnL: dayTrades.reduce((sum, t) => sum + (t.pnl || 0), 0),
        isCurrentMonth: false,
        isToday: dateStr === today,
      });
    }

    // Fill in days of the month
    for (let day = 1; day <= lastDay.getDate(); day++) {
      const date = new Date(year, month, day);
      const dateStr = toLocalDateStr(date);
      const dayTrades = tradesByDate.get(dateStr) || [];

      currentWeek.push({
        date: dateStr,
        trades: dayTrades,
        totalPnL: dayTrades.reduce((sum, t) => sum + (t.pnl || 0), 0),
        isCurrentMonth: true,
        isToday: dateStr === today,
      });

      // Saturday = end of week
      if (date.getDay() === 6) {
        const weekTrades = currentWeek.flatMap((d) => d.trades);
        const totalPnL = weekTrades.reduce((sum, t) => sum + (t.pnl || 0), 0);
        const winCount = weekTrades.filter((t) => (t.pnl || 0) > 0).length;
        const lossCount = weekTrades.filter((t) => (t.pnl || 0) < 0).length;

        weeks.push({
          weekNumber,
          startDate: currentWeek[0].date,
          endDate: currentWeek[currentWeek.length - 1].date,
          days: currentWeek,
          trades: weekTrades,
          totalPnL,
          tradeCount: weekTrades.length,
          winCount,
          lossCount,
          winRate: weekTrades.length > 0 ? (winCount / weekTrades.length) * 100 : 0,
        });

        currentWeek = [];
        weekNumber++;
      }
    }

    // Fill remaining days and create last week
    if (currentWeek.length > 0) {
      const remainingDays = 7 - currentWeek.length;
      for (let i = 1; i <= remainingDays; i++) {
        const nextDate = new Date(year, month + 1, i);
        const dateStr = toLocalDateStr(nextDate);
        const dayTrades = tradesByDate.get(dateStr) || [];
        currentWeek.push({
          date: dateStr,
          trades: dayTrades,
          totalPnL: dayTrades.reduce((sum, t) => sum + (t.pnl || 0), 0),
          isCurrentMonth: false,
          isToday: dateStr === today,
        });
      }

      const weekTrades = currentWeek.flatMap((d) => d.trades);
      const totalPnL = weekTrades.reduce((sum, t) => sum + (t.pnl || 0), 0);
      const winCount = weekTrades.filter((t) => (t.pnl || 0) > 0).length;
      const lossCount = weekTrades.filter((t) => (t.pnl || 0) < 0).length;

      weeks.push({
        weekNumber,
        startDate: currentWeek[0].date,
        endDate: currentWeek[currentWeek.length - 1].date,
        days: currentWeek,
        trades: weekTrades,
        totalPnL,
        tradeCount: weekTrades.length,
        winCount,
        lossCount,
        winRate: weekTrades.length > 0 ? (winCount / weekTrades.length) * 100 : 0,
      });
    }

    return weeks;
  }, [calendarDate, trades, getToday]);

  // Sorted trades for list view
  const sortedTrades = useMemo(() => {
    return [...trades].sort((a, b) => new Date(b.trade_date).getTime() - new Date(a.trade_date).getTime());
  }, [trades]);

  // Handlers
  const handleDayClick = (day: DayData) => {
    setSelectedDay(day);
    setShowDayModal(true);
  };

  const handleWeekClick = (week: WeekData) => {
    if (week.tradeCount > 0) {
      setSelectedWeek(week);
      setShowWeekModal(true);
    }
  };

  const handleEditTrade = (trade: Trade) => {
    setEditingTrade(trade);
    setEditFormData({
      date: trade.trade_date.split("T")[0],
      symbol: trade.symbol,
      asset_type: trade.asset_type,
      quantity: String(trade.quantity),
      entry_price: "",
      exit_price: String(trade.price || ""),
      pnl: String(trade.pnl || ""),
      notes: trade.notes || "",
    });
    setShowEditModal(true);
  };

  const handleSubmit = async () => {
    if (!formData.symbol || !formData.quantity) return;

    setIsSubmitting(true);

    const quantity = parseInt(formData.quantity) || 0;
    const entryPrice = parseFloat(formData.entry_price) || 0;
    const exitPrice = parseFloat(formData.exit_price) || 0;
    const fees = parseFloat(formData.fees) || 0;
    const multiplier = formData.asset_type === "stock" ? 1 : 100;
    const pnl = (exitPrice - entryPrice) * quantity * multiplier - fees;

    await addTrade({
      symbol: formData.symbol.toUpperCase(),
      trade_type: formData.trade_type,
      asset_type: formData.asset_type,
      quantity,
      price: Math.round(exitPrice * 100) / 100,
      total_value: Math.round(exitPrice * quantity * multiplier * 100) / 100,
      pnl: Math.round(pnl * 100) / 100,
      notes: formData.notes || null,
      trade_date: formData.date || getToday(),
    });

    setFormData({
      date: getToday(),
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

  const handleEditSubmit = async () => {
    if (!editingTrade || !editFormData.symbol || !editFormData.quantity) return;

    setIsSubmitting(true);

    const quantity = parseInt(editFormData.quantity) || 0;
    const exitPrice = parseFloat(editFormData.exit_price) || 0;
    const multiplier = editFormData.asset_type === "stock" ? 1 : 100;
    const pnl = parseFloat(editFormData.pnl) || 0;

    const success = await updateTrade(editingTrade.id, {
      symbol: editFormData.symbol.toUpperCase(),
      asset_type: editFormData.asset_type,
      quantity,
      price: Math.round(exitPrice * 100) / 100,
      total_value: Math.round(exitPrice * quantity * multiplier * 100) / 100,
      pnl: Math.round(pnl * 100) / 100,
      notes: editFormData.notes || null,
      trade_date: editFormData.date,
    });

    if (success) {
      setShowEditModal(false);
      setEditingTrade(null);
      if (showDayModal && selectedDay) {
        refetch();
      }
    }
    setIsSubmitting(false);
  };

  const handleExportCSV = () => {
    const headers = ["Date", "Symbol", "Type", "Trade Type", "Quantity", "Price", "P&L", "Notes"];
    const rows = trades.map((t) => [
      t.trade_date.split("T")[0],
      t.symbol,
      t.asset_type,
      t.trade_type,
      t.quantity,
      t.price,
      t.pnl,
      t.notes || "",
    ]);
    const csv = [headers, ...rows].map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `trades-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleBulkImport = async (tradesToImport: Omit<Trade, "id" | "user_id" | "created_at">[]) => {
    for (const trade of tradesToImport) {
      await addTrade(trade);
    }
    refetch();
  };

  // Screenshot handlers
  const handleScreenshotUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setExtractionError("Please upload an image file");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setExtractionError("Image too large. Please upload under 10MB.");
      return;
    }

    setShowImportDropdown(false);
    setShowScreenshotModal(true);
    setExtractionError(null);
    setExtractedTrade(null);
    setIsExtracting(true);

    const reader = new FileReader();
    reader.onload = async (e) => {
      const base64 = e.target?.result as string;
      setScreenshotPreview(base64);

      try {
        const response = await fetch("/api/extract-trade", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ image: base64 }),
        });

        const data = await response.json();

        if (!response.ok || data.error) {
          setExtractionError(data.error || "Failed to analyze screenshot");
          setIsExtracting(false);
          return;
        }

        setExtractedTrade(data.trade);
        setIsExtracting(false);
      } catch {
        setExtractionError("Failed to process screenshot");
        setIsExtracting(false);
      }
    };
    reader.readAsDataURL(file);
    event.target.value = "";
  };

  const handleConfirmScreenshotTrade = async () => {
    if (!extractedTrade) return;

    setIsSubmitting(true);

    const assetType = extractedTrade.optionType === "stock" ? "stock" : extractedTrade.optionType;
    const quantity = extractedTrade.quantity || 1;
    const exitPrice = extractedTrade.exitPrice || 0;
    const multiplier = assetType === "stock" ? 1 : 100;

    await addTrade({
      symbol: extractedTrade.symbol.toUpperCase(),
      trade_type: "sell",
      asset_type: assetType,
      quantity,
      price: Math.round(exitPrice * 100) / 100,
      total_value: Math.round(exitPrice * quantity * multiplier * 100) / 100,
      pnl: Math.round((extractedTrade.profitLoss || 0) * 100) / 100,
      notes: extractedTrade.strikePrice
        ? `$${extractedTrade.strikePrice} ${extractedTrade.optionType} ${extractedTrade.expirationDate || ""}`
        : null,
      trade_date: extractedTrade.closeDate || getToday(),
    });

    setShowScreenshotModal(false);
    setScreenshotPreview(null);
    setExtractedTrade(null);
    setIsSubmitting(false);
  };

  const handleShareDay = (day: DayData) => {
    setShareMode("day");
    setShareDayData({
      date: day.date,
      totalPnL: day.totalPnL,
      trades: day.trades,
    });
    setShowDayModal(false);
    setShowShareModal(true);
  };

  const handleShareTrade = (trade: Trade) => {
    setShareMode("trade");
    setShareTradeData({
      symbol: trade.symbol,
      assetType: trade.asset_type,
      pnl: trade.pnl || 0,
      pctReturn: null,
      entryPrice: null,
      exitPrice: trade.price || null,
      quantity: trade.quantity,
      date: trade.trade_date,
      price: trade.price || 0,
      strikePrice: null,
    });
    setShowDayModal(false);
    setShowShareModal(true);
  };

  // Format date for day modal
  const formatDayModalDate = (dateStr: string) => {
    const date = parseLocalDate(dateStr);
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  };

  // Format short date
  const formatShortDate = (dateStr: string) => {
    const date = parseLocalDate(dateStr.split("T")[0]);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <div className="min-h-full bg-gradient-to-br from-brown-950 via-brown-900 to-brown-950 text-brown-50 p-4 pb-24 overflow-x-hidden max-w-[100vw]">
      <div className="max-w-4xl mx-auto space-y-4 w-full">
        {/* Header */}
        <div className="space-y-3 w-full">
          {/* Title Row */}
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0">
              <Logo size="header" glow />
            </div>
            <div className="min-w-0">
              <h1 className="text-2xl sm:text-xl font-bold text-brown-50">Trading Journal</h1>
              <p className="text-brown-500 text-xs">Track your trading performance</p>
            </div>
          </div>

          {/* Buttons Row - full width on mobile */}
          <div className="flex gap-2 w-full">
            {/* Import Dropdown */}
            <div className="relative flex-1">
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setShowImportDropdown(!showImportDropdown);
                }}
                className="w-full h-8 inline-flex items-center justify-center gap-1.5 rounded-md border border-brown-700 bg-transparent text-brown-300 hover:bg-brown-800 active:bg-brown-700 text-xs font-medium transition-colors touch-manipulation"
              >
                <Upload className="w-4 h-4" />
                Import
                <ChevronDown className={cn("w-3 h-3 transition-transform", showImportDropdown && "rotate-180")} />
              </button>
              {showImportDropdown && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setShowImportDropdown(false)}
                    onTouchEnd={() => setShowImportDropdown(false)}
                  />
                  <div className="absolute left-0 right-0 sm:left-auto sm:right-0 sm:w-52 mt-1 bg-brown-900 border border-brown-700 rounded-lg shadow-2xl z-50 overflow-hidden">
                    <button
                      type="button"
                      onClick={() => {
                        setShowImportDropdown(false);
                        setShowImportModal(true);
                      }}
                      className="w-full flex items-center gap-3 px-4 py-3.5 text-sm text-brown-200 hover:bg-brown-800 active:bg-brown-700 touch-manipulation"
                    >
                      <Upload className="w-4 h-4 text-brown-400" />
                      Import CSV
                    </button>
                    <label className="w-full flex items-center gap-3 px-4 py-3.5 text-sm text-brown-200 hover:bg-brown-800 active:bg-brown-700 cursor-pointer touch-manipulation">
                      <Camera className="w-4 h-4 text-gold-400" />
                      Upload Screenshot
                      <input type="file" accept="image/*" onChange={handleScreenshotUpload} className="hidden" />
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setShowImportDropdown(false);
                        setShowBatchModal(true);
                      }}
                      className="w-full flex items-center gap-3 px-4 py-3.5 text-sm text-brown-200 hover:bg-brown-800 active:bg-brown-700 border-t border-brown-700/50 touch-manipulation"
                    >
                      <ImageIcon className="w-4 h-4 text-gold-400" />
                      Batch Screenshots
                    </button>
                  </div>
                </>
              )}
            </div>
            {/* Share */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setShareMode("overview");
                setShareDayData(null);
                setShareTradeData(null);
                setShareWeekData(null);
                setShowShareModal(true);
              }}
              disabled={trades.length === 0}
              className="flex-1 border-brown-700 text-brown-300 hover:bg-brown-800 text-xs justify-center"
            >
              <ImageIcon className="w-4 h-4 mr-1.5" />
              Share
            </Button>
            {/* Log Trade */}
            <Button
              size="sm"
              onClick={() => {
                setFormData((f) => ({ ...f, date: f.date || getToday() }));
                setShowAddModal(true);
              }}
              className="flex-1 bg-gold-500 hover:bg-gold-600 text-brown-900 text-xs justify-center"
            >
              <Plus className="w-4 h-4 mr-1.5" />
              Log Trade
            </Button>
          </div>
        </div>

        {/* Stats Cards - 2x2 Grid */}
        <div className="grid grid-cols-2 gap-3">
          <Card className="bg-brown-800/50 border-brown-700/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-1.5 text-brown-400 mb-1">
                <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-sm font-semibold uppercase tracking-wider">Total P&L</span>
              </div>
              <p className={cn(
                "text-3xl md:text-4xl font-bold",
                stats.totalPnL >= 0 ? "text-emerald-400" : "text-red-400"
              )}>
                {stats.totalPnL >= 0 ? "+" : "-"}${Math.abs(stats.totalPnL).toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </p>
            </CardContent>
          </Card>
          <Card className="bg-brown-800/50 border-brown-700/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-1.5 text-brown-400 mb-1">
                <Calendar className="w-3.5 h-3.5 text-blue-400" />
                <span className="text-sm font-semibold uppercase tracking-wider">This Month</span>
              </div>
              <p className={cn(
                "text-3xl md:text-4xl font-bold",
                stats.thisMonthPnL >= 0 ? "text-emerald-400" : "text-red-400"
              )}>
                {stats.thisMonthPnL >= 0 ? "+" : "-"}${Math.abs(stats.thisMonthPnL).toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </p>
            </CardContent>
          </Card>
          <Card className="bg-brown-800/50 border-brown-700/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-1.5 text-brown-400 mb-1">
                <Percent className="w-3.5 h-3.5 text-[#D4AF37]" />
                <span className="text-sm font-semibold uppercase tracking-wider">Win Rate</span>
              </div>
              <p className="text-3xl md:text-4xl font-bold text-[#D4AF37]">{stats.winRate.toFixed(0)}%</p>
              <p className="text-sm md:text-base text-brown-500">{stats.wins}W / {stats.losses}L</p>
            </CardContent>
          </Card>
          <Card className="bg-brown-800/50 border-brown-700/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-1.5 text-brown-400 mb-1">
                <Target className="w-3.5 h-3.5 text-teal-400" />
                <span className="text-sm font-semibold uppercase tracking-wider">Avg W/L</span>
              </div>
              <p className="text-2xl md:text-3xl font-bold">
                <span className="text-emerald-400">+${stats.avgWin.toFixed(0)}</span>
                <span className="text-brown-500 mx-1">/</span>
                <span className="text-red-400">-${stats.avgLoss.toFixed(0)}</span>
              </p>
            </CardContent>
          </Card>
        </div>

        {/* View Toggle */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewMode("calendar")}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-all",
              viewMode === "calendar"
                ? "bg-brown-800 border-brown-600 text-brown-100"
                : "border-brown-700/50 text-brown-500 hover:text-brown-300"
            )}
          >
            <Calendar className="w-3.5 h-3.5" />
            Calendar
          </button>
          <button
            onClick={() => setViewMode("list")}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-all",
              viewMode === "list"
                ? "bg-brown-800 border-brown-600 text-brown-100"
                : "border-brown-700/50 text-brown-500 hover:text-brown-300"
            )}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            List View
          </button>
        </div>

        {/* Calendar View */}
        {viewMode === "calendar" && (
          <Card className="bg-brown-900/50 border-brown-700/50 overflow-hidden">
            <CardContent className="p-4">
              {/* Monthly P&L Header */}
              <div className="text-center mb-4">
                <span className="text-brown-400 text-base">Monthly P/L: </span>
                <span className={cn("text-xl font-bold", monthlyPnL >= 0 ? "text-emerald-400" : "text-rose-400")}>
                  {monthlyPnL >= 0 ? "+" : "-"}${Math.abs(monthlyPnL).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
              </div>

              {/* Month Navigation */}
              <div className="flex items-center justify-between mb-4">
                <button
                  onClick={() => setCalendarDate(new Date(calendarDate.getFullYear(), calendarDate.getMonth() - 1))}
                  className="p-1.5 text-brown-400 hover:text-brown-200 transition-colors"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <h2 className="text-base font-semibold text-brown-100">
                  {calendarDate.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
                </h2>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCalendarDate(new Date())}
                    className="text-xs text-brown-400 hover:text-brown-200 transition-colors"
                  >
                    Today
                  </button>
                  <button
                    onClick={() => setCalendarDate(new Date(calendarDate.getFullYear(), calendarDate.getMonth() + 1))}
                    className="p-1.5 text-brown-400 hover:text-brown-200 transition-colors"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Day Headers */}
              <div className="grid grid-cols-7 gap-1 mb-1">
                {weekDays.map((day, i) => (
                  <div key={i} className="text-center text-[10px] sm:text-xs md:text-sm text-brown-500 font-medium py-1">
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar Grid */}
              <div className="space-y-1">
                {calendarWeeks.map((week, weekIndex) => (
                  <div key={weekIndex} className="grid grid-cols-7 gap-1">
                    {week.days.map((day, dayIndex) => {
                      const isSaturday = dayIndex === 6;
                      const hasTrades = day.trades.length > 0;
                      const isProfit = day.totalPnL > 0;
                      const isLoss = day.totalPnL < 0;
                      const isBreakeven = hasTrades && !isProfit && !isLoss;

                      // Saturday cell shows weekly summary if week has trades
                      const showWeeklySummary = isSaturday && week.tradeCount > 0;

                      // Previous/next month overflow days - muted warm brown text only
                      if (!day.isCurrentMonth) {
                        return (
                          <div
                            key={day.date}
                            className="min-h-[60px] md:min-h-[100px] flex flex-col items-center justify-center p-1"
                          >
                            <span className="text-[10px] sm:text-xs md:text-sm text-brown-600">
                              {parseLocalDate(day.date).getDate()}
                            </span>
                          </div>
                        );
                      }

                      // Weekly summary cell (Saturday with trades this week)
                      if (showWeeklySummary) {
                        return (
                          <button
                            key={day.date}
                            onClick={() => handleWeekClick(week)}
                            className="min-h-[60px] md:min-h-[100px] rounded-md border border-[#D4AF37] bg-[#D4AF37]/20 hover:bg-[#D4AF37]/30 transition-all flex flex-col items-center justify-center cursor-pointer p-1 overflow-hidden min-w-0"
                          >
                            <span className="text-[10px] sm:text-xs md:text-sm text-brown-200">
                              {parseLocalDate(day.date).getDate()}
                            </span>
                            {/* W# on mobile, Week # on desktop */}
                            <span className="text-[8px] sm:text-[10px] text-[#D4AF37] font-medium">
                              <span className="sm:hidden">W{week.weekNumber}</span>
                              <span className="hidden sm:inline">Week {week.weekNumber}</span>
                            </span>
                            <span className={cn(
                              "text-[10px] sm:text-xs md:text-sm font-bold whitespace-nowrap",
                              week.totalPnL >= 0 ? "text-emerald-400" : "text-red-400"
                            )}>
                              {formatPnLMobile(week.totalPnL)}
                            </span>
                            {/* Abbreviated on mobile, full on desktop */}
                            <span className="text-[8px] sm:text-[9px] text-[#D4AF37]">
                              <span className="sm:hidden">{week.tradeCount}t</span>
                              <span className="hidden sm:inline">{week.tradeCount} trades</span>
                            </span>
                          </button>
                        );
                      }

                      // Regular day cell
                      return (
                        <button
                          key={day.date}
                          onClick={() => handleDayClick(day)}
                          className={cn(
                            "min-h-[60px] md:min-h-[100px] rounded-md border transition-all flex flex-col cursor-pointer p-1 sm:p-2 relative overflow-hidden min-w-0",
                            "border-brown-700/50",
                            hasTrades && isProfit && "bg-emerald-900/30 hover:bg-emerald-900/40",
                            hasTrades && isLoss && "bg-red-900/25 hover:bg-red-900/35",
                            isBreakeven && "bg-brown-800/40 hover:bg-brown-800/50",
                            !hasTrades && "bg-transparent hover:bg-brown-800/20"
                          )}
                        >
                          {/* Today indicator */}
                          {day.isToday && (
                            <div className="absolute top-1 right-1 w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-emerald-400" />
                          )}
                          {/* Date number */}
                          <span className={cn(
                            "text-[10px] sm:text-xs md:text-sm",
                            hasTrades ? "text-white" : "text-brown-400"
                          )}>
                            {parseLocalDate(day.date).getDate()}
                          </span>
                          {hasTrades && (
                            <div className="flex-1 flex flex-col items-center justify-center min-w-0">
                              {/* P&L - mobile compact, desktop full */}
                              <span className={cn(
                                "text-[10px] sm:text-xs md:text-sm font-bold whitespace-nowrap",
                                isProfit ? "text-emerald-400" : isLoss ? "text-red-400" : "text-brown-300"
                              )}>
                                <span className="sm:hidden">{formatPnLMobile(day.totalPnL)}</span>
                                <span className="hidden sm:inline">{formatPnLDesktop(day.totalPnL)}</span>
                              </span>
                              {/* Trade count - abbreviated on mobile */}
                              <span className="text-[8px] sm:text-[10px] text-brown-500">
                                <span className="sm:hidden">{day.trades.length}t</span>
                                <span className="hidden sm:inline">{day.trades.length} {day.trades.length === 1 ? "trade" : "trades"}</span>
                              </span>
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* List View */}
        {viewMode === "list" && (
          <Card className="bg-brown-800/50 border-brown-700/50 overflow-hidden">
            <div className="p-3 border-b border-brown-700/50">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-medium text-brown-200">Trade History</h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleExportCSV}
                  disabled={trades.length === 0}
                  className="text-xs text-brown-400 hover:text-brown-200"
                >
                  <Download className="w-3.5 h-3.5 mr-1" />
                  Export
                </Button>
              </div>
            </div>

            {loading ? (
              <div className="p-8 text-center">
                <Loader2 className="w-6 h-6 text-gold-400 animate-spin mx-auto" />
              </div>
            ) : trades.length === 0 ? (
              <div className="p-8 text-center">
                <TrendingUp className="w-8 h-8 text-brown-600 mx-auto mb-2" />
                <p className="text-brown-500 text-sm">No trades logged yet</p>
              </div>
            ) : (
              <div className="divide-y divide-brown-700/30">
                {sortedTrades.map((trade) => (
                  <div key={trade.id} className="p-3 flex items-center justify-between hover:bg-brown-700/20">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-brown-100 text-sm">{trade.symbol}</span>
                        <span className={cn(
                          "text-[10px] px-1.5 py-0.5 rounded font-medium",
                          trade.asset_type === "call" ? "bg-teal-500/20 text-teal-400" :
                          trade.asset_type === "put" ? "bg-purple-500/20 text-purple-400" :
                          "bg-brown-600/30 text-brown-400"
                        )}>
                          {trade.asset_type}
                        </span>
                      </div>
                      <p className="text-[10px] text-brown-500">{formatShortDate(trade.trade_date)}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={cn(
                        "font-bold text-sm",
                        (trade.pnl || 0) >= 0 ? "text-emerald-400" : "text-red-400"
                      )}>
                        {(trade.pnl || 0) >= 0 ? "+" : ""}${Math.abs(trade.pnl || 0).toFixed(2)}
                      </span>
                      <button
                        onClick={() => handleShareTrade(trade)}
                        className="p-1 text-brown-500 hover:text-blue-400"
                      >
                        <Share2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleEditTrade(trade)}
                        className="p-1 text-brown-500 hover:text-brown-300"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => deleteTrade(trade.id)}
                        className="p-1 text-brown-500 hover:text-red-400"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        )}

        {/* Analytics Section */}
        {!loading && trades.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-sm font-semibold text-brown-200">Performance Analytics</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <DayOfWeekHeatmap trades={trades} />
              <TickerLeaderboard trades={trades} />
            </div>
          </div>
        )}

        {/* Day Detail Modal */}
        {showDayModal && selectedDay && typeof document !== "undefined" &&
          createPortal(
            <div className="fixed inset-0 flex items-center justify-center p-4" style={{ zIndex: 9999 }}>
              <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setShowDayModal(false)} />
              <div className="relative w-full max-w-md max-h-[85vh] bg-brown-900 rounded-2xl border border-brown-700 shadow-2xl overflow-hidden flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-brown-700/50">
                  <div>
                    <h2 className="text-base font-semibold text-brown-50">
                      Trades for {formatDayModalDate(selectedDay.date)}
                    </h2>
                    {selectedDay.trades.length > 0 && (
                      <p className={cn(
                        "text-sm font-medium",
                        selectedDay.totalPnL >= 0 ? "text-emerald-400" : "text-red-400"
                      )}>
                        Day&apos;s P&L: {selectedDay.totalPnL >= 0 ? "+" : ""}${Math.abs(selectedDay.totalPnL).toFixed(2)}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {selectedDay.trades.length > 0 && (
                      <button
                        onClick={() => handleShareDay(selectedDay)}
                        className="p-2 text-brown-400 hover:text-brown-200"
                      >
                        <Share2 className="w-5 h-5" />
                      </button>
                    )}
                    <button onClick={() => setShowDayModal(false)} className="p-2 text-brown-400 hover:text-brown-200">
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Trades List */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {selectedDay.trades.map((trade) => (
                    <div
                      key={trade.id}
                      className={cn(
                        "p-3 rounded-xl border",
                        (trade.pnl || 0) >= 0
                          ? "bg-emerald-500/10 border-emerald-500/30"
                          : "bg-red-500/10 border-red-500/30"
                      )}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-brown-100">{trade.symbol}</span>
                          <span className={cn(
                            "text-[10px] px-1.5 py-0.5 rounded font-medium",
                            trade.asset_type === "call" ? "bg-teal-500/30 text-teal-400" :
                            trade.asset_type === "put" ? "bg-purple-500/30 text-purple-400" :
                            "bg-brown-600/30 text-brown-400"
                          )}>
                            {trade.asset_type}
                          </span>
                        </div>
                        <span className={cn(
                          "font-bold",
                          (trade.pnl || 0) >= 0 ? "text-emerald-400" : "text-red-400"
                        )}>
                          {(trade.pnl || 0) >= 0 ? "+" : ""}${Math.abs(trade.pnl || 0).toFixed(2)}
                        </span>
                      </div>
                      <p className="text-xs text-brown-500">
                        Qty: {trade.quantity} {trade.price ? `@ $${trade.price.toFixed(2)}` : ""}
                      </p>
                      {trade.notes && (
                        <p className="text-xs text-brown-400 mt-1">{trade.notes}</p>
                      )}
                      <div className="flex items-center gap-4 mt-3 pt-2 border-t border-brown-700/30">
                        <button
                          onClick={() => handleShareTrade(trade)}
                          className="flex items-center gap-1 text-xs text-brown-400 hover:text-brown-200"
                        >
                          <Share2 className="w-3.5 h-3.5" />
                          Share
                        </button>
                        <button
                          onClick={() => {
                            setShowDayModal(false);
                            handleEditTrade(trade);
                          }}
                          className="flex items-center gap-1 text-xs text-brown-400 hover:text-brown-200"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                          Edit
                        </button>
                        <button
                          onClick={() => deleteTrade(trade.id)}
                          className="flex items-center gap-1 text-xs text-brown-400 hover:text-red-400"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}

                  {selectedDay.trades.length === 0 && (
                    <div className="text-center py-8">
                      <TrendingUp className="w-8 h-8 text-brown-600 mx-auto mb-2" />
                      <p className="text-brown-500 text-sm">No trades on this day</p>
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between p-4 border-t border-brown-700/50 bg-brown-900/50">
                  <div className="text-xs text-brown-400">
                    {selectedDay.trades.length} trade{selectedDay.trades.length !== 1 ? "s" : ""}
                    {selectedDay.trades.length > 0 && (
                      <>
                        {" · "}
                        <span className="text-emerald-400">
                          {selectedDay.trades.filter((t) => (t.pnl || 0) > 0).length} winner{selectedDay.trades.filter((t) => (t.pnl || 0) > 0).length !== 1 ? "s" : ""}
                        </span>
                        {" · "}
                        <span className="text-red-400">
                          {selectedDay.trades.filter((t) => (t.pnl || 0) < 0).length} loser{selectedDay.trades.filter((t) => (t.pnl || 0) < 0).length !== 1 ? "s" : ""}
                        </span>
                      </>
                    )}
                  </div>
                  <Button
                    size="sm"
                    onClick={() => {
                      setShowDayModal(false);
                      setFormData((f) => ({ ...f, date: selectedDay.date }));
                      setShowAddModal(true);
                    }}
                    className="bg-gold-500 hover:bg-gold-600 text-brown-900 text-xs"
                  >
                    <Plus className="w-3.5 h-3.5 mr-1" />
                    Add Trade
                  </Button>
                </div>
              </div>
            </div>,
            document.body
          )}

        {/* Week Summary Modal */}
        {showWeekModal && selectedWeek && typeof document !== "undefined" &&
          createPortal(
            <div className="fixed inset-0 flex items-center justify-center p-4" style={{ zIndex: 9999 }}>
              <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setShowWeekModal(false)} />
              <div className="relative w-full max-w-md max-h-[90vh] bg-[#1A1410] rounded-2xl shadow-2xl overflow-hidden flex flex-col">
                {/* Gold top accent bar */}
                <div className="h-1.5 bg-[#D4AF37]" />

                {/* Header */}
                <div className="p-4 bg-gradient-to-b from-[#3d3020] to-transparent">
                  <div className="flex items-start justify-between">
                    <div>
                      <h2 className="text-2xl font-bold text-white">Week {selectedWeek.weekNumber} Summary</h2>
                      <p className="text-sm text-brown-400 mt-1">
                        {(() => {
                          const start = parseLocalDate(selectedWeek.startDate);
                          const end = parseLocalDate(selectedWeek.endDate);
                          return `${start.toLocaleDateString("en-US", { month: "short", day: "numeric" })} – ${end.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`;
                        })()}
                      </p>
                    </div>
                    <button onClick={() => setShowWeekModal(false)} className="p-1 text-brown-400 hover:text-white transition-colors">
                      <X className="w-6 h-6" />
                    </button>
                  </div>
                </div>

                {/* Scrollable content */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {/* Weekly P&L Card */}
                  <div className="p-4 rounded-xl border border-brown-700/50 bg-brown-800/30 text-center">
                    <p className="text-sm text-brown-400 mb-2">Weekly P&L</p>
                    <p className={cn(
                      "text-4xl font-bold",
                      selectedWeek.totalPnL >= 0 ? "text-emerald-400" : "text-red-400"
                    )}>
                      {selectedWeek.totalPnL >= 0 ? "+" : "-"}${Math.abs(selectedWeek.totalPnL).toFixed(2)}
                    </p>
                    <p className="text-sm text-brown-500 mt-2">{selectedWeek.tradeCount} trades this week</p>
                  </div>

                  {/* Biggest Win / Biggest Loss Cards */}
                  {(() => {
                    const wins = selectedWeek.trades.filter(t => (t.pnl || 0) > 0);
                    const losses = selectedWeek.trades.filter(t => (t.pnl || 0) < 0);
                    const biggestWin = wins.length > 0 ? wins.reduce((max, t) => (t.pnl || 0) > (max.pnl || 0) ? t : max) : null;
                    const biggestLoss = losses.length > 0 ? losses.reduce((min, t) => (t.pnl || 0) < (min.pnl || 0) ? t : min) : null;

                    return (
                      <div className="grid grid-cols-2 gap-3">
                        {/* Biggest Win */}
                        <div className="p-3 rounded-xl border border-emerald-700/40 bg-emerald-900/20">
                          <div className="flex items-center gap-1.5 mb-2">
                            <TrendingUp className="w-4 h-4 text-emerald-400" />
                            <span className="text-xs font-medium text-emerald-400 uppercase">Biggest Win</span>
                          </div>
                          {biggestWin ? (
                            <>
                              <p className="text-2xl font-bold text-emerald-400">+${Math.abs(biggestWin.pnl || 0).toFixed(2)}</p>
                              <p className="text-xs text-brown-400 mt-1">{biggestWin.symbol} {biggestWin.asset_type}</p>
                            </>
                          ) : (
                            <p className="text-sm text-brown-500">No wins</p>
                          )}
                        </div>

                        {/* Biggest Loss */}
                        <div className="p-3 rounded-xl border border-red-700/40 bg-red-900/20">
                          <div className="flex items-center gap-1.5 mb-2">
                            <TrendingDown className="w-4 h-4 text-red-400" />
                            <span className="text-xs font-medium text-red-400 uppercase">Biggest Loss</span>
                          </div>
                          {biggestLoss ? (
                            <>
                              <p className="text-2xl font-bold text-red-400">-${Math.abs(biggestLoss.pnl || 0).toFixed(2)}</p>
                              <p className="text-xs text-brown-400 mt-1">{biggestLoss.symbol} {biggestLoss.notes || biggestLoss.asset_type}</p>
                            </>
                          ) : (
                            <p className="text-sm text-brown-500">No losses</p>
                          )}
                        </div>
                      </div>
                    );
                  })()}

                  {/* Win Rate Card */}
                  <div className="p-4 rounded-xl border border-brown-700/50 bg-brown-800/30">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Target className="w-5 h-5 text-[#D4AF37]" />
                        <span className="text-sm text-brown-300">Win Rate</span>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-white">{selectedWeek.winRate.toFixed(0)}%</p>
                        <p className="text-xs text-brown-500">{selectedWeek.winCount}W / {selectedWeek.lossCount}L</p>
                      </div>
                    </div>
                    {/* Progress bar */}
                    <div className="h-2 bg-brown-700/50 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 rounded-full transition-all"
                        style={{ width: `${selectedWeek.winRate}%` }}
                      />
                    </div>
                  </div>

                  {/* Daily Breakdown */}
                  <div>
                    <h3 className="text-xs font-medium text-brown-500 uppercase tracking-wider mb-3">Daily Breakdown</h3>
                    <div className="space-y-1">
                      {(() => {
                        // Group trades by day
                        const dailyData = new Map<string, { pnl: number; count: number }>();
                        selectedWeek.trades.forEach(trade => {
                          const dateStr = trade.trade_date.split("T")[0];
                          const existing = dailyData.get(dateStr) || { pnl: 0, count: 0 };
                          dailyData.set(dateStr, {
                            pnl: existing.pnl + (trade.pnl || 0),
                            count: existing.count + 1
                          });
                        });

                        // Sort by date and render
                        const sortedDays = Array.from(dailyData.entries()).sort((a, b) => a[0].localeCompare(b[0]));

                        if (sortedDays.length === 0) {
                          return <p className="text-sm text-brown-500 text-center py-4">No trades this week</p>;
                        }

                        return sortedDays.map(([dateStr, data]) => {
                          const date = parseLocalDate(dateStr);
                          const dayName = date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
                          const isProfit = data.pnl > 0;
                          const isLoss = data.pnl < 0;

                          return (
                            <div key={dateStr} className="flex items-center justify-between p-3 rounded-lg bg-brown-800/30 border border-brown-700/30">
                              <span className="text-sm text-brown-200">{dayName}</span>
                              <div className="flex items-center gap-2">
                                <span className={cn(
                                  "text-sm font-semibold",
                                  isProfit ? "text-emerald-400" : isLoss ? "text-red-400" : "text-brown-300"
                                )}>
                                  {isProfit ? "+" : isLoss ? "-" : ""}${Math.abs(data.pnl).toFixed(2)}
                                </span>
                                <span className="text-xs text-brown-500">({data.count}t)</span>
                              </div>
                            </div>
                          );
                        });
                      })()}
                    </div>
                  </div>
                </div>

                {/* Footer buttons */}
                <div className="p-4 space-y-2 border-t border-brown-700/30">
                  <Button
                    onClick={() => {
                      setShowWeekModal(false);
                      setShareMode("overview");
                      setShareWeekData(selectedWeek);
                      setShowShareModal(true);
                    }}
                    variant="ghost"
                    className="w-full text-brown-400 hover:text-white"
                  >
                    <Share2 className="w-4 h-4 mr-2" />
                    Share Week
                  </Button>
                  <Button
                    onClick={() => setShowWeekModal(false)}
                    className="w-full bg-[#D4AF37] hover:bg-[#c4a030] text-black font-medium"
                  >
                    Close
                  </Button>
                </div>
              </div>
            </div>,
            document.body
          )}

        {/* Add Trade Modal */}
        {showAddModal && typeof document !== "undefined" &&
          createPortal(
            <div className="fixed inset-0 flex items-center justify-center p-4" style={{ zIndex: 9999 }}>
              <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setShowAddModal(false)} />
              <div className="relative w-full max-w-md max-h-[90vh] bg-brown-900 rounded-2xl border border-brown-700 shadow-2xl overflow-hidden flex flex-col">
                <div className="flex items-center justify-between p-4 border-b border-brown-700">
                  <h2 className="text-lg font-semibold text-brown-50">Log Trade</h2>
                  <button onClick={() => setShowAddModal(false)} className="p-1 text-brown-400 hover:text-brown-200">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label className="text-brown-300 text-xs">Date</Label>
                      <Input
                        type="date"
                        value={formData.date}
                        onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                        className="bg-brown-800 border-brown-700 text-brown-100 text-sm"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-brown-300 text-xs">Symbol</Label>
                      <Input
                        placeholder="AAPL"
                        value={formData.symbol}
                        onChange={(e) => setFormData({ ...formData, symbol: e.target.value.toUpperCase() })}
                        className="bg-brown-800 border-brown-700 text-brown-100 text-sm"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label className="text-brown-300 text-xs">Type</Label>
                      <select
                        value={formData.asset_type}
                        onChange={(e) => setFormData({ ...formData, asset_type: e.target.value as "stock" | "call" | "put" })}
                        className="w-full h-9 px-3 bg-brown-800 border border-brown-700 text-brown-100 rounded-md text-sm"
                      >
                        <option value="call">Call</option>
                        <option value="put">Put</option>
                        <option value="stock">Stock</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-brown-300 text-xs">Quantity</Label>
                      <Input
                        type="number"
                        placeholder="10"
                        value={formData.quantity}
                        onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                        className="bg-brown-800 border-brown-700 text-brown-100 text-sm"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label className="text-brown-300 text-xs">Entry Price ($)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="1.50"
                        value={formData.entry_price}
                        onChange={(e) => setFormData({ ...formData, entry_price: e.target.value })}
                        className="bg-brown-800 border-brown-700 text-brown-100 text-sm"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-brown-300 text-xs">Exit Price ($)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="2.00"
                        value={formData.exit_price}
                        onChange={(e) => setFormData({ ...formData, exit_price: e.target.value })}
                        className="bg-brown-800 border-brown-700 text-brown-100 text-sm"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-brown-300 text-xs">Notes (optional)</Label>
                    <Input
                      placeholder="Trade notes..."
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      className="bg-brown-800 border-brown-700 text-brown-100 text-sm"
                    />
                  </div>

                  {formData.entry_price && formData.exit_price && formData.quantity && (
                    <div className="p-3 bg-brown-800/50 rounded-lg border border-brown-700">
                      <span className="text-xs text-brown-400">Calculated P&L: </span>
                      {(() => {
                        const entry = parseFloat(formData.entry_price) || 0;
                        const exit = parseFloat(formData.exit_price) || 0;
                        const qty = parseInt(formData.quantity) || 0;
                        const mult = formData.asset_type === "stock" ? 1 : 100;
                        const pnl = (exit - entry) * qty * mult;
                        return (
                          <span className={cn("font-bold", pnl >= 0 ? "text-emerald-400" : "text-red-400")}>
                            {pnl >= 0 ? "+" : ""}${pnl.toFixed(2)}
                          </span>
                        );
                      })()}
                    </div>
                  )}
                </div>

                <div className="flex gap-2 p-4 border-t border-brown-700">
                  <Button variant="ghost" onClick={() => setShowAddModal(false)} className="flex-1 text-brown-400">
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSubmit}
                    disabled={!formData.symbol || !formData.quantity || isSubmitting}
                    className="flex-1 bg-gold-500 hover:bg-gold-600 text-brown-900"
                  >
                    {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Trade"}
                  </Button>
                </div>
              </div>
            </div>,
            document.body
          )}

        {/* Edit Trade Modal */}
        {showEditModal && editingTrade && typeof document !== "undefined" &&
          createPortal(
            <div className="fixed inset-0 flex items-center justify-center p-4" style={{ zIndex: 9999 }}>
              <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setShowEditModal(false)} />
              <div className="relative w-full max-w-md max-h-[90vh] bg-brown-900 rounded-2xl border border-brown-700 shadow-2xl overflow-hidden flex flex-col">
                <div className="flex items-center justify-between p-4 border-b border-brown-700">
                  <h2 className="text-lg font-semibold text-brown-50">Edit Trade</h2>
                  <button onClick={() => setShowEditModal(false)} className="p-1 text-brown-400 hover:text-brown-200">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label className="text-brown-300 text-xs">Date</Label>
                      <Input
                        type="date"
                        value={editFormData.date}
                        onChange={(e) => setEditFormData({ ...editFormData, date: e.target.value })}
                        className="bg-brown-800 border-brown-700 text-brown-100 text-sm"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-brown-300 text-xs">Symbol</Label>
                      <Input
                        value={editFormData.symbol}
                        onChange={(e) => setEditFormData({ ...editFormData, symbol: e.target.value.toUpperCase() })}
                        className="bg-brown-800 border-brown-700 text-brown-100 text-sm"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label className="text-brown-300 text-xs">Type</Label>
                      <select
                        value={editFormData.asset_type}
                        onChange={(e) => setEditFormData({ ...editFormData, asset_type: e.target.value as "stock" | "call" | "put" })}
                        className="w-full h-9 px-3 bg-brown-800 border border-brown-700 text-brown-100 rounded-md text-sm"
                      >
                        <option value="call">Call</option>
                        <option value="put">Put</option>
                        <option value="stock">Stock</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-brown-300 text-xs">Quantity</Label>
                      <Input
                        type="number"
                        value={editFormData.quantity}
                        onChange={(e) => setEditFormData({ ...editFormData, quantity: e.target.value })}
                        className="bg-brown-800 border-brown-700 text-brown-100 text-sm"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-brown-300 text-xs">P&L ($)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={editFormData.pnl}
                      onChange={(e) => setEditFormData({ ...editFormData, pnl: e.target.value })}
                      className="bg-brown-800 border-brown-700 text-brown-100 text-sm"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-brown-300 text-xs">Notes</Label>
                    <Input
                      value={editFormData.notes}
                      onChange={(e) => setEditFormData({ ...editFormData, notes: e.target.value })}
                      className="bg-brown-800 border-brown-700 text-brown-100 text-sm"
                    />
                  </div>
                </div>

                <div className="flex gap-2 p-4 border-t border-brown-700">
                  <Button variant="ghost" onClick={() => setShowEditModal(false)} className="flex-1 text-brown-400">
                    Cancel
                  </Button>
                  <Button
                    onClick={handleEditSubmit}
                    disabled={!editFormData.symbol || !editFormData.quantity || isSubmitting}
                    className="flex-1 bg-gold-500 hover:bg-gold-600 text-brown-900"
                  >
                    {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Changes"}
                  </Button>
                </div>
              </div>
            </div>,
            document.body
          )}

        {/* Screenshot Modal */}
        {showScreenshotModal && typeof document !== "undefined" &&
          createPortal(
            <div className="fixed inset-0 flex items-center justify-center p-4" style={{ zIndex: 9999 }}>
              <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => {
                setShowScreenshotModal(false);
                setScreenshotPreview(null);
                setExtractedTrade(null);
                setExtractionError(null);
              }} />
              <div className="relative w-full max-w-lg max-h-[85vh] bg-brown-900 rounded-2xl border border-brown-700 shadow-2xl overflow-hidden flex flex-col">
                <div className="flex items-center justify-between p-4 border-b border-brown-700">
                  <h2 className="text-lg font-semibold text-brown-50">
                    {isExtracting ? "Analyzing..." : extractedTrade ? "Confirm Trade" : "Screenshot Upload"}
                  </h2>
                  <button onClick={() => {
                    setShowScreenshotModal(false);
                    setScreenshotPreview(null);
                    setExtractedTrade(null);
                    setExtractionError(null);
                  }} className="p-1 text-brown-400 hover:text-brown-200">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {screenshotPreview && (
                    <div className="relative w-full h-32 rounded-lg overflow-hidden border border-brown-700">
                      <img src={screenshotPreview} alt="Screenshot" className="w-full h-full object-contain" />
                    </div>
                  )}

                  {isExtracting && (
                    <div className="flex flex-col items-center py-8">
                      <Loader2 className="w-8 h-8 text-gold-400 animate-spin mb-4" />
                      <p className="text-brown-300">Analyzing screenshot with AI...</p>
                    </div>
                  )}

                  {extractionError && (
                    <div className="flex items-start gap-3 p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
                      <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                      <div>
                        <p className="text-red-400 font-medium">Could not extract trade data</p>
                        <p className="text-red-400/80 text-sm mt-1">{extractionError}</p>
                      </div>
                    </div>
                  )}

                  {extractedTrade && !isExtracting && (
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-2">
                        <div className="p-2.5 bg-brown-800/50 rounded-lg">
                          <p className="text-xs text-brown-500 uppercase">Symbol</p>
                          <p className="text-base font-bold text-brown-100">{extractedTrade.symbol}</p>
                        </div>
                        <div className="p-2.5 bg-brown-800/50 rounded-lg">
                          <p className="text-xs text-brown-500 uppercase">Type</p>
                          <p className="text-base font-bold text-brown-100 capitalize">
                            {extractedTrade.optionType}
                            {extractedTrade.strikePrice && ` $${extractedTrade.strikePrice}`}
                          </p>
                        </div>
                        <div className="p-2.5 bg-brown-800/50 rounded-lg">
                          <p className="text-xs text-brown-500 uppercase">Quantity</p>
                          <p className="text-sm text-brown-100">{extractedTrade.quantity}</p>
                        </div>
                        <div className="p-2.5 bg-brown-800/50 rounded-lg">
                          <p className="text-xs text-brown-500 uppercase">Date</p>
                          <p className="text-sm text-brown-100">{extractedTrade.closeDate}</p>
                        </div>
                      </div>

                      <div className="p-3 bg-brown-800/50 rounded-lg border border-brown-700">
                        <p className="text-xs text-brown-500 uppercase mb-1">Profit / Loss</p>
                        <span className={cn("text-xl font-bold", extractedTrade.isProfit ? "text-emerald-400" : "text-red-400")}>
                          {extractedTrade.isProfit ? "+" : ""}${Math.abs(extractedTrade.profitLoss).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex gap-2 p-4 border-t border-brown-700">
                  <Button variant="ghost" onClick={() => {
                    setShowScreenshotModal(false);
                    setScreenshotPreview(null);
                    setExtractedTrade(null);
                    setExtractionError(null);
                  }} className="flex-1 text-brown-400">
                    Cancel
                  </Button>
                  {extractedTrade && !isExtracting && (
                    <Button
                      onClick={handleConfirmScreenshotTrade}
                      disabled={isSubmitting}
                      className="flex-1 bg-gold-500 hover:bg-gold-600 text-brown-900"
                    >
                      {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Confirm & Save"}
                    </Button>
                  )}
                </div>
              </div>
            </div>,
            document.body
          )}

        {/* Import Trades Modal */}
        <ImportTradesModal
          isOpen={showImportModal}
          onClose={() => setShowImportModal(false)}
          existingTrades={trades}
          onImport={handleBulkImport}
        />

        {/* Social Share Modal */}
        <SocialShareModal
          isOpen={showShareModal}
          onClose={() => setShowShareModal(false)}
          trades={trades}
          period="weekly"
          weekData={shareWeekData}
          mode={shareMode}
          dayData={shareDayData}
          tradeData={shareTradeData}
        />

        {/* Batch Screenshot Upload Modal */}
        <BatchScreenshotUpload
          isOpen={showBatchModal}
          onClose={() => setShowBatchModal(false)}
          onSaveTrades={async (tradesToSave) => {
            for (const trade of tradesToSave) {
              await addTrade(trade);
            }
            refetch();
          }}
          getToday={getToday}
        />

        {/* Hidden screenshot input */}
        <input
          ref={screenshotInputRef}
          type="file"
          accept="image/*"
          onChange={handleScreenshotUpload}
          className="hidden"
        />

        {/* First-time user onboarding */}
        {!loading && (
          <PnLOnboarding
            tradesCount={trades.length}
            onOpenImportModal={() => setShowImportModal(true)}
            onOpenScreenshotUpload={() => screenshotInputRef.current?.click()}
          />
        )}
      </div>
    </div>
  );
}
