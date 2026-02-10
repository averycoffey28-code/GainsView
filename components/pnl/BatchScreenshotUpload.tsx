"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  X,
  Upload,
  Loader2,
  Check,
  AlertCircle,
  Trash2,
  ChevronDown,
  ChevronUp,
  Camera,
  ImagePlus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

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

type ImageStatus = "queued" | "processing" | "done" | "error";

interface ImageItem {
  id: string;
  file: File;
  preview: string;
  status: ImageStatus;
  error?: string;
  extractedTrade?: ExtractedTrade;
}

interface ReviewTrade extends ExtractedTrade {
  id: string;
  imageId: string;
  selected: boolean;
  // Editable fields
  editSymbol: string;
  editQuantity: string;
  editPnL: string;
  editDate: string;
}

interface BatchScreenshotUploadProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveTrades: (trades: Array<{
    symbol: string;
    trade_type: "buy" | "sell";
    asset_type: "stock" | "call" | "put";
    quantity: number;
    price: number;
    total_value: number;
    pnl: number;
    notes: string | null;
    trade_date: string;
  }>) => Promise<void>;
  getToday: () => string;
  initialFiles?: File[];
}

export default function BatchScreenshotUpload({
  isOpen,
  onClose,
  onSaveTrades,
  getToday,
  initialFiles,
}: BatchScreenshotUploadProps) {
  const [step, setStep] = useState<"upload" | "processing" | "review">("upload");
  const [images, setImages] = useState<ImageItem[]>([]);
  const [reviewTrades, setReviewTrades] = useState<ReviewTrade[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [expandedTrade, setExpandedTrade] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Generate unique ID
  const generateId = () => Math.random().toString(36).substr(2, 9);

  // Handle file selection
  const handleFileSelect = useCallback((files: FileList | File[]) => {
    const fileArray = Array.from(files);
    const validFiles = fileArray.filter(file => {
      const validTypes = ["image/png", "image/jpeg", "image/jpg", "image/webp"];
      const maxSize = 10 * 1024 * 1024; // 10MB
      return validTypes.includes(file.type) && file.size <= maxSize;
    });

    const newImages: ImageItem[] = validFiles.map(file => ({
      id: generateId(),
      file,
      preview: URL.createObjectURL(file),
      status: "queued" as ImageStatus,
    }));

    setImages(prev => [...prev, ...newImages]);
  }, []);

  // Load initial files when modal opens with them
  useEffect(() => {
    if (isOpen && initialFiles && initialFiles.length > 0) {
      handleFileSelect(initialFiles);
    }
  }, [isOpen, initialFiles, handleFileSelect]);

  // Drag and drop handlers
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.currentTarget === dropZoneRef.current) {
      setIsDragging(false);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileSelect(files);
    }
  }, [handleFileSelect]);

  // Remove image
  const removeImage = useCallback((id: string) => {
    setImages(prev => {
      const image = prev.find(img => img.id === id);
      if (image) {
        URL.revokeObjectURL(image.preview);
      }
      return prev.filter(img => img.id !== id);
    });
  }, []);

  // Clear all
  const clearAll = useCallback(() => {
    images.forEach(img => URL.revokeObjectURL(img.preview));
    setImages([]);
  }, [images]);

  // Process a single image
  const processImage = async (image: ImageItem): Promise<ImageItem> => {
    try {
      // Read file as base64
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target?.result as string);
        reader.onerror = () => reject(new Error("Failed to read file"));
        reader.readAsDataURL(image.file);
      });

      const response = await fetch("/api/extract-trade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: base64 }),
      });

      const data = await response.json();

      if (!response.ok || data.error) {
        return {
          ...image,
          status: "error",
          error: data.error || "Failed to analyze screenshot",
        };
      }

      return {
        ...image,
        status: "done",
        extractedTrade: data.trade,
      };
    } catch (error) {
      return {
        ...image,
        status: "error",
        error: "Failed to process screenshot",
      };
    }
  };

  // Start batch processing
  const startProcessing = async () => {
    if (images.length === 0) return;

    setStep("processing");
    setIsProcessing(true);

    // Process images sequentially to respect rate limits
    const processedImages: ImageItem[] = [...images];

    for (let i = 0; i < processedImages.length; i++) {
      // Update status to processing
      setImages(prev => prev.map((img, idx) =>
        idx === i ? { ...img, status: "processing" as ImageStatus } : img
      ));

      // Add a small delay between requests to avoid rate limiting
      if (i > 0) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      const result = await processImage(processedImages[i]);
      processedImages[i] = result;

      // Update the image with result
      setImages(prev => prev.map((img, idx) =>
        idx === i ? result : img
      ));
    }

    setIsProcessing(false);

    // Build review trades from successful extractions
    const successfulTrades: ReviewTrade[] = processedImages
      .filter(img => img.status === "done" && img.extractedTrade)
      .map(img => ({
        ...img.extractedTrade!,
        id: generateId(),
        imageId: img.id,
        selected: true,
        editSymbol: img.extractedTrade!.symbol,
        editQuantity: String(img.extractedTrade!.quantity || 1),
        editPnL: String(img.extractedTrade!.profitLoss || 0),
        editDate: img.extractedTrade!.closeDate || getToday(),
      }));

    setReviewTrades(successfulTrades);
    setStep("review");
  };

  // Toggle trade selection
  const toggleTradeSelection = (id: string) => {
    setReviewTrades(prev => prev.map(trade =>
      trade.id === id ? { ...trade, selected: !trade.selected } : trade
    ));
  };

  // Update trade field
  const updateTradeField = (id: string, field: keyof ReviewTrade, value: string) => {
    setReviewTrades(prev => prev.map(trade =>
      trade.id === id ? { ...trade, [field]: value } : trade
    ));
  };

  // Remove trade from review
  const removeTradeFromReview = (id: string) => {
    setReviewTrades(prev => prev.filter(trade => trade.id !== id));
  };

  // Save all selected trades
  const handleSaveAll = async () => {
    const selectedTrades = reviewTrades.filter(t => t.selected);
    if (selectedTrades.length === 0) return;

    setIsSaving(true);

    const tradesToSave = selectedTrades.map(trade => {
      const assetType = trade.optionType === "stock" ? "stock" : trade.optionType;
      const quantity = parseInt(trade.editQuantity) || 1;
      const exitPrice = trade.exitPrice || 0;
      const multiplier = assetType === "stock" ? 1 : 100;
      const pnl = parseFloat(trade.editPnL) || trade.profitLoss || 0;

      return {
        symbol: trade.editSymbol.toUpperCase(),
        trade_type: "sell" as const,
        asset_type: assetType as "stock" | "call" | "put",
        quantity,
        price: Math.round(exitPrice * 100) / 100,
        total_value: Math.round(exitPrice * quantity * multiplier * 100) / 100,
        pnl: Math.round(pnl * 100) / 100,
        notes: trade.strikePrice
          ? `$${trade.strikePrice} ${trade.optionType} ${trade.expirationDate || ""}`
          : null,
        trade_date: trade.editDate || getToday(),
      };
    });

    try {
      await onSaveTrades(tradesToSave);
      handleClose();
    } catch (error) {
      console.error("Failed to save trades:", error);
    } finally {
      setIsSaving(false);
    }
  };

  // Close and reset
  const handleClose = () => {
    images.forEach(img => URL.revokeObjectURL(img.preview));
    setImages([]);
    setReviewTrades([]);
    setStep("upload");
    setIsProcessing(false);
    setIsSaving(false);
    setExpandedTrade(null);
    onClose();
  };

  // Go back
  const handleBack = () => {
    if (step === "processing" && !isProcessing) {
      setStep("upload");
    } else if (step === "review") {
      setStep("upload");
    }
  };

  if (!isOpen || typeof document === "undefined") return null;

  const selectedCount = reviewTrades.filter(t => t.selected).length;
  const successCount = images.filter(img => img.status === "done").length;
  const errorCount = images.filter(img => img.status === "error").length;

  return createPortal(
    <div
      className="fixed inset-0 flex flex-col bg-brown-900 sm:bg-transparent sm:items-center sm:justify-center sm:p-4"
      style={{ zIndex: 9999, height: "100dvh" }}
    >
      {/* Desktop backdrop */}
      <div
        className="hidden sm:block absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Modal shell */}
      <div className="relative flex flex-col flex-1 sm:flex-initial sm:w-full sm:max-w-2xl sm:max-h-[90vh] sm:rounded-2xl sm:border sm:border-brown-700 sm:shadow-2xl bg-brown-900 overflow-hidden">
        {/* Header */}
        <div className="flex-shrink-0 flex items-center justify-between p-4 border-b border-brown-700">
          <div className="flex items-center gap-3">
            {step !== "upload" && (
              <button
                onClick={handleBack}
                disabled={isProcessing}
                className="p-1 text-brown-400 hover:text-brown-200 transition-colors disabled:opacity-50"
              >
                <ChevronDown className="w-5 h-5 rotate-90" />
              </button>
            )}
            <h2 className="text-lg font-semibold text-brown-50">
              {step === "upload" && "Batch Screenshot Upload"}
              {step === "processing" && "Processing Screenshots..."}
              {step === "review" && "Review & Confirm Trades"}
            </h2>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="p-1 text-brown-400 hover:text-brown-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step indicator */}
        <div className="flex-shrink-0 flex items-center justify-center gap-2 py-3 px-4 border-b border-brown-800/50">
          {["Upload", "Process", "Review"].map((label, idx) => {
            const stepIndex = step === "upload" ? 0 : step === "processing" ? 1 : 2;
            const isActive = idx === stepIndex;
            const isComplete = idx < stepIndex;
            return (
              <div key={label} className="flex items-center gap-2">
                {idx > 0 && <div className={cn("w-8 h-0.5", isComplete ? "bg-gold-500" : "bg-brown-700")} />}
                <div className={cn(
                  "flex items-center justify-center w-6 h-6 rounded-full text-xs font-medium",
                  isActive ? "bg-gold-500 text-brown-900" : isComplete ? "bg-gold-500/30 text-gold-400" : "bg-brown-800 text-brown-500"
                )}>
                  {isComplete ? <Check className="w-3 h-3" /> : idx + 1}
                </div>
                <span className={cn("text-sm", isActive ? "text-brown-100" : "text-brown-500")}>{label}</span>
              </div>
            );
          })}
        </div>

        {/* Content */}
        <div
          className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-4"
          style={{ WebkitOverflowScrolling: "touch" }}
        >
          {/* Upload Step */}
          {step === "upload" && (
            <div className="space-y-4">
              {/* Dropzone */}
              <div
                ref={dropZoneRef}
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={cn(
                  "relative flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-xl cursor-pointer transition-all",
                  isDragging
                    ? "border-gold-400 bg-gold-500/10"
                    : "border-brown-600 hover:border-brown-500 hover:bg-brown-800/30"
                )}
              >
                <ImagePlus className={cn("w-12 h-12 mb-3", isDragging ? "text-gold-400" : "text-brown-500")} />
                <p className="text-brown-200 font-medium text-center">
                  {isDragging ? "Drop screenshots here" : "Drag & drop screenshots"}
                </p>
                <p className="text-brown-500 text-sm mt-1">or click to browse</p>
                <p className="text-brown-600 text-xs mt-3">PNG, JPG, JPEG, WEBP • Max 10MB each</p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".png,.jpg,.jpeg,.webp"
                  multiple
                  onChange={(e) => e.target.files && handleFileSelect(e.target.files)}
                  className="hidden"
                />
              </div>

              {/* Thumbnail grid */}
              {images.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-brown-300">{images.length} screenshot{images.length !== 1 ? "s" : ""} ready</p>
                    <button
                      onClick={clearAll}
                      className="text-sm text-red-400 hover:text-red-300 transition-colors"
                    >
                      Clear all
                    </button>
                  </div>
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                    {images.map((image) => (
                      <div key={image.id} className="relative group aspect-square rounded-lg overflow-hidden border border-brown-700 bg-brown-800">
                        <img
                          src={image.preview}
                          alt="Screenshot preview"
                          className="w-full h-full object-cover"
                        />
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            removeImage(image.id);
                          }}
                          className="absolute top-1 right-1 p-1 bg-brown-900/80 rounded-full text-brown-400 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                    {/* Add more button */}
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="aspect-square rounded-lg border-2 border-dashed border-brown-700 hover:border-brown-600 flex flex-col items-center justify-center text-brown-500 hover:text-brown-400 transition-colors"
                    >
                      <Upload className="w-5 h-5" />
                      <span className="text-xs mt-1">Add</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Empty state */}
              {images.length === 0 && (
                <div className="text-center py-4">
                  <p className="text-brown-500 text-sm">
                    Upload multiple trade screenshots at once to quickly log your trades.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Processing Step */}
          {step === "processing" && (
            <div className="space-y-4">
              <div className="flex items-center justify-center gap-4 py-4">
                {isProcessing && <Loader2 className="w-6 h-6 text-gold-400 animate-spin" />}
                <div className="text-center">
                  <p className="text-brown-200">
                    {isProcessing ? "Analyzing screenshots with AI..." : "Processing complete"}
                  </p>
                  <p className="text-brown-500 text-sm mt-1">
                    {successCount} of {images.length} processed
                    {errorCount > 0 && ` • ${errorCount} failed`}
                  </p>
                </div>
              </div>

              {/* Processing status grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {images.map((image) => (
                  <div
                    key={image.id}
                    className={cn(
                      "relative aspect-video rounded-lg overflow-hidden border bg-brown-800",
                      image.status === "done" && "border-emerald-500/50",
                      image.status === "error" && "border-red-500/50",
                      image.status === "processing" && "border-gold-500/50",
                      image.status === "queued" && "border-brown-700"
                    )}
                  >
                    <img
                      src={image.preview}
                      alt="Screenshot"
                      className={cn("w-full h-full object-cover", image.status !== "done" && "opacity-50")}
                    />
                    <div className="absolute inset-0 flex items-center justify-center bg-brown-900/40">
                      {image.status === "queued" && (
                        <div className="px-2 py-1 bg-brown-800/90 rounded text-xs text-brown-400">Queued</div>
                      )}
                      {image.status === "processing" && (
                        <Loader2 className="w-6 h-6 text-gold-400 animate-spin" />
                      )}
                      {image.status === "done" && (
                        <div className="p-2 bg-emerald-500/90 rounded-full">
                          <Check className="w-4 h-4 text-white" />
                        </div>
                      )}
                      {image.status === "error" && (
                        <div className="flex flex-col items-center px-2 py-1.5 bg-red-500/90 rounded">
                          <AlertCircle className="w-4 h-4 text-white" />
                          <span className="text-xs text-white mt-0.5">Failed</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Review Step */}
          {step === "review" && (
            <div className="space-y-4">
              {reviewTrades.length === 0 ? (
                <div className="text-center py-8">
                  <AlertCircle className="w-12 h-12 text-brown-500 mx-auto mb-3" />
                  <p className="text-brown-300">No trades could be extracted</p>
                  <p className="text-brown-500 text-sm mt-1">Try uploading clearer screenshots</p>
                  <Button
                    onClick={() => setStep("upload")}
                    variant="outline"
                    className="mt-4 border-brown-700 text-brown-300"
                  >
                    Try Again
                  </Button>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-brown-300">
                      {selectedCount} of {reviewTrades.length} trades selected
                    </p>
                    <button
                      onClick={() => setReviewTrades(prev => prev.map(t => ({ ...t, selected: true })))}
                      className="text-sm text-gold-400 hover:text-gold-300 transition-colors"
                    >
                      Select all
                    </button>
                  </div>

                  {/* Trade list */}
                  <div className="space-y-2">
                    {reviewTrades.map((trade) => {
                      const isExpanded = expandedTrade === trade.id;
                      return (
                        <div
                          key={trade.id}
                          className={cn(
                            "border rounded-lg overflow-hidden transition-colors",
                            trade.selected ? "border-brown-600 bg-brown-800/50" : "border-brown-700/50 bg-brown-800/20 opacity-60"
                          )}
                        >
                          {/* Trade summary row */}
                          <div className="flex items-center gap-3 p-3">
                            <input
                              type="checkbox"
                              checked={trade.selected}
                              onChange={() => toggleTradeSelection(trade.id)}
                              className="w-4 h-4 rounded border-brown-600 text-gold-500 focus:ring-gold-500 bg-brown-800"
                            />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-brown-100">{trade.editSymbol}</span>
                                <span className="text-xs text-brown-500 capitalize">
                                  {trade.optionType}
                                  {trade.strikePrice && ` $${trade.strikePrice}`}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 text-xs text-brown-400">
                                <span>{trade.editQuantity} {trade.optionType === "stock" ? "shares" : "contracts"}</span>
                                <span>•</span>
                                <span>{trade.editDate}</span>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className={cn(
                                "font-bold",
                                parseFloat(trade.editPnL) >= 0 ? "text-emerald-400" : "text-red-400"
                              )}>
                                {parseFloat(trade.editPnL) >= 0 ? "+" : ""}${parseFloat(trade.editPnL).toFixed(2)}
                              </p>
                            </div>
                            <button
                              onClick={() => setExpandedTrade(isExpanded ? null : trade.id)}
                              className="p-1 text-brown-400 hover:text-brown-200 transition-colors"
                            >
                              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                            </button>
                          </div>

                          {/* Expanded edit form */}
                          {isExpanded && (
                            <div className="px-3 pb-3 pt-1 border-t border-brown-700/50 space-y-3">
                              <div className="grid grid-cols-2 gap-3">
                                <div>
                                  <label className="text-xs text-brown-500 uppercase">Symbol</label>
                                  <Input
                                    value={trade.editSymbol}
                                    onChange={(e) => updateTradeField(trade.id, "editSymbol", e.target.value.toUpperCase())}
                                    className="mt-1 bg-brown-800 border-brown-600 text-brown-100"
                                  />
                                </div>
                                <div>
                                  <label className="text-xs text-brown-500 uppercase">Quantity</label>
                                  <Input
                                    type="number"
                                    value={trade.editQuantity}
                                    onChange={(e) => updateTradeField(trade.id, "editQuantity", e.target.value)}
                                    className="mt-1 bg-brown-800 border-brown-600 text-brown-100"
                                  />
                                </div>
                                <div>
                                  <label className="text-xs text-brown-500 uppercase">P&L</label>
                                  <Input
                                    type="number"
                                    step="0.01"
                                    value={trade.editPnL}
                                    onChange={(e) => updateTradeField(trade.id, "editPnL", e.target.value)}
                                    className="mt-1 bg-brown-800 border-brown-600 text-brown-100"
                                  />
                                </div>
                                <div>
                                  <label className="text-xs text-brown-500 uppercase">Date</label>
                                  <Input
                                    type="date"
                                    value={trade.editDate}
                                    onChange={(e) => updateTradeField(trade.id, "editDate", e.target.value)}
                                    className="mt-1 bg-brown-800 border-brown-600 text-brown-100"
                                  />
                                </div>
                              </div>
                              <div className="flex justify-end">
                                <button
                                  onClick={() => removeTradeFromReview(trade.id)}
                                  className="flex items-center gap-1 text-sm text-red-400 hover:text-red-300 transition-colors"
                                >
                                  <Trash2 className="w-3 h-3" />
                                  Remove
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Summary */}
                  <div className="p-3 bg-brown-800/50 rounded-lg border border-brown-700">
                    <div className="flex items-center justify-between">
                      <span className="text-brown-400">Total P&L from selected:</span>
                      <span className={cn(
                        "font-bold text-lg",
                        reviewTrades.filter(t => t.selected).reduce((sum, t) => sum + (parseFloat(t.editPnL) || 0), 0) >= 0
                          ? "text-emerald-400"
                          : "text-red-400"
                      )}>
                        {(() => {
                          const total = reviewTrades.filter(t => t.selected).reduce((sum, t) => sum + (parseFloat(t.editPnL) || 0), 0);
                          return `${total >= 0 ? "+" : ""}$${total.toFixed(2)}`;
                        })()}
                      </span>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          className="flex-shrink-0 flex gap-2 p-4 border-t border-brown-700 bg-brown-900"
          style={{ paddingBottom: "max(1rem, env(safe-area-inset-bottom))" }}
        >
          <Button
            variant="ghost"
            onClick={handleClose}
            className="flex-1 text-brown-400"
          >
            Cancel
          </Button>

          {step === "upload" && (
            <Button
              onClick={startProcessing}
              disabled={images.length === 0}
              className="flex-1 bg-gold-500 hover:bg-gold-600 text-brown-900"
            >
              <Camera className="w-4 h-4 mr-2" />
              Process {images.length > 0 ? `${images.length} Screenshot${images.length !== 1 ? "s" : ""}` : "Screenshots"}
            </Button>
          )}

          {step === "processing" && !isProcessing && (
            <Button
              onClick={() => setStep("review")}
              className="flex-1 bg-gold-500 hover:bg-gold-600 text-brown-900"
            >
              Continue to Review
            </Button>
          )}

          {step === "review" && reviewTrades.length > 0 && (
            <Button
              onClick={handleSaveAll}
              disabled={selectedCount === 0 || isSaving}
              className="flex-1 bg-gold-500 hover:bg-gold-600 text-brown-900"
            >
              {isSaving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  Save {selectedCount} Trade{selectedCount !== 1 ? "s" : ""}
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
