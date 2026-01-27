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

interface ParsedTrade {
  id: string;
  date: string;
  symbol: string;
  side: "buy" | "sell";
  quantity: number;
  price: number;
  type: string;
  assetType: "stock" | "call" | "put";
  pnl: number | null;
  isDuplicate: boolean;
  selected: boolean;
}

interface ImportTradesModalProps {
  isOpen: boolean;
  onClose: () => void;
  existingTrades: Trade[];
  onImport: (trades: Omit<Trade, "id" | "user_id" | "created_at">[]) => Promise<void>;
}

export default function ImportTradesModal({
  isOpen,
  onClose,
  existingTrades,
  onImport,
}: ImportTradesModalProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [parsedTrades, setParsedTrades] = useState<ParsedTrade[]>([]);
  const [parseError, setParseError] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [importSuccess, setImportSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const resetState = () => {
    setParsedTrades([]);
    setParseError(null);
    setImportSuccess(false);
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  // Check if a trade is a duplicate
  const isDuplicateTrade = useCallback(
    (trade: { date: string; symbol: string; quantity: number; price: number }) => {
      return existingTrades.some(
        (existing) =>
          existing.trade_date.split("T")[0] === trade.date &&
          existing.symbol.toUpperCase() === trade.symbol.toUpperCase() &&
          existing.quantity === trade.quantity &&
          Math.abs(existing.price - trade.price) < 0.01
      );
    },
    [existingTrades]
  );

  // Parse Robinhood CSV format
  const parseRobinhoodCSV = useCallback(
    (csvText: string): ParsedTrade[] => {
      const lines = csvText.trim().split("\n");
      if (lines.length < 2) {
        throw new Error("CSV file appears to be empty");
      }

      // Get headers (first line)
      const headers = lines[0].split(",").map((h) => h.trim().toLowerCase().replace(/"/g, ""));

      // Find column indices - Robinhood uses various column names
      const findColumn = (names: string[]) => {
        for (const name of names) {
          const index = headers.findIndex((h) => h.includes(name));
          if (index !== -1) return index;
        }
        return -1;
      };

      const symbolIdx = findColumn(["symbol", "instrument"]);
      const dateIdx = findColumn(["date", "activity date", "trans date", "settlement date"]);
      const sideIdx = findColumn(["side", "trans code", "action", "type"]);
      const quantityIdx = findColumn(["quantity", "qty", "shares", "amount"]);
      const priceIdx = findColumn(["price", "average price", "avg price"]);
      const typeIdx = findColumn(["order type", "type"]);

      if (symbolIdx === -1 || dateIdx === -1 || quantityIdx === -1) {
        throw new Error(
          "Could not find required columns. Make sure the CSV has Symbol, Date, and Quantity columns."
        );
      }

      const trades: ParsedTrade[] = [];

      for (let i = 1; i < lines.length; i++) {
        const line = lines[i];
        if (!line.trim()) continue;

        // Parse CSV line handling quoted values
        const values: string[] = [];
        let current = "";
        let inQuotes = false;

        for (const char of line) {
          if (char === '"') {
            inQuotes = !inQuotes;
          } else if (char === "," && !inQuotes) {
            values.push(current.trim());
            current = "";
          } else {
            current += char;
          }
        }
        values.push(current.trim());

        const symbol = values[symbolIdx]?.replace(/"/g, "").trim();
        const dateStr = values[dateIdx]?.replace(/"/g, "").trim();
        const sideRaw = sideIdx !== -1 ? values[sideIdx]?.replace(/"/g, "").toLowerCase().trim() : "";
        const quantityRaw = values[quantityIdx]?.replace(/"/g, "").trim();
        const priceRaw = priceIdx !== -1 ? values[priceIdx]?.replace(/"/g, "").trim() : "0";
        const orderType = typeIdx !== -1 ? values[typeIdx]?.replace(/"/g, "").trim() : "";

        // Skip if essential data is missing
        if (!symbol || !dateStr || !quantityRaw) continue;

        // Parse quantity (remove any non-numeric chars except decimal and minus)
        const quantity = Math.abs(parseFloat(quantityRaw.replace(/[^0-9.-]/g, "")) || 0);
        if (quantity === 0) continue;

        // Parse price
        const price = parseFloat(priceRaw.replace(/[^0-9.-]/g, "")) || 0;

        // Determine buy/sell from side or quantity sign
        let side: "buy" | "sell" = "buy";
        if (sideRaw.includes("sell") || sideRaw.includes("sld") || quantityRaw.startsWith("-")) {
          side = "sell";
        } else if (sideRaw.includes("buy") || sideRaw.includes("bot")) {
          side = "buy";
        }

        // Parse date - try multiple formats
        let parsedDate: Date | null = null;
        const dateFormats = [
          /(\d{4})-(\d{2})-(\d{2})/, // YYYY-MM-DD
          /(\d{2})\/(\d{2})\/(\d{4})/, // MM/DD/YYYY
          /(\d{2})-(\d{2})-(\d{4})/, // MM-DD-YYYY
        ];

        for (const format of dateFormats) {
          const match = dateStr.match(format);
          if (match) {
            if (format === dateFormats[0]) {
              parsedDate = new Date(`${match[1]}-${match[2]}-${match[3]}`);
            } else {
              parsedDate = new Date(`${match[3]}-${match[1]}-${match[2]}`);
            }
            break;
          }
        }

        if (!parsedDate || isNaN(parsedDate.getTime())) {
          parsedDate = new Date(dateStr);
        }

        if (isNaN(parsedDate.getTime())) continue;

        const formattedDate = parsedDate.toISOString().split("T")[0];

        // Determine asset type (stock vs option)
        // Options typically have longer symbols with strike prices
        const isOption = symbol.length > 10 || symbol.includes(" ") || /\d{6}[CP]\d+/.test(symbol);
        let assetType: "stock" | "call" | "put" = "stock";

        if (isOption) {
          // Check if it's a call or put based on symbol
          if (symbol.toLowerCase().includes("call") || /\d{6}C\d+/.test(symbol)) {
            assetType = "call";
          } else if (symbol.toLowerCase().includes("put") || /\d{6}P\d+/.test(symbol)) {
            assetType = "put";
          } else {
            assetType = "call"; // Default to call for options
          }
        }

        // Clean up symbol for options (extract underlying)
        let cleanSymbol = symbol;
        if (isOption) {
          // Try to extract underlying symbol from option symbol
          const underlyingMatch = symbol.match(/^([A-Z]+)/);
          if (underlyingMatch) {
            cleanSymbol = `${underlyingMatch[1]} ${assetType.toUpperCase()}`;
          }
        }

        const trade: ParsedTrade = {
          id: `import-${i}-${Date.now()}`,
          date: formattedDate,
          symbol: cleanSymbol.toUpperCase(),
          side,
          quantity,
          price,
          type: orderType,
          assetType,
          pnl: null, // Will be calculated when paired with closing trade
          isDuplicate: isDuplicateTrade({
            date: formattedDate,
            symbol: cleanSymbol.toUpperCase(),
            quantity,
            price,
          }),
          selected: true,
        };

        trades.push(trade);
      }

      if (trades.length === 0) {
        throw new Error("No valid trades found in the CSV file");
      }

      return trades;
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
          setParsedTrades(trades);
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
    setParsedTrades((prev) =>
      prev.map((t) => (t.id === id ? { ...t, selected: !t.selected } : t))
    );
  };

  const selectAll = (selected: boolean) => {
    setParsedTrades((prev) =>
      prev.map((t) => ({ ...t, selected: t.isDuplicate ? false : selected }))
    );
  };

  const removeTradeFromPreview = (id: string) => {
    setParsedTrades((prev) => prev.filter((t) => t.id !== id));
  };

  const handleImport = async () => {
    const selectedTrades = parsedTrades.filter((t) => t.selected && !t.isDuplicate);
    if (selectedTrades.length === 0) return;

    setIsImporting(true);

    try {
      const tradesToImport = selectedTrades.map((t) => ({
        symbol: t.symbol,
        trade_type: t.side,
        asset_type: t.assetType,
        quantity: t.quantity,
        price: t.price,
        total_value: t.price * t.quantity * (t.assetType === "stock" ? 1 : 100),
        pnl: t.pnl,
        notes: `Imported from Robinhood - ${t.type || "Market"}`,
        trade_date: t.date,
      }));

      await onImport(tradesToImport);
      setImportSuccess(true);

      // Close after short delay
      setTimeout(() => {
        handleClose();
      }, 1500);
    } catch (error) {
      setParseError("Failed to import trades. Please try again.");
    } finally {
      setIsImporting(false);
    }
  };

  const selectedCount = parsedTrades.filter((t) => t.selected && !t.isDuplicate).length;
  const duplicateCount = parsedTrades.filter((t) => t.isDuplicate).length;

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
            </div>
          ) : parsedTrades.length === 0 ? (
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
              {/* Preview Header */}
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm text-brown-200">
                    Found <span className="text-gold-400 font-semibold">{parsedTrades.length}</span> trades
                  </p>
                  {duplicateCount > 0 && (
                    <p className="text-xs text-amber-400">
                      {duplicateCount} duplicate{duplicateCount !== 1 ? "s" : ""} detected (already imported)
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

              {/* Trade Preview List */}
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {parsedTrades.map((trade) => (
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
                        "w-5 h-5 rounded border-2 flex items-center justify-center transition-colors",
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
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-brown-100">{trade.symbol}</span>
                        <span
                          className={cn(
                            "text-xs px-1.5 py-0.5 rounded",
                            trade.side === "buy"
                              ? "bg-emerald-500/20 text-emerald-400"
                              : "bg-red-500/20 text-red-400"
                          )}
                        >
                          {trade.side.toUpperCase()}
                        </span>
                        <span className="text-xs px-1.5 py-0.5 rounded bg-brown-700/50 text-brown-400">
                          {trade.assetType}
                        </span>
                        {trade.isDuplicate && (
                          <span className="text-xs px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400">
                            Duplicate
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-brown-500 mt-1">
                        <span>{trade.date}</span>
                        <span>Qty: {trade.quantity}</span>
                        <span>@ ${trade.price.toFixed(2)}</span>
                      </div>
                    </div>

                    {/* Remove Button */}
                    <button
                      onClick={() => removeTradeFromPreview(trade.id)}
                      className="p-1 text-brown-500 hover:text-red-400 transition-colors"
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
        {parsedTrades.length > 0 && !importSuccess && (
          <div className="flex items-center justify-between p-4 border-t border-brown-700">
            <p className="text-sm text-brown-400">
              {selectedCount} trade{selectedCount !== 1 ? "s" : ""} selected for import
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
