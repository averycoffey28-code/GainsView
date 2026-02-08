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

    // Get options chain and current stock price in parallel
    const [chainResponse, quoteResponse] = await Promise.all([
      fetch(
        `${TRADIER_API_URL}/markets/options/chains?symbol=${symbol.toUpperCase()}&expiration=${expiration}&greeks=true`,
        {
          headers: {
            Authorization: `Bearer ${TRADIER_API_KEY}`,
            Accept: "application/json",
          },
        }
      ),
      fetch(
        `${TRADIER_API_URL}/markets/quotes?symbols=${symbol.toUpperCase()}`,
        {
          headers: {
            Authorization: `Bearer ${TRADIER_API_KEY}`,
            Accept: "application/json",
          },
        }
      ),
    ]);

    if (!chainResponse.ok) {
      throw new Error(`Tradier API error: ${chainResponse.status}`);
    }

    const chainData = await chainResponse.json();
    const quoteData = quoteResponse.ok ? await quoteResponse.json() : null;

    const currentPrice = quoteData?.quotes?.quote?.last ?? null;

    if (!chainData.options?.option) {
      return NextResponse.json(
        { error: "No options data available" },
        { status: 404 }
      );
    }

    const options = Array.isArray(chainData.options.option)
      ? chainData.options.option
      : [chainData.options.option];

    interface TradierOption {
      symbol: string;
      option_type: string;
      strike: number;
      bid: number;
      ask: number;
      last: number;
      change: number;
      change_percentage: number;
      volume: number;
      open_interest: number;
      greeks?: {
        delta: number;
        gamma: number;
        theta: number;
        vega: number;
        mid_iv: number;
      };
    }

    const mapOption = (opt: TradierOption) => ({
      symbol: opt.symbol,
      strike: opt.strike,
      bid: opt.bid ?? 0,
      ask: opt.ask ?? 0,
      last: opt.last ?? 0,
      change: opt.change ?? 0,
      changePercent: opt.change_percentage ?? 0,
      volume: opt.volume ?? 0,
      openInterest: opt.open_interest ?? 0,
      delta: opt.greeks?.delta ?? null,
      gamma: opt.greeks?.gamma ?? null,
      theta: opt.greeks?.theta ?? null,
      vega: opt.greeks?.vega ?? null,
      iv: opt.greeks?.mid_iv ?? null,
    });

    const allCalls = options
      .filter((opt: TradierOption) => opt.option_type === "call")
      .map(mapOption)
      .sort((a: { strike: number }, b: { strike: number }) => a.strike - b.strike);

    const allPuts = options
      .filter((opt: TradierOption) => opt.option_type === "put")
      .map(mapOption)
      .sort((a: { strike: number }, b: { strike: number }) => a.strike - b.strike);

    return NextResponse.json({
      symbol: symbol.toUpperCase(),
      expiration,
      currentPrice,
      calls: allCalls,
      puts: allPuts,
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
