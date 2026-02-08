import { auth } from "@clerk/nextjs/server";
import { neon } from "@neondatabase/serverless";
import { NextResponse } from "next/server";
import { pushSubscriptionSchema, validateInput } from "@/lib/validations";

export async function POST(req: Request) {
  const { userId: clerkId } = await auth();
  if (!clerkId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const DATABASE_URL = process.env.DATABASE_URL;
  if (!DATABASE_URL) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }

  const sql = neon(DATABASE_URL);

  try {
    const body = await req.json();

    const validation = validateInput(pushSubscriptionSchema, body);
    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const { subscription, reminder_time } = validation.data;

    const userResult = await sql`SELECT id FROM users WHERE clerk_id = ${clerkId}`;
    const userId = userResult[0]?.id;
    if (!userId) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    await sql`
      UPDATE user_settings SET
        notifications_enabled = true,
        push_endpoint = ${subscription.endpoint},
        push_p256dh = ${subscription.keys.p256dh},
        push_auth = ${subscription.keys.auth},
        push_reminder_time = ${reminder_time || '16:15'},
        updated_at = NOW()
      WHERE user_id = ${userId}
    `;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Subscribe error:", error);
    return NextResponse.json({ error: "Failed to subscribe" }, { status: 500 });
  }
}
