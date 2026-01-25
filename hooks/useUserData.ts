"use client";

import { useUser } from "@clerk/nextjs";
import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";

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

// Hook to get the Supabase user ID from Clerk ID
export function useSupabaseUser() {
  const { user: clerkUser, isLoaded } = useUser();
  const [supabaseUser, setSupabaseUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchUser() {
      if (!isLoaded || !clerkUser) {
        setLoading(false);
        return;
      }

      const supabase = createClient();
      if (!supabase) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("clerk_id", clerkUser.id)
        .single();

      if (!error && data) {
        setSupabaseUser(data as User);
      }
      setLoading(false);
    }

    fetchUser();
  }, [clerkUser, isLoaded]);

  return { user: supabaseUser, loading, clerkUser };
}

// Hook for positions
export function usePositions() {
  const { user } = useSupabaseUser();
  const [positions, setPositions] = useState<Position[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPositions = useCallback(async () => {
    if (!user) return;

    const supabase = createClient();
    if (!supabase) return;

    setLoading(true);
    const { data, error } = await supabase
      .from("positions")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (!error && data) {
      setPositions(data as Position[]);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchPositions();
  }, [fetchPositions]);

  const addPosition = async (position: Omit<Position, "id" | "user_id" | "created_at">) => {
    if (!user) return null;

    const supabase = createClient();
    if (!supabase) return null;

    const { data, error } = await supabase
      .from("positions")
      .insert({ ...position, user_id: user.id })
      .select()
      .single();

    if (!error && data) {
      setPositions((prev) => [data as Position, ...prev]);
      return data;
    }
    return null;
  };

  const updatePosition = async (id: string, updates: Partial<Position>) => {
    const supabase = createClient();
    if (!supabase) return false;

    const { error } = await supabase
      .from("positions")
      .update(updates)
      .eq("id", id);

    if (!error) {
      setPositions((prev) =>
        prev.map((p) => (p.id === id ? { ...p, ...updates } : p))
      );
      return true;
    }
    return false;
  };

  const deletePosition = async (id: string) => {
    const supabase = createClient();
    if (!supabase) return false;

    const { error } = await supabase.from("positions").delete().eq("id", id);

    if (!error) {
      setPositions((prev) => prev.filter((p) => p.id !== id));
      return true;
    }
    return false;
  };

  return { positions, loading, addPosition, updatePosition, deletePosition, refetch: fetchPositions };
}

// Hook for watchlist
export function useWatchlist() {
  const { user } = useSupabaseUser();
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchWatchlist = useCallback(async () => {
    if (!user) return;

    const supabase = createClient();
    if (!supabase) return;

    setLoading(true);
    const { data, error } = await supabase
      .from("watchlist")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (!error && data) {
      setWatchlist(data as WatchlistItem[]);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchWatchlist();
  }, [fetchWatchlist]);

  const addToWatchlist = async (symbol: string, notes?: string) => {
    if (!user) return null;

    const supabase = createClient();
    if (!supabase) return null;

    const { data, error } = await supabase
      .from("watchlist")
      .insert({ user_id: user.id, symbol: symbol.toUpperCase(), notes })
      .select()
      .single();

    if (!error && data) {
      setWatchlist((prev) => [data as WatchlistItem, ...prev]);
      return data;
    }
    return null;
  };

  const removeFromWatchlist = async (id: string) => {
    const supabase = createClient();
    if (!supabase) return false;

    const { error } = await supabase.from("watchlist").delete().eq("id", id);

    if (!error) {
      setWatchlist((prev) => prev.filter((w) => w.id !== id));
      return true;
    }
    return false;
  };

  return { watchlist, loading, addToWatchlist, removeFromWatchlist, refetch: fetchWatchlist };
}

// Hook for trades (P&L tracking)
export function useTrades() {
  const { user } = useSupabaseUser();
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTrades = useCallback(async () => {
    if (!user) return;

    const supabase = createClient();
    if (!supabase) return;

    setLoading(true);
    const { data, error } = await supabase
      .from("trades")
      .select("*")
      .eq("user_id", user.id)
      .order("trade_date", { ascending: false });

    if (!error && data) {
      setTrades(data as Trade[]);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchTrades();
  }, [fetchTrades]);

  const addTrade = async (trade: Omit<Trade, "id" | "user_id" | "created_at">) => {
    if (!user) return null;

    const supabase = createClient();
    if (!supabase) return null;

    const { data, error } = await supabase
      .from("trades")
      .insert({ ...trade, user_id: user.id })
      .select()
      .single();

    if (!error && data) {
      setTrades((prev) => [data as Trade, ...prev]);
      return data;
    }
    return null;
  };

  const deleteTrade = async (id: string) => {
    const supabase = createClient();
    if (!supabase) return false;

    const { error } = await supabase.from("trades").delete().eq("id", id);

    if (!error) {
      setTrades((prev) => prev.filter((t) => t.id !== id));
      return true;
    }
    return false;
  };

  // Calculate total P&L
  const totalPnL = trades.reduce((sum, trade) => sum + (trade.pnl || 0), 0);

  return { trades, loading, addTrade, deleteTrade, totalPnL, refetch: fetchTrades };
}

// Hook for chat history
export function useChatHistory() {
  const { user } = useSupabaseUser();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMessages = useCallback(async () => {
    if (!user) return;

    const supabase = createClient();
    if (!supabase) return;

    setLoading(true);
    const { data, error } = await supabase
      .from("chat_history")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: true })
      .limit(100); // Keep last 100 messages

    if (!error && data) {
      setMessages(data as ChatMessage[]);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  const addMessage = async (role: "user" | "assistant", content: string) => {
    if (!user) return null;

    const supabase = createClient();
    if (!supabase) return null;

    const { data, error } = await supabase
      .from("chat_history")
      .insert({ user_id: user.id, role, content })
      .select()
      .single();

    if (!error && data) {
      setMessages((prev) => [...prev, data as ChatMessage]);
      return data;
    }
    return null;
  };

  const clearHistory = async () => {
    if (!user) return false;

    const supabase = createClient();
    if (!supabase) return false;

    const { error } = await supabase
      .from("chat_history")
      .delete()
      .eq("user_id", user.id);

    if (!error) {
      setMessages([]);
      return true;
    }
    return false;
  };

  return { messages, loading, addMessage, clearHistory, refetch: fetchMessages };
}

// Hook for user settings
export function useUserSettings() {
  const { user } = useSupabaseUser();
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchSettings() {
      if (!user) return;

      const supabase = createClient();
      if (!supabase) return;

      setLoading(true);
      const { data, error } = await supabase
        .from("user_settings")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (!error && data) {
        setSettings(data as UserSettings);
      }
      setLoading(false);
    }

    fetchSettings();
  }, [user]);

  const updateSettings = async (updates: Partial<UserSettings>) => {
    if (!user || !settings) return false;

    const supabase = createClient();
    if (!supabase) return false;

    const { error } = await supabase
      .from("user_settings")
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq("user_id", user.id);

    if (!error) {
      setSettings((prev) => (prev ? { ...prev, ...updates } : null));
      return true;
    }
    return false;
  };

  return { settings, loading, updateSettings };
}
