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
    const headers = {
      Authorization: `Bearer ${TRADIER_API_KEY}`,
      Accept: "application/json",
    };

    // Call both lookup (searches by ticker symbol) and search (searches by company name) in parallel
    const [lookupRes, searchRes] = await Promise.all([
      fetch(
        `${TRADIER_API_URL}/markets/lookup?q=${encodeURIComponent(query)}&exchanges=Q,N&types=stock`,
        { headers }
      ),
      fetch(
        `${TRADIER_API_URL}/markets/search?q=${encodeURIComponent(query)}&indexes=false`,
        { headers }
      ),
    ]);

    const parseSecurities = (data: { securities?: { security?: unknown } }) => {
      if (!data.securities?.security) return [];
      const list = Array.isArray(data.securities.security)
        ? data.securities.security
        : [data.securities.security];
      return list
        .filter((s: { type: string }) => s.type === "stock")
        .map((s: { symbol: string; description: string; exchange: string }) => ({
          symbol: s.symbol,
          name: s.description,
          exchange: s.exchange,
        }));
    };

    const lookupData = lookupRes.ok ? await lookupRes.json() : {};
    const searchData = searchRes.ok ? await searchRes.json() : {};

    const lookupResults = parseSecurities(lookupData);
    const searchResults = parseSecurities(searchData);

    // Merge results: lookup (ticker matches) first, then search (name matches), deduplicated
    const seen = new Set<string>();
    const merged: { symbol: string; name: string; exchange: string }[] = [];

    for (const item of [...lookupResults, ...searchResults]) {
      if (!seen.has(item.symbol)) {
        seen.add(item.symbol);
        merged.push(item);
      }
    }

    // Sort: exact ticker match → starts with query → shorter ticker length
    const upperQuery = query.toUpperCase().trim();
    const sortedResults = merged.sort((a, b) => {
      const aExact = a.symbol.toUpperCase() === upperQuery;
      const bExact = b.symbol.toUpperCase() === upperQuery;
      if (aExact && !bExact) return -1;
      if (!aExact && bExact) return 1;

      const aStarts = a.symbol.toUpperCase().startsWith(upperQuery);
      const bStarts = b.symbol.toUpperCase().startsWith(upperQuery);
      if (aStarts && !bStarts) return -1;
      if (!aStarts && bStarts) return 1;

      return a.symbol.length - b.symbol.length;
    }).slice(0, 10);

    return NextResponse.json({ results: sortedResults });
  } catch (error) {
    console.error("Search error:", error);
    return NextResponse.json(
      { error: "Failed to search" },
      { status: 500 }
    );
  }
}
