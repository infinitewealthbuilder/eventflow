'use client';

/**
 * Auth Kit — SignedIn / SignedOut
 *
 * Conditional rendering based on auth state.
 * Drop-in replacements for Clerk's <SignedIn> and <SignedOut>.
 */

import { useAuth } from '../client/use-auth';

export function SignedIn({ children }: { children: React.ReactNode }) {
  const { isLoaded, isSignedIn } = useAuth();
  if (!isLoaded || !isSignedIn) return null;
  return <>{children}</>;
}

export function SignedOut({ children }: { children: React.ReactNode }) {
  const { isLoaded, isSignedIn } = useAuth();
  if (!isLoaded || isSignedIn) return null;
  return <>{children}</>;
}
