"use client";

import { useState, useCallback, useRef } from "react";
import {
  Upload,
  X,
  FileText,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Trash2,
  Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Trade } from "@/hooks/useUserData";

// Robinhood transaction codes
type TransCode = "BTO" | "STC" | "OEXP" | "Buy" | "Sell" | "SKIP";

interface RawTransaction {
  date: string;
  instrument: string;
  description: string;
  transCode: TransCode;
  quantity: number;
  price: number;
  amount: number; // Positive for credit, negative for debit
}

interface MatchedTrade {
  id: string;
  date: string;
  symbol: string;
  side: "buy" | "sell";
  quantity: number;
  price: number;
  assetType: "stock" | "call" | "put";
  pnl: number;
  openDate?: string;
  closeDate?: string;
  notes: string;
  isDuplicate: boolean;
  selected: boolean;
}

interface ImportTradesModalProps {
  isOpen: boolean;
  onClose: () => void;
  existingTrades: Trade[];
  onImport: (trades: Omit<Trade, "id" | "user_id" | "created_at">[]) => Promise<void>;
}

// Parse amount from Robinhood format: ($118.04) = -118.04, $50.00 = 50.00
function parseAmount(amountStr: string | undefined | null): number {
  if (!amountStr) return 0;
  const cleaned = String(amountStr).replace(/[$,]/g, "").trim();
  // Check for parentheses (negative)
  const isNegative = cleaned.startsWith("(") && cleaned.endsWith(")");
  const value = parseFloat(cleaned.replace(/[()]/g, ""));
  return isNaN(value) ? 0 : (isNegative ? -value : value);
}

// Normalize description for matching
// Handles: "Option Expiration for SLV 1/26/2026 Call $104.00" -> "slv 1/26/2026 call $104.00"
function normalizeDescription(desc: string | undefined | null): string {
  if (!desc) return "";
  return desc
    .replace(/^Option Expiration for\s+/i, "") // Strip OEXP prefix
    .replace(/\s+/g, " ") // Normalize whitespace
    .trim()
    .toLowerCase();
}

// Parse option type from description
function getOptionType(desc: string): "call" | "put" | null {
  const lower = desc.toLowerCase();
  if (lower.includes("call")) return "call";
  if (lower.includes("put")) return "put";
  return null;
}

// Create display symbol from description
function createDisplaySymbol(desc: string): string {
  // "SLV 1/26/2026 Call $104.00" -> "SLV $104 CALL"
  const match = desc.match(/^([A-Z]+)\s+[\d/]+\s+(Call|Put)\s+\$?([\d.]+)/i);
  if (match) {
    return `${match[1]} $${match[3]} ${match[2].toUpperCase()}`;
  }
  return desc;
}

// Parse CSV handling quoted fields with newlines
function parseCSV(csvText: string): { headers: string[]; rows: string[][] } {
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentField = "";
  let inQuotes = false;

  for (let i = 0; i < csvText.length; i++) {
    const char = csvText[i];
    const nextChar = csvText[i + 1];

    if (inQuotes) {
      if (char === '"' && nextChar === '"') {
        // Escaped quote
        currentField += '"';
        i++;
      } else if (char === '"') {
        // End of quoted field
        inQuotes = false;
      } else {
        // Regular character inside quotes (including newlines)
        currentField += char;
      }
    } else {
      if (char === '"') {
        // Start of quoted field
        inQuotes = true;
      } else if (char === ",") {
        // Field separator
        currentRow.push(currentField.trim());
        currentField = "";
      } else if (char === "\n" || (char === "\r" && nextChar === "\n")) {
        // Row separator
        currentRow.push(currentField.trim());
        if (currentRow.some(f => f)) { // Skip empty rows
          rows.push(currentRow);
        }
        currentRow = [];
        currentField = "";
        if (char === "\r") i++; // Skip \n after \r
      } else if (char !== "\r") {
        currentField += char;
      }
    }
  }

  // Handle last field/row
  if (currentField || currentRow.length > 0) {
    currentRow.push(currentField.trim());
    if (currentRow.some(f => f)) {
      rows.push(currentRow);
    }
  }

  const headers = rows[0] || [];
  return { headers, rows: rows.slice(1) };
}

