/**
 * Auth Kit — Middleware Factory
 *
 * Creates a composable Next.js middleware that handles:
 * 1. Static asset skipping
 * 2. Pre-auth hooks (tenant resolution, custom headers)
 * 3. Public route matching
 * 4. Session cookie refresh via @supabase/ssr
 * 5. Auth check + redirect for unauthenticated users
 * 6. Post-auth hooks (role checks, membership validation)
 * 7. Header injection (x-user-id, x-tenant-id)
 *
 * Each project customizes behavior via onBeforeAuth / onAfterAuth hooks.
 */

import { NextResponse, type NextRequest } from 'next/server';
import type { AuthMiddlewareConfig } from '../types';
import { createRouteMatcher } from './route-matcher';
import { refreshSession } from './cookie-refresh';

export function createAuthMiddleware(config: AuthMiddlewareConfig) {
  const isPublicRoute = createRouteMatcher(config.publicRoutes);
  const signInUrl = config.signInUrl || '/sign-in';

  return async function middleware(req: NextRequest): Promise<NextResponse> {
    // --- Pre-auth hook ---
    if (config.onBeforeAuth) {
      const hookResponse = await config.onBeforeAuth(req);
      if (hookResponse) return hookResponse;
    }

    // --- Public routes: refresh cookie but don't require auth ---
    if (isPublicRoute(req)) {
      const { response } = await refreshSession(req);
      return response;
    }

    // --- Protected routes: refresh cookie and validate ---
    const { response: refreshedResponse, auth } = await refreshSession(req);

    if (!auth) {
      // Custom unauthenticated handler
      if (config.onUnauthenticated) {
        const hookResponse = await config.onUnauthenticated(req);
        if (hookResponse) return hookResponse;
      }

      // Default: redirect to sign-in
      const redirectUrl = new URL(signInUrl, req.url);
      redirectUrl.searchParams.set('redirect_url', req.nextUrl.pathname + req.nextUrl.search);
      return NextResponse.redirect(redirectUrl);
    }

    // --- Post-auth hook ---
    if (config.onAfterAuth) {
      const hookResponse = await config.onAfterAuth(req, auth);
      if (hookResponse) return hookResponse;
    }

    // --- Inject auth context into request headers for downstream code ---
    refreshedResponse.headers.set('x-user-id', auth.userId);
    refreshedResponse.headers.set('x-tenant-id', auth.tenantId);
    if (auth.role) refreshedResponse.headers.set('x-user-role', auth.role);
    if (auth.email) refreshedResponse.headers.set('x-user-email', auth.email);

    return refreshedResponse;
  };
}
