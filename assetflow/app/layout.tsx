import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { AppShell } from "@/components/app-shell";
import { getSession } from "@/lib/auth";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "AssetFlow — Enterprise Asset Management",
  description: "Enterprise asset management, allocation, maintenance, and audit platform.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const session = getSession();

  return (
<<<<<<< HEAD
    <html lang="en" className={`h-full ${inter.variable}`}>
      <body className="min-h-full font-sans bg-canvas text-ink antialiased">
        <AppShell>{children}</AppShell>
=======
    <html lang="en" className="h-full">
      <body className="min-h-full font-sans">
        <AppShell role={session?.role ?? null}>{children}</AppShell>
>>>>>>> 79ff05dcf327b3c43cd4f1151af24d95bb3d8b7e
      </body>
    </html>
  );
}
