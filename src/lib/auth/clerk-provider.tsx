import { ReactNode } from "react";

const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

/**
 * Check if Clerk is configured with valid credentials
 */
export function isClerkConfigured(): boolean {
  return Boolean(publishableKey);
}

/**
 * Conditional Clerk provider that only wraps children with ClerkProvider
 * when valid Clerk credentials are configured. This allows building and
 * running the app without Clerk for development/CI purposes.
 *
 * NOTE: This is a server component that conditionally imports the client
 * wrapper only when Clerk is configured, avoiding Clerk imports during
 * static page generation.
 */
export async function ConditionalClerkProvider({ children }: { children: ReactNode }) {
  // If no publishable key, render children without Clerk
  if (!publishableKey) {
    return <>{children}</>;
  }

  // Dynamically import the Clerk provider wrapper only when configured
  const { ClerkProviderClient } = await import("./clerk-provider-client");
  return <ClerkProviderClient>{children}</ClerkProviderClient>;
}
