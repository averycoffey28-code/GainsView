import { NextRequest, NextResponse } from "next/server";

const FINNHUB_API_KEY = process.env.FINNHUB_API_KEY;
const FINNHUB_BASE_URL = "https://finnhub.io/api/v1";

// Simple in-memory cache
const cache = new Map<string, { data: unknown; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

interface FinnhubNewsArticle {
  category: string;
  datetime: number;
  headline: string;
  id: number;
  image: string;
  related: string;
  source: string;
  summary: string;
  url: string;
}

export async function GET(request: NextRequest) {
  if (!FINNHUB_API_KEY) {
    return NextResponse.json(
      { error: "News API not configured. Please add FINNHUB_API_KEY to environment variables." },
      { status: 500 }
    );
  }

  const searchParams = request.nextUrl.searchParams;
  const category = searchParams.get("category");
  const symbol = searchParams.get("symbol");
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  let apiUrl: string;
  let cacheKey: string;

  if (symbol) {
    // Company-specific news
    const today = new Date();
    const fromDate = from || new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
    const toDate = to || today.toISOString().split("T")[0];

    apiUrl = `${FINNHUB_BASE_URL}/company-news?symbol=${symbol.toUpperCase()}&from=${fromDate}&to=${toDate}&token=${FINNHUB_API_KEY}`;
    cacheKey = `company-${symbol.toUpperCase()}-${fromDate}-${toDate}`;
  } else {
    // General market news
    const newsCategory = category || "general";
    apiUrl = `${FINNHUB_BASE_URL}/news?category=${newsCategory}&token=${FINNHUB_API_KEY}`;
    cacheKey = `general-${newsCategory}`;
  }

  // Check cache
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return NextResponse.json(cached.data);
  }

  try {
    const response = await fetch(apiUrl, {
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      if (response.status === 429) {
        return NextResponse.json(
          { error: "Rate limit exceeded. Please try again in a moment." },
          { status: 429 }
        );
      }
      throw new Error(`Finnhub API error: ${response.status}`);
    }

    const data: FinnhubNewsArticle[] = await response.json();

    // Filter out articles without essential fields and limit results
    const filteredData = data
      .filter((article) => article.headline && article.url)
      .slice(0, 50); // Limit to 50 articles

    // Cache the result
    cache.set(cacheKey, { data: { articles: filteredData }, timestamp: Date.now() });

    return NextResponse.json({ articles: filteredData });
  } catch (error) {
    console.error("News API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch news. Please try again later." },
      { status: 500 }
    );
  }
}
