import { NextRequest, NextResponse } from "next/server";

const TRADIER_API_KEY = process.env.TRADIER_API_KEY;
const TRADIER_API_URL = process.env.TRADIER_API_URL || "https://sandbox.tradier.com/v1";

export async function GET(request: NextRequest) {
  const symbol = request.nextUrl.searchParams.get("symbol");
  const expiration = request.nextUrl.searchParams.get("expiration");

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
    // If no expiration provided, get available expirations first
    if (!expiration) {
      const expResponse = await fetch(
        `${TRADIER_API_URL}/markets/options/expirations?symbol=${symbol.toUpperCase()}`,
        {
          headers: {
            Authorization: `Bearer ${TRADIER_API_KEY}`,
            Accept: "application/json",
          },
        }
      );

      if (!expResponse.ok) {
        throw new Error(`Tradier API error: ${expResponse.status}`);
      }

      const expData = await expResponse.json();

      if (!expData.expirations?.date) {
        return NextResponse.json(
          { error: `No options available for "${symbol}"` },
          { status: 404 }
        );
      }

      const expirations = Array.isArray(expData.expirations.date)
        ? expData.expirations.date
        : [expData.expirations.date];

      return NextResponse.json({
        symbol: symbol.toUpperCase(),
        expirations,
        timestamp: new Date().toISOString(),
      });
    }

    // Get options chain for specific expiration
    const chainResponse = await fetch(
      `${TRADIER_API_URL}/markets/options/chains?symbol=${symbol.toUpperCase()}&expiration=${expiration}`,
      {
        headers: {
          Authorization: `Bearer ${TRADIER_API_KEY}`,
          Accept: "application/json",
        },
      }
    );

    if (!chainResponse.ok) {
      throw new Error(`Tradier API error: ${chainResponse.status}`);
    }

    const chainData = await chainResponse.json();

    if (!chainData.options?.option) {
      return NextResponse.json(
        { error: "No options data available" },
        { status: 404 }
      );
    }

    const options = Array.isArray(chainData.options.option)
      ? chainData.options.option
      : [chainData.options.option];

    // Group by strike price
    const calls = options
      .filter((opt: { option_type: string }) => opt.option_type === "call")
      .map((opt: {
        symbol: string;
        strike: number;
        bid: number;
        ask: number;
        last: number;
        volume: number;
        open_interest: number;
        greeks?: {
          delta: number;
          gamma: number;
          theta: number;
          vega: number;
          iv: number;
        };
      }) => ({
        symbol: opt.symbol,
        strike: opt.strike,
        bid: opt.bid,
        ask: opt.ask,
        last: opt.last,
        volume: opt.volume,
        openInterest: opt.open_interest,
        delta: opt.greeks?.delta,
        iv: opt.greeks?.iv,
      }));

    const puts = options
      .filter((opt: { option_type: string }) => opt.option_type === "put")
      .map((opt: {
        symbol: string;
        strike: number;
        bid: number;
        ask: number;
        last: number;
        volume: number;
        open_interest: number;
        greeks?: {
          delta: number;
          gamma: number;
          theta: number;
          vega: number;
          iv: number;
        };
      }) => ({
        symbol: opt.symbol,
        strike: opt.strike,
        bid: opt.bid,
        ask: opt.ask,
        last: opt.last,
        volume: opt.volume,
        openInterest: opt.open_interest,
        delta: opt.greeks?.delta,
        iv: opt.greeks?.iv,
      }));

    return NextResponse.json({
      symbol: symbol.toUpperCase(),
      expiration,
      calls: calls.sort((a: { strike: number }, b: { strike: number }) => a.strike - b.strike),
      puts: puts.sort((a: { strike: number }, b: { strike: number }) => a.strike - b.strike),
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Options chain error:", error);
    return NextResponse.json(
      { error: "Failed to fetch options data" },
      { status: 500 }
    );
  }
}
