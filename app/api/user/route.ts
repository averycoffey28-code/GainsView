import { auth } from "@clerk/nextjs/server";
import { neon } from "@neondatabase/serverless";
import { NextResponse } from "next/server";

// Get current user's database ID from Clerk ID
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function getUserId(clerkId: string, sql: any): Promise<string | null> {
  const result = await sql`SELECT id FROM users WHERE clerk_id = ${clerkId}`;
  return result[0]?.id || null;
}

export async function GET(req: Request) {
  const { userId: clerkId } = await auth();
  if (!clerkId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const DATABASE_URL = process.env.DATABASE_URL;
  if (!DATABASE_URL) {
    return NextResponse.json({ error: "Database not configured" }, { status: 500 });
  }

  const sql = neon(DATABASE_URL);
  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type");

  try {
    let userId = await getUserId(clerkId, sql);
    if (!userId) {
      // Create user if doesn't exist
      const result = await sql`
        INSERT INTO users (clerk_id, email, name)
        VALUES (${clerkId}, '', '')
        ON CONFLICT (clerk_id) DO UPDATE SET updated_at = NOW()
        RETURNING id
      `;
      const rows = result as unknown as { id: string }[];
      userId = rows[0]?.id;
      if (!userId) {
        return NextResponse.json({ error: "Failed to create user" }, { status: 500 });
      }
      return NextResponse.json({ data: [] });
    }

    switch (type) {
      case "user":
        const user = await sql`SELECT * FROM users WHERE id = ${userId}`;
        return NextResponse.json({ data: (user as unknown[])[0] || null });

      case "positions":
        const positions = await sql`
          SELECT * FROM positions WHERE user_id = ${userId} ORDER BY created_at DESC
        `;
        return NextResponse.json({ data: positions });

      case "watchlist":
        const watchlist = await sql`
          SELECT * FROM watchlist WHERE user_id = ${userId} ORDER BY created_at DESC
        `;
        return NextResponse.json({ data: watchlist });

      case "trades":
        const trades = await sql`
          SELECT * FROM trades WHERE user_id = ${userId} ORDER BY trade_date DESC
        `;
        return NextResponse.json({ data: trades });

      case "chat":
        const messages = await sql`
          SELECT * FROM chat_history WHERE user_id = ${userId} ORDER BY created_at ASC LIMIT 100
        `;
        return NextResponse.json({ data: messages });

      case "settings":
        const settings = await sql`SELECT * FROM user_settings WHERE user_id = ${userId}`;
        return NextResponse.json({ data: (settings as unknown[])[0] || null });

      default:
        return NextResponse.json({ error: "Invalid type" }, { status: 400 });
    }
  } catch (error) {
    console.error("Database error:", error);
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const { userId: clerkId } = await auth();
  if (!clerkId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const DATABASE_URL = process.env.DATABASE_URL;
  if (!DATABASE_URL) {
    return NextResponse.json({ error: "Database not configured" }, { status: 500 });
  }

  const sql = neon(DATABASE_URL);
  const body = await req.json();
  const { type, data } = body;

  try {
    const userId = await getUserId(clerkId, sql);
    if (!userId) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    switch (type) {
      case "position":
        const position = await sql`
          INSERT INTO positions (user_id, symbol, contract_type, position_type, strike_price, premium, contracts, entry_stock_price, expiration_date, notes)
          VALUES (${userId}, ${data.symbol}, ${data.contract_type}, ${data.position_type}, ${data.strike_price}, ${data.premium}, ${data.contracts}, ${data.entry_stock_price}, ${data.expiration_date || null}, ${data.notes || null})
          RETURNING *
        `;
        return NextResponse.json({ data: (position as unknown[])[0] });

      case "watchlist":
        const watchlistItem = await sql`
          INSERT INTO watchlist (user_id, symbol, notes)
          VALUES (${userId}, ${data.symbol.toUpperCase()}, ${data.notes || null})
          ON CONFLICT (user_id, symbol) DO NOTHING
          RETURNING *
        `;
        return NextResponse.json({ data: (watchlistItem as unknown[])[0] });

      case "trade":
        const trade = await sql`
          INSERT INTO trades (user_id, symbol, trade_type, asset_type, quantity, price, total_value, pnl, notes, trade_date)
          VALUES (${userId}, ${data.symbol}, ${data.trade_type}, ${data.asset_type}, ${data.quantity}, ${data.price}, ${data.total_value}, ${data.pnl || null}, ${data.notes || null}, ${data.trade_date || 'NOW()'})
          RETURNING *
        `;
        return NextResponse.json({ data: (trade as unknown[])[0] });

      case "chat":
        const message = await sql`
          INSERT INTO chat_history (user_id, role, content)
          VALUES (${userId}, ${data.role}, ${data.content})
          RETURNING *
        `;
        return NextResponse.json({ data: (message as unknown[])[0] });

      default:
        return NextResponse.json({ error: "Invalid type" }, { status: 400 });
    }
  } catch (error) {
    console.error("Database error:", error);
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const { userId: clerkId } = await auth();
  if (!clerkId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const DATABASE_URL = process.env.DATABASE_URL;
  if (!DATABASE_URL) {
    return NextResponse.json({ error: "Database not configured" }, { status: 500 });
  }

  const sql = neon(DATABASE_URL);
  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type");
  const id = searchParams.get("id");

  try {
    const userId = await getUserId(clerkId, sql);
    if (!userId) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    switch (type) {
      case "position":
        await sql`DELETE FROM positions WHERE id = ${id} AND user_id = ${userId}`;
        return NextResponse.json({ success: true });

      case "watchlist":
        await sql`DELETE FROM watchlist WHERE id = ${id} AND user_id = ${userId}`;
        return NextResponse.json({ success: true });

      case "trade":
        await sql`DELETE FROM trades WHERE id = ${id} AND user_id = ${userId}`;
        return NextResponse.json({ success: true });

      case "chat":
        await sql`DELETE FROM chat_history WHERE user_id = ${userId}`;
        return NextResponse.json({ success: true });

      default:
        return NextResponse.json({ error: "Invalid type" }, { status: 400 });
    }
  } catch (error) {
    console.error("Database error:", error);
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  const { userId: clerkId } = await auth();
  if (!clerkId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const DATABASE_URL = process.env.DATABASE_URL;
  if (!DATABASE_URL) {
    return NextResponse.json({ error: "Database not configured" }, { status: 500 });
  }

  const sql = neon(DATABASE_URL);
  const body = await req.json();
  const { type, id, data } = body;

  try {
    const userId = await getUserId(clerkId, sql);
    if (!userId) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    switch (type) {
      case "position":
        const position = await sql`
          UPDATE positions SET
            status = COALESCE(${data.status}, status),
            close_price = COALESCE(${data.close_price}, close_price),
            closed_at = COALESCE(${data.closed_at}, closed_at),
            realized_pnl = COALESCE(${data.realized_pnl}, realized_pnl),
            notes = COALESCE(${data.notes}, notes)
          WHERE id = ${id} AND user_id = ${userId}
          RETURNING *
        `;
        return NextResponse.json({ data: (position as unknown[])[0] });

      case "settings":
        const settings = await sql`
          UPDATE user_settings SET
            theme = COALESCE(${data.theme}, theme),
            default_contracts = COALESCE(${data.default_contracts}, default_contracts),
            notifications_enabled = COALESCE(${data.notifications_enabled}, notifications_enabled),
            updated_at = NOW()
          WHERE user_id = ${userId}
          RETURNING *
        `;
        return NextResponse.json({ data: (settings as unknown[])[0] });

      default:
        return NextResponse.json({ error: "Invalid type" }, { status: 400 });
    }
  } catch (error) {
    console.error("Database error:", error);
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }
}
