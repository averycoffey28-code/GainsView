import { Webhook } from "svix";
import { headers } from "next/headers";
import { WebhookEvent } from "@clerk/nextjs/server";
import { neon } from "@neondatabase/serverless";

export async function POST(req: Request) {
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;
  const DATABASE_URL = process.env.DATABASE_URL;

  if (!WEBHOOK_SECRET) {
    console.error("Missing CLERK_WEBHOOK_SECRET");
    return new Response("Missing webhook secret", { status: 500 });
  }

  if (!DATABASE_URL) {
    console.error("Missing DATABASE_URL");
    return new Response("Database not configured", { status: 500 });
  }

  // Get the headers
  const headerPayload = await headers();
  const svix_id = headerPayload.get("svix-id");
  const svix_timestamp = headerPayload.get("svix-timestamp");
  const svix_signature = headerPayload.get("svix-signature");

  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response("Missing svix headers", { status: 400 });
  }

  // Get the body
  const payload = await req.json();
  const body = JSON.stringify(payload);

  // Verify the webhook
  const wh = new Webhook(WEBHOOK_SECRET);
  let evt: WebhookEvent;

  try {
    evt = wh.verify(body, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    }) as WebhookEvent;
  } catch (err) {
    console.error("Webhook verification failed:", err);
    return new Response("Webhook verification failed", { status: 400 });
  }

  const sql = neon(DATABASE_URL);
  const eventType = evt.type;

  try {
    if (eventType === "user.created") {
      const { id, email_addresses, first_name, last_name, image_url } = evt.data;
      const email = email_addresses?.[0]?.email_address;
      const name = [first_name, last_name].filter(Boolean).join(" ") || null;

      if (!email) {
        return new Response("No email found", { status: 400 });
      }

      // Insert new user
      await sql`
        INSERT INTO users (clerk_id, email, name, avatar_url)
        VALUES (${id}, ${email}, ${name}, ${image_url || null})
        ON CONFLICT (clerk_id) DO UPDATE SET
          email = ${email},
          name = ${name},
          avatar_url = ${image_url || null},
          updated_at = NOW()
      `;

      // Create default settings
      const user = await sql`SELECT id FROM users WHERE clerk_id = ${id}`;
      if (user[0]) {
        await sql`
          INSERT INTO user_settings (user_id)
          VALUES (${user[0].id})
          ON CONFLICT (user_id) DO NOTHING
        `;
      }
    }

    if (eventType === "user.updated") {
      const { id, email_addresses, first_name, last_name, image_url } = evt.data;
      const email = email_addresses?.[0]?.email_address;
      const name = [first_name, last_name].filter(Boolean).join(" ") || null;

      await sql`
        UPDATE users SET
          email = ${email},
          name = ${name},
          avatar_url = ${image_url || null},
          updated_at = NOW()
        WHERE clerk_id = ${id}
      `;
    }

    if (eventType === "user.deleted") {
      const { id } = evt.data;
      await sql`DELETE FROM users WHERE clerk_id = ${id}`;
    }

    return new Response("Webhook processed", { status: 200 });
  } catch (error) {
    console.error("Database error:", error);
    return new Response("Database error", { status: 500 });
  }
}
