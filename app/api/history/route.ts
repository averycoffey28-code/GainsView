import { NextRequest, NextResponse } from "next/server";

const TRADIER_API_KEY = process.env.TRADIER_API_KEY;
const TRADIER_API_URL = process.env.TRADIER_API_URL || "https://sandbox.tradier.com/v1";

export async function GET(request: NextRequest) {
  const symbol = request.nextUrl.searchParams.get("symbol");
  const interval = request.nextUrl.searchParams.get("interval") || "daily";
  const range = request.nextUrl.searchParams.get("range") || "1M";

  if (!symbol) {
    return NextResponse.json({ error: "Symbol is required" }, { status: 400 });
  }

  if (!TRADIER_API_KEY || TRADIER_API_KEY === "your_sandbox_token_here") {
    return NextResponse.json(
      { error: "API key not configured" },
      { status: 500 }
    );
  }

  try {
    // Calculate date range
    const end = new Date();
    const start = new Date();

    switch (range) {
      case "1D":
        start.setDate(start.getDate() - 1);
        break;
      case "1W":
        start.setDate(start.getDate() - 7);
        break;
      case "1M":
        start.setMonth(start.getMonth() - 1);
        break;
      case "3M":
        start.setMonth(start.getMonth() - 3);
        break;
      case "1Y":
        start.setFullYear(start.getFullYear() - 1);
        break;
      case "ALL":
        start.setFullYear(start.getFullYear() - 5);
        break;
      default:
        start.setMonth(start.getMonth() - 1);
    }

    const startStr = start.toISOString().split("T")[0];
    const endStr = end.toISOString().split("T")[0];

    // Use timesales for intraday, history for daily
    let url: string;
    if (range === "1D") {
      url = `${TRADIER_API_URL}/markets/timesales?symbol=${symbol.toUpperCase()}&interval=5min&start=${startStr}&end=${endStr}`;
    } else {
      url = `${TRADIER_API_URL}/markets/history?symbol=${symbol.toUpperCase()}&interval=${interval}&start=${startStr}&end=${endStr}`;
    }

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${TRADIER_API_KEY}`,
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Tradier API error: ${response.status}`);
    }

    const data = await response.json();

    // Handle intraday data
    if (range === "1D") {
      if (!data.series?.data) {
        return NextResponse.json({ history: [] });
      }

      const timesales = Array.isArray(data.series.data)
        ? data.series.data
        : [data.series.data];

      const history = timesales.map((d: { time: string; price: number; volume: number }) => ({
        date: d.time,
        close: d.price,
        volume: d.volume,
      }));

      return NextResponse.json({
        symbol: symbol.toUpperCase(),
        range,
        history,
      });
    }

    // Handle daily data
    if (!data.history?.day) {
      return NextResponse.json({ history: [] });
    }

    const days = Array.isArray(data.history.day)
      ? data.history.day
      : [data.history.day];

    const history = days.map((d: { date: string; open: number; high: number; low: number; close: number; volume: number }) => ({
      date: d.date,
      open: d.open,
      high: d.high,
      low: d.low,
      close: d.close,
      volume: d.volume,
    }));

    return NextResponse.json({
      symbol: symbol.toUpperCase(),
      range,
      history,
    });
  } catch (error) {
    console.error("History error:", error);
    return NextResponse.json(
      { error: "Failed to fetch history" },
      { status: 500 }
    );
  }
}
