import { NextRequest, NextResponse } from "next/server";

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";

const SYSTEM_PROMPT = `You are an expert options trading advisor with decades of experience in derivatives markets. Your role is to help traders understand options strategies, analyze positions, and make informed decisions.

Your personality:
- Professional and knowledgeable wealth advisor
- Helpful and thorough in explanations
- Cautious and risk-aware
- Direct and actionable in advice

Your capabilities:
- Explain options strategies (calls, puts, spreads, straddles, etc.)
- Analyze profit/loss scenarios
- Assess risk/reward profiles
- Discuss Greeks (delta, gamma, theta, vega)
- Compare strategies for different market outlooks
- Help interpret options chain data

When given contract details, always reference them specifically in your analysis. Use concrete numbers when available. Be concise but thorough.`;

interface Message {
  role: "user" | "assistant" | "system";
  content: string;
}

interface ChatRequest {
  messages: Message[];
  context?: {
    symbol?: string;
    contractType?: string;
    position?: string;
    strikePrice?: number;
    premium?: number;
    currentPrice?: number;
    contracts?: number;
    targetPrice?: number;
    breakEven?: number;
    maxProfit?: string | number;
    maxLoss?: string | number;
    targetPnL?: number;
    targetROI?: number;
  };
}

export async function POST(request: NextRequest) {
  if (!GROQ_API_KEY || GROQ_API_KEY === "your_groq_api_key_here") {
    return NextResponse.json(
      { error: "Groq API key not configured. Please add GROQ_API_KEY to .env.local" },
      { status: 500 }
    );
  }

  try {
    const body: ChatRequest = await request.json();
    const { messages, context } = body;

    // Build context string if contract details provided
    let contextString = "";
    if (context && context.strikePrice) {
      contextString = `

CURRENT POSITION CONTEXT:
- Symbol: ${context.symbol || "Not specified"}
- Contract Type: ${context.contractType?.toUpperCase() || "Not specified"}
- Position: ${context.position?.toUpperCase() || "Not specified"}
- Strike Price: $${context.strikePrice}
- Premium: $${context.premium} per share
- Current Stock Price: $${context.currentPrice}
- Number of Contracts: ${context.contracts}
- Target Price: $${context.targetPrice}
- Break-Even: $${context.breakEven?.toFixed(2)}
- Max Profit: ${context.maxProfit === "Unlimited" ? "Unlimited" : "$" + context.maxProfit}
- Max Loss: ${context.maxLoss === "Unlimited" ? "Unlimited" : "$" + context.maxLoss}
- P&L at Target: $${context.targetPnL?.toFixed(2)}
- ROI at Target: ${context.targetROI?.toFixed(1)}%

Reference these specific details in your response when relevant.`;
    }

    const systemMessage = SYSTEM_PROMPT + contextString;

    const response = await fetch(GROQ_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: "llama-3.1-70b-versatile",
        messages: [
          { role: "system", content: systemMessage },
          ...messages,
        ],
        temperature: 0.7,
        max_tokens: 1024,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("Groq API error:", error);
      return NextResponse.json(
        { error: "Failed to get response from AI" },
        { status: response.status }
      );
    }

    const data = await response.json();
    const assistantMessage = data.choices[0]?.message?.content || "I apologize, but I couldn't generate a response.";

    return NextResponse.json({
      message: assistantMessage,
      usage: data.usage,
    });
  } catch (error) {
    console.error("Chat API error:", error);
    return NextResponse.json(
      { error: "Failed to process chat request" },
      { status: 500 }
    );
  }
}
