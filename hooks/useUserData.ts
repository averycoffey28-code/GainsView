"use client";

import { useUser } from "@clerk/nextjs";
import { useEffect, useState, useCallback } from "react";

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
  created_at: string;
  updated_at: string;
}

// Hook to get the database user from Clerk
export function useDbUser() {
  const { user: clerkUser, isLoaded } = useUser();
  const [dbUser, setDbUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchUser() {
      if (!isLoaded || !clerkUser) {
        setLoading(false);
        return;
      }

      try {
        const res = await fetch("/api/user?type=user");
        if (res.ok) {
          const { data } = await res.json();
          setDbUser(data);
        }
      } catch (error) {
        console.error("Error fetching user:", error);
      }
      setLoading(false);
    }

    fetchUser();
  }, [clerkUser, isLoaded]);

  return { user: dbUser, loading, clerkUser };
}

// Hook for positions
export function usePositions() {
  const { clerkUser } = useDbUser();
  const [positions, setPositions] = useState<Position[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPositions = useCallback(async () => {
    if (!clerkUser) return;

    setLoading(true);
    try {
      const res = await fetch("/api/user?type=positions");
      if (res.ok) {
        const { data } = await res.json();
        setPositions(data || []);
      }
    } catch (error) {
      console.error("Error fetching positions:", error);
    }
    setLoading(false);
  }, [clerkUser]);

  useEffect(() => {
    fetchPositions();
  }, [fetchPositions]);

  const addPosition = async (position: Omit<Position, "id" | "user_id" | "created_at" | "status" | "closed_at" | "close_price" | "realized_pnl">) => {
    try {
      const res = await fetch("/api/user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "position", data: position }),
      });
      if (res.ok) {
        const { data } = await res.json();
        if (data) {
          setPositions((prev) => [data, ...prev]);
          return data;
        }
      }
    } catch (error) {
      console.error("Error adding position:", error);
    }
    return null;
  };

  const updatePosition = async (id: string, updates: Partial<Position>) => {
    try {
      const res = await fetch("/api/user", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "position", id, data: updates }),
      });
      if (res.ok) {
        const { data } = await res.json();
        if (data) {
          setPositions((prev) =>
            prev.map((p) => (p.id === id ? data : p))
          );
          return true;
        }
      }
    } catch (error) {
      console.error("Error updating position:", error);
    }
    return false;
  };

  const deletePosition = async (id: string) => {
    try {
      const res = await fetch(`/api/user?type=position&id=${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setPositions((prev) => prev.filter((p) => p.id !== id));
        return true;
      }
    } catch (error) {
      console.error("Error deleting position:", error);
    }
    return false;
  };

  return { positions, loading, addPosition, updatePosition, deletePosition, refetch: fetchPositions };
}

// Hook for watchlist
export function useWatchlist() {
  const { clerkUser } = useDbUser();
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchWatchlist = useCallback(async () => {
    if (!clerkUser) return;

    setLoading(true);
    try {
      const res = await fetch("/api/user?type=watchlist");
      if (res.ok) {
        const { data } = await res.json();
        setWatchlist(data || []);
      }
    } catch (error) {
      console.error("Error fetching watchlist:", error);
    }
    setLoading(false);
  }, [clerkUser]);

  useEffect(() => {
    fetchWatchlist();
  }, [fetchWatchlist]);

  const addToWatchlist = async (symbol: string, notes?: string) => {
    try {
      const res = await fetch("/api/user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "watchlist", data: { symbol, notes } }),
      });
      if (res.ok) {
        const { data } = await res.json();
        if (data) {
          setWatchlist((prev) => [data, ...prev]);
          return data;
        }
      }
    } catch (error) {
      console.error("Error adding to watchlist:", error);
    }
    return null;
  };

  const removeFromWatchlist = async (id: string) => {
    try {
      const res = await fetch(`/api/user?type=watchlist&id=${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setWatchlist((prev) => prev.filter((w) => w.id !== id));
        return true;
      }
    } catch (error) {
      console.error("Error removing from watchlist:", error);
    }
    return false;
  };

  return { watchlist, loading, addToWatchlist, removeFromWatchlist, refetch: fetchWatchlist };
}

