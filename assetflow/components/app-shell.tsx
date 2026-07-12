"use client";

import clsx from "clsx";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import type { UserRole } from "@prisma/client";
import {
  LayoutDashboard,
  Package,
  ArrowLeftRight,
  CalendarDays,
  Wrench,
  ClipboardList,
  BarChart3,
  Bell,
  Building2,
  Activity,
  LogOut,
} from "lucide-react";

const navItems = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Assets", href: "/assets", icon: Package },
  { label: "Allocations", href: "/allocations", icon: ArrowLeftRight },
  { label: "Bookings", href: "/bookings", icon: CalendarDays },
  { label: "Maintenance", href: "/maintenance", icon: Wrench },
  { label: "Audits", href: "/audits", icon: ClipboardList },
  { label: "Reports", href: "/reports", icon: BarChart3 },
  { label: "Activity", href: "/activity", icon: Activity },
] as const;

const adminNavItems = [
  { label: "Org Setup", href: "/org", icon: Building2 },
] as const;

const shelllessRoutes = ["/login", "/signup", "/forgot-password"];

const roleMeta: Record<string, { label: string; className: string }> = {
  ADMIN: { label: "Admin", className: "bg-violet text-white" },
  ASSET_MANAGER: { label: "Asset Manager", className: "bg-signal text-white" },
  DEPARTMENT_HEAD: { label: "Dept Head", className: "bg-go text-white" },
  EMPLOYEE: { label: "Employee", className: "bg-ink3 text-white" },
};

export function AppShell({ children, role }: { children: ReactNode; role: UserRole | null }) {
  const pathname = usePathname();

  if (shelllessRoutes.some((route) => pathname === route || pathname.startsWith(`${route}/`))) {
    return <>{children}</>;
  }

  const isActive = (href: string) =>
    href === "/dashboard"
      ? pathname === "/dashboard" || pathname === "/"
      : pathname === href || pathname.startsWith(`${href}/`);

  const activeRole = role ?? "EMPLOYEE";
  const userInitials = activeRole === "ADMIN" ? "AA" : "U";
  const userName = activeRole === "ADMIN" ? "Avery Admin" : "User";

  return (
    <div className="flex min-h-screen">
      {/* ── Sidebar ── */}
      <aside className="fixed inset-y-0 left-0 z-30 flex w-[240px] flex-col bg-ink">
        {/* Logo */}
        <div className="flex h-14 items-center gap-2.5 border-b border-white/10 px-5">
          <div className="flex h-7 w-7 items-center justify-center rounded bg-signal text-xs font-semibold text-white">
            AF
          </div>
          <span className="text-sm font-semibold tracking-tight text-white">AssetFlow</span>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-0.5">
          <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-widest text-white/30">
            Navigation
          </p>
          {navItems.map((item) => {
            const active = isActive(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={clsx(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                  active
                    ? "border-l-2 border-signal bg-white/15 pl-[10px] text-white"
                    : "text-white/60 hover:bg-white/10 hover:text-white"
                )}
              >
                <Icon size={16} />
                {item.label}
              </Link>
            );
          })}

          {/* Admin section - only visible to ADMIN and ASSET_MANAGER roles */}
          {(activeRole === "ADMIN" || activeRole === "ASSET_MANAGER") && (
            <>
              <hr className="my-3 border-white/10" />
              <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-widest text-white/30">
                Admin
              </p>
              {adminNavItems.map((item) => {
                const active = isActive(item.href);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={clsx(
                      "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                      active
                        ? "border-l-2 border-signal bg-white/15 pl-[10px] text-white"
                        : "text-white/60 hover:bg-white/10 hover:text-white"
                    )}
                  >
                    <Icon size={16} />
                    {item.label}
                  </Link>
                );
              })}
            </>
          )}
        </nav>

        {/* User footer */}
        <div className="border-t border-white/10 p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-signal text-xs font-semibold text-white">
              {userInitials}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-white">{userName}</p>
              <span className={clsx("mt-0.5 inline-flex rounded-full px-1.5 py-0.5 text-[10px] font-medium", roleMeta[activeRole].className)}>
                {roleMeta[activeRole].label}
              </span>
            </div>
            <button className="text-white/40 transition hover:text-white" title="Sign out">
              <LogOut size={14} />
            </button>
          </div>
        </div>
      </aside>

      {/* ── Main area ── */}
      <div className="ml-[240px] flex min-h-screen flex-1 flex-col">
        {/* Top header */}
        <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-border bg-surface px-8">
          <div className="flex items-center gap-2 text-xs text-ink3">
            <span className="text-ink font-medium">{getPageTitle(pathname)}</span>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/activity"
              className="relative flex h-8 w-8 items-center justify-center rounded-md text-ink3 transition hover:bg-sunken hover:text-ink"
            >
              <Bell size={16} />
              <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-signal" />
            </Link>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 bg-canvas px-8 py-6">{children}</main>
      </div>
    </div>
  );
}

function getPageTitle(pathname: string): string {
  if (pathname === "/" || pathname === "/dashboard") return "Dashboard";
  if (pathname.startsWith("/assets")) return "Asset Registry";
  if (pathname.startsWith("/allocations")) return "Allocation & Transfer";
  if (pathname.startsWith("/bookings")) return "Resource Booking";
  if (pathname.startsWith("/maintenance")) return "Maintenance";
  if (pathname.startsWith("/audits")) return "Audits";
  if (pathname.startsWith("/reports")) return "Reports & Analytics";
  if (pathname.startsWith("/activity")) return "Activity & Notifications";
  if (pathname.startsWith("/org")) return "Organization Setup";
  return "AssetFlow";
}