export default function ImportTradesModal({
  isOpen,
  onClose,
  existingTrades,
  onImport,
}: ImportTradesModalProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [matchedTrades, setMatchedTrades] = useState<MatchedTrade[]>([]);
  const [parseError, setParseError] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [importSuccess, setImportSuccess] = useState(false);
  const [parseStats, setParseStats] = useState<{
    rawCount: number;
    matchedCount: number;
    expiredCount: number;
    skippedCount: number;
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const resetState = () => {
    setMatchedTrades([]);
    setParseError(null);
    setImportSuccess(false);
    setParseStats(null);
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  // Check if a trade is a duplicate
  const isDuplicateTrade = useCallback(
    (trade: { date: string; symbol: string; pnl: number }) => {
      return existingTrades.some(
        (existing) =>
          existing.trade_date.split("T")[0] === trade.date &&
          existing.symbol.toUpperCase() === trade.symbol.toUpperCase() &&
          Math.abs((existing.pnl || 0) - trade.pnl) < 0.01
      );
    },
    [existingTrades]
  );

  // Parse Robinhood CSV and calculate P&L
  const parseRobinhoodCSV = useCallback(
    (csvText: string): MatchedTrade[] => {
      const { headers, rows } = parseCSV(csvText);

      if (rows.length === 0) {
        throw new Error("CSV file appears to be empty");
      }

      // Find column indices (case-insensitive)
      const headerLower = headers.map(h => h.toLowerCase().replace(/"/g, ""));
      const findColumn = (names: string[]) => {
        for (const name of names) {
          const index = headerLower.findIndex(h => h.includes(name));
          if (index !== -1) return index;
        }
        return -1;
      };

      const dateIdx = findColumn(["activity date", "date"]);
      const instrumentIdx = findColumn(["instrument", "symbol"]);
      const descriptionIdx = findColumn(["description"]);
      const transCodeIdx = findColumn(["trans code"]);
      const quantityIdx = findColumn(["quantity"]);
      const priceIdx = findColumn(["price"]);
      const amountIdx = findColumn(["amount"]);

      if (dateIdx === -1) {
        throw new Error("Could not find Activity Date column");
      }

      // Parse all transactions
      const transactions: RawTransaction[] = [];
      let skippedCount = 0;

      for (const row of rows) {
        const dateStr = (row[dateIdx] || "").replace(/"/g, "").trim();
        const instrument = (row[instrumentIdx] || "").replace(/"/g, "").trim();
        const description = (row[descriptionIdx] || "").replace(/"/g, "").trim();
        const transCodeRaw = (row[transCodeIdx] || "").replace(/"/g, "").trim().toUpperCase();
        const quantityRaw = (row[quantityIdx] || "").replace(/"/g, "").trim();
        const priceRaw = (row[priceIdx] || "").replace(/"/g, "").trim();
        const amountRaw = (row[amountIdx] || "").replace(/"/g, "").trim();

        // Skip rows without date or trans code (disclaimer rows, etc.)
        if (!dateStr || !transCodeRaw) {
          skippedCount++;
          continue;
        }

        // Determine transaction code
        let transCode: TransCode = "SKIP";
        if (transCodeRaw === "BTO") transCode = "BTO";
        else if (transCodeRaw === "STC") transCode = "STC";
        else if (transCodeRaw === "OEXP") transCode = "OEXP";
        else if (transCodeRaw === "BUY") transCode = "Buy";
        else if (transCodeRaw === "SELL") transCode = "Sell";

        // Skip non-trade transactions (DCF, ACH, CDIV, SLIP, etc.)
        if (transCode === "SKIP") {
          skippedCount++;
          continue;
        }

        // Parse date (MM/DD/YYYY format)
        let parsedDate: Date | null = null;
        const dateMatch = dateStr.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
        if (dateMatch) {
          parsedDate = new Date(`${dateMatch[3]}-${dateMatch[1].padStart(2, "0")}-${dateMatch[2].padStart(2, "0")}`);
        } else {
          parsedDate = new Date(dateStr);
        }
        if (!parsedDate || isNaN(parsedDate.getTime())) {
          skippedCount++;
          continue;
        }
        const formattedDate = parsedDate.toISOString().split("T")[0];

        // Parse numeric values
        const quantity = Math.abs(parseFloat(quantityRaw.replace(/[^0-9.-]/g, "")) || 0);
        const price = parseFloat(priceRaw.replace(/[^0-9.-]/g, "")) || 0;
        const amount = parseAmount(amountRaw);

        transactions.push({
          date: formattedDate,
          instrument,
          description,
          transCode,
          quantity,
          price,
          amount,
        });
      }

      // Group transactions by normalized description
      // Key: normalized description, Value: { buys: [], sells: [], expirations: [] }
      const groups: Map<string, {
        buys: RawTransaction[];
        sells: RawTransaction[];
        expirations: RawTransaction[];
        displayDesc: string;
        instrument: string;
      }> = new Map();

      for (const tx of transactions) {
        // For stock trades (Buy/Sell), use instrument as key
        // For options (BTO/STC/OEXP), use normalized description
        let key: string;
        let displayDesc: string;

        if (tx.transCode === "Buy" || tx.transCode === "Sell") {
          // Stock trade - key by instrument
          key = tx.instrument.toLowerCase();
          displayDesc = tx.instrument;
        } else {
          // Option trade - key by normalized description
          key = normalizeDescription(tx.description);
          displayDesc = tx.description.replace(/^Option Expiration for\s+/i, "").trim();
        }

        if (!key) {
          skippedCount++;
          continue;
        }

        if (!groups.has(key)) {
          groups.set(key, {
            buys: [],
            sells: [],
            expirations: [],
            displayDesc,
            instrument: tx.instrument,
          });
        }

        const group = groups.get(key)!;

        if (tx.transCode === "BTO" || tx.transCode === "Buy") {
          group.buys.push(tx);
        } else if (tx.transCode === "STC" || tx.transCode === "Sell") {
          group.sells.push(tx);
        } else if (tx.transCode === "OEXP") {
          group.expirations.push(tx);
        }
      }

      // Calculate P&L for each completed trade group
      const completedTrades: MatchedTrade[] = [];
      let expiredCount = 0;

      for (const [key, group] of groups) {
        const { buys, sells, expirations, displayDesc, instrument } = group;

        // Skip if no buys (nothing to match against)
        if (buys.length === 0) continue;

        // Skip if no sells AND no expirations (position still open)
        if (sells.length === 0 && expirations.length === 0) continue;

        // Calculate total cost (sum of all buy amounts - these are negative/debits)
        const totalBuyCost = buys.reduce((sum, b) => sum + Math.abs(b.amount), 0);
        const totalBuyQty = buys.reduce((sum, b) => sum + b.quantity, 0);

        // Calculate total proceeds from sells (these are positive/credits)
        const totalSellProceeds = sells.reduce((sum, s) => sum + s.amount, 0);
        const totalSellQty = sells.reduce((sum, s) => sum + s.quantity, 0);

        // Calculate expired quantity
        const totalExpiredQty = expirations.reduce((sum, e) => sum + e.quantity, 0);

        // Determine if this is a stock or option
        const isOption = getOptionType(displayDesc) !== null;
        const optionType = getOptionType(displayDesc);

        // Get dates
        const buyDates = buys.map(b => b.date).sort();
        const sellDates = sells.map(s => s.date).sort();
        const expDates = expirations.map(e => e.date).sort();
        const openDate = buyDates[0] || "";
        const closeDate = [...sellDates, ...expDates].sort().pop() || "";

        // If there are sells, create a trade for sold portion
        if (sells.length > 0 && totalSellQty > 0) {
          // Calculate cost basis for sold quantity (proportional)
          const soldRatio = Math.min(totalSellQty / totalBuyQty, 1);
          const costForSold = totalBuyCost * soldRatio;
          const pnl = totalSellProceeds - costForSold;

          const avgBuyPrice = totalBuyQty > 0 ? totalBuyCost / totalBuyQty / (isOption ? 100 : 1) : 0;
          const avgSellPrice = totalSellQty > 0 ? totalSellProceeds / totalSellQty / (isOption ? 100 : 1) : 0;

          completedTrades.push({
            id: `import-sell-${completedTrades.length}-${Date.now()}`,
            date: closeDate,
            symbol: isOption ? createDisplaySymbol(displayDesc) : instrument,
            side: "sell",
            quantity: totalSellQty,
            price: avgSellPrice,
            assetType: isOption ? (optionType || "call") : "stock",
            pnl: Math.round(pnl * 100) / 100,
            openDate,
            closeDate,
            notes: `Bought ${totalBuyQty} @ $${avgBuyPrice.toFixed(2)} avg, Sold ${totalSellQty} @ $${avgSellPrice.toFixed(2)} avg`,
            isDuplicate: false,
            selected: true,
          });
        }

        // If there are expirations, create a trade for expired portion
        if (expirations.length > 0 && totalExpiredQty > 0) {
          // Calculate cost basis for expired quantity (proportional)
          const expiredRatio = Math.min(totalExpiredQty / totalBuyQty, 1);
          const costForExpired = totalBuyCost * expiredRatio;
          const pnl = -costForExpired; // 100% loss

          const avgBuyPrice = totalBuyQty > 0 ? totalBuyCost / totalBuyQty / 100 : 0;

          completedTrades.push({
            id: `import-exp-${completedTrades.length}-${Date.now()}`,
            date: closeDate,
            symbol: createDisplaySymbol(displayDesc),
            side: "sell",
            quantity: totalExpiredQty,
            price: 0,
            assetType: optionType || "call",
            pnl: Math.round(pnl * 100) / 100,
            openDate,
            closeDate,
            notes: `EXPIRED WORTHLESS - Bought ${totalExpiredQty} @ $${avgBuyPrice.toFixed(2)} avg`,
            isDuplicate: false,
            selected: true,
          });

          expiredCount++;
        }
      }

      // Mark duplicates
      for (const trade of completedTrades) {
        trade.isDuplicate = isDuplicateTrade({
          date: trade.date,
          symbol: trade.symbol,
          pnl: trade.pnl,
        });
        if (trade.isDuplicate) {
          trade.selected = false;
        }
      }

      // Sort by date (most recent first)
      completedTrades.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      setParseStats({
        rawCount: transactions.length,
        matchedCount: completedTrades.length,
        expiredCount,
        skippedCount,
      });

      if (completedTrades.length === 0) {
        throw new Error(
          `No completed trades found. Parsed ${transactions.length} transactions but none had matching buy/sell pairs.`
        );
      }

      return completedTrades;
    },
    [isDuplicateTrade]
  );

  const handleFileUpload = useCallback(
    (file: File) => {
      setParseError(null);

      if (!file.name.endsWith(".csv")) {
        setParseError("Please upload a CSV file");
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const csvText = e.target?.result as string;
          const trades = parseRobinhoodCSV(csvText);
          setMatchedTrades(trades);
        } catch (error) {
          setParseError(error instanceof Error ? error.message : "Failed to parse CSV");
        }
      };
      reader.onerror = () => {
        setParseError("Failed to read file");
      };
      reader.readAsText(file);
    },
    [parseRobinhoodCSV]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);

      const file = e.dataTransfer.files[0];
      if (file) {
        handleFileUpload(file);
      }
    },
    [handleFileUpload]
  );

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  const toggleTradeSelection = (id: string) => {
    setMatchedTrades((prev) =>
      prev.map((t) => (t.id === id ? { ...t, selected: !t.selected } : t))
    );
  };

  const selectAll = (selected: boolean) => {
    setMatchedTrades((prev) =>
      prev.map((t) => ({ ...t, selected: t.isDuplicate ? false : selected }))
    );
  };

  const removeTradeFromPreview = (id: string) => {
    setMatchedTrades((prev) => prev.filter((t) => t.id !== id));
  };

  const handleImport = async () => {
    const selectedTrades = matchedTrades.filter((t) => t.selected && !t.isDuplicate);
    if (selectedTrades.length === 0) return;

    setIsImporting(true);

    try {
      const tradesToImport = selectedTrades.map((t) => ({
        symbol: t.symbol,
        trade_type: t.side as "buy" | "sell",
        asset_type: t.assetType,
        quantity: t.quantity,
        price: t.price,
        total_value: t.price * t.quantity * (t.assetType === "stock" ? 1 : 100),
        pnl: t.pnl,
        notes: t.notes,
        trade_date: t.date,
      }));

      await onImport(tradesToImport);
      setImportSuccess(true);

      setTimeout(() => {
        handleClose();
      }, 1500);
    } catch (error) {
      setParseError("Failed to import trades. Please try again.");
    } finally {
      setIsImporting(false);
    }
  };

  const selectedCount = matchedTrades.filter((t) => t.selected && !t.isDuplicate).length;
  const duplicateCount = matchedTrades.filter((t) => t.isDuplicate).length;
  const totalPnL = matchedTrades
    .filter((t) => t.selected && !t.isDuplicate)
    .reduce((sum, t) => sum + t.pnl, 0);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-2xl max-h-[90vh] bg-brown-900 border border-brown-700 rounded-2xl shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-brown-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gold-500/20 rounded-lg">
              <Upload className="w-5 h-5 text-gold-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-brown-50">Import Trades</h2>
              <p className="text-xs text-brown-400">Upload your Robinhood trade history CSV</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 text-brown-400 hover:text-brown-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {importSuccess ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="p-4 bg-emerald-500/20 rounded-full mb-4">
                <CheckCircle2 className="w-12 h-12 text-emerald-400" />
              </div>
              <h3 className="text-xl font-semibold text-brown-50 mb-2">Import Complete!</h3>
              <p className="text-brown-400">{selectedCount} trades imported successfully</p>
              <p className={cn(
                "text-lg font-semibold mt-2",
                totalPnL >= 0 ? "text-emerald-400" : "text-red-400"
              )}>
                Total P&L: {totalPnL >= 0 ? "+" : ""}${totalPnL.toFixed(2)}
              </p>
            </div>
          ) : matchedTrades.length === 0 ? (
            <>
              {/* Instructions */}
              <div className="mb-4 p-3 bg-brown-800/50 rounded-lg border border-brown-700">
                <div className="flex items-start gap-2">
                  <Info className="w-4 h-4 text-gold-400 mt-0.5 flex-shrink-0" />
                  <div className="text-xs text-brown-400">
                    <p className="font-medium text-brown-300 mb-1">How to export from Robinhood:</p>
                    <ol className="list-decimal list-inside space-y-1">
                      <li>Open Robinhood app → Account → Statements & History</li>
                      <li>Select "Account" tab → Download CSV</li>
                      <li>Or visit robinhood.com → Account → History → Export</li>
                    </ol>
                    <p className="mt-2 text-brown-500">
                      Supports: Options (BTO/STC), Expirations (OEXP), Stocks (Buy/Sell)
                    </p>
                  </div>
                </div>
              </div>

              {/* Drop Zone */}
              <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onClick={() => fileInputRef.current?.click()}
                className={cn(
                  "border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all",
                  isDragging
                    ? "border-gold-500 bg-gold-500/10"
                    : "border-brown-700 hover:border-brown-600 hover:bg-brown-800/30"
                )}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <FileText
                  className={cn(
                    "w-12 h-12 mx-auto mb-4",
                    isDragging ? "text-gold-400" : "text-brown-500"
                  )}
                />
                <p className="text-brown-200 font-medium mb-1">
                  {isDragging ? "Drop your CSV file here" : "Drag and drop your CSV file"}
                </p>
                <p className="text-sm text-brown-500">or click to browse</p>
              </div>

              {/* Error Message */}
              {parseError && (
                <div className="mt-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-red-400">{parseError}</p>
                </div>
              )}
            </>
          ) : (
            <>
              {/* Preview Header with Stats */}
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm text-brown-200">
                    Found <span className="text-gold-400 font-semibold">{matchedTrades.length}</span> completed trades
                  </p>
                  {parseStats && (
                    <p className="text-xs text-brown-500">
                      {parseStats.rawCount} transactions • {parseStats.expiredCount} expired • {parseStats.skippedCount} skipped
                    </p>
                  )}
                  {duplicateCount > 0 && (
                    <p className="text-xs text-amber-400">
                      {duplicateCount} duplicate{duplicateCount !== 1 ? "s" : ""} detected
                    </p>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => selectAll(true)}
                    className="text-xs text-brown-400"
                  >
                    Select All
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => selectAll(false)}
                    className="text-xs text-brown-400"
                  >
                    Deselect All
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={resetState}
                    className="text-xs text-brown-400"
                  >
                    Upload Different File
                  </Button>
                </div>
              </div>

              {/* Total P&L Preview */}
              <div className="mb-4 p-3 bg-brown-800/50 rounded-lg border border-brown-700">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-brown-400">Selected P&L Total:</span>
                  <span className={cn(
                    "text-lg font-bold",
                    totalPnL >= 0 ? "text-emerald-400" : "text-red-400"
                  )}>
                    {totalPnL >= 0 ? "+" : ""}${totalPnL.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Trade Preview List */}
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {matchedTrades.map((trade) => (
                  <div
                    key={trade.id}
                    className={cn(
                      "flex items-center gap-3 p-3 rounded-lg border transition-all",
                      trade.isDuplicate
                        ? "bg-amber-500/5 border-amber-500/20 opacity-60"
                        : trade.selected
                        ? "bg-brown-800/50 border-gold-500/30"
                        : "bg-brown-800/30 border-brown-700/50"
                    )}
                  >
                    {/* Checkbox */}
                    <button
                      onClick={() => !trade.isDuplicate && toggleTradeSelection(trade.id)}
                      disabled={trade.isDuplicate}
                      className={cn(
                        "w-5 h-5 rounded border-2 flex items-center justify-center transition-colors flex-shrink-0",
                        trade.isDuplicate
                          ? "border-amber-500/50 bg-amber-500/20"
                          : trade.selected
                          ? "border-gold-500 bg-gold-500"
                          : "border-brown-600 hover:border-brown-500"
                      )}
                    >
                      {(trade.selected || trade.isDuplicate) && (
                        <CheckCircle2
                          className={cn(
                            "w-3 h-3",
                            trade.isDuplicate ? "text-amber-400" : "text-brown-900"
                          )}
                        />
                      )}
                    </button>

                    {/* Trade Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-brown-100">{trade.symbol}</span>
                        <span className="text-xs px-1.5 py-0.5 rounded bg-brown-700/50 text-brown-400">
                          {trade.assetType}
                        </span>
                        {trade.notes.includes("EXPIRED") && (
                          <span className="text-xs px-1.5 py-0.5 rounded bg-red-500/20 text-red-400">
                            Expired
                          </span>
                        )}
                        {trade.isDuplicate && (
                          <span className="text-xs px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400">
                            Duplicate
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-brown-500 mt-1">
                        <span>{trade.date}</span>
                        <span>Qty: {trade.quantity}</span>
                      </div>
                      {trade.notes && (
                        <p className="text-xs text-brown-600 mt-1 truncate">{trade.notes}</p>
                      )}
                    </div>

                    {/* P&L */}
                    <div className={cn(
                      "text-right font-semibold flex-shrink-0",
                      trade.pnl >= 0 ? "text-emerald-400" : "text-red-400"
                    )}>
                      {trade.pnl >= 0 ? "+" : ""}${trade.pnl.toFixed(2)}
                    </div>

                    {/* Remove Button */}
                    <button
                      onClick={() => removeTradeFromPreview(trade.id)}
                      className="p-1 text-brown-500 hover:text-red-400 transition-colors flex-shrink-0"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Error Message */}
              {parseError && (
                <div className="mt-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-red-400">{parseError}</p>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        {matchedTrades.length > 0 && !importSuccess && (
          <div className="flex items-center justify-between p-4 border-t border-brown-700">
            <p className="text-sm text-brown-400">
              {selectedCount} trade{selectedCount !== 1 ? "s" : ""} selected
            </p>
            <div className="flex gap-2">
              <Button variant="ghost" onClick={handleClose} className="text-brown-400">
                Cancel
              </Button>
              <Button
                onClick={handleImport}
                disabled={selectedCount === 0 || isImporting}
                className="bg-gold-500 hover:bg-gold-600 text-brown-900"
              >
                {isImporting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Importing...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Import {selectedCount} Trade{selectedCount !== 1 ? "s" : ""}
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
