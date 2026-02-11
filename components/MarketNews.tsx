"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Newspaper,
  Search,
  Loader2,
  ExternalLink,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface NewsArticle {
  id: number;
  headline: string;
  summary: string;
  source: string;
  datetime: number;
  url: string;
  image: string;
  related: string;
}

type NewsTab = "general" | "ticker";

const formatTimeAgo = (unixTimestamp: number): string => {
  const seconds = Math.floor(Date.now() / 1000 - unixTimestamp);
  if (seconds < 60) return "Just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 172800) return "Yesterday";
  return `${Math.floor(seconds / 86400)}d ago`;
};

interface MarketNewsProps {
  /** Optional: pre-select a ticker symbol */
  selectedSymbol?: string | null;
  /** Callback when user wants to view a ticker */
  onSelectTicker?: (symbol: string) => void;
}

export default function MarketNews({ selectedSymbol, onSelectTicker }: MarketNewsProps) {
  const [activeTab, setActiveTab] = useState<NewsTab>("general");
  const [tickerSearch, setTickerSearch] = useState("");
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [displayCount, setDisplayCount] = useState(10);
  const [currentTicker, setCurrentTicker] = useState<string | null>(null);

  // Fetch general news on mount
  const fetchGeneralNews = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/news?category=general");
      const data = await res.json();

      if (!res.ok || data.error) {
        setError(data.error || "Failed to load news");
        return;
      }

      setArticles(data.articles || []);
      setCurrentTicker(null);
    } catch {
      setError("Failed to load news. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch ticker-specific news
  const fetchTickerNews = useCallback(async (symbol: string) => {
    if (!symbol.trim()) return;

    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/news?symbol=${encodeURIComponent(symbol.toUpperCase())}`);
      const data = await res.json();

      if (!res.ok || data.error) {
        setError(data.error || "Failed to load news");
        return;
      }

      if (data.articles?.length === 0) {
        setError(`No news found for ${symbol.toUpperCase()}`);
        setArticles([]);
      } else {
        setArticles(data.articles || []);
      }
      setCurrentTicker(symbol.toUpperCase());
    } catch {
      setError("Failed to load news. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchGeneralNews();
  }, [fetchGeneralNews]);

  // When tab changes
  useEffect(() => {
    if (activeTab === "general") {
      fetchGeneralNews();
    } else if (activeTab === "ticker" && currentTicker) {
      // Keep current ticker news
    } else if (activeTab === "ticker" && selectedSymbol) {
      setTickerSearch(selectedSymbol);
      fetchTickerNews(selectedSymbol);
    }
    setDisplayCount(10);
  }, [activeTab, fetchGeneralNews, fetchTickerNews, selectedSymbol, currentTicker]);

  // Handle ticker search
  const handleTickerSearch = () => {
    if (tickerSearch.trim()) {
      fetchTickerNews(tickerSearch);
      setDisplayCount(10);
    }
  };

  // Handle key press for search
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleTickerSearch();
    }
  };

  // Handle ticker badge click
  const handleTickerClick = (ticker: string) => {
    if (onSelectTicker) {
      onSelectTicker(ticker);
    } else {
      setActiveTab("ticker");
      setTickerSearch(ticker);
      fetchTickerNews(ticker);
    }
  };

  const displayedArticles = articles.slice(0, displayCount);
  const hasMore = articles.length > displayCount;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Newspaper className="w-5 h-5 text-gold-400" />
          <h2 className="text-sm font-medium text-brown-300">Market News</h2>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => activeTab === "general" ? fetchGeneralNews() : currentTicker && fetchTickerNews(currentTicker)}
          disabled={isLoading}
          className="text-brown-400 hover:text-gold-400"
        >
          <RefreshCw className={cn("w-4 h-4", isLoading && "animate-spin")} />
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        <button
          onClick={() => setActiveTab("general")}
          className={cn(
            "flex-1 py-2.5 text-sm font-medium rounded-lg transition-colors",
            activeTab === "general"
              ? "bg-gold-500 text-brown-900"
              : "bg-brown-800/50 text-brown-400 hover:bg-brown-800"
          )}
        >
          General
        </button>
        <button
          onClick={() => setActiveTab("ticker")}
          className={cn(
            "flex-1 py-2.5 text-sm font-medium rounded-lg transition-colors",
            activeTab === "ticker"
              ? "bg-gold-500 text-brown-900"
              : "bg-brown-800/50 text-brown-400 hover:bg-brown-800"
          )}
        >
          Ticker
        </button>
      </div>

      {/* Ticker Search (when ticker tab is active) */}
      {activeTab === "ticker" && (
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brown-500" />
            <Input
              placeholder="Enter ticker (AAPL, TSLA...)"
              value={tickerSearch}
              onChange={(e) => setTickerSearch(e.target.value.toUpperCase())}
              onKeyDown={handleKeyPress}
              className="pl-9 bg-brown-800/50 border-brown-700 text-brown-100 placeholder:text-brown-500 uppercase"
            />
          </div>
          <Button
            onClick={handleTickerSearch}
            disabled={!tickerSearch.trim() || isLoading}
            className="bg-gold-500 hover:bg-gold-600 text-brown-900"
          >
            Search
          </Button>
        </div>
      )}

      {/* Current ticker indicator */}
      {activeTab === "ticker" && currentTicker && !error && (
        <p className="text-xs text-brown-500">
          Showing news for <span className="text-gold-400 font-medium">{currentTicker}</span>
        </p>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="flex gap-3 p-3 bg-brown-800/30 border border-brown-700/50 rounded-xl animate-pulse"
            >
              <div className="w-20 h-20 md:w-24 md:h-24 bg-brown-700/50 rounded-lg flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-brown-700/50 rounded w-3/4" />
                <div className="h-3 bg-brown-700/50 rounded w-1/2" />
                <div className="h-3 bg-brown-700/50 rounded w-full" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Error State */}
      {!isLoading && error && (
        <div className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/30 rounded-xl">
          <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      {/* News Articles */}
      {!isLoading && !error && (
        <div className="space-y-3">
          {displayedArticles.length === 0 ? (
            <div className="p-8 text-center">
              <Newspaper className="w-10 h-10 text-brown-600 mx-auto mb-3" />
              <p className="text-brown-400">No news available</p>
            </div>
          ) : (
            displayedArticles.map((article) => (
              <a
                key={article.id}
                href={article.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex gap-3 md:gap-4 p-3 md:p-4 bg-brown-800/50 border border-brown-700/50 rounded-xl hover:border-gold-400/30 transition-colors group"
              >
                {/* Thumbnail */}
                <div className="w-20 h-20 md:w-28 md:h-28 flex-shrink-0 rounded-lg overflow-hidden bg-brown-900">
                  {article.image ? (
                    <img
                      src={article.image}
                      alt=""
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = "none";
                      }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Newspaper className="w-8 h-8 text-brown-700" />
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0 flex flex-col">
                  <h3 className="font-semibold text-brown-100 text-sm md:text-base line-clamp-2 mb-1 group-hover:text-gold-400 transition-colors">
                    {article.headline}
                  </h3>
                  <div className="flex items-center gap-2 text-xs text-brown-500 mb-1 md:mb-2">
                    <span>{article.source}</span>
                    <span>·</span>
                    <span>{formatTimeAgo(article.datetime)}</span>
                    <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <p className="text-xs md:text-sm text-brown-400 line-clamp-2 hidden sm:block">
                    {article.summary}
                  </p>

                  {/* Related tickers */}
                  {article.related && (
                    <div className="flex gap-1 mt-auto pt-2 flex-wrap">
                      {article.related
                        .split(",")
                        .slice(0, 3)
                        .map((ticker) => (
                          <button
                            key={ticker}
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleTickerClick(ticker.trim());
                            }}
                            className="px-2 py-0.5 text-[10px] font-medium text-gold-400 bg-gold-400/10 rounded-full border border-gold-400/20 hover:bg-gold-400/20 transition-colors"
                          >
                            {ticker.trim()}
                          </button>
                        ))}
                    </div>
                  )}
                </div>
              </a>
            ))
          )}

          {/* Load More Button */}
          {hasMore && (
            <Button
              onClick={() => setDisplayCount((prev) => prev + 10)}
              variant="outline"
              className="w-full border-brown-700 text-brown-300 hover:bg-brown-800"
            >
              Load More ({articles.length - displayCount} remaining)
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
