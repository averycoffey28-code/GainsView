import { Webhook } from "svix";
import { headers } from "next/headers";
import { WebhookEvent } from "@clerk/nextjs/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: Request) {
  // Get the webhook secret from environment
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;

  if (!WEBHOOK_SECRET) {
    console.error("Missing CLERK_WEBHOOK_SECRET");
    return new Response("Missing webhook secret", { status: 500 });
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

  // Get Supabase admin client
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    console.error("Supabase not configured");
    return new Response("Database not configured", { status: 500 });
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey);

  // Handle the webhook event
  const eventType = evt.type;

  if (eventType === "user.created" || eventType === "user.updated") {
    const { id, email_addresses, first_name, last_name, image_url } = evt.data;

    const email = email_addresses?.[0]?.email_address;
    const name = [first_name, last_name].filter(Boolean).join(" ") || null;

    if (!email) {
      return new Response("No email found", { status: 400 });
    }

    // Upsert user in Supabase
    const { error } = await supabase.from("users").upsert(
      {
        clerk_id: id,
        email: email,
        name: name,
        avatar_url: image_url || null,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: "clerk_id",
      }
    );

    if (error) {
      console.error("Error upserting user:", error);
      return new Response("Database error", { status: 500 });
    }

    // Create default settings for new users
    if (eventType === "user.created") {
      const { data: userData } = await supabase
        .from("users")
        .select("id")
        .eq("clerk_id", id)
        .single();

      if (userData) {
        await supabase.from("user_settings").insert({
          user_id: userData.id,
          theme: "dark",
          default_contracts: 1,
          notifications_enabled: true,
        });
      }
    }
  }

  if (eventType === "user.deleted") {
    const { id } = evt.data;

    // Delete user from Supabase (cascade will handle related data)
    const { error } = await supabase.from("users").delete().eq("clerk_id", id);

    if (error) {
      console.error("Error deleting user:", error);
      return new Response("Database error", { status: 500 });
    }
  }

  return new Response("Webhook processed", { status: 200 });
}
