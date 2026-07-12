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
  type LucideIcon,
} from "lucide-react";

type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
};

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
  ADMIN: { label: "Admin", chipClass: "bg-violet_bg text-signal" },
  ASSET_MANAGER: { label: "Asset Manager", chipClass: "bg-go_bg text-go" },
  DEPARTMENT_HEAD: { label: "Dept Head", chipClass: "bg-warn_bg text-warn" },
  EMPLOYEE: { label: "Employee", chipClass: "bg-gray_bg text-ink2" },
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

  const renderNav = (items: readonly NavItem[]) =>
    items.map((item) => {
      const active = isActive(item.href);
      const Icon = item.icon;

      return (
        <Link
          key={item.href}
          href={item.href}
          className={clsx(
            "relative flex h-10 items-center gap-3 rounded-md px-4 text-[13px] font-medium transition-colors",
            active
              ? "bg-deepMid pl-[13px] text-white before:absolute before:left-0 before:top-2 before:h-6 before:w-[3px] before:rounded-r before:bg-signal"
              : "text-white/55 hover:bg-deepMid hover:text-white/80",
          )}
        >
          <Icon size={16} strokeWidth={1.5} className="shrink-0" />
          {item.label}
        </Link>
      );
    });

  return (
    <div className="flex min-h-[100dvh]">
      <aside className="fixed inset-y-0 left-0 z-30 flex w-[220px] flex-col bg-depth">
        <div className="flex h-14 items-center gap-2 border-b border-white/15 px-4">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-signal">
            <Zap size={14} strokeWidth={1.5} className="text-white" />
          </div>
          <span className="font-display text-[17px] font-semibold tracking-tight text-white">AssetFlow</span>
        </div>

        <nav className="flex-1 space-y-px overflow-y-auto px-2 py-4">
          <p className="mb-2 px-3.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-white/40">
            Navigation
          </p>

          {renderNav(
            navItems.filter((item) => {
              if (item.href === "/audits" || item.href === "/reports") {
                return activeRole === "ADMIN" || activeRole === "ASSET_MANAGER";
              }
              return true;
            }),
          )}

          {activeRole === "ADMIN" && (
            <>
              <div className="my-3 border-t border-white/15" />
              <p className="mb-2 px-3.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-white/40">
                Admin
              </p>
              {renderNav(adminNavItems)}
            </>
          )}
        </nav>

        <div className="border-t border-white/15 p-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-white/10 text-[11px] font-semibold text-white">
              {userInitials}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-semibold text-white">{userName}</p>
              <span
                className={clsx(
                  "mt-1 inline-flex items-center rounded px-1.5 py-px text-[10px] font-semibold tracking-[0.04em]",
                  meta.chipClass,
                )}
              >
                {meta.label}
              </span>
            </div>
            <button
              onClick={handleLogout}
              className="rounded p-1 text-white/40 transition hover:bg-deepMid hover:text-white"
              title="Sign out"
            >
              <LogOut size={16} strokeWidth={1.5} />
            </button>
          </div>
        </div>
      </aside>

      <div className="ml-[220px] flex min-h-[100dvh] flex-1 flex-col">
        <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-border bg-surface px-6">
          <span className="font-display text-[22px] font-semibold tracking-[-0.3px] text-ink">
            {getPageTitle(pathname)}
          </span>

          <Link
            href="/notifications"
            className="relative flex h-8 w-8 items-center justify-center rounded-md border border-border text-ink2 transition hover:bg-canvas"
          >
            <Bell size={16} strokeWidth={1.5} />
            <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-signal" />
          </Link>
        </header>

        <main className="flex-1 bg-canvas px-6 py-6">{children}</main>
      </div>
    </div>
  );
}

function getPageTitle(pathname: string): string {
  if (pathname === "/" || pathname === "/dashboard") return "Dashboard";
  if (pathname.startsWith("/assets")) return "Asset Registry";
  if (pathname.startsWith("/allocations")) return "Allocation & Transfer";
  if (pathname.startsWith("/bookings") || pathname.startsWith("/resource-booking")) return "Resource Booking";
  if (pathname.startsWith("/maintenance")) return "Maintenance";
  if (pathname.startsWith("/audits")) return "Audits";
  if (pathname.startsWith("/reports")) return "Reports & Analytics";
  if (pathname.startsWith("/activity") || pathname.startsWith("/notifications")) return "Notifications";
  if (pathname.startsWith("/org")) return "Organization Setup";
  return "AssetFlow";
}
