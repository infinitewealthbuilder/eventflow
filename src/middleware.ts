import { NextResponse, NextRequest } from "next/server";

// Check if Clerk is configured at build/startup time
const isClerkConfigured = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);

// Middleware function
export default async function middleware(request: NextRequest) {
  // If Clerk is not configured, allow all requests
  if (!isClerkConfigured) {
    return NextResponse.next();
  }

  // Dynamically import Clerk middleware only when needed
  const { clerkMiddleware, createRouteMatcher } = await import("@clerk/nextjs/server");

  const isPublicRoute = createRouteMatcher([
    "/",
    "/sign-in(.*)",
    "/sign-up(.*)",
    "/api/webhooks(.*)",
  ]);

  // Create and run Clerk middleware
  const middleware = clerkMiddleware(async (auth, req) => {
    if (!isPublicRoute(req)) {
      await auth.protect();
    }
  });

  return middleware(request, {} as never);
}

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
