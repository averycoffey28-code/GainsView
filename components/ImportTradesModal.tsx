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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Trade } from "@/hooks/useUserData";

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

type CSVFormat = "auto" | "generic" | "robinhood";

// Parse amount handling various formats: ($118.04), -118.04, (118.04), $50.00
function parseAmount(amountStr: string | undefined | null): number {
  if (!amountStr) return 0;
  const cleaned = String(amountStr).replace(/[$,]/g, "").trim();
  const isNegative = cleaned.startsWith("(") && cleaned.endsWith(")") || cleaned.startsWith("-");
  const value = parseFloat(cleaned.replace(/[()-]/g, ""));
  return isNaN(value) ? 0 : (isNegative ? -value : value);
}

// Parse date from various formats
function parseDate(dateStr: string | undefined | null): string | null {
  if (!dateStr) return null;
  const cleaned = String(dateStr).trim();

  // Try MM/DD/YYYY
  const slashMatch = cleaned.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (slashMatch) {
    return `${slashMatch[3]}-${slashMatch[1].padStart(2, "0")}-${slashMatch[2].padStart(2, "0")}`;
  }

  // Try YYYY-MM-DD
  const isoMatch = cleaned.match(/(\d{4})-(\d{2})-(\d{2})/);
  if (isoMatch) {
    return `${isoMatch[1]}-${isoMatch[2]}-${isoMatch[3]}`;
  }

  // Try DD/MM/YYYY (European)
  const euroMatch = cleaned.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (euroMatch) {
    // Assume month is first if <= 12
    const first = parseInt(euroMatch[1]);
    const second = parseInt(euroMatch[2]);
    if (first <= 12) {
      return `${euroMatch[3]}-${euroMatch[1].padStart(2, "0")}-${euroMatch[2].padStart(2, "0")}`;
    } else {
      return `${euroMatch[3]}-${euroMatch[2].padStart(2, "0")}-${euroMatch[1].padStart(2, "0")}`;
    }
  }

  // Try Date.parse as fallback
  const parsed = new Date(cleaned);
  if (!isNaN(parsed.getTime())) {
    return parsed.toISOString().split("T")[0];
  }

  return null;
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
        currentField += '"';
        i++;
      } else if (char === '"') {
        inQuotes = false;
      } else {
        currentField += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === ",") {
        currentRow.push(currentField.trim());
        currentField = "";
      } else if (char === "\n" || (char === "\r" && nextChar === "\n")) {
        currentRow.push(currentField.trim());
        if (currentRow.some(f => f)) {
          rows.push(currentRow);
        }
        currentRow = [];
        currentField = "";
        if (char === "\r") i++;
      } else if (char !== "\r") {
        currentField += char;
      }
    }
  }

  if (currentField || currentRow.length > 0) {
    currentRow.push(currentField.trim());
    if (currentRow.some(f => f)) {
      rows.push(currentRow);
    }
  }

  const headers = rows[0] || [];
  return { headers, rows: rows.slice(1) };
}

// Normalize column name for matching
function normalizeColumnName(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]/g, "_").replace(/_+/g, "_").replace(/^_|_$/g, "");
}

// Detect CSV format based on headers
function detectFormat(headers: string[]): CSVFormat {
  const normalized = headers.map(normalizeColumnName);

  // Robinhood has specific columns
  const hasTransCode = normalized.some(h => h.includes("trans") && h.includes("code"));
  const hasActivityDate = normalized.some(h => h.includes("activity") && h.includes("date"));

  if (hasTransCode && hasActivityDate) {
    return "robinhood";
  }

  // Generic format - just needs date, symbol, and some form of P&L
  const hasDate = normalized.some(h => h.includes("date") || h === "trade_date" || h === "close_date");
  const hasSymbol = normalized.some(h => h.includes("symbol") || h.includes("ticker") || h.includes("instrument"));
  const hasPnL = normalized.some(h => h.includes("pnl") || h.includes("profit") || h.includes("loss") || h.includes("p_l") || h.includes("gain"));

  if (hasDate && hasSymbol && hasPnL) {
    return "generic";
  }

  return "auto";
}

