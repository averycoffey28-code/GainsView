"use client";

import { useState } from "react";
import { TrendingUp, TrendingDown, Plus, Calendar, DollarSign, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

interface Trade {
  id: string;
  date: string;
  symbol: string;
  type: "buy" | "sell";
  quantity: number;
  price: number;
  pnl: number;
  notes?: string;
}

// Mock trade history
const mockTrades: Trade[] = [
  {
    id: "1",
    date: "2025-01-24",
    symbol: "AAPL 185C",
    type: "sell",
    quantity: 5,
    price: 4.50,
    pnl: 375,
    notes: "Closed for profit",
  },
  {
    id: "2",
    date: "2025-01-23",
    symbol: "TSLA",
    type: "sell",
    quantity: 20,
    price: 242.00,
    pnl: -180,
    notes: "Cut losses early",
  },
  {
    id: "3",
    date: "2025-01-22",
    symbol: "SPY 480P",
    type: "sell",
    quantity: 10,
    price: 3.20,
    pnl: 520,
  },
  {
    id: "4",
    date: "2025-01-20",
    symbol: "NVDA",
    type: "sell",
    quantity: 15,
    price: 495.00,
    pnl: 825,
  },
];

export default function PnLPage() {
  const [trades, setTrades] = useState<Trade[]>(mockTrades);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTrade, setNewTrade] = useState({
    symbol: "",
    type: "sell" as "buy" | "sell",
    quantity: "",
    price: "",
    pnl: "",
    notes: "",
  });

  const totalPnL = trades.reduce((sum, trade) => sum + trade.pnl, 0);
  const winningTrades = trades.filter((t) => t.pnl > 0).length;
  const losingTrades = trades.filter((t) => t.pnl < 0).length;
  const winRate = trades.length > 0 ? (winningTrades / trades.length) * 100 : 0;

  const handleAddTrade = () => {
    if (!newTrade.symbol || !newTrade.pnl) return;

    const trade: Trade = {
      id: Date.now().toString(),
      date: new Date().toISOString().split("T")[0],
      symbol: newTrade.symbol.toUpperCase(),
      type: newTrade.type,
      quantity: Number(newTrade.quantity) || 0,
      price: Number(newTrade.price) || 0,
      pnl: Number(newTrade.pnl),
      notes: newTrade.notes || undefined,
    };

    setTrades([trade, ...trades]);
    setNewTrade({ symbol: "", type: "sell", quantity: "", price: "", pnl: "", notes: "" });
    setShowAddForm(false);
  };

  const handleDeleteTrade = (id: string) => {
    setTrades(trades.filter((t) => t.id !== id));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-brown-950 via-brown-900 to-brown-950 text-brown-50 p-4 pb-24">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-brown-50">P&L Tracker</h1>
            <p className="text-brown-400 text-sm">Track your trading performance</p>
          </div>
          <Button
            onClick={() => setShowAddForm(!showAddForm)}
            className="bg-gold-500 hover:bg-gold-600 text-brown-900"
          >
            <Plus className="w-4 h-4 mr-2" />
            Log Trade
          </Button>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-3">
          <Card className="bg-brown-800/50 border-brown-700">
            <CardContent className="p-4 text-center">
              <p className="text-xs text-brown-400 mb-1">Total P&L</p>
              <p
                className={`text-xl font-bold ${
                  totalPnL >= 0 ? "text-emerald-400" : "text-rose-400"
                }`}
              >
                {totalPnL >= 0 ? "+" : ""}${totalPnL.toLocaleString()}
              </p>
            </CardContent>
          </Card>
          <Card className="bg-brown-800/50 border-brown-700">
            <CardContent className="p-4 text-center">
              <p className="text-xs text-brown-400 mb-1">Win Rate</p>
              <p className="text-xl font-bold text-gold-400">{winRate.toFixed(0)}%</p>
            </CardContent>
          </Card>
          <Card className="bg-brown-800/50 border-brown-700">
            <CardContent className="p-4 text-center">
              <p className="text-xs text-brown-400 mb-1">Trades</p>
              <p className="text-xl font-bold text-brown-50">
                <span className="text-emerald-400">{winningTrades}</span>
                <span className="text-brown-500 mx-1">/</span>
                <span className="text-rose-400">{losingTrades}</span>
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Add Trade Form */}
        {showAddForm && (
          <Card className="bg-brown-800/50 border-brown-700">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg text-brown-50">Log New Trade</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-brown-300">Symbol</Label>
                  <Input
                    placeholder="AAPL, TSLA 200C, etc."
                    value={newTrade.symbol}
                    onChange={(e) => setNewTrade({ ...newTrade, symbol: e.target.value })}
                    className="bg-brown-700/50 border-brown-600 text-brown-100"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-brown-300">P&L ($)</Label>
                  <Input
                    type="number"
                    placeholder="+500 or -200"
                    value={newTrade.pnl}
                    onChange={(e) => setNewTrade({ ...newTrade, pnl: e.target.value })}
                    className="bg-brown-700/50 border-brown-600 text-brown-100"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-brown-300">Quantity</Label>
                  <Input
                    type="number"
                    placeholder="100"
                    value={newTrade.quantity}
                    onChange={(e) => setNewTrade({ ...newTrade, quantity: e.target.value })}
                    className="bg-brown-700/50 border-brown-600 text-brown-100"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-brown-300">Exit Price ($)</Label>
                  <Input
                    type="number"
                    placeholder="185.50"
                    value={newTrade.price}
                    onChange={(e) => setNewTrade({ ...newTrade, price: e.target.value })}
                    className="bg-brown-700/50 border-brown-600 text-brown-100"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-brown-300">Notes (optional)</Label>
                <Input
                  placeholder="Trade notes..."
                  value={newTrade.notes}
                  onChange={(e) => setNewTrade({ ...newTrade, notes: e.target.value })}
                  className="bg-brown-700/50 border-brown-600 text-brown-100"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={handleAddTrade}
                  className="flex-1 bg-gold-500 hover:bg-gold-600 text-brown-900"
                >
                  Save Trade
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => setShowAddForm(false)}
                  className="text-brown-400"
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Trade History */}
        <div>
          <h2 className="text-lg font-semibold text-brown-100 mb-3">Trade History</h2>
          <div className="space-y-3">
            {trades.map((trade) => (
              <Card
                key={trade.id}
                className="bg-brown-800/50 border-brown-700 hover:border-brown-600 transition-colors"
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className={`p-2 rounded-lg ${
                          trade.pnl >= 0 ? "bg-emerald-500/20" : "bg-rose-500/20"
                        }`}
                      >
                        {trade.pnl >= 0 ? (
                          <TrendingUp className="w-5 h-5 text-emerald-400" />
                        ) : (
                          <TrendingDown className="w-5 h-5 text-rose-400" />
                        )}
                      </div>
                      <div>
                        <p className="font-semibold text-brown-50">{trade.symbol}</p>
                        <div className="flex items-center gap-2 text-xs text-brown-500">
                          <Calendar className="w-3 h-3" />
                          <span>{trade.date}</span>
                          {trade.quantity > 0 && (
                            <>
                              <span>•</span>
                              <span>{trade.quantity} @ ${trade.price.toFixed(2)}</span>
                            </>
                          )}
                        </div>
                        {trade.notes && (
                          <p className="text-xs text-brown-400 mt-1">{trade.notes}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <p
                        className={`text-lg font-bold ${
                          trade.pnl >= 0 ? "text-emerald-400" : "text-rose-400"
                        }`}
                      >
                        {trade.pnl >= 0 ? "+" : ""}${trade.pnl.toLocaleString()}
                      </p>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteTrade(trade.id)}
                        className="text-brown-500 hover:text-rose-400 h-8 w-8"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Empty state */}
        {trades.length === 0 && (
          <div className="text-center py-12">
            <TrendingUp className="w-12 h-12 text-brown-600 mx-auto mb-4" />
            <p className="text-brown-400">No trades logged yet</p>
            <p className="text-sm text-brown-500 mt-1">
              Start tracking your P&L by logging your first trade
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
