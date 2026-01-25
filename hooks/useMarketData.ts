"use client";

import { useState, useCallback } from "react";
import {
  StockQuote,
  OptionsChain,
  MarketDataState,
} from "@/lib/types";

const initialState: MarketDataState = {
  quote: null,
  expirations: [],
  chain: null,
  selectedExpiration: null,
  isLoading: false,
  error: null,
  lastUpdated: null,
};

export function useMarketData() {
  const [state, setState] = useState<MarketDataState>(initialState);

  const fetchQuote = useCallback(async (symbol: string) => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      const response = await fetch(`/api/stock?symbol=${symbol}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch quote");
      }

      setState((prev) => ({
        ...prev,
        quote: data as StockQuote,
        isLoading: false,
        lastUpdated: data.timestamp,
      }));

      // Also fetch expirations
      await fetchExpirations(symbol);

      return data as StockQuote;
    } catch (error) {
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }));
      return null;
    }
  }, []);

  const fetchExpirations = useCallback(async (symbol: string) => {
    try {
      const response = await fetch(`/api/options?symbol=${symbol}`);
      const data = await response.json();

      if (!response.ok) {
        // Don't throw for options - some stocks don't have options
        console.warn("Options not available:", data.error);
        setState((prev) => ({ ...prev, expirations: [] }));
        return;
      }

      setState((prev) => ({
        ...prev,
        expirations: data.expirations || [],
        selectedExpiration: null,
        chain: null,
      }));
    } catch (error) {
      console.error("Failed to fetch expirations:", error);
      setState((prev) => ({ ...prev, expirations: [] }));
    }
  }, []);

  const fetchOptionsChain = useCallback(
    async (symbol: string, expiration: string) => {
      setState((prev) => ({
        ...prev,
        isLoading: true,
        selectedExpiration: expiration,
      }));

      try {
        const response = await fetch(
          `/api/options?symbol=${symbol}&expiration=${expiration}`
        );
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Failed to fetch options chain");
        }

        setState((prev) => ({
          ...prev,
          chain: data as OptionsChain,
          isLoading: false,
          lastUpdated: data.timestamp,
        }));

        return data as OptionsChain;
      } catch (error) {
        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: error instanceof Error ? error.message : "Unknown error",
        }));
        return null;
      }
    },
    []
  );

  const clearData = useCallback(() => {
    setState(initialState);
  }, []);

  return {
    ...state,
    fetchQuote,
    fetchOptionsChain,
    clearData,
  };
}
