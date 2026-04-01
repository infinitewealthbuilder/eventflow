import { createAuthMiddleware } from "@/lib/auth-kit/middleware";

export default createAuthMiddleware({
  publicRoutes: [
    "/",
    "/sign-in(.*)",
    "/sign-up(.*)",
    "/forgot-password",
    "/reset-password",
    "/api/webhooks(.*)",
    "/api/auth/callback",
  ],
  signInUrl: "/sign-in",
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
