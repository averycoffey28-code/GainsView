"use client";

import { useUser } from "@clerk/nextjs";
import { useCallback, useMemo, useEffect } from "react";
import useSWR, { mutate } from "swr";
import { fetcher, userDataConfig } from "@/lib/swr-config";

// Type definitions
export interface User {
  id: string;
  clerk_id: string;
  email: string;
  name: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface Position {
  id: string;
  user_id: string;
  symbol: string;
  contract_type: "call" | "put";
  position_type: "long" | "short";
  strike_price: number;
  premium: number;
  contracts: number;
  entry_stock_price: number;
  expiration_date: string | null;
  status: "open" | "closed";
  notes: string | null;
  created_at: string;
  closed_at: string | null;
  close_price: number | null;
  realized_pnl: number | null;
}

export interface WatchlistItem {
  id: string;
  user_id: string;
  symbol: string;
  target_price: number | null;
  alert_enabled: boolean;
  notes: string | null;
  created_at: string;
}

export interface Trade {
  id: string;
  user_id: string;
  symbol: string;
  trade_type: "buy" | "sell";
  asset_type: "stock" | "call" | "put";
  quantity: number;
  price: number;
  total_value: number;
  pnl: number | null;
  notes: string | null;
  trade_date: string;
  created_at: string;
}

export interface ChatMessage {
  id: string;
  user_id: string;
  role: "user" | "assistant";
  content: string;
  created_at: string;
}

export interface UserSettings {
  id: string;
  user_id: string;
  theme: "dark" | "light";
  default_contracts: number;
  notifications_enabled: boolean;
  onboarding_completed: boolean;
  trading_preference: "calls" | "puts" | "both" | null;
  experience_level: "beginner" | "intermediate" | "advanced" | null;
  risk_acknowledged: boolean;
  market_disclaimer_acknowledged: boolean;
  push_endpoint: string | null;
  push_p256dh: string | null;
  push_auth: string | null;
  push_reminder_time: string | null;
  created_at: string;
  updated_at: string;
}

export interface Goal {
  id: string;
  user_id: string;
  label: string;
  type: "weekly" | "monthly" | "yearly" | "custom";
  target: number;
  start_date: string;
  end_date: string;
  status: "active" | "completed" | "failed" | "archived";
  created_at: string;
}

// Custom fetcher that extracts data from response
const userFetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to fetch");
  const json = await res.json();
  return json.data;
};

// Hook to get the database user from Clerk
export function useDbUser() {
  const { user: clerkUser, isLoaded } = useUser();

  const { data: dbUser, isLoading } = useSWR<User>(
    isLoaded && clerkUser ? "/api/user?type=user" : null,
    userFetcher,
    {
      ...userDataConfig,
      revalidateOnMount: true,
    }
  );

  return {
    user: dbUser || null,
    loading: !isLoaded || isLoading,
    clerkUser
  };
}

// Hook for positions
export function usePositions() {
  const { clerkUser } = useDbUser();

  const { data, isLoading, mutate: mutatePositions } = useSWR<Position[]>(
    clerkUser ? "/api/user?type=positions" : null,
    userFetcher,
    userDataConfig
  );

  const positions = useMemo(() => data || [], [data]);

  const addPosition = useCallback(
    async (
      position: Omit<
        Position,
        "id" | "user_id" | "created_at" | "status" | "closed_at" | "close_price" | "realized_pnl"
      >
    ) => {
      try {
        const res = await fetch("/api/user", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type: "position", data: position }),
        });
        if (res.ok) {
          const { data: newPosition } = await res.json();
          if (newPosition) {
            // Optimistic update
            mutatePositions((prev) => [newPosition, ...(prev || [])], false);
            return newPosition;
          }
        }
      } catch (error) {
        console.error("Error adding position:", error);
      }
      return null;
    },
    [mutatePositions]
  );

  const updatePosition = useCallback(
    async (id: string, updates: Partial<Position>) => {
      try {
        const res = await fetch("/api/user", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type: "position", id, data: updates }),
        });
        if (res.ok) {
          const { data: updatedPosition } = await res.json();
          if (updatedPosition) {
            mutatePositions(
              (prev) => prev?.map((p) => (p.id === id ? updatedPosition : p)),
              false
            );
            return true;
          }
        }
      } catch (error) {
        console.error("Error updating position:", error);
      }
      return false;
    },
    [mutatePositions]
  );

  const deletePosition = useCallback(
    async (id: string) => {
      try {
        const res = await fetch(`/api/user?type=position&id=${id}`, {
          method: "DELETE",
        });
        if (res.ok) {
          mutatePositions((prev) => prev?.filter((p) => p.id !== id), false);
          return true;
        }
      } catch (error) {
        console.error("Error deleting position:", error);
      }
      return false;
    },
    [mutatePositions]
  );

  return {
    positions,
    loading: isLoading,
    addPosition,
    updatePosition,
    deletePosition,
    refetch: mutatePositions,
  };
}

