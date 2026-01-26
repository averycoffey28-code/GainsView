"use client";

import { useState, useRef, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import Image from "next/image";
import {
  Send,
  TrendingUp,
  Lightbulb,
  Calculator,
  Briefcase,
  Copy,
  Check,
  RefreshCw,
  Trash2,
  Sparkles,
  Shield,
  ChevronRight,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { usePositions, useTrades, useChatHistory } from "@/hooks/useUserData";
import { cn } from "@/lib/utils";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

const suggestedPrompts = [
  {
    icon: Lightbulb,
    label: "Explain call options",
    prompt: "Explain call options to me like I'm a beginner. What are they and how do they work?",
  },
  {
    icon: TrendingUp,
    label: "Analyze my portfolio",
    prompt: "Analyze my current portfolio positions and give me insights on my risk exposure.",
  },
  {
    icon: Calculator,
    label: "Calculate risk",
    prompt: "Help me calculate the risk-reward ratio for a potential trade. What factors should I consider?",
  },
  {
    icon: Shield,
    label: "Risk management",
    prompt: "What are the best risk management strategies for options trading?",
  },
];

const contextActions = [
  {
    icon: Briefcase,
    label: "Analyze my portfolio",
    description: "Get AI insights on your positions",
  },
  {
    icon: Calculator,
    label: "Explain my last calculation",
    description: "Understand your recent P&L analysis",
  },
];

export default function AIPage() {
  const { user } = useUser();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { positions } = usePositions();
  const { trades, totalPnL } = useTrades();
  const { messages: savedMessages, addMessage, clearHistory } = useChatHistory();

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [displayedContent, setDisplayedContent] = useState("");
  const [typingMessageId, setTypingMessageId] = useState<string | null>(null);

  const firstName = user?.firstName || "Trader";

  // Load saved messages on mount
  useEffect(() => {
    if (savedMessages.length > 0) {
      const loadedMessages = savedMessages.map((m) => ({
        id: m.id,
        role: m.role,
        content: m.content,
        timestamp: new Date(m.created_at),
      }));
      setMessages(loadedMessages);
    }
  }, [savedMessages]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, displayedContent]);

  // Typing animation effect
  useEffect(() => {
    if (!isTyping || !typingMessageId) return;

    const message = messages.find((m) => m.id === typingMessageId);
    if (!message) return;

    const fullContent = message.content;
    let currentIndex = 0;

    const typeInterval = setInterval(() => {
      if (currentIndex < fullContent.length) {
        setDisplayedContent(fullContent.slice(0, currentIndex + 1));
        currentIndex++;
      } else {
        setIsTyping(false);
        setTypingMessageId(null);
        clearInterval(typeInterval);
      }
    }, 10);

    return () => clearInterval(typeInterval);
  }, [isTyping, typingMessageId, messages]);

  const buildContextString = () => {
    let context = "";

    if (positions.length > 0) {
      const openPositions = positions.filter((p) => p.status === "open");
      context += `\n\nUser's open positions (${openPositions.length}):\n`;
      openPositions.forEach((p) => {
        context += `- ${p.symbol}: ${p.position_type} ${p.contract_type} @ $${p.strike_price}, ${p.contracts} contracts\n`;
      });
    }

    if (trades.length > 0) {
      context += `\n\nUser's trading stats:\n`;
      context += `- Total P&L: $${totalPnL}\n`;
      context += `- Total trades: ${trades.length}\n`;
      const wins = trades.filter((t) => (t.pnl || 0) > 0).length;
      context += `- Win rate: ${((wins / trades.length) * 100).toFixed(0)}%\n`;
    }

    return context;
  };

  const sendMessage = async (content: string, includeContext = false) => {
    if (!content.trim() || isLoading) return;

    const messageId = Date.now().toString();
    const userMessage: Message = {
      id: messageId,
      role: "user",
      content: content.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    // Save user message
    await addMessage("user", content.trim());

    try {
      let contextString = "";
      if (includeContext) {
        contextString = buildContextString();
      }

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages, userMessage].map((m) => ({
            role: m.role,
            content: m.content,
          })),
          context: {
            userContext: contextString,
            userName: firstName,
          },
        }),
      });

      const data = await response.json();
      const assistantContent = data.message || "Sorry, I couldn't process that request.";

      const assistantId = (Date.now() + 1).toString();
      const assistantMessage: Message = {
        id: assistantId,
        role: "assistant",
        content: assistantContent,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);

      // Save assistant message
      await addMessage("assistant", assistantContent);

      // Start typing animation
      setDisplayedContent("");
      setTypingMessageId(assistantId);
      setIsTyping(true);
    } catch {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "Sorry, an error occurred. Please try again.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleContextAction = (action: string) => {
    if (action === "Analyze my portfolio") {
      const prompt = `Please analyze my current portfolio and trading performance. Give me insights on my positions, risk exposure, and suggestions for improvement.`;
      sendMessage(prompt, true);
    } else if (action === "Explain my last calculation") {
      sendMessage(
        "Explain how options P&L calculations work, including break-even points, max profit, and max loss scenarios.",
        false
      );
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const copyMessage = (id: string, content: string) => {
    navigator.clipboard.writeText(content);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const regenerateResponse = async () => {
    if (messages.length < 2) return;

    // Find the last user message
    const lastUserIndex = [...messages].reverse().findIndex((m) => m.role === "user");
    if (lastUserIndex === -1) return;

    const lastUserMessage = messages[messages.length - 1 - lastUserIndex];

    // Remove the last assistant message
    setMessages((prev) => prev.slice(0, -1));

    // Resend
    await sendMessage(lastUserMessage.content);
  };

  const handleClearChat = async () => {
    await clearHistory();
    setMessages([]);
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  return (
    <div className="h-full bg-gradient-to-br from-brown-950 via-brown-900 to-brown-950 text-brown-50 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex-shrink-0 px-4 py-3 border-b border-brown-800/50 bg-brown-900/50 backdrop-blur-xl">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* AI Avatar */}
            <div className="relative">
              <div className="absolute inset-0 blur-xl bg-gold-400/50 rounded-full scale-125" />
              <div className="relative w-12 h-12 rounded-full bg-gradient-to-br from-gold-400 to-gold-600 flex items-center justify-center overflow-hidden">
                <Image
                  src="/images/logo.png"
                  alt="GainsView AI"
                  width={40}
                  height={40}
                  className="object-contain drop-shadow-[0_0_10px_rgba(212,175,55,0.4)]"
                />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-semibold text-brown-50">GainsView AI</h1>
                <span className="px-2 py-0.5 text-[10px] font-medium bg-gold-400/20 text-gold-400 rounded-full">
                  Powered by AI
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                <span className="text-xs text-emerald-400">Online</span>
              </div>
            </div>
          </div>

          {/* Clear Chat */}
          {messages.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearChat}
              className="text-brown-400 hover:text-red-400"
            >
              <Trash2 className="w-4 h-4 mr-1" />
              Clear
            </Button>
          )}
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="max-w-3xl mx-auto space-y-6">
          {messages.length === 0 ? (
            <div className="py-8">
              {/* Welcome Message */}
              <div className="text-center mb-8">
                <div className="relative inline-block mb-6">
                  <div className="absolute inset-0 blur-3xl bg-gold-400/40 rounded-full scale-150" />
                  <div className="relative w-28 h-28 md:w-32 md:h-32 rounded-full bg-gradient-to-br from-gold-400/20 to-gold-600/20 border border-gold-400/30 flex items-center justify-center mx-auto">
                    <Image
                      src="/images/logo.png"
                      alt="GainsView AI"
                      width={96}
                      height={96}
                      className="object-contain drop-shadow-[0_0_20px_rgba(212,175,55,0.5)]"
                    />
                  </div>
                </div>
                <h2 className="text-2xl font-bold text-brown-50 mb-2">
                  Hi {firstName}, I&apos;m your AI trading assistant.
                </h2>
                <p className="text-brown-400 max-w-md mx-auto">
                  Ask me anything about options trading, market analysis, or get personalized insights on your portfolio.
                </p>
              </div>

              {/* Context Actions */}
              <div className="flex flex-wrap justify-center gap-3 mb-8">
                {contextActions.map((action) => {
                  const Icon = action.icon;
                  return (
                    <button
                      key={action.label}
                      type="button"
                      onClick={() => handleContextAction(action.label)}
                      className="flex items-center gap-2 px-4 py-2 bg-gold-400/10 hover:bg-gold-400/20 border border-gold-400/30 rounded-full text-gold-400 text-sm font-medium transition-colors"
                    >
                      <Icon className="w-4 h-4" />
                      {action.label}
                    </button>
                  );
                })}
              </div>

              {/* Suggested Prompts */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {suggestedPrompts.map((prompt) => {
                  const Icon = prompt.icon;
                  return (
                    <button
                      key={prompt.label}
                      type="button"
                      onClick={() => sendMessage(prompt.prompt)}
                      className="p-4 text-left bg-brown-800/30 hover:bg-brown-800/50 border border-brown-700/50 hover:border-gold-400/30 rounded-xl transition-all group"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-brown-700/50 group-hover:bg-gold-400/20 rounded-lg transition-colors">
                            <Icon className="w-4 h-4 text-brown-400 group-hover:text-gold-400 transition-colors" />
                          </div>
                          <span className="font-medium text-brown-200 group-hover:text-gold-400 transition-colors">
                            {prompt.label}
                          </span>
                        </div>
                        <ChevronRight className="w-4 h-4 text-brown-600 group-hover:text-gold-400 transition-colors" />
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            <>
              {messages.map((message, index) => {
                const isTypingThis = isTyping && typingMessageId === message.id;
                const content = isTypingThis ? displayedContent : message.content;

                return (
                  <div
                    key={message.id}
                    className={cn(
                      "flex gap-3",
                      message.role === "user" ? "justify-end" : "justify-start"
                    )}
                  >
                    {message.role === "assistant" && (
                      <div className="flex-shrink-0">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gold-400/20 to-gold-600/20 border border-gold-400/30 flex items-center justify-center">
                          <Image
                            src="/images/logo.png"
                            alt="AI"
                            width={28}
                            height={28}
                            className="object-contain drop-shadow-[0_0_8px_rgba(212,175,55,0.3)]"
                          />
                        </div>
                      </div>
                    )}

                    <div
                      className={cn(
                        "max-w-[80%] group",
                        message.role === "user" ? "order-first" : ""
                      )}
                    >
                      <div
                        className={cn(
                          "px-4 py-3 rounded-2xl",
                          message.role === "user"
                            ? "bg-gold-500 text-brown-900 rounded-br-md"
                            : "bg-brown-800/80 text-brown-100 border border-brown-700/50 rounded-bl-md"
                        )}
                      >
                        <p className="whitespace-pre-wrap text-sm leading-relaxed">
                          {content}
                          {isTypingThis && (
                            <span className="inline-block w-1 h-4 ml-0.5 bg-gold-400 animate-pulse" />
                          )}
                        </p>
                      </div>

                      {/* Message Actions */}
                      <div
                        className={cn(
                          "flex items-center gap-2 mt-1 px-1",
                          message.role === "user" ? "justify-end" : "justify-start"
                        )}
                      >
                        <span className="text-[10px] text-brown-600">
                          {formatTime(message.timestamp)}
                        </span>

                        {message.role === "assistant" && !isTypingThis && (
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              type="button"
                              onClick={() => copyMessage(message.id, message.content)}
                              className="p-1 text-brown-500 hover:text-gold-400 transition-colors"
                              title="Copy"
                            >
                              {copiedId === message.id ? (
                                <Check className="w-3 h-3" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                            </button>
                            {index === messages.length - 1 && (
                              <button
                                type="button"
                                onClick={regenerateResponse}
                                className="p-1 text-brown-500 hover:text-gold-400 transition-colors"
                                title="Regenerate"
                              >
                                <RefreshCw className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {message.role === "user" && (
                      <div className="flex-shrink-0 order-last">
                        <div className="w-8 h-8 rounded-full bg-gold-500 flex items-center justify-center text-brown-900 font-semibold text-sm">
                          {firstName[0]}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Loading indicator */}
              {isLoading && (
                <div className="flex gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gold-400/20 to-gold-600/20 border border-gold-400/30 flex items-center justify-center">
                    <Image
                      src="/images/logo.png"
                      alt="AI"
                      width={28}
                      height={28}
                      className="object-contain drop-shadow-[0_0_8px_rgba(212,175,55,0.3)]"
                    />
                  </div>
                  <div className="bg-brown-800/80 border border-brown-700/50 px-4 py-3 rounded-2xl rounded-bl-md">
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

              <div ref={messagesEndRef} />
            </>
          )}
        </div>
      </div>

      {/* Input Area */}
      <div className="flex-shrink-0 p-4 border-t border-brown-800/50 bg-brown-900/50 backdrop-blur-xl">
        <div className="max-w-3xl mx-auto">
          <div className="flex gap-2 items-end">
            <div className="flex-1 relative">
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask anything about trading..."
                className="min-h-[48px] max-h-[120px] pr-12 bg-brown-800/50 border-brown-700 text-brown-100 placeholder:text-brown-500 resize-none rounded-xl"
                rows={1}
              />
              <Button
                type="button"
                onClick={() => sendMessage(input)}
                disabled={!input.trim() || isLoading}
                className="absolute right-2 bottom-2 h-8 w-8 p-0 bg-gold-500 hover:bg-gold-600 text-brown-900 rounded-lg disabled:opacity-50"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>

          {/* Disclaimer */}
          <div className="flex items-center justify-center gap-2 mt-3">
            <Sparkles className="w-3 h-3 text-brown-600" />
            <p className="text-[10px] text-brown-600 text-center">
              AI responses are for educational purposes only. Not financial advice.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
