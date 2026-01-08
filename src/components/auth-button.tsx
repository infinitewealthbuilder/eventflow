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
        className="rounded-md bg-[#F5E6A3] px-3 py-2 text-sm font-medium text-[#090909] hover:bg-[#D9B01C]"
      >
        Sign In (Auth Disabled)
      </Link>
    );
  }

  return <UserButton afterSignOutUrl="/" />;
}
