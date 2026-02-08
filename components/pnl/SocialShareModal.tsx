"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { X, Download, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Trade } from "@/hooks/useUserData";
import { parsePnL, parseLocalDate } from "@/lib/trade-analytics";

interface WeekData {
  weekNumber: number;
  startDate: string;
  endDate: string;
  totalPnL: number;
  tradeCount: number;
  winCount: number;
  lossCount: number;
  winRate: number;
}

export interface DayShareData {
  date: string;
  totalPnL: number;
  trades: Trade[];
}

export interface TradeShareData {
  symbol: string;
  assetType: string;
  pnl: number;
  pctReturn: number | null;
  entryPrice: number | null;
  exitPrice: number | null;
  quantity: number;
  date: string;
  price: number;
  strikePrice: number | null;
}

interface SocialShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  trades: Trade[];
  period: "daily" | "weekly" | "monthly";
  weekData?: WeekData | null;
  mode?: "overview" | "day" | "trade";
  dayData?: DayShareData | null;
  tradeData?: TradeShareData | null;
}

export default function SocialShareModal({
  isOpen,
  onClose,
  trades,
  period: initialPeriod,
  weekData,
  mode = "overview",
  dayData,
  tradeData,
}: SocialShareModalProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [period, setPeriod] = useState(initialPeriod);
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  // Reset period when modal opens in overview mode
  useEffect(() => {
    if (isOpen) setPeriod(initialPeriod);
  }, [isOpen, initialPeriod]);

  // ── Shared canvas drawing helpers ──

  function drawCardFrame(
    ctx: CanvasRenderingContext2D,
    W: number,
    H: number,
    pnlValue: number
  ) {
    const isPositive = pnlValue >= 0;

    const roundRect = (x: number, y: number, w: number, h: number, r: number) => {
      ctx.beginPath();
      ctx.moveTo(x + r, y);
      ctx.lineTo(x + w - r, y);
      ctx.quadraticCurveTo(x + w, y, x + w, y + r);
      ctx.lineTo(x + w, y + h - r);
      ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
      ctx.lineTo(x + r, y + h);
      ctx.quadraticCurveTo(x, y + h, x, y + h - r);
      ctx.lineTo(x, y + r);
      ctx.quadraticCurveTo(x, y, x + r, y);
      ctx.closePath();
    };

    // Background
    const bgGrad = ctx.createLinearGradient(0, 0, 0, H);
    bgGrad.addColorStop(0, "#0F0D08");
    bgGrad.addColorStop(0.5, "#0C0A06");
    bgGrad.addColorStop(1, "#080604");
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, W, H);

    // Radial glow
    const glowGrad = ctx.createRadialGradient(W / 2, 520, 0, W / 2, 520, 350);
    glowGrad.addColorStop(0, isPositive ? "rgba(74, 222, 128, 0.06)" : "rgba(248, 113, 113, 0.06)");
    glowGrad.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = glowGrad;
    ctx.fillRect(0, 0, W, H);

    // Outer border
    roundRect(40, 40, W - 80, H - 80, 24);
    ctx.strokeStyle = "rgba(212, 175, 55, 0.4)";
    ctx.lineWidth = 2;
    ctx.stroke();

    // Inner border
    roundRect(52, 52, W - 104, H - 104, 20);
    ctx.strokeStyle = "rgba(212, 175, 55, 0.15)";
    ctx.lineWidth = 1;
    ctx.stroke();

    // Gold corner accents
    ctx.strokeStyle = "#D4AF37";
    ctx.lineWidth = 3;
    ctx.lineCap = "round";
    const cornerLen = 40;
    const co = 40;

    ctx.beginPath(); ctx.moveTo(co, co + cornerLen); ctx.lineTo(co, co); ctx.lineTo(co + cornerLen, co); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(W - co - cornerLen, co); ctx.lineTo(W - co, co); ctx.lineTo(W - co, co + cornerLen); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(co, H - co - cornerLen); ctx.lineTo(co, H - co); ctx.lineTo(co + cornerLen, H - co); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(W - co - cornerLen, H - co); ctx.lineTo(W - co, H - co); ctx.lineTo(W - co, H - co - cornerLen); ctx.stroke();

    ctx.lineCap = "butt";

    // Header
    ctx.textAlign = "center";
    ctx.fillStyle = "#D4AF37";
    ctx.font = "600 42px Georgia, serif";
    ctx.letterSpacing = "0.3em";
    ctx.fillText("G A I N S V I E W", W / 2, 160);
    ctx.letterSpacing = "0px";

    // Gold divider under header
    ctx.strokeStyle = "rgba(212, 175, 55, 0.25)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(W / 2 - 180, 200);
    ctx.lineTo(W / 2 + 180, 200);
    ctx.stroke();
  }

  function drawLogoAndFinalize(
    ctx: CanvasRenderingContext2D,
    canvas: HTMLCanvasElement,
    W: number,
    H: number,
    quoteY: number
  ) {
    // Motivational quote
    ctx.textAlign = "center";
    ctx.fillStyle = "rgba(212, 175, 55, 0.45)";
    ctx.font = "italic 30px Georgia, serif";
    ctx.fillText("Discipline is the bridge between goals and results.", W / 2, quoteY);

    // Load logo
    const logoImg = new Image();
    logoImg.crossOrigin = "anonymous";
    logoImg.src = "/images/logo.png";

    const finalize = () => {
      const url = canvas.toDataURL("image/png", 1.0);
      setImageUrl(url);
    };

    logoImg.onload = () => {
      // Trim transparent padding
      const tempCanvas = document.createElement("canvas");
      tempCanvas.width = logoImg.naturalWidth;
      tempCanvas.height = logoImg.naturalHeight;
      const tempCtx = tempCanvas.getContext("2d")!;
      tempCtx.drawImage(logoImg, 0, 0);

      const imageData = tempCtx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);
      const { data, width: imgW, height: imgH } = imageData;

      let top = imgH, bottom = 0, left = imgW, right = 0;
      for (let y = 0; y < imgH; y++) {
        for (let x = 0; x < imgW; x++) {
          if (data[(y * imgW + x) * 4 + 3] > 10) {
            if (y < top) top = y;
            if (y > bottom) bottom = y;
            if (x < left) left = x;
            if (x > right) right = x;
          }
        }
      }

      const pad = 5;
      top = Math.max(0, top - pad);
      bottom = Math.min(imgH - 1, bottom + pad);
      left = Math.max(0, left - pad);
      right = Math.min(imgW - 1, right + pad);

      const trimW = right - left + 1;
      const trimH = bottom - top + 1;

      const croppedCanvas = document.createElement("canvas");
      croppedCanvas.width = trimW;
      croppedCanvas.height = trimH;
      const croppedCtx = croppedCanvas.getContext("2d")!;
      croppedCtx.drawImage(tempCanvas, left, top, trimW, trimH, 0, 0, trimW, trimH);

      const aspectRatio = trimW / trimH;
      const drawW = W * 0.45;
      const drawH = drawW / aspectRatio;
      const drawX = (W - drawW) / 2;
      const bottomZoneTop = quoteY + 30;
      const bottomZoneBottom = H - 60;
      const drawY = bottomZoneTop + (bottomZoneBottom - bottomZoneTop - drawH) / 2;

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";

      ctx.save();
      ctx.shadowColor = "rgba(212, 175, 55, 0.4)";
      ctx.shadowBlur = 40;
      ctx.drawImage(croppedCanvas, drawX, drawY, drawW, drawH);
      ctx.restore();

      finalize();
    };

    logoImg.onerror = finalize;
  }

  // ── Draw: Overview / Day mode ──

  const getOverviewStats = useCallback(() => {
    const now = new Date();
    let filtered: Trade[];
    let periodLabel: string;
    let dateText: string;

    if (period === "weekly") {
      if (weekData) {
        filtered = trades.filter((t) => {
          const d = t.trade_date.split("T")[0];
          return d >= weekData.startDate && d <= weekData.endDate;
        });
        const s = parseLocalDate(weekData.startDate);
        const e = parseLocalDate(weekData.endDate);
        const opts: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" };
        dateText = `${s.toLocaleDateString("en-US", opts)} – ${e.toLocaleDateString("en-US", opts)}, ${e.getFullYear()}`;
      } else {
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const dayOfWeek = today.getDay();
        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() - dayOfWeek);
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);
        filtered = trades.filter((t) => {
          const d = parseLocalDate(t.trade_date);
          return d >= weekStart && d <= weekEnd;
        });
        const opts: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" };
        dateText = `${weekStart.toLocaleDateString("en-US", opts)} – ${weekEnd.toLocaleDateString("en-US", opts)}, ${weekEnd.getFullYear()}`;
      }
      periodLabel = "WEEKLY PERFORMANCE";
    } else if (period === "daily") {
      const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
      filtered = trades.filter((t) => t.trade_date.split("T")[0] === today);
      periodLabel = "DAILY PERFORMANCE";
      dateText = now.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });
    } else {
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      filtered = trades.filter((t) => new Date(t.trade_date) >= monthStart);
      periodLabel = "MONTHLY PERFORMANCE";
      dateText = now.toLocaleDateString("en-US", { month: "long", year: "numeric" });
    }

    const totalPnL = filtered.reduce((s, t) => s + parsePnL(t.pnl), 0);
    const totalEntryCost = filtered.reduce((sum, t) => {
      const tv = t.total_value || 0;
      const p = parsePnL(t.pnl);
      const entry = tv - p;
      return entry > 0 ? sum + entry : sum;
    }, 0);
    const pctReturn = totalEntryCost > 0 ? (totalPnL / totalEntryCost) * 100 : null;

    return { totalPnL, pctReturn, periodLabel, dateText };
  }, [trades, period, weekData]);

  const drawOverviewCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const W = 1080;
    const H = 1350;
    canvas.width = W;
    canvas.height = H;

    let pnlValue: number;
    let pctReturn: number | null;
    let periodLabel: string;
    let dateText: string;

    if (mode === "day" && dayData) {
      pnlValue = dayData.totalPnL;
      periodLabel = "DAILY PERFORMANCE";
      const d = parseLocalDate(dayData.date);
      dateText = d.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });
      const totalEntry = dayData.trades.reduce((sum, t) => {
        const tv = t.total_value || 0;
        const p = parsePnL(t.pnl);
        const entry = tv - p;
        return entry > 0 ? sum + entry : sum;
      }, 0);
      pctReturn = totalEntry > 0 ? (pnlValue / totalEntry) * 100 : null;
    } else {
      const stats = getOverviewStats();
      pnlValue = stats.totalPnL;
      pctReturn = stats.pctReturn;
      periodLabel = stats.periodLabel;
      dateText = stats.dateText;
    }

    const isPositive = pnlValue >= 0;

    drawCardFrame(ctx, W, H, pnlValue);

    // Period label
    ctx.textAlign = "center";
    ctx.fillStyle = "rgba(212, 175, 55, 0.75)";
    ctx.font = "400 28px system-ui, -apple-system, sans-serif";
    ctx.fillText(periodLabel, W / 2, 265);

    // Date
    ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
    ctx.font = "300 20px system-ui, -apple-system, sans-serif";
    ctx.fillText(dateText, W / 2, 305);

    // P&L
    const pnlText = `${isPositive ? "+" : ""}$${Math.abs(pnlValue).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    ctx.save();
    ctx.shadowColor = isPositive ? "rgba(74, 222, 128, 0.3)" : "rgba(248, 113, 113, 0.3)";
    ctx.shadowBlur = 40;
    ctx.fillStyle = isPositive ? "#4ADE80" : "#F87171";
    ctx.font = "bold 128px system-ui, -apple-system, sans-serif";
    ctx.fillText(pnlText, W / 2, 520);
    ctx.restore();

    // Percentage return
    if (pctReturn !== null) {
      const pctText = `${isPositive ? "+" : ""}${pctReturn.toFixed(1)}%`;
      ctx.fillStyle = isPositive ? "rgba(74, 222, 128, 0.7)" : "rgba(248, 113, 113, 0.7)";
      ctx.font = "300 48px system-ui, -apple-system, sans-serif";
      ctx.fillText(pctText, W / 2, 600);
    }

    drawLogoAndFinalize(ctx, canvas, W, H, H * 0.52);
  }, [mode, dayData, getOverviewStats]);

  // ── Draw: Trade mode ──

  const drawTradeCanvas = useCallback(() => {
    if (!tradeData) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const W = 1080;
    const H = 1350;
    canvas.width = W;
    canvas.height = H;

    const isPositive = tradeData.pnl >= 0;

    drawCardFrame(ctx, W, H, tradeData.pnl);

    ctx.textAlign = "center";

    // "TRADE RESULT"
    ctx.fillStyle = "rgba(212, 175, 55, 0.75)";
    ctx.font = "400 28px system-ui, -apple-system, sans-serif";
    ctx.fillText("TRADE RESULT", W / 2, 255);

    // Date
    const d = parseLocalDate(tradeData.date);
    const dateText = d.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });
    ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
    ctx.font = "300 20px system-ui, -apple-system, sans-serif";
    ctx.fillText(dateText, W / 2, 290);

    // Ticker + option info (use strike price for options, not entry price)
    const tickerText = tradeData.assetType === "stock"
      ? tradeData.symbol
      : tradeData.strikePrice
        ? `${tradeData.symbol} $${tradeData.strikePrice} ${tradeData.assetType.toUpperCase()}`
        : `${tradeData.symbol} ${tradeData.assetType.toUpperCase()}`;
    ctx.fillStyle = "#D4AF37";
    ctx.font = "bold 40px system-ui, -apple-system, sans-serif";
    ctx.fillText(tickerText, W / 2, 365);

    // P&L
    const pnlText = `${isPositive ? "+" : ""}$${Math.abs(tradeData.pnl).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    ctx.save();
    ctx.shadowColor = isPositive ? "rgba(74, 222, 128, 0.3)" : "rgba(248, 113, 113, 0.3)";
    ctx.shadowBlur = 40;
    ctx.fillStyle = isPositive ? "#4ADE80" : "#F87171";
    ctx.font = "bold 120px system-ui, -apple-system, sans-serif";
    ctx.fillText(pnlText, W / 2, 530);
    ctx.restore();

    // Percentage
    if (tradeData.pctReturn !== null) {
      const pctText = `${isPositive ? "+" : ""}${tradeData.pctReturn.toFixed(1)}%`;
      ctx.fillStyle = isPositive ? "rgba(74, 222, 128, 0.7)" : "rgba(248, 113, 113, 0.7)";
      ctx.font = "300 48px system-ui, -apple-system, sans-serif";
      ctx.fillText(pctText, W / 2, 600);
    }

    // Entry → Exit
    if (tradeData.entryPrice !== null && tradeData.exitPrice !== null) {
      ctx.fillStyle = "rgba(255, 255, 255, 0.35)";
      ctx.font = "300 24px system-ui, -apple-system, sans-serif";
      ctx.fillText(`$${tradeData.entryPrice.toFixed(2)}  →  $${tradeData.exitPrice.toFixed(2)}`, W / 2, 650);
    }

    drawLogoAndFinalize(ctx, canvas, W, H, H * 0.52);
  }, [tradeData]);

  // ── Main draw dispatcher ──

  const drawCanvas = useCallback(() => {
    setImageUrl(null);
    if (mode === "trade") {
      drawTradeCanvas();
    } else {
      drawOverviewCanvas();
    }
  }, [mode, drawOverviewCanvas, drawTradeCanvas]);

  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(drawCanvas, 50);
      return () => clearTimeout(timer);
    }
  }, [isOpen, drawCanvas, period]);

  const fileLabel = mode === "trade" && tradeData
    ? `gainsview-trade-${tradeData.symbol}`
    : mode === "day" && dayData
    ? `gainsview-day-${dayData.date}`
    : `gainsview-${period}-performance`;

  const handleDownload = () => {
    if (!imageUrl) return;
    const a = document.createElement("a");
    a.href = imageUrl;
    a.download = `${fileLabel}.png`;
    a.click();
  };

  const handleShare = async () => {
    if (!imageUrl) return;
    const res = await fetch(imageUrl);
    const blob = await res.blob();
    const file = new File([blob], `${fileLabel}.png`, { type: "image/png" });

    if (navigator.share && navigator.canShare?.({ files: [file] })) {
      try {
        await navigator.share({ files: [file], title: "My Trading Performance" });
      } catch {
        // User cancelled
      }
    } else {
      handleDownload();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-lg max-h-[90vh] bg-brown-900 border border-gold-500/30 rounded-2xl shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gold-500/20">
          <h2 className="text-lg font-semibold text-gold-400">
            {mode === "trade" ? "Share Trade" : mode === "day" ? "Share Day" : "Share Performance"}
          </h2>
          <button onClick={onClose} className="p-2 text-brown-400 hover:text-brown-200 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Period selector — only in overview mode */}
        {mode === "overview" && (
          <div className="flex gap-1 p-3 border-b border-brown-700/50">
            {(["daily", "weekly", "monthly"] as const).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`flex-1 px-3 py-1.5 text-xs font-medium rounded-lg transition-all capitalize ${
                  period === p
                    ? "bg-gold-500 text-brown-900"
                    : "text-brown-400 hover:text-brown-200 hover:bg-brown-800"
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        )}

        {/* Canvas preview */}
        <div className="flex-1 overflow-y-auto p-4">
          <canvas
            ref={canvasRef}
            className="w-full rounded-lg border border-gold-500/20"
            style={{ aspectRatio: "1080 / 1350" }}
          />
        </div>

        {/* Actions */}
        <div className="flex gap-2 p-4 border-t border-gold-500/20">
          <Button
            onClick={handleDownload}
            disabled={!imageUrl}
            className="flex-1 bg-gradient-to-r from-gold-500 to-gold-600 hover:from-gold-600 hover:to-gold-700 text-brown-900 font-semibold"
          >
            <Download className="w-4 h-4 mr-2" />
            Download
          </Button>
          <Button
            onClick={handleShare}
            disabled={!imageUrl}
            variant="outline"
            className="flex-1 border-gold-500/30 text-gold-400 hover:bg-gold-500/10"
          >
            <Share2 className="w-4 h-4 mr-2" />
            Share
          </Button>
        </div>
      </div>
    </div>
  );
}
