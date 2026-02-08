import { neon } from "@neondatabase/serverless";
import { NextResponse } from "next/server";
import webpush from "web-push";

export async function POST(req: Request) {
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const DATABASE_URL = process.env.DATABASE_URL;
  const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY;
  const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY;

  if (!DATABASE_URL || !VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
    return NextResponse.json({ error: "Server not configured" }, { status: 500 });
  }

  webpush.setVapidDetails(
    "mailto:gainsview@gmail.com",
    VAPID_PUBLIC_KEY,
    VAPID_PRIVATE_KEY
  );

  const sql = neon(DATABASE_URL);

  try {
    // On Hobby plan the cron runs once daily (weekdays 4:15 PM ET),
    // so we send to all enabled users regardless of their reminder_time.
    const users = await sql`
      SELECT push_endpoint, push_p256dh, push_auth
      FROM user_settings
      WHERE notifications_enabled = true
        AND push_endpoint IS NOT NULL
    `;

    const payload = JSON.stringify({
      title: "GainsView Reminder",
      body: "Time to log your trades! Track your P&L while it's fresh.",
      url: "/pnl",
    });

    let sent = 0;
    let failed = 0;

    const results = await Promise.allSettled(
      (users as unknown as { push_endpoint: string; push_p256dh: string; push_auth: string }[]).map(
        async (user) => {
          try {
            await webpush.sendNotification(
              {
                endpoint: user.push_endpoint,
                keys: {
                  p256dh: user.push_p256dh,
                  auth: user.push_auth,
                },
              },
              payload
            );
            sent++;
          } catch (err: unknown) {
            const error = err as { statusCode?: number };
            if (error.statusCode === 410 || error.statusCode === 404) {
              // Subscription expired — clean up
              await sql`
                UPDATE user_settings SET
                  notifications_enabled = false,
                  push_endpoint = NULL,
                  push_p256dh = NULL,
                  push_auth = NULL,
                  updated_at = NOW()
                WHERE push_endpoint = ${user.push_endpoint}
              `;
            }
            failed++;
          }
        }
      )
    );

    return NextResponse.json({
      success: true,
      sent,
      failed,
      total: results.length,
    });
  } catch (error) {
    console.error("Send notifications error:", error);
    return NextResponse.json({ error: "Failed to send notifications" }, { status: 500 });
  }
}
