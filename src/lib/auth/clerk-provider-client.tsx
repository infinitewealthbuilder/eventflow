"use client";

import { ClerkProvider } from "@clerk/nextjs";
import { ReactNode } from "react";

/**
 * Client-side Clerk provider wrapper.
 * This is only imported when Clerk is configured.
 */
export function ClerkProviderClient({ children }: { children: ReactNode }) {
  return <ClerkProvider>{children}</ClerkProvider>;
}
