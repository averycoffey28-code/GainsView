import { NextRequest, NextResponse } from "next/server";

const TRADIER_API_KEY = process.env.TRADIER_API_KEY;
const TRADIER_API_URL = process.env.TRADIER_API_URL || "https://sandbox.tradier.com/v1";

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("q");

  if (!query || query.length < 1) {
    return NextResponse.json({ results: [] });
  }

  if (!TRADIER_API_KEY || TRADIER_API_KEY === "your_sandbox_token_here") {
    return NextResponse.json(
      { error: "API key not configured" },
      { status: 500 }
    );
  }

  try {
    const response = await fetch(
      `${TRADIER_API_URL}/markets/search?q=${encodeURIComponent(query)}&indexes=false`,
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

    if (!data.securities?.security) {
      return NextResponse.json({ results: [] });
    }

    const securities = Array.isArray(data.securities.security)
      ? data.securities.security
      : [data.securities.security];

    // Filter to stocks only and limit results
    const results = securities
      .filter((s: { type: string }) => s.type === "stock")
      .slice(0, 10)
      .map((s: { symbol: string; description: string; exchange: string }) => ({
        symbol: s.symbol,
        name: s.description,
        exchange: s.exchange,
      }));

    return NextResponse.json({ results });
  } catch (error) {
    console.error("Search error:", error);
    return NextResponse.json(
      { error: "Failed to search" },
      { status: 500 }
    );
  }
}
