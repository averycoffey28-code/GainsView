import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_VISION_MODEL = "meta-llama/llama-4-scout-17b-16e-instruct";

export async function POST(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { image } = await request.json();

    if (!image) {
      return NextResponse.json({ error: "No image provided" }, { status: 400 });
    }

    if (!GROQ_API_KEY || GROQ_API_KEY === "your_groq_api_key_here") {
      return NextResponse.json(
        { error: "Groq API key not configured" },
        { status: 500 }
      );
    }

    const prompt = `Extract trade information from this Robinhood screenshot. This appears to be a closed position or trade confirmation screen.

Analyze the image carefully and return ONLY a valid JSON object with these fields:
{
  "symbol": "ticker symbol (e.g., GLD, AAPL, SPY)",
  "strikePrice": number or null if it's a stock trade,
  "optionType": "call" or "put" or "stock",
  "expirationDate": "MM/DD" format or null if stock,
  "quantity": number of contracts or shares,
  "entryPrice": cost per share/contract as a number,
  "exitPrice": credit/sale price per share/contract as a number,
  "totalCost": total cost at open as a number,
  "totalCredit": total credit at close as a number,
  "profitLoss": realized profit/loss as a number (positive for profit, negative for loss),
  "profitLossPercent": percentage gain/loss as a number,
  "closeDate": "YYYY-MM-DD" format (today's date if not shown),
  "isProfit": true if profitable, false if loss
}

Important:
- Look for "Total Return" or "P&L" to determine profit/loss
- Look for "Avg. Cost" or "Cost" for entry price
- Look for "Avg. Credit" or "Credit" for exit price
- For options, extract strike price from the contract name (e.g., "$485 Call")
- Return ONLY the JSON object, no markdown, no explanation, no code blocks
- If a field cannot be determined, use null
- Make sure all number fields are actual numbers, not strings`;

    const imageUrl = image.startsWith("data:")
      ? image
      : `data:image/jpeg;base64,${image}`;

    const response = await fetch(GROQ_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: GROQ_VISION_MODEL,
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: prompt },
              {
                type: "image_url",
                image_url: { url: imageUrl },
              },
            ],
          },
        ],
        max_tokens: 1000,
        temperature: 0.1,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Groq Vision API error:", response.status, errorText);

      let errorMessage = "Failed to analyze image";
      try {
        const errorJson = JSON.parse(errorText);
        if (errorJson.error?.message) {
          errorMessage = errorJson.error.message;
        }
      } catch {
        // Keep default error message
      }

      return NextResponse.json({ error: errorMessage }, { status: 500 });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      return NextResponse.json(
        { error: "No response from AI" },
        { status: 500 }
      );
    }

    // Parse the JSON response - handle potential markdown code blocks
    let jsonStr = content.trim();

    if (jsonStr.startsWith("```json")) {
      jsonStr = jsonStr.slice(7);
    } else if (jsonStr.startsWith("```")) {
      jsonStr = jsonStr.slice(3);
    }
    if (jsonStr.endsWith("```")) {
      jsonStr = jsonStr.slice(0, -3);
    }
    jsonStr = jsonStr.trim();

    try {
      const tradeData = JSON.parse(jsonStr);

      if (!tradeData.symbol) {
        return NextResponse.json(
          { error: "Could not extract trade symbol from screenshot" },
          { status: 400 }
        );
      }

      return NextResponse.json({ success: true, trade: tradeData });
    } catch (parseError) {
      console.error("JSON parse error:", parseError, "Content:", content);
      return NextResponse.json(
        { error: "Could not parse trade data from screenshot" },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("Extract trade error:", error);
    return NextResponse.json(
      { error: "Failed to process screenshot" },
      { status: 500 }
    );
  }
}
