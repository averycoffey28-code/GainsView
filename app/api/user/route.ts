import { auth } from "@clerk/nextjs/server";
import { neon } from "@neondatabase/serverless";
import { NextResponse } from "next/server";
import {
  positionSchema,
  tradeSchema,
  watchlistSchema,
  chatMessageSchema,
  validateInput,
} from "@/lib/validations";

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

      case "goals":
        const goals = await sql`
          SELECT * FROM goals WHERE user_id = ${userId} ORDER BY created_at DESC
        `;
        return NextResponse.json({ data: goals });

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
      case "position": {
        const validation = validateInput(positionSchema, data);
        if (!validation.success) {
          return NextResponse.json({ error: validation.error }, { status: 400 });
        }
        const validData = validation.data;
        const position = await sql`
          INSERT INTO positions (user_id, symbol, contract_type, position_type, strike_price, premium, contracts, entry_stock_price, expiration_date, notes)
          VALUES (${userId}, ${validData.symbol.toUpperCase()}, ${validData.contract_type}, ${validData.position_type}, ${validData.strike_price}, ${validData.premium}, ${validData.contracts}, ${validData.entry_stock_price || null}, ${validData.expiration_date || null}, ${validData.notes || null})
          RETURNING *
        `;
        return NextResponse.json({ data: (position as unknown[])[0] });
      }

      case "watchlist": {
        const validation = validateInput(watchlistSchema, data);
        if (!validation.success) {
          return NextResponse.json({ error: validation.error }, { status: 400 });
        }
        const validData = validation.data;
        const watchlistItem = await sql`
          INSERT INTO watchlist (user_id, symbol, notes)
          VALUES (${userId}, ${validData.symbol.toUpperCase()}, ${null})
          ON CONFLICT (user_id, symbol) DO NOTHING
          RETURNING *
        `;
        return NextResponse.json({ data: (watchlistItem as unknown[])[0] });
      }

      case "trade": {
        const validation = validateInput(tradeSchema, data);
        if (!validation.success) {
          return NextResponse.json({ error: validation.error }, { status: 400 });
        }
        const validData = validation.data;
        const trade = await sql`
          INSERT INTO trades (user_id, symbol, trade_type, asset_type, quantity, price, total_value, pnl, notes, trade_date)
          VALUES (${userId}, ${validData.symbol.toUpperCase()}, ${validData.trade_type}, ${validData.asset_type}, ${validData.quantity}, ${validData.price}, ${validData.total_value || 0}, ${validData.pnl || null}, ${validData.notes || null}, ${data.trade_date || 'NOW()'})
          RETURNING *
        `;
        return NextResponse.json({ data: (trade as unknown[])[0] });
      }

      case "chat": {
        const validation = validateInput(chatMessageSchema, data);
        if (!validation.success) {
          return NextResponse.json({ error: validation.error }, { status: 400 });
        }
        const validData = validation.data;
        const message = await sql`
          INSERT INTO chat_history (user_id, role, content)
          VALUES (${userId}, ${validData.role}, ${validData.content})
          RETURNING *
        `;
        return NextResponse.json({ data: (message as unknown[])[0] });
      }

      case "goal":
        const goal = await sql`
          INSERT INTO goals (user_id, label, type, target, start_date, end_date, status)
          VALUES (${userId}, ${data.label}, ${data.type}, ${data.target}, ${data.start_date}, ${data.end_date}, ${data.status || 'active'})
          RETURNING *
        `;
        return NextResponse.json({ data: (goal as unknown[])[0] });

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

      case "goal":
        await sql`DELETE FROM goals WHERE id = ${id} AND user_id = ${userId}`;
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
            theme = COALESCE(${data.theme ?? null}, theme),
            default_contracts = COALESCE(${data.default_contracts ?? null}, default_contracts),
            notifications_enabled = COALESCE(${data.notifications_enabled ?? null}, notifications_enabled),
            market_disclaimer_acknowledged = COALESCE(${data.market_disclaimer_acknowledged ?? null}, market_disclaimer_acknowledged),
            push_endpoint = COALESCE(${data.push_endpoint ?? null}, push_endpoint),
            push_p256dh = COALESCE(${data.push_p256dh ?? null}, push_p256dh),
            push_auth = COALESCE(${data.push_auth ?? null}, push_auth),
            push_reminder_time = COALESCE(${data.push_reminder_time ?? null}, push_reminder_time),
            updated_at = NOW()
          WHERE user_id = ${userId}
          RETURNING *
        `;
        return NextResponse.json({ data: (settings as unknown[])[0] });

      case "trade":
        const trade = await sql`
          UPDATE trades SET
            symbol = COALESCE(${data.symbol}, symbol),
            trade_type = COALESCE(${data.trade_type}, trade_type),
            asset_type = COALESCE(${data.asset_type}, asset_type),
            quantity = COALESCE(${data.quantity}, quantity),
            price = COALESCE(${data.price}, price),
            total_value = COALESCE(${data.total_value}, total_value),
            pnl = COALESCE(${data.pnl}, pnl),
            notes = COALESCE(${data.notes}, notes),
            trade_date = COALESCE(${data.trade_date}, trade_date)
          WHERE id = ${id} AND user_id = ${userId}
          RETURNING *
        `;
        return NextResponse.json({ data: (trade as unknown[])[0] });

      case "goal":
        const goalUpdate = await sql`
          UPDATE goals SET
            label = COALESCE(${data.label ?? null}, label),
            status = COALESCE(${data.status ?? null}, status),
            target = COALESCE(${data.target ?? null}, target)
          WHERE id = ${id} AND user_id = ${userId}
          RETURNING *
        `;
        return NextResponse.json({ data: (goalUpdate as unknown[])[0] });

      default:
        return NextResponse.json({ error: "Invalid type" }, { status: 400 });
    }
  } catch (error) {
    console.error("Database error:", error);
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }
}
