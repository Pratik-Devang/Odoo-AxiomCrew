import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { AppShell } from "@/components/app-shell";
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
  return (
    <html lang="en" className={`h-full ${inter.variable}`}>
      <body className="min-h-full font-sans bg-canvas text-ink antialiased">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
