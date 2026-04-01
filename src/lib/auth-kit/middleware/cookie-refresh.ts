/**
 * Auth Kit — Cookie Refresh
 *
 * Core middleware logic: creates a Supabase server client in the middleware context,
 * validates the session, and refreshes cookies on the response.
 *
 * This is the @supabase/ssr middleware pattern that replaces Clerk's session management.
 */

import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { getSupabaseUrl, getSupabaseAnonKey } from '../config';
import type { AuthContext } from '../types';

interface RefreshResult {
  response: NextResponse;
  auth: AuthContext | null;
}

export function refreshSession(
  req: NextRequest,
  res: NextResponse = NextResponse.next({ request: req }),
): Promise<RefreshResult> {
  // Create a Supabase client that reads cookies from the request
  // and writes updated cookies to the response.
  const supabase = createServerClient(getSupabaseUrl(), getSupabaseAnonKey(), {
    cookies: {
      getAll() {
        return req.cookies.getAll();
      },
      setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
        // Set cookies on the request (for downstream server code)
        cookiesToSet.forEach(({ name, value }) => {
          req.cookies.set(name, value);
        });
        // Set cookies on the response (for the browser)
        cookiesToSet.forEach(({ name, value, options }) => {
          res.cookies.set(name, value, options as Parameters<typeof res.cookies.set>[2]);
        });
      },
    },
  });

  // getUser() validates the JWT server-side and refreshes the token if needed.
  // This is more secure than getSession() which only decodes the JWT locally.
  return supabase.auth.getUser().then(({ data: { user } }) => {
    if (!user) {
      return { response: res, auth: null };
    }

    const meta = user.user_metadata ?? {};

    return {
      response: res,
      auth: {
        userId: user.id,
        tenantId: (meta.tenant_id as string) || user.id,
        role: (meta.role as string) || undefined,
        email: user.email,
        firstName: meta.first_name as string | undefined,
        lastName: meta.last_name as string | undefined,
        avatar: meta.avatar_url as string | undefined,
        sessionId: null,
      },
    };
  });
}
