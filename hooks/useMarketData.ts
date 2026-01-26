"use client";

import { useState, useCallback, useMemo } from "react";
import useSWR from "swr";
import { StockQuote, OptionsChain } from "@/lib/types";
import { fetcher, marketDataConfig } from "@/lib/swr-config";

interface UseMarketDataOptions {
  symbol?: string;
  expiration?: string;
}

export function useMarketData(options: UseMarketDataOptions = {}) {
  const [selectedSymbol, setSelectedSymbol] = useState<string | null>(
    options.symbol || null
  );
  const [selectedExpiration, setSelectedExpiration] = useState<string | null>(
    options.expiration || null
  );

  // Fetch quote with SWR caching
  const {
    data: quoteData,
    error: quoteError,
    isLoading: quoteLoading,
    isValidating: quoteValidating,
    mutate: mutateQuote,
  } = useSWR<StockQuote>(
    selectedSymbol ? `/api/stock?symbol=${selectedSymbol}` : null,
    fetcher,
    {
      ...marketDataConfig,
      revalidateOnMount: true,
    }
  );

  // Fetch expirations
  const {
    data: expirationsData,
    error: expirationsError,
    isLoading: expirationsLoading,
  } = useSWR<{ expirations: string[] }>(
    selectedSymbol ? `/api/options?symbol=${selectedSymbol}` : null,
    fetcher,
    {
      ...marketDataConfig,
      refreshInterval: 300000, // Expirations don't change often - 5 min
    }
  );

  // Fetch options chain
  const {
    data: chainData,
    error: chainError,
    isLoading: chainLoading,
    isValidating: chainValidating,
  } = useSWR<OptionsChain>(
    selectedSymbol && selectedExpiration
      ? `/api/options?symbol=${selectedSymbol}&expiration=${selectedExpiration}`
      : null,
    fetcher,
    marketDataConfig
  );

  // Memoized state
  const quote = useMemo(() => quoteData || null, [quoteData]);
  const expirations = useMemo(
    () => expirationsData?.expirations || [],
    [expirationsData]
  );
  const chain = useMemo(() => chainData || null, [chainData]);

  const isLoading = quoteLoading || expirationsLoading || chainLoading;
  const isValidating = quoteValidating || chainValidating;
  const error = quoteError?.message || expirationsError?.message || chainError?.message || null;

  // Callbacks
  const fetchQuote = useCallback(
    async (symbol: string) => {
      setSelectedSymbol(symbol.toUpperCase());
      setSelectedExpiration(null);
      // SWR will automatically fetch when symbol changes
      // Return the current data or wait for new data
      return quoteData || null;
    },
    [quoteData]
  );

  const fetchOptionsChain = useCallback(
    async (symbol: string, expiration: string) => {
      setSelectedSymbol(symbol.toUpperCase());
      setSelectedExpiration(expiration);
      return chainData || null;
    },
    [chainData]
  );

  const clearData = useCallback(() => {
    setSelectedSymbol(null);
    setSelectedExpiration(null);
  }, []);

  const refreshQuote = useCallback(() => {
    mutateQuote();
  }, [mutateQuote]);

  return {
    quote,
    expirations,
    chain,
    selectedExpiration,
    isLoading,
    isValidating, // Show stale data indicator
    error,
    lastUpdated: quote?.timestamp || null,
    fetchQuote,
    fetchOptionsChain,
    clearData,
    refreshQuote,
  };
}

// Standalone hook for just market indices (SPY, QQQ, VIX)
export function useMarketIndices() {
  const symbols = ["SPY", "QQQ", "VIX"];

  const { data, error, isLoading, isValidating, mutate } = useSWR<StockQuote[]>(
    "/api/market-indices",
    async () => {
      const results = await Promise.all(
        symbols.map((symbol) =>
          fetch(`/api/stock?symbol=${symbol}`)
            .then((r) => (r.ok ? r.json() : null))
            .catch(() => null)
        )
      );
      return results.filter(Boolean) as StockQuote[];
    },
    {
      ...marketDataConfig,
      refreshInterval: 30000, // Every 30 seconds
      dedupingInterval: 10000,
    }
  );

  return {
    indices: data || [],
    isLoading,
    isValidating,
    error: error?.message || null,
    refresh: mutate,
  };
}
