"use client";

import { ClerkProvider as BaseClerkProvider } from "@clerk/nextjs";
import { ReactNode } from "react";

const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

/**
 * Conditional Clerk provider that only wraps children with ClerkProvider
 * when valid Clerk credentials are configured. This allows building and
 * running the app without Clerk for development/CI purposes.
 */
export function ConditionalClerkProvider({ children }: { children: ReactNode }) {
  // If no publishable key, render children without Clerk
  if (!publishableKey) {
    return <>{children}</>;
  }

  return <BaseClerkProvider>{children}</BaseClerkProvider>;
}

/**
 * Check if Clerk is configured with valid credentials
 */
export function isClerkConfigured(): boolean {
  return Boolean(publishableKey);
}
