import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isPublicRoute = createRouteMatcher([
  "/",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/api/webhooks(.*)",
]);

const isOnboardingRoute = createRouteMatcher(["/onboarding"]);
const isAuthRoute = createRouteMatcher(["/sign-in(.*)", "/sign-up(.*)"]);

export default clerkMiddleware(async (auth, req) => {
  const { userId, sessionClaims } = await auth();

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

  // Type-safe role extraction from Clerk session claims
  const metadata = sessionClaims?.publicMetadata as
    | { role?: string }
    | undefined;
  const role = metadata?.role;

  // If user is authenticated but on auth page, redirect to dashboard
  if (isAuthRoute(req)) {
    if (role === "PLATFORM_ADMIN") {
      return NextResponse.redirect(new URL("/admin/dashboard", req.url));
    } else if (role === "RECRUITER") {
      return NextResponse.redirect(new URL("/recruiter/dashboard", req.url));
    } else if (role === "CANDIDATE") {
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

  // If on onboarding but has role, redirect to appropriate dashboard
  if (role && isOnboardingRoute(req)) {
    if (role === "PLATFORM_ADMIN") {
      return NextResponse.redirect(new URL("/admin/dashboard", req.url));
    } else if (role === "RECRUITER") {
      return NextResponse.redirect(new URL("/recruiter/dashboard", req.url));
    } else if (role === "CANDIDATE") {
      return NextResponse.redirect(new URL("/candidate/dashboard", req.url));
    }
  }

  // Role-based access control
  const pathname = req.nextUrl.pathname;

  if (pathname.startsWith("/admin") && role !== "PLATFORM_ADMIN") {
    return NextResponse.redirect(new URL("/unauthorized", req.url));
  }

  if (pathname.startsWith("/recruiter") && role !== "RECRUITER") {
    return NextResponse.redirect(new URL("/unauthorized", req.url));
  }

  if (pathname.startsWith("/candidate") && role !== "CANDIDATE") {
    return NextResponse.redirect(new URL("/unauthorized", req.url));
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
