/**
 * Auth Kit — getAuth()
 *
 * Primary server-side auth function. Works in Server Components, API routes, Server Actions.
 * Uses supabase.auth.getUser() which validates the JWT against the server (not just decoding).
 */

import { createAuthClient } from './client';
import type { AuthContext } from '../types';

export async function getAuth(): Promise<AuthContext | null> {
  const supabase = await createAuthClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) return null;

  const meta = user.user_metadata ?? {};
  const appMeta = user.app_metadata ?? {};

  return {
    userId: user.id,
    tenantId: (meta.tenant_id as string) || user.id,
    role: (meta.role as string) || (appMeta.role as string) || undefined,
    email: user.email,
    firstName: meta.first_name as string | undefined,
    lastName: meta.last_name as string | undefined,
    avatar: meta.avatar_url as string | undefined,
    sessionId: null,
  };
}