// Hook for watchlist
export function useWatchlist() {
  const { clerkUser } = useDbUser();

  const { data, isLoading, mutate: mutateWatchlist } = useSWR<WatchlistItem[]>(
    clerkUser ? "/api/user?type=watchlist" : null,
    userFetcher,
    userDataConfig
  );

  const watchlist = useMemo(() => data || [], [data]);

  const addToWatchlist = useCallback(
    async (symbol: string, notes?: string) => {
      try {
        const res = await fetch("/api/user", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type: "watchlist", data: { symbol, notes } }),
        });
        if (res.ok) {
          const { data: newItem } = await res.json();
          if (newItem) {
            mutateWatchlist((prev) => [newItem, ...(prev || [])], false);
            return newItem;
          }
        }
      } catch (error) {
        console.error("Error adding to watchlist:", error);
      }
      return null;
    },
    [mutateWatchlist]
  );

  const removeFromWatchlist = useCallback(
    async (id: string) => {
      try {
        const res = await fetch(`/api/user?type=watchlist&id=${id}`, {
          method: "DELETE",
        });
        if (res.ok) {
          mutateWatchlist((prev) => prev?.filter((w) => w.id !== id), false);
          return true;
        }
      } catch (error) {
        console.error("Error removing from watchlist:", error);
      }
      return false;
    },
    [mutateWatchlist]
  );

  return {
    watchlist,
    loading: isLoading,
    addToWatchlist,
    removeFromWatchlist,
    refetch: mutateWatchlist,
  };
}

// Helper to parse numeric values from database (handles string/number/null)
const parseNumeric = (value: number | string | null | undefined): number => {
  if (value === null || value === undefined) return 0;
  const parsed = typeof value === 'string' ? parseFloat(value) : value;
  return isNaN(parsed) ? 0 : parsed;
};

const TRADES_CACHE_KEY = "gainsview_trades_cache";

// Hook for trades (P&L tracking)
export function useTrades() {
  const { clerkUser } = useDbUser();

  // Load cached data on initial render for instant display
  const getCachedTrades = (): Trade[] | undefined => {
    if (typeof window === "undefined") return undefined;
    try {
      const cached = localStorage.getItem(TRADES_CACHE_KEY);
      if (cached) {
        const { trades, timestamp } = JSON.parse(cached);
        // Use cache if less than 5 minutes old
        if (Date.now() - timestamp < 5 * 60 * 1000) {
          return trades;
        }
      }
    } catch {
      // Ignore cache errors
    }
    return undefined;
  };

  const { data, isLoading, mutate: mutateTrades } = useSWR<Trade[]>(
    clerkUser ? "/api/user?type=trades" : null,
    userFetcher,
    {
      ...userDataConfig,
      fallbackData: getCachedTrades(),
    }
  );

  // Normalize trades to ensure numeric values are properly parsed
  const trades = useMemo(() => {
    if (!data) return [];
    return data.map(trade => ({
      ...trade,
      pnl: parseNumeric(trade.pnl),
      price: parseNumeric(trade.price),
      quantity: parseNumeric(trade.quantity),
      total_value: parseNumeric(trade.total_value),
    }));
  }, [data]);

  // Cache trades to localStorage when fresh data arrives
  useEffect(() => {
    if (data && data.length > 0 && typeof window !== "undefined") {
      try {
        localStorage.setItem(TRADES_CACHE_KEY, JSON.stringify({
          trades: data,
          timestamp: Date.now()
        }));
      } catch {
        // Ignore storage errors
      }
    }
  }, [data]);

  const totalPnL = useMemo(
    () => Math.round(trades.reduce((sum, trade) => sum + (trade.pnl || 0), 0) * 100) / 100,
    [trades]
  );

  const addTrade = useCallback(
    async (trade: Omit<Trade, "id" | "user_id" | "created_at">) => {
      try {
        const res = await fetch("/api/user", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type: "trade", data: trade }),
        });
        if (res.ok) {
          const { data: newTrade } = await res.json();
          if (newTrade) {
            mutateTrades((prev) => [newTrade, ...(prev || [])], false);
            return newTrade;
          }
        }
      } catch (error) {
        console.error("Error adding trade:", error);
      }
      return null;
    },
    [mutateTrades]
  );

  const updateTrade = useCallback(
    async (id: string, updates: Partial<Omit<Trade, "id" | "user_id" | "created_at">>) => {
      try {
        const res = await fetch("/api/user", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type: "trade", id, data: updates }),
        });
        if (res.ok) {
          const { data: updatedTrade } = await res.json();
          if (updatedTrade) {
            mutateTrades(
              (prev) => prev?.map((t) => (t.id === id ? { ...t, ...updatedTrade } : t)),
              false
            );
            return true;
          }
        }
      } catch (error) {
        console.error("Error updating trade:", error);
      }
      return false;
    },
    [mutateTrades]
  );

  const deleteTrade = useCallback(
    async (id: string) => {
      try {
        const res = await fetch(`/api/user?type=trade&id=${id}`, {
          method: "DELETE",
        });
        if (res.ok) {
          mutateTrades((prev) => prev?.filter((t) => t.id !== id), false);
          return true;
        }
      } catch (error) {
        console.error("Error deleting trade:", error);
      }
      return false;
    },
    [mutateTrades]
  );

  return {
    trades,
    // Only show loading if we have no data at all (no cache, no fresh data)
    loading: isLoading && !data,
    addTrade,
    updateTrade,
    deleteTrade,
    totalPnL,
    refetch: mutateTrades,
  };
}

