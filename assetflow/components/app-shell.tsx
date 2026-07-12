"use client";

import clsx from "clsx";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import type { UserRole } from "@prisma/client";

const navItems: Array<{ label: string; href: string; roles?: UserRole[] }> = [
  { label: "Dashboard", href: "/" },
  { label: "Organization Setup", href: "/organization-setup", roles: ["ADMIN"] },
  { label: "Assets", href: "/assets" },
  { label: "Allocation & Transfer", href: "/allocation-transfer" },
  { label: "Resource Booking", href: "/resource-booking" },
  { label: "Maintenance", href: "/maintenance" },
  { label: "Audit", href: "/audit" },
  { label: "Reports", href: "/reports" },
  { label: "Notifications", href: "/notifications" },
] as const;

const shelllessRoutes = ["/login", "/signup", "/forgot-password"];

export function AppShell({ children, role }: { children: ReactNode; role: UserRole | null }) {
  const pathname = usePathname();

  if (shelllessRoutes.some((route) => pathname === route || pathname.startsWith(`${route}/`))) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-af-background p-4 sm:p-6">
      <div className="mx-auto flex min-h-[calc(100vh-3rem)] max-w-[1600px] gap-5">
        <aside className="w-[220px] shrink-0 py-2">
          <div className="px-3 pb-7 text-sm font-bold tracking-wide text-white">
            AssetFlow
          </div>

          <nav aria-label="Primary navigation" className="space-y-1">
            {navItems.filter((item) => !item.roles || (role && item.roles.includes(role))).map((item) => {
              const isActive =
                item.href === "/"
                  ? pathname === "/"
                  : pathname === item.href || pathname.startsWith(`${item.href}/`);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={isActive ? "page" : undefined}
                  className={clsx(
                    "block rounded-md border px-3 py-2.5 text-sm transition-colors",
                    isActive
                      ? "border-green-500/50 bg-af-green text-green-400"
                      : "border-transparent text-gray-400 hover:bg-af-panel hover:text-gray-100",
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </aside>

        <main className="af-panel min-w-0 flex-1 p-7 sm:p-10">{children}</main>
      </div>
    </div>
  );
}
