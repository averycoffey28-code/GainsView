"use client";

import { useState } from "react";
import { Brain, Send, Sparkles, MessageSquare, TrendingUp, Shield, Lightbulb } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const quickPrompts = [
  {
    icon: TrendingUp,
    label: "Market Analysis",
    prompt: "What's your analysis of the current market conditions? Any sectors looking promising?",
  },
  {
    icon: Shield,
    label: "Risk Management",
    prompt: "What are the best risk management strategies for options trading?",
  },
  {
    icon: Lightbulb,
    label: "Strategy Ideas",
    prompt: "Can you suggest some options strategies for generating income in a sideways market?",
  },
  {
    icon: MessageSquare,
    label: "Explain Greeks",
    prompt: "Explain the option Greeks (Delta, Gamma, Theta, Vega) and how they affect my trades.",
  },
];

export default function AIPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const sendMessage = async (content: string) => {
    if (!content.trim() || isLoading) return;

    const userMessage: Message = { role: "user", content: content.trim() };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages, userMessage],
          context: {},
        }),
      });

      const data = await response.json();

      const assistantMessage: Message = {
        role: "assistant",
        content: data.message || "Sorry, I couldn't process that request.",
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Sorry, an error occurred. Please try again." },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-brown-950 via-brown-900 to-brown-950 text-brown-50 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-brown-800">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <div className="p-2 bg-gold-400/20 rounded-xl">
            <Brain className="w-6 h-6 text-gold-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-brown-50">AI Trading Assistant</h1>
            <p className="text-xs text-brown-400">Powered by Llama 3.1 70B</p>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 pb-32">
        <div className="max-w-2xl mx-auto space-y-4">
          {messages.length === 0 ? (
            <div className="py-8">
              {/* Welcome Message */}
              <div className="text-center mb-8">
                <div className="inline-flex p-4 bg-gold-400/10 rounded-2xl mb-4">
                  <Sparkles className="w-10 h-10 text-gold-400" />
                </div>
                <h2 className="text-2xl font-bold text-brown-100 mb-2">
                  How can I help you today?
                </h2>
                <p className="text-brown-400 max-w-md mx-auto">
                  Ask me about options strategies, market analysis, risk management, or anything trading-related.
                </p>
              </div>

              {/* Quick Prompts */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {quickPrompts.map((prompt) => {
                  const Icon = prompt.icon;
                  return (
                    <button
                      key={prompt.label}
                      onClick={() => sendMessage(prompt.prompt)}
                      className="p-4 text-left bg-brown-800/50 hover:bg-brown-800 border border-brown-700 rounded-xl transition-colors group"
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-brown-700/50 rounded-lg group-hover:bg-gold-400/20 transition-colors">
                          <Icon className="w-4 h-4 text-brown-400 group-hover:text-gold-400 transition-colors" />
                        </div>
                        <span className="font-medium text-brown-200">{prompt.label}</span>
                      </div>
                      <p className="text-sm text-brown-500 line-clamp-2">{prompt.prompt}</p>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            <>
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[85%] p-4 rounded-2xl ${
                      message.role === "user"
                        ? "bg-gold-500 text-brown-900"
                        : "bg-brown-800 text-brown-100"
                    }`}
                  >
                    {message.role === "assistant" && (
                      <div className="flex items-center gap-2 mb-2">
                        <Brain className="w-4 h-4 text-gold-400" />
                        <span className="text-xs text-gold-400 font-medium">AI Assistant</span>
                      </div>
                    )}
                    <p className="whitespace-pre-wrap text-sm leading-relaxed">{message.content}</p>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-brown-800 text-brown-100 p-4 rounded-2xl">
                    <div className="flex items-center gap-2">
                      <div className="flex gap-1">
                        <span className="w-2 h-2 bg-gold-400 rounded-full animate-bounce" />
                        <span
                          className="w-2 h-2 bg-gold-400 rounded-full animate-bounce"
                          style={{ animationDelay: "0.1s" }}
                        />
                        <span
                          className="w-2 h-2 bg-gold-400 rounded-full animate-bounce"
                          style={{ animationDelay: "0.2s" }}
                        />
                      </div>
                      <span className="text-xs text-brown-400">Thinking...</span>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Input Area - Fixed at bottom */}
      <div className="fixed bottom-16 left-0 right-0 p-4 bg-gradient-to-t from-brown-950 via-brown-950 to-transparent">
        <div className="max-w-2xl mx-auto">
          <Card className="bg-brown-800/90 backdrop-blur-xl border-brown-700">
            <CardContent className="p-3">
              <div className="flex gap-2">
                <Textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask anything about trading..."
                  className="min-h-[44px] max-h-[120px] bg-brown-900/50 border-brown-700 text-brown-100 placeholder:text-brown-500 resize-none"
                  rows={1}
                />
                <Button
                  onClick={() => sendMessage(input)}
                  disabled={!input.trim() || isLoading}
                  className="bg-gold-500 hover:bg-gold-600 text-brown-900 px-4"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
