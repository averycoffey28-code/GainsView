import { neon } from "@neondatabase/serverless";
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import webpush from "web-push";

export async function POST() {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const DATABASE_URL = process.env.DATABASE_URL;
  const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY;
  const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY;

  if (!DATABASE_URL || !VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
    return NextResponse.json({
      error: "Push notifications not available"
    }, { status: 500 });
  }

  webpush.setVapidDetails(
    "mailto:gainsview@gmail.com",
    VAPID_PUBLIC_KEY,
    VAPID_PRIVATE_KEY
  );

  const sql = neon(DATABASE_URL);

  try {
    // Get the current user's push subscription
    const users = await sql`
      SELECT us.push_endpoint, us.push_p256dh, us.push_auth, us.notifications_enabled, u.email
      FROM user_settings us
      JOIN users u ON us.user_id = u.id
      WHERE u.clerk_id = ${userId}
    `;

    if (!users || users.length === 0) {
      return NextResponse.json({
        error: "No user settings found",
        help: "Visit the Menu page to enable notifications first"
      }, { status: 404 });
    }

    const user = users[0] as {
      push_endpoint: string | null;
      push_p256dh: string | null;
      push_auth: string | null;
      notifications_enabled: boolean;
      email: string;
    };

    if (!user.notifications_enabled) {
      return NextResponse.json({
        error: "Notifications not enabled",
        help: "Enable notifications in Menu → Preferences → Notifications"
      }, { status: 400 });
    }

    if (!user.push_endpoint || !user.push_p256dh || !user.push_auth) {
      return NextResponse.json({
        error: "Push subscription incomplete",
        help: "Try disabling and re-enabling notifications in Menu"
      }, { status: 400 });
    }

    const payload = JSON.stringify({
      title: "GainsView Test",
      body: "Notifications are working! You'll receive reminders to log your trades.",
      url: "/pnl",
    });

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

      return NextResponse.json({
        success: true,
        message: "Test notification sent!"
      });
    } catch (pushError: unknown) {
      const error = pushError as { statusCode?: number; message?: string };

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

        return NextResponse.json({
          error: "Push subscription expired",
          help: "Please re-enable notifications in Menu → Preferences"
        }, { status: 410 });
      }

      return NextResponse.json({
        error: "Failed to send push notification"
      }, { status: 500 });
    }
  } catch (error) {
    console.error("Test notification error:", error);
    return NextResponse.json({
      error: "Failed to send test notification"
    }, { status: 500 });
  }
}
