'use client';

/**
 * Auth Kit — useUser() hook
 *
 * Returns user profile and loading state.
 * Drop-in replacement for Clerk's useUser().
 */

import { useAuthContext } from './auth-provider';
import type { ClientUserState } from '../types';

export function useUser(): ClientUserState {
  const { user, isLoaded } = useAuthContext();
  return { user, isLoaded };
}
