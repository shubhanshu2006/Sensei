import { clerkMiddleware, createRouteMatcher, clerkClient } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isPublicRoute = createRouteMatcher([
  "/",
  "/about(.*)",
  "/contact(.*)",
  "/privacy(.*)",
  "/terms(.*)",
  "/refund(.*)",
  "/shipping(.*)",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/api/webhooks(.*)",
]);

const isOnboardingRoute = createRouteMatcher(["/onboarding"]);
const isAuthRoute = createRouteMatcher(["/sign-in(.*)", "/sign-up(.*)"]);

export default clerkMiddleware(async (auth, req) => {
  const { userId, sessionClaims } = await auth();

  // If user is authenticated and visits the landing page (/), redirect directly to dashboard
  if (userId && req.nextUrl.pathname === "/") {
    const claims = sessionClaims as any;
    let role =
      claims?.role ||
      claims?.publicMetadata?.role ||
      claims?.public_metadata?.role ||
      claims?.metadata?.role;

    if (!role) {
      try {
        const client = await clerkClient();
        const user = await client.users.getUser(userId);
        role = (user.publicMetadata as { role?: string } | undefined)?.role;
      } catch (e) {
        console.error("Middleware failed to fetch user metadata from Clerk:", e);
      }
    }

    if (role === "PLATFORM_ADMIN") {
      return NextResponse.redirect(new URL("/admin/dashboard", req.url));
    }
    return NextResponse.redirect(new URL("/candidate/dashboard", req.url));
  }

  // Public routes - allow access
  if (isPublicRoute(req)) {
    return NextResponse.next();
  }

  // Protected routes - require authentication
  if (!userId) {
    const signInUrl = new URL("/sign-in", req.url);
    signInUrl.searchParams.set("redirect_url", req.url);
    return NextResponse.redirect(signInUrl);
  }

  // Extract role from session claims (checks direct role, publicMetadata, and metadata)
  const claims = sessionClaims as any;
  let role =
    claims?.role ||
    claims?.publicMetadata?.role ||
    claims?.public_metadata?.role ||
    claims?.metadata?.role;

  // Fallback: If sessionClaims doesn't have role, fetch directly via clerkClient
  if (!role && userId) {
    try {
      const client = await clerkClient();
      const user = await client.users.getUser(userId);
      role = (user.publicMetadata as { role?: string } | undefined)?.role;
    } catch (e) {
      console.error("Middleware failed to fetch user metadata from Clerk:", e);
    }
  }

  console.log(`[Middleware] Path: ${req.nextUrl.pathname} | User: ${userId} | Role: ${role}`);

  // If user is authenticated but on auth page, redirect to dashboard
  if (isAuthRoute(req)) {
    if (role === "PLATFORM_ADMIN") {
      return NextResponse.redirect(new URL("/admin/dashboard", req.url));
    } else if (role === "CANDIDATE" || role === "RECRUITER") {
      return NextResponse.redirect(new URL("/candidate/dashboard", req.url));
    } else {
      // No role set, redirect to onboarding
      return NextResponse.redirect(new URL("/onboarding", req.url));
    }
  }

  // Check if user has completed onboarding (has a role)
  if (!role && !isOnboardingRoute(req)) {
    // User hasn't completed onboarding, redirect to onboarding
    return NextResponse.redirect(new URL("/onboarding", req.url));
  }

  // Normalize role
  const roleUpper = typeof role === "string" ? role.toUpperCase() : "";
  const isAdmin =
    roleUpper === "PLATFORM_ADMIN" ||
    roleUpper === "ADMIN" ||
    roleUpper === "SUPER_ADMIN";

  // If on onboarding but has role, redirect to appropriate dashboard
  if (role && isOnboardingRoute(req)) {
    if (isAdmin) {
      return NextResponse.redirect(new URL("/admin/dashboard", req.url));
    } else {
      return NextResponse.redirect(new URL("/candidate/dashboard", req.url));
    }
  }

  // Role-based access control
  const pathname = req.nextUrl.pathname;

  // Protect admin routes: only platform admins allowed
  if (pathname.startsWith("/admin")) {
    if (!isAdmin) {
      return NextResponse.redirect(new URL("/unauthorized", req.url));
    }
    return NextResponse.next();
  }

  // Unwire recruiter portal: automatically redirect to candidate dashboard
  if (pathname.startsWith("/recruiter")) {
    return NextResponse.redirect(new URL("/candidate/dashboard", req.url));
  }

  // Candidate routes:
  if (pathname.startsWith("/candidate")) {
    // If admin lands on candidate dashboard, route them to admin dashboard
    if (isAdmin) {
      if (pathname === "/candidate/dashboard") {
        return NextResponse.redirect(new URL("/admin/dashboard", req.url));
      }
      // Allow admins to view candidate pages (practice, etc.)
      return NextResponse.next();
    }

    if (roleUpper !== "CANDIDATE" && roleUpper !== "RECRUITER") {
      return NextResponse.redirect(new URL("/unauthorized", req.url));
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
