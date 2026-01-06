import type { Metadata } from "next";
import { ConditionalClerkProvider } from "@/lib/auth";
import "./globals.css";

// Force dynamic rendering for the entire app to avoid Clerk context issues
// during static page generation when Clerk is not configured
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "EventFlow - Cross-Post Events Everywhere",
  description: "Create events once, publish to 9+ platforms automatically",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ConditionalClerkProvider>
      <html lang="en">
        <body className="font-sans antialiased">{children}</body>
      </html>
    </ConditionalClerkProvider>
  );
}
