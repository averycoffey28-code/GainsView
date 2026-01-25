"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  MessageCircle,
  X,
  Send,
  Loader2,
  Bot,
  User,
  Sparkles,
  TrendingUp,
  HelpCircle,
  Shield,
  BarChart3,
} from "lucide-react";
import { Calculations, ContractType, Position } from "@/lib/calculations";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface TradingAssistantProps {
  context: {
    symbol?: string;
    contractType: ContractType;
    position: Position;
    strikePrice: number;
    premium: number;
    currentPrice: number;
    contracts: number;
    targetPrice: number;
  };
  calculations: Calculations;
}

const QUICK_PROMPTS = [
  { icon: TrendingUp, label: "Explain this strategy", prompt: "Explain the strategy I have set up and when it would be profitable." },
  { icon: BarChart3, label: "Analyze my position", prompt: "Analyze my current position. What are the key risks and potential rewards?" },
  { icon: Shield, label: "Risk assessment", prompt: "What's the risk/reward profile of this trade? Should I be concerned about anything?" },
  { icon: HelpCircle, label: "Improve my trade", prompt: "How could I improve this trade setup? Are there better strike prices or strategies?" },
];

export default function TradingAssistant({ context, calculations }: TradingAssistantProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const sendMessage = useCallback(async (messageText: string) => {
    if (!messageText.trim() || isLoading) return;

    const userMessage: Message = { role: "user", content: messageText };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages, userMessage].map((m) => ({
            role: m.role,
            content: m.content,
          })),
          context: {
            ...context,
            breakEven: calculations.breakEven,
            maxProfit: calculations.maxProfit,
            maxLoss: calculations.maxLoss,
            targetPnL: calculations.targetPnL,
            targetROI: calculations.targetROI,
          },
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to get response");
      }

      const assistantMessage: Message = {
        role: "assistant",
        content: data.message,
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsLoading(false);
    }
  }, [messages, context, calculations, isLoading]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  const handleQuickPrompt = (prompt: string) => {
    sendMessage(prompt);
  };

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-6 right-6 z-50 p-4 bg-gradient-to-r from-gold-500 to-gold-600 hover:from-gold-600 hover:to-gold-700 text-brown-900 rounded-full shadow-lg shadow-gold-500/25 transition-all duration-300 ${
          isOpen ? "scale-0 opacity-0" : "scale-100 opacity-100"
        }`}
        aria-label="Open trading assistant"
      >
        <MessageCircle className="w-6 h-6" />
      </button>

      {/* Slide-out Panel */}
      <div
        className={`fixed inset-y-0 right-0 z-50 w-full sm:w-[420px] bg-brown-900 border-l border-brown-700 shadow-2xl transform transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-brown-700 bg-brown-800/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gold-400/20 rounded-lg">
              <Sparkles className="w-5 h-5 text-gold-400" />
            </div>
            <div>
              <h2 className="font-semibold text-brown-50">Trading Assistant</h2>
              <p className="text-xs text-brown-400">Powered by Llama 3.1</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsOpen(false)}
            className="text-brown-400 hover:text-brown-50 hover:bg-brown-700"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 h-[calc(100vh-180px)]">
          {messages.length === 0 ? (
            <div className="space-y-4">
              <div className="text-center py-8">
                <div className="inline-flex p-3 bg-gold-400/10 rounded-full mb-4">
                  <Bot className="w-8 h-8 text-gold-400" />
                </div>
                <h3 className="text-lg font-medium text-brown-50 mb-2">
                  How can I help you today?
                </h3>
                <p className="text-sm text-brown-400 max-w-[280px] mx-auto">
                  I can explain strategies, analyze your positions, and help you understand options trading.
                </p>
              </div>

              {/* Quick Prompts */}
              <div className="space-y-2">
                <p className="text-xs text-brown-500 uppercase tracking-wide px-1">
                  Quick Actions
                </p>
                {QUICK_PROMPTS.map((item, index) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={index}
                      onClick={() => handleQuickPrompt(item.prompt)}
                      disabled={isLoading}
                      className="w-full flex items-center gap-3 p-3 bg-brown-800/50 hover:bg-brown-700/50 border border-brown-700 rounded-lg text-left transition-colors disabled:opacity-50"
                    >
                      <Icon className="w-4 h-4 text-gold-400 flex-shrink-0" />
                      <span className="text-sm text-brown-200">{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            messages.map((message, index) => (
              <div
                key={index}
                className={`flex gap-3 ${
                  message.role === "user" ? "flex-row-reverse" : ""
                }`}
              >
                <div
                  className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                    message.role === "user"
                      ? "bg-gold-500/20"
                      : "bg-brown-700"
                  }`}
                >
                  {message.role === "user" ? (
                    <User className="w-4 h-4 text-gold-400" />
                  ) : (
                    <Bot className="w-4 h-4 text-brown-300" />
                  )}
                </div>
                <div
                  className={`max-w-[80%] p-3 rounded-lg ${
                    message.role === "user"
                      ? "bg-gold-500/20 text-brown-50"
                      : "bg-brown-800 text-brown-100"
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                </div>
              </div>
            ))
          )}

          {isLoading && (
            <div className="flex gap-3">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-brown-700 flex items-center justify-center">
                <Bot className="w-4 h-4 text-brown-300" />
              </div>
              <div className="bg-brown-800 p-3 rounded-lg">
                <Loader2 className="w-4 h-4 animate-spin text-gold-400" />
              </div>
            </div>
          )}

          {error && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-lg">
              <p className="text-sm text-rose-400">{error}</p>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 border-t border-brown-700 bg-brown-800/50">
          <form onSubmit={handleSubmit} className="flex gap-2">
            <Input
              ref={inputRef}
              type="text"
              placeholder="Ask about your trade..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={isLoading}
              className="flex-1 bg-brown-700/50 border-brown-600 text-brown-50 placeholder:text-brown-500"
            />
            <Button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="bg-gold-500 hover:bg-gold-600 text-brown-900"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          </form>
        </div>
      </div>

      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 sm:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
}
