import { auth, clerkClient } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const ADMIN_EMAIL = "gainsview@gmail.com";

export async function GET() {
  try {
    const { userId, sessionClaims } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is admin (case-insensitive email comparison)
    const userEmail = sessionClaims?.email as string | undefined;
    if (!userEmail || userEmail.toLowerCase() !== ADMIN_EMAIL.toLowerCase()) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Fetch all users from Clerk
    const client = await clerkClient();
    const usersResponse = await client.users.getUserList({
      limit: 100,
      orderBy: "-created_at",
    });

    // Map to simpler format
    const users = usersResponse.data.map((user) => ({
      id: user.id,
      emailAddresses: user.emailAddresses.map((e) => ({ emailAddress: e.emailAddress })),
      firstName: user.firstName,
      lastName: user.lastName,
      imageUrl: user.imageUrl,
      createdAt: user.createdAt,
      lastSignInAt: user.lastSignInAt,
      externalAccounts: user.externalAccounts.map((e) => ({ provider: e.provider })),
    }));

    return NextResponse.json({ users });
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