// Hook for trades (P&L tracking)
export function useTrades() {
  const { clerkUser } = useDbUser();
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTrades = useCallback(async () => {
    if (!clerkUser) return;

    setLoading(true);
    try {
      const res = await fetch("/api/user?type=trades");
      if (res.ok) {
        const { data } = await res.json();
        setTrades(data || []);
      }
    } catch (error) {
      console.error("Error fetching trades:", error);
    }
    setLoading(false);
  }, [clerkUser]);

  useEffect(() => {
    fetchTrades();
  }, [fetchTrades]);

  const addTrade = async (trade: Omit<Trade, "id" | "user_id" | "created_at">) => {
    try {
      const res = await fetch("/api/user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "trade", data: trade }),
      });
      if (res.ok) {
        const { data } = await res.json();
        if (data) {
          setTrades((prev) => [data, ...prev]);
          return data;
        }
      }
    } catch (error) {
      console.error("Error adding trade:", error);
    }
    return null;
  };

  const deleteTrade = async (id: string) => {
    try {
      const res = await fetch(`/api/user?type=trade&id=${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setTrades((prev) => prev.filter((t) => t.id !== id));
        return true;
      }
    } catch (error) {
      console.error("Error deleting trade:", error);
    }
    return false;
  };

  const totalPnL = trades.reduce((sum, trade) => sum + (trade.pnl || 0), 0);

  return { trades, loading, addTrade, deleteTrade, totalPnL, refetch: fetchTrades };
}

// Hook for chat history
export function useChatHistory() {
  const { clerkUser } = useDbUser();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMessages = useCallback(async () => {
    if (!clerkUser) return;

    setLoading(true);
    try {
      const res = await fetch("/api/user?type=chat");
      if (res.ok) {
        const { data } = await res.json();
        setMessages(data || []);
      }
    } catch (error) {
      console.error("Error fetching chat:", error);
    }
    setLoading(false);
  }, [clerkUser]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  const addMessage = async (role: "user" | "assistant", content: string) => {
    try {
      const res = await fetch("/api/user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "chat", data: { role, content } }),
      });
      if (res.ok) {
        const { data } = await res.json();
        if (data) {
          setMessages((prev) => [...prev, data]);
          return data;
        }
      }
    } catch (error) {
      console.error("Error adding message:", error);
    }
    return null;
  };

  const clearHistory = async () => {
    try {
      const res = await fetch(`/api/user?type=chat`, {
        method: "DELETE",
      });
      if (res.ok) {
        setMessages([]);
        return true;
      }
    } catch (error) {
      console.error("Error clearing chat:", error);
    }
    return false;
  };

  return { messages, loading, addMessage, clearHistory, refetch: fetchMessages };
}

// Hook for user settings
export function useUserSettings() {
  const { clerkUser } = useDbUser();
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchSettings() {
      if (!clerkUser) return;

      setLoading(true);
      try {
        const res = await fetch("/api/user?type=settings");
        if (res.ok) {
          const { data } = await res.json();
          setSettings(data);
        }
      } catch (error) {
        console.error("Error fetching settings:", error);
      }
      setLoading(false);
    }

    fetchSettings();
  }, [clerkUser]);

  const updateSettings = async (updates: Partial<UserSettings>) => {
    try {
      const res = await fetch("/api/user", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "settings", data: updates }),
      });
      if (res.ok) {
        const { data } = await res.json();
        if (data) {
          setSettings(data);
          return true;
        }
      }
    } catch (error) {
      console.error("Error updating settings:", error);
    }
    return false;
  };

  return { settings, loading, updateSettings };
}
