import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isPublicRoute = createRouteMatcher([
  "/",
  "/login(.*)",
  "/signup(.*)",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/forgot-password",
  "/reset-password",
  "/api/stock(.*)",
  "/api/options(.*)",
  "/api/chat(.*)",
  "/portfolio",
  "/pnl",
  "/ai",
  "/menu",
]);

const isAdminRoute = createRouteMatcher(["/admin(.*)"]);

const ADMIN_EMAIL = "gainsview@gmail.com";

export default clerkMiddleware(async (auth, req) => {
  const { userId, sessionClaims } = await auth();

  // Protect admin routes
  if (isAdminRoute(req)) {
    if (!userId) {
      const signInUrl = new URL("/login", req.url);
      signInUrl.searchParams.set("redirect_url", req.url);
      return NextResponse.redirect(signInUrl);
    }

    // Check if user is admin
    const userEmail = sessionClaims?.email as string | undefined;
    if (userEmail !== ADMIN_EMAIL) {
      return NextResponse.redirect(new URL("/", req.url));
    }
  }

  // Protect non-public routes
  if (!isPublicRoute(req) && !userId) {
    const signInUrl = new URL("/login", req.url);
    signInUrl.searchParams.set("redirect_url", req.url);
    return NextResponse.redirect(signInUrl);
  }
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
