import type { Metadata } from "next";
import { AppShell } from "@/components/app-shell";
import { getSession } from "@/lib/auth";
import "./globals.css";

export const metadata: Metadata = {
  title: "AssetFlow",
  description: "Asset management, allocation, and maintenance.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const session = getSession();

  return (
    <html lang="en" className="h-full">
      <body className="min-h-full font-sans">
        <AppShell role={session?.role ?? null}>{children}</AppShell>
      </body>
    </html>
  );
}
