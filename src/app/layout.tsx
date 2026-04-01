import type { Metadata } from "next";
import { AuthProvider } from "@/lib/auth-kit/client";
import "./globals.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "EventFlow - Cross-Post Events Everywhere",
  description: "Create events once, publish to 9+ platforms automatically",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
