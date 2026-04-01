/**
 * Auth Kit — Server Client
 *
 * Creates a Supabase server client that reads auth from cookies.
 * Respects RLS via auth.uid(). Use this for all tenant-scoped queries.
 */

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { getSupabaseUrl, getSupabaseAnonKey } from '../config';

export async function createAuthClient() {
  const cookieStore = await cookies();

  return createServerClient(getSupabaseUrl(), getSupabaseAnonKey(), {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options as Parameters<typeof cookieStore.set>[2]),
          );
        } catch {
          // Cookies can only be modified in Server Actions or Route Handlers.
          // This is expected when called from Server Components.
        }
      },
    },
  });
}
