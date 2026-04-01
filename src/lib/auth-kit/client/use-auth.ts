'use client';

/**
 * Auth Kit — useAuth() hook
 *
 * Returns auth state: userId, tenantId, role, isSignedIn, isLoaded.
 * Drop-in replacement for Clerk's useAuth().
 */

import { useAuthContext } from './auth-provider';
import type { ClientAuthState } from '../types';

export function useAuth(): ClientAuthState {
  const { userId, tenantId, role, email, isLoaded, isSignedIn } = useAuthContext();
  return { userId, tenantId, role, email, isLoaded, isSignedIn };
}
