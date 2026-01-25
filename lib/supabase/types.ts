export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          clerk_id: string;
          email: string;
          name: string | null;
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          clerk_id: string;
          email: string;
          name?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          clerk_id?: string;
          email?: string;
          name?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      positions: {
        Row: {
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
        };
        Insert: {
          id?: string;
          user_id: string;
          symbol: string;
          contract_type: "call" | "put";
          position_type: "long" | "short";
          strike_price: number;
          premium: number;
          contracts: number;
          entry_stock_price: number;
          expiration_date?: string | null;
          status?: "open" | "closed";
          notes?: string | null;
          created_at?: string;
          closed_at?: string | null;
          close_price?: number | null;
          realized_pnl?: number | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          symbol?: string;
          contract_type?: "call" | "put";
          position_type?: "long" | "short";
          strike_price?: number;
          premium?: number;
          contracts?: number;
          entry_stock_price?: number;
          expiration_date?: string | null;
          status?: "open" | "closed";
          notes?: string | null;
          created_at?: string;
          closed_at?: string | null;
          close_price?: number | null;
          realized_pnl?: number | null;
        };
      };
      watchlist: {
        Row: {
          id: string;
          user_id: string;
          symbol: string;
          target_price: number | null;
          alert_enabled: boolean;
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          symbol: string;
          target_price?: number | null;
          alert_enabled?: boolean;
          notes?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          symbol?: string;
          target_price?: number | null;
          alert_enabled?: boolean;
          notes?: string | null;
          created_at?: string;
        };
      };
      trades: {
        Row: {
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
        };
        Insert: {
          id?: string;
          user_id: string;
          symbol: string;
          trade_type: "buy" | "sell";
          asset_type: "stock" | "call" | "put";
          quantity: number;
          price: number;
          total_value: number;
          pnl?: number | null;
          notes?: string | null;
          trade_date?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          symbol?: string;
          trade_type?: "buy" | "sell";
          asset_type?: "stock" | "call" | "put";
          quantity?: number;
          price?: number;
          total_value?: number;
          pnl?: number | null;
          notes?: string | null;
          trade_date?: string;
          created_at?: string;
        };
      };
      chat_history: {
        Row: {
          id: string;
          user_id: string;
          role: "user" | "assistant";
          content: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          role: "user" | "assistant";
          content: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          role?: "user" | "assistant";
          content?: string;
          created_at?: string;
        };
      };
      user_settings: {
        Row: {
          id: string;
          user_id: string;
          theme: "dark" | "light";
          default_contracts: number;
          notifications_enabled: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          theme?: "dark" | "light";
          default_contracts?: number;
          notifications_enabled?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          theme?: "dark" | "light";
          default_contracts?: number;
          notifications_enabled?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
    Views: {};
    Functions: {};
    Enums: {};
    CompositeTypes: {};
  };
}

// Helper types
export type User = Database["public"]["Tables"]["users"]["Row"];
export type Position = Database["public"]["Tables"]["positions"]["Row"];
export type WatchlistItem = Database["public"]["Tables"]["watchlist"]["Row"];
export type Trade = Database["public"]["Tables"]["trades"]["Row"];
export type ChatMessage = Database["public"]["Tables"]["chat_history"]["Row"];
export type UserSettings = Database["public"]["Tables"]["user_settings"]["Row"];