// Find column index by trying multiple possible names
function findColumn(headers: string[], possibleNames: string[]): number {
  const normalized = headers.map(normalizeColumnName);
  for (const name of possibleNames) {
    const normalizedName = normalizeColumnName(name);
    const index = normalized.findIndex(h => h.includes(normalizedName) || normalizedName.includes(h));
    if (index !== -1) return index;
  }
  return -1;
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
  const [importProgress, setImportProgress] = useState({ current: 0, total: 0 });
  const [parseStats, setParseStats] = useState<{
    format: string;
    totalRows: number;
    parsedCount: number;
    skippedCount: number;
    skippedReasons: string[];
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const resetState = () => {
    setMatchedTrades([]);
    setParseError(null);
    setImportSuccess(false);
    setParseStats(null);
    setImportProgress({ current: 0, total: 0 });
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

  // Parse generic CSV format (any broker)
  const parseGenericCSV = useCallback(
    (csvText: string): MatchedTrade[] => {
      const { headers, rows } = parseCSV(csvText);

      console.log(`[CSV Import] Parsing ${rows.length} rows with headers:`, headers);

      if (rows.length === 0) {
        throw new Error("CSV file appears to be empty");
      }

      // Find column indices
      const dateIdx = findColumn(headers, ["date", "trade_date", "close_date", "activity_date", "execution_date", "filled_date", "settlement_date"]);
      const symbolIdx = findColumn(headers, ["symbol", "ticker", "instrument", "stock", "underlying", "name"]);
      const pnlIdx = findColumn(headers, ["pnl", "p_l", "profit_loss", "profit", "gain_loss", "realized_p_l", "net_profit", "total_pnl", "amount"]);
      const typeIdx = findColumn(headers, ["type", "asset_type", "option_type", "call_put", "instrument_type"]);
      const quantityIdx = findColumn(headers, ["quantity", "qty", "contracts", "shares", "size"]);
      const entryIdx = findColumn(headers, ["entry_price", "open_price", "buy_price", "cost", "entry"]);
      const exitIdx = findColumn(headers, ["exit_price", "close_price", "sell_price", "proceeds", "exit"]);
      const notesIdx = findColumn(headers, ["notes", "description", "comment", "memo"]);

      if (dateIdx === -1) {
        throw new Error(`Could not find a Date column. Headers found: ${headers.join(", ")}`);
      }
      if (symbolIdx === -1) {
        throw new Error(`Could not find a Symbol column. Headers found: ${headers.join(", ")}`);
      }
      if (pnlIdx === -1) {
        throw new Error(`Could not find a P&L column. Headers found: ${headers.join(", ")}`);
      }

      console.log(`[CSV Import] Column mapping - Date: ${dateIdx}, Symbol: ${symbolIdx}, PnL: ${pnlIdx}`);

      const trades: MatchedTrade[] = [];
      const skippedReasons: string[] = [];
      let skippedCount = 0;

      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const rowNum = i + 2; // +2 for header row and 0-indexing

        try {
          const dateRaw = row[dateIdx] || "";
          const symbolRaw = row[symbolIdx] || "";
          const pnlRaw = row[pnlIdx] || "";

          // Skip empty rows
          if (!dateRaw && !symbolRaw && !pnlRaw) {
            continue;
          }

          // Parse date
          const date = parseDate(dateRaw);
          if (!date) {
            skippedCount++;
            if (skippedReasons.length < 5) {
              skippedReasons.push(`Row ${rowNum}: Invalid date "${dateRaw}"`);
            }
            continue;
          }

          // Parse symbol - skip if empty
          const symbol = symbolRaw.trim().toUpperCase();
          if (!symbol) {
            skippedCount++;
            if (skippedReasons.length < 5) {
              skippedReasons.push(`Row ${rowNum}: Missing symbol`);
            }
            continue;
          }

          // Parse P&L
          const pnl = parseAmount(pnlRaw);

          // Parse optional fields
          const typeRaw = typeIdx !== -1 ? (row[typeIdx] || "").toLowerCase() : "";
          let assetType: "stock" | "call" | "put" = "stock";
          if (typeRaw.includes("call")) assetType = "call";
          else if (typeRaw.includes("put")) assetType = "put";
          else if (typeRaw.includes("option")) assetType = "call";

          const quantity = quantityIdx !== -1 ? Math.abs(parseInt(row[quantityIdx]) || 1) : 1;
          const entryPrice = entryIdx !== -1 ? parseAmount(row[entryIdx]) : 0;
          const exitPrice = exitIdx !== -1 ? parseAmount(row[exitIdx]) : 0;
          const notes = notesIdx !== -1 ? (row[notesIdx] || "").trim() : "";

          trades.push({
            id: `import-${i}-${Date.now()}`,
            date,
            symbol,
            side: "sell",
            quantity,
            price: exitPrice || entryPrice,
            assetType,
            pnl: Math.round(pnl * 100) / 100,
            notes,
            isDuplicate: false,
            selected: true,
          });
        } catch (err) {
          skippedCount++;
          if (skippedReasons.length < 5) {
            skippedReasons.push(`Row ${rowNum}: ${err instanceof Error ? err.message : "Parse error"}`);
          }
        }
      }

      // Mark duplicates
      for (const trade of trades) {
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
      trades.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      console.log(`[CSV Import] Parsed ${trades.length} trades, skipped ${skippedCount}`);

      setParseStats({
        format: "Generic CSV",
        totalRows: rows.length,
        parsedCount: trades.length,
        skippedCount,
        skippedReasons,
      });

      if (trades.length === 0) {
        const reasons = skippedReasons.length > 0 ? `\n\nSample errors:\n${skippedReasons.join("\n")}` : "";
        throw new Error(`No valid trades found in ${rows.length} rows.${reasons}`);
      }

      return trades;
    },
    [isDuplicateTrade]
  );

  // Parse Robinhood CSV format (matched pairs)
  const parseRobinhoodCSV = useCallback(
    (csvText: string): MatchedTrade[] => {
      const { headers, rows } = parseCSV(csvText);

      if (rows.length === 0) {
        throw new Error("CSV file appears to be empty");
      }

      const headerLower = headers.map(h => h.toLowerCase().replace(/"/g, ""));
      const findCol = (names: string[]) => {
        for (const name of names) {
          const index = headerLower.findIndex(h => h.includes(name));
          if (index !== -1) return index;
        }
        return -1;
      };

      const dateIdx = findCol(["activity date", "date"]);
      const instrumentIdx = findCol(["instrument", "symbol"]);
      const descriptionIdx = findCol(["description"]);
      const transCodeIdx = findCol(["trans code"]);
      const quantityIdx = findCol(["quantity"]);
      const priceIdx = findCol(["price"]);
      const amountIdx = findCol(["amount"]);

      if (dateIdx === -1 || transCodeIdx === -1) {
        throw new Error("This doesn't appear to be a Robinhood CSV. Try using the generic format.");
      }

      type TransCode = "BTO" | "STC" | "OEXP" | "Buy" | "Sell" | "SKIP";
      interface RawTransaction {
        date: string;
        instrument: string;
        description: string;
        transCode: TransCode;
        quantity: number;
        price: number;
        amount: number;
      }

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

        if (!dateStr || !transCodeRaw) {
          skippedCount++;
          continue;
        }

        let transCode: TransCode = "SKIP";
        if (transCodeRaw === "BTO") transCode = "BTO";
        else if (transCodeRaw === "STC") transCode = "STC";
        else if (transCodeRaw === "OEXP") transCode = "OEXP";
        else if (transCodeRaw === "BUY") transCode = "Buy";
        else if (transCodeRaw === "SELL") transCode = "Sell";

        if (transCode === "SKIP") {
          skippedCount++;
          continue;
        }

        const formattedDate = parseDate(dateStr);
        if (!formattedDate) {
          skippedCount++;
          continue;
        }

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

      // Group and match transactions (existing Robinhood logic)
      const groups = new Map<string, {
        buys: RawTransaction[];
        sells: RawTransaction[];
        expirations: RawTransaction[];
        displayDesc: string;
        instrument: string;
      }>();

      const normalizeDesc = (desc: string) => desc.replace(/^Option Expiration for\s+/i, "").replace(/\s+/g, " ").trim().toLowerCase();
      const getOptionType = (desc: string): "call" | "put" | null => {
        const lower = desc.toLowerCase();
        if (lower.includes("call")) return "call";
        if (lower.includes("put")) return "put";
        return null;
      };
      const createDisplaySymbol = (desc: string): string => {
        const match = desc.match(/^([A-Z]+)\s+[\d/]+\s+(Call|Put)\s+\$?([\d.]+)/i);
        if (match) return `${match[1]} $${match[3]} ${match[2].toUpperCase()}`;
        return desc;
      };

      for (const tx of transactions) {
        let key: string;
        let displayDesc: string;

        if (tx.transCode === "Buy" || tx.transCode === "Sell") {
          key = tx.instrument.toLowerCase();
          displayDesc = tx.instrument;
        } else {
          key = normalizeDesc(tx.description);
          displayDesc = tx.description.replace(/^Option Expiration for\s+/i, "").trim();
        }

        if (!key) {
          skippedCount++;
          continue;
        }

        if (!groups.has(key)) {
          groups.set(key, { buys: [], sells: [], expirations: [], displayDesc, instrument: tx.instrument });
        }

        const group = groups.get(key)!;
        if (tx.transCode === "BTO" || tx.transCode === "Buy") group.buys.push(tx);
        else if (tx.transCode === "STC" || tx.transCode === "Sell") group.sells.push(tx);
        else if (tx.transCode === "OEXP") group.expirations.push(tx);
      }

      const completedTrades: MatchedTrade[] = [];
      let expiredCount = 0;

      for (const [, group] of groups) {
        const { buys, sells, expirations, displayDesc, instrument } = group;

        if (buys.length === 0) continue;
        if (sells.length === 0 && expirations.length === 0) continue;

        const totalBuyCost = buys.reduce((sum, b) => sum + Math.abs(b.amount), 0);
        const totalBuyQty = buys.reduce((sum, b) => sum + b.quantity, 0);
        const totalSellProceeds = sells.reduce((sum, s) => sum + s.amount, 0);
        const totalSellQty = sells.reduce((sum, s) => sum + s.quantity, 0);
        const totalExpiredQty = expirations.reduce((sum, e) => sum + e.quantity, 0);

        const isOption = getOptionType(displayDesc) !== null;
        const optionType = getOptionType(displayDesc);

        const buyDates = buys.map(b => b.date).sort();
        const sellDates = sells.map(s => s.date).sort();
        const expDates = expirations.map(e => e.date).sort();
        const openDate = buyDates[0] || "";
        const closeDate = [...sellDates, ...expDates].sort().pop() || "";

        if (sells.length > 0 && totalSellQty > 0) {
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
            notes: `Bought ${totalBuyQty} @ $${avgBuyPrice.toFixed(2)}, Sold ${totalSellQty} @ $${avgSellPrice.toFixed(2)}`,
            isDuplicate: false,
            selected: true,
          });
        }

        if (expirations.length > 0 && totalExpiredQty > 0) {
          const expiredRatio = Math.min(totalExpiredQty / totalBuyQty, 1);
          const costForExpired = totalBuyCost * expiredRatio;
          const pnl = -costForExpired;
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
            notes: `EXPIRED - Bought ${totalExpiredQty} @ $${avgBuyPrice.toFixed(2)}`,
            isDuplicate: false,
            selected: true,
          });
          expiredCount++;
        }
      }

      for (const trade of completedTrades) {
        trade.isDuplicate = isDuplicateTrade({ date: trade.date, symbol: trade.symbol, pnl: trade.pnl });
        if (trade.isDuplicate) trade.selected = false;
      }

      completedTrades.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      setParseStats({
        format: "Robinhood",
        totalRows: rows.length,
        parsedCount: completedTrades.length,
        skippedCount,
        skippedReasons: [`${expiredCount} expired options`, `${transactions.length} transactions processed`],
      });

      if (completedTrades.length === 0) {
        throw new Error(
          `No completed trades found. Parsed ${transactions.length} transactions but none had matching buy/sell pairs. ` +
          `If you have a simple CSV with Date, Symbol, and P&L columns, try uploading again.`
        );
      }

      return completedTrades;
    },
    [isDuplicateTrade]
  );

  const handleFileUpload = useCallback(
    (file: File) => {
      setParseError(null);

      if (!file.name.toLowerCase().endsWith(".csv")) {
        setParseError("Please upload a CSV file");
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const csvText = e.target?.result as string;
          const { headers } = parseCSV(csvText);
          const format = detectFormat(headers);

          console.log(`[CSV Import] Detected format: ${format}, headers:`, headers);

          let trades: MatchedTrade[];

          if (format === "robinhood") {
            trades = parseRobinhoodCSV(csvText);
          } else {
            // Default to generic format
            trades = parseGenericCSV(csvText);
          }

          setMatchedTrades(trades);
        } catch (error) {
          console.error("[CSV Import] Parse error:", error);
          setParseError(error instanceof Error ? error.message : "Failed to parse CSV");
        }
      };
      reader.onerror = () => {
        setParseError("Failed to read file");
      };
      reader.readAsText(file);
    },
    [parseRobinhoodCSV, parseGenericCSV]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFileUpload(file);
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
    if (file) handleFileUpload(file);
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
    setImportProgress({ current: 0, total: selectedTrades.length });

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

      // Import all at once
      await onImport(tradesToImport);
      setImportProgress({ current: selectedTrades.length, total: selectedTrades.length });
      setImportSuccess(true);

      setTimeout(() => {
        handleClose();
      }, 1500);
    } catch (error) {
      console.error("[CSV Import] Import error:", error);
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
              <p className="text-xs text-brown-400">Upload CSV from any broker or spreadsheet</p>
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
              {/* Robinhood Export Instructions */}
              <div className="mb-4 p-4 bg-brown-800/50 rounded-xl border border-brown-700">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-lg">📱</span>
                  <h4 className="font-semibold text-brown-100">How to export from Robinhood</h4>
                </div>
                <ol className="space-y-1.5 text-sm text-brown-400 ml-6 list-decimal">
                  <li>Open Robinhood → tap <strong className="text-brown-200">Account</strong> (person icon)</li>
                  <li>Tap <strong className="text-brown-200">Reports & Statements</strong></li>
                  <li>Tap <strong className="text-brown-200">Generate Report</strong></li>
                  <li>Select your desired date range</li>
                  <li>Tap <strong className="text-brown-200">Generate</strong></li>
                  <li>Download the CSV once it&apos;s ready</li>
                </ol>
                <div className="flex items-center gap-2 mt-3 p-2 bg-gold-400/10 rounded-lg">
                  <span className="text-sm">⏳</span>
                  <p className="text-xs text-gold-400">Reports can take a few hours to generate. You&apos;ll get a notification when ready.</p>
                </div>
              </div>

              {/* Secondary: Other formats */}
              <p className="text-xs text-brown-500 mb-4">
                <strong className="text-brown-400">Also supports:</strong> Any CSV with Date, Symbol, and P&L columns. Column names are detected automatically.
              </p>

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
                  <p className="text-sm text-red-400 whitespace-pre-wrap">{parseError}</p>
                </div>
              )}
            </>
          ) : (
            <>
              {/* Preview Header with Stats */}
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm text-brown-200">
                    Found <span className="text-gold-400 font-semibold">{matchedTrades.length}</span> trades
                  </p>
                  {parseStats && (
                    <p className="text-xs text-brown-500">
                      {parseStats.format} format • {parseStats.totalRows} rows • {parseStats.skippedCount} skipped
                    </p>
                  )}
                  {duplicateCount > 0 && (
                    <p className="text-xs text-amber-400">
                      {duplicateCount} duplicate{duplicateCount !== 1 ? "s" : ""} detected
                    </p>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" onClick={() => selectAll(true)} className="text-xs text-brown-400">
                    Select All
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => selectAll(false)} className="text-xs text-brown-400">
                    Deselect All
                  </Button>
                  <Button variant="ghost" size="sm" onClick={resetState} className="text-xs text-brown-400">
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
                        {trade.quantity > 1 && <span>Qty: {trade.quantity}</span>}
                      </div>
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
                    Importing {importProgress.current}/{importProgress.total}...
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
