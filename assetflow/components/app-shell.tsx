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
  Zap,
  LogOut,
} from "lucide-react";

const navItems = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Assets", href: "/assets", icon: Package },
  { label: "Allocations", href: "/allocations", icon: ArrowLeftRight },
  { label: "Resource Booking", href: "/resource-booking", icon: CalendarDays },
  { label: "Maintenance", href: "/maintenance", icon: Wrench },
  { label: "Audits", href: "/audits", icon: ClipboardList },
  { label: "Reports", href: "/reports", icon: BarChart3 },
  { label: "Notifications", href: "/notifications", icon: Bell },
] as const;

const adminNavItems = [
  { label: "Org Setup", href: "/org", icon: Building2 },
] as const;

const roleMeta: Record<string, { label: string; chipClass: string }> = {
  ADMIN:           { label: "Admin",         chipClass: "border-signal bg-signal text-white" },
  ASSET_MANAGER:   { label: "Asset Manager", chipClass: "border-go    bg-go    text-white" },
  DEPARTMENT_HEAD: { label: "Dept Head",     chipClass: "border-warn   bg-warn   text-white" },
  EMPLOYEE:        { label: "Employee",      chipClass: "border-ink3   bg-ink2   text-white" },
};

interface UserProp {
  id: number;
  name: string;
  email: string;
  role: UserRole;
}

export function AppShell({ children, user }: { children: ReactNode; user: UserProp | null }) {
  const pathname = usePathname();

  const handleLogout = async () => {
    try {
      const response = await fetch("/api/auth/logout", { method: "POST" });
      if (response.ok) window.location.href = "/login";
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  const isActive = (href: string) =>
    href === "/dashboard"
      ? pathname === "/dashboard" || pathname === "/"
      : pathname === href || pathname.startsWith(`${href}/`);

  const activeRole = user?.role ?? "EMPLOYEE";
  const meta = roleMeta[activeRole];
  const userName = user?.name ?? "Guest User";
  const userInitials = user?.name
    ? user.name
        .split(" ")
        .map((w) => w[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "GU";

  return (
    <div className="flex min-h-[100dvh]">
      {/* ── Flat Sidebar ── */}
      <aside className="fixed inset-y-0 left-0 z-30 flex w-[220px] flex-col bg-ink border-r-2 border-ink">
        {/* Logo block */}
        <div className="flex h-14 items-center gap-2 border-b-2 border-white/10 px-4">
          <div className="flex h-7 w-7 items-center justify-center border-2 border-signal bg-signal">
            <Zap size={13} className="text-white fill-white" />
          </div>
          <span className="text-sm font-bold tracking-tight text-white uppercase">AssetFlow</span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-px">
          <p className="mb-2 px-2 text-[9px] font-bold uppercase tracking-[0.15em] text-white/30">
            Navigation
          </p>

          {navItems
            .filter((item) => {
              if (item.href === "/audits" || item.href === "/reports") {
                return activeRole === "ADMIN" || activeRole === "ASSET_MANAGER";
              }
              return true;
            })
            .map((item) => {
              const active = isActive(item.href);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={clsx(
                    "flex items-center gap-2.5 px-2 py-2 text-xs font-medium transition-colors border-l-2",
                    active
                      ? "border-signal bg-white/10 text-white"
                      : "border-transparent text-white/50 hover:bg-white/8 hover:text-white hover:border-white/20"
                  )}
                >
                  <Icon size={14} />
                  {item.label}
                </Link>
              );
            })}

          {/* Admin-only section */}
          {activeRole === "ADMIN" && (
            <>
              <div className="my-3 border-t border-white/10" />
              <p className="mb-2 px-2 text-[9px] font-bold uppercase tracking-[0.15em] text-white/30">
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
                      "flex items-center gap-2.5 px-2 py-2 text-xs font-medium transition-colors border-l-2",
                      active
                        ? "border-signal bg-white/10 text-white"
                        : "border-transparent text-white/50 hover:bg-white/8 hover:text-white hover:border-white/20"
                    )}
                  >
                    <Icon size={14} />
                    {item.label}
                  </Link>
                );
              })}
            </>
          )}
        </nav>

        {/* User footer */}
        <div className="border-t-2 border-white/10 p-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center border border-white/30 bg-white/10 text-[10px] font-bold text-white">
              {userInitials}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-semibold text-white">{userName}</p>
              <span className={clsx("mt-0.5 inline-flex items-center border px-1.5 py-px text-[9px] font-bold uppercase tracking-wide", meta.chipClass)}>
                {meta.label}
              </span>
            </div>
            <button
              onClick={handleLogout}
              className="text-white/30 transition hover:text-white"
              title="Sign out"
            >
              <LogOut size={13} />
            </button>
          </div>
        </div>
      </aside>

      {/* ── Main content area ── */}
      <div className="ml-[220px] flex min-h-[100dvh] flex-1 flex-col">
        {/* Top header bar */}
        <header className="sticky top-0 z-20 flex h-12 items-center justify-between border-b-2 border-ink bg-surface px-6">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-widest text-ink">
              {getPageTitle(pathname)}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/notifications"
              className="relative flex h-7 w-7 items-center justify-center border border-ink text-ink2 transition hover:bg-sunken"
            >
              <Bell size={13} />
              <span className="absolute right-1 top-1 h-1.5 w-1.5 bg-signal" />
            </Link>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 bg-canvas px-6 py-5">{children}</main>
      </div>
    </div>
  );
}

function getPageTitle(pathname: string): string {
  if (pathname === "/" || pathname === "/dashboard") return "Dashboard";
  if (pathname.startsWith("/assets"))      return "Asset Registry";
  if (pathname.startsWith("/allocations")) return "Allocation & Transfer";
  if (pathname.startsWith("/bookings") || pathname.startsWith("/resource-booking")) return "Resource Booking";
  if (pathname.startsWith("/maintenance")) return "Maintenance";
  if (pathname.startsWith("/audits")) return "Audits";
  if (pathname.startsWith("/reports")) return "Reports & Analytics";
  if (pathname.startsWith("/activity") || pathname.startsWith("/notifications")) return "Notifications";
  if (pathname.startsWith("/org")) return "Organization Setup";
  return "AssetFlow";
}
