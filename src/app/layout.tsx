import type { Metadata } from "next";
import { ConditionalClerkProvider } from "@/lib/auth";
import "./globals.css";

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
    <ConditionalClerkProvider>
      <html lang="en">
        <body className="font-sans antialiased">{children}</body>
      </html>
    </ConditionalClerkProvider>
  );
}
