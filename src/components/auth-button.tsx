"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { isClerkConfigured } from "@/lib/auth";

// Dynamically import UserButton to avoid loading Clerk during static generation
const UserButton = dynamic(
  () => import("@clerk/nextjs").then((mod) => mod.UserButton),
  { ssr: false }
);

/**
 * Auth button that shows Clerk's UserButton when configured,
 * or a placeholder sign-in link when Clerk is not available.
 */
export function AuthButton() {
  if (!isClerkConfigured()) {
    return (
      <Link
        href="/sign-in"
        className="rounded-md bg-gray-100 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200"
      >
        Sign In (Auth Disabled)
      </Link>
    );
  }

  return <UserButton afterSignOutUrl="/" />;
}
