import { auth } from "@clerk/nextjs/server";
import { neon } from "@neondatabase/serverless";
import { NextResponse } from "next/server";

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
  const {
    trading_preference,
    experience_level,
    default_contracts,
    risk_acknowledged,
    onboarding_completed,
  } = body;

  try {
    // Get user ID from clerk_id
    const userResult = await sql`SELECT id FROM users WHERE clerk_id = ${clerkId}`;

    if (!userResult[0]?.id) {
      // Create user if doesn't exist
      const newUserResult = await sql`
        INSERT INTO users (clerk_id, email, name)
        VALUES (${clerkId}, '', '')
        ON CONFLICT (clerk_id) DO UPDATE SET updated_at = NOW()
        RETURNING id
      `;

      if (!newUserResult[0]?.id) {
        return NextResponse.json({ error: "Failed to create user" }, { status: 500 });
      }
    }

    const userId = userResult[0]?.id || (await sql`SELECT id FROM users WHERE clerk_id = ${clerkId}`)[0]?.id;

    // Upsert user settings with onboarding data
    const settings = await sql`
      INSERT INTO user_settings (
        user_id,
        trading_preference,
        experience_level,
        default_contracts,
        risk_acknowledged,
        onboarding_completed
      )
      VALUES (
        ${userId},
        ${trading_preference || null},
        ${experience_level || null},
        ${default_contracts || 1},
        ${risk_acknowledged || false},
        ${onboarding_completed || false}
      )
      ON CONFLICT (user_id) DO UPDATE SET
        trading_preference = COALESCE(${trading_preference}, user_settings.trading_preference),
        experience_level = COALESCE(${experience_level}, user_settings.experience_level),
        default_contracts = COALESCE(${default_contracts}, user_settings.default_contracts),
        risk_acknowledged = COALESCE(${risk_acknowledged}, user_settings.risk_acknowledged),
        onboarding_completed = COALESCE(${onboarding_completed}, user_settings.onboarding_completed),
        updated_at = NOW()
      RETURNING *
    `;

    return NextResponse.json({ data: settings[0], success: true });
  } catch (error) {
    console.error("Onboarding error:", error);
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }
}

export async function GET() {
  const { userId: clerkId } = await auth();
  if (!clerkId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const DATABASE_URL = process.env.DATABASE_URL;
  if (!DATABASE_URL) {
    return NextResponse.json({ error: "Database not configured" }, { status: 500 });
  }

  const sql = neon(DATABASE_URL);

  try {
    const result = await sql`
      SELECT us.* FROM user_settings us
      JOIN users u ON us.user_id = u.id
      WHERE u.clerk_id = ${clerkId}
    `;

    return NextResponse.json({
      data: result[0] || null,
      onboarding_completed: result[0]?.onboarding_completed || false
    });
  } catch (error) {
    console.error("Get onboarding status error:", error);
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }
}
