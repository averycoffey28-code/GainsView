import { NextRequest, NextResponse } from "next/server";

const TRADIER_API_KEY = process.env.TRADIER_API_KEY;
const TRADIER_API_URL = process.env.TRADIER_API_URL || "https://sandbox.tradier.com/v1";

export async function GET(request: NextRequest) {
  const symbol = request.nextUrl.searchParams.get("symbol");

  if (!symbol) {
    return NextResponse.json({ error: "Symbol is required" }, { status: 400 });
  }

  if (!TRADIER_API_KEY || TRADIER_API_KEY === "your_sandbox_token_here") {
    return NextResponse.json(
      { error: "API key not configured. Please add your Tradier API key to .env.local" },
      { status: 500 }
    );
  }

  try {
    const response = await fetch(
      `${TRADIER_API_URL}/markets/quotes?symbols=${symbol.toUpperCase()}`,
      {
        headers: {
          Authorization: `Bearer ${TRADIER_API_KEY}`,
          Accept: "application/json",
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Tradier API error: ${response.status}`);
    }

    const data = await response.json();

    if (!data.quotes?.quote) {
      return NextResponse.json(
        { error: `Symbol "${symbol}" not found` },
        { status: 404 }
      );
    }

    const quote = Array.isArray(data.quotes.quote)
      ? data.quotes.quote[0]
      : data.quotes.quote;

    return NextResponse.json({
      symbol: quote.symbol,
      price: quote.last,
      change: quote.change,
      changePercent: quote.change_percentage,
      high: quote.high,
      low: quote.low,
      volume: quote.volume,
      description: quote.description,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Stock quote error:", error);
    return NextResponse.json(
      { error: "Failed to fetch stock data" },
      { status: 500 }
    );
  }
}
