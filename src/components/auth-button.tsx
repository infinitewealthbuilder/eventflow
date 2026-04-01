"use client";

import { UserButton } from "@/lib/auth-kit/components";

export function AuthButton() {
  return <UserButton afterSignOutUrl="/" />;
}
