"use client";

import dynamic from "next/dynamic";
import { isClerkConfigured } from "@/lib/auth";
import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";

const SignUp = dynamic(
  () => import("@clerk/nextjs").then((mod) => mod.SignUp),
  { ssr: false }
);

export default function SignUpPage() {
  if (!isClerkConfigured()) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Header variant="minimal" showAuth={false} />
        <main className="flex-1 flex flex-col items-center justify-center gap-4">
          <p className="text-gray-600">Authentication is not configured</p>
          <Link href="/" className="text-[#D9B01C] hover:underline">
            Return Home
          </Link>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header variant="minimal" showAuth={false} />
      <main className="flex-1 flex items-center justify-center py-12">
        <SignUp />
      </main>
      <Footer />
    </div>
  );
}