// Hook for chat history
export function useChatHistory() {
  const { clerkUser } = useDbUser();

  const { data, isLoading, mutate: mutateChat } = useSWR<ChatMessage[]>(
    clerkUser ? "/api/user?type=chat" : null,
    userFetcher,
    {
      ...userDataConfig,
      refreshInterval: 0, // Don't auto-refresh chat
    }
  );

  const messages = useMemo(() => data || [], [data]);

  const addMessage = useCallback(
    async (role: "user" | "assistant", content: string) => {
      try {
        const res = await fetch("/api/user", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type: "chat", data: { role, content } }),
        });
        if (res.ok) {
          const { data: newMessage } = await res.json();
          if (newMessage) {
            mutateChat((prev) => [...(prev || []), newMessage], false);
            return newMessage;
          }
        }
      } catch (error) {
        console.error("Error adding message:", error);
      }
      return null;
    },
    [mutateChat]
  );

  const clearHistory = useCallback(async () => {
    try {
      const res = await fetch(`/api/user?type=chat`, {
        method: "DELETE",
      });
      if (res.ok) {
        mutateChat([], false);
        return true;
      }
    } catch (error) {
      console.error("Error clearing chat:", error);
    }
    return false;
  }, [mutateChat]);

  return {
    messages,
    loading: isLoading,
    addMessage,
    clearHistory,
    refetch: mutateChat,
  };
}

// Hook for user settings
export function useUserSettings() {
  const { clerkUser } = useDbUser();

  const { data, isLoading, mutate: mutateSettings } = useSWR<UserSettings>(
    clerkUser ? "/api/user?type=settings" : null,
    userFetcher,
    userDataConfig
  );

  const updateSettings = useCallback(
    async (updates: Partial<UserSettings>) => {
      try {
        const res = await fetch("/api/user", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type: "settings", data: updates }),
        });
        if (res.ok) {
          const { data: updatedSettings } = await res.json();
          if (updatedSettings) {
            mutateSettings(updatedSettings, false);
            return true;
          }
        }
      } catch (error) {
        console.error("Error updating settings:", error);
      }
      return false;
    },
    [mutateSettings]
  );

  return {
    settings: data || null,
    loading: isLoading,
    updateSettings,
  };
}

// Alias for backward compatibility
export const useSupabaseUser = useDbUser;

export function useGoals() {
  const { clerkUser } = useDbUser();

  const { data, isLoading, mutate: mutateGoals } = useSWR<Goal[]>(
    clerkUser ? "/api/user?type=goals" : null,
    userFetcher,
    userDataConfig
  );

  const goals = useMemo(() => data || [], [data]);

  const activeGoals = useMemo(
    () => goals.filter((g) => g.status === "active"),
    [goals]
  );

  const addGoal = useCallback(
    async (goal: Omit<Goal, "id" | "user_id" | "created_at" | "status">) => {
      try {
        const res = await fetch("/api/user", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type: "goal", data: { ...goal, status: "active" } }),
        });
        if (res.ok) {
          const { data: newGoal } = await res.json();
          if (newGoal) {
            mutateGoals((prev) => [newGoal, ...(prev || [])], false);
            return newGoal;
          }
        }
      } catch (error) {
        console.error("Error adding goal:", error);
      }
      return null;
    },
    [mutateGoals]
  );

  const updateGoal = useCallback(
    async (id: string, updates: Partial<Goal>) => {
      try {
        const res = await fetch("/api/user", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type: "goal", id, data: updates }),
        });
        if (res.ok) {
          const { data: updatedGoal } = await res.json();
          if (updatedGoal) {
            mutateGoals(
              (prev) => prev?.map((g) => (g.id === id ? { ...g, ...updatedGoal } : g)),
              false
            );
            return true;
          }
        }
      } catch (error) {
        console.error("Error updating goal:", error);
      }
      return false;
    },
    [mutateGoals]
  );

  const deleteGoal = useCallback(
    async (id: string) => {
      try {
        const res = await fetch(`/api/user?type=goal&id=${id}`, {
          method: "DELETE",
        });
        if (res.ok) {
          mutateGoals((prev) => prev?.filter((g) => g.id !== id), false);
          return true;
        }
      } catch (error) {
        console.error("Error deleting goal:", error);
      }
      return false;
    },
    [mutateGoals]
  );

  return {
    goals,
    activeGoals,
    loading: isLoading,
    addGoal,
    updateGoal,
    deleteGoal,
    refetch: mutateGoals,
  };
}
