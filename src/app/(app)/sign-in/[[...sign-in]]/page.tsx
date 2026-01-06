"use client";

import dynamic from "next/dynamic";
import { isClerkConfigured } from "@/lib/auth";
import Link from "next/link";

const SignIn = dynamic(
  () => import("@clerk/nextjs").then((mod) => mod.SignIn),
  { ssr: false }
);

export default function SignInPage() {
  if (!isClerkConfigured()) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-gray-50">
        <p className="text-gray-600">Authentication is not configured</p>
        <Link href="/" className="text-indigo-600 hover:underline">
          Return Home
        </Link>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <SignIn />
    </div>
  );
}
