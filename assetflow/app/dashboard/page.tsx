"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AlertTriangle, ArrowLeftRight, BookOpen, CalendarDays, Clock, Loader2, Package, Plus, Wrench } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { SectionHeader } from "@/components/section-header";

type DashboardPayload = {
  kpis: {
    assetsAvailable: number;
    assetsAllocated: number;
    bookableFree: number;
    activeBookings: number;
    pendingTransfers: number;
    upcomingReturns: number;
  };
  overdueReturns: number;
  recentActivity: Array<{
    id: string;
    timestamp: string;
    text: string;
  }>;
};

const formatNumber = (value: number) => new Intl.NumberFormat("en").format(value);

export default function DashboardPage() {
  const [data, setData] = useState<DashboardPayload | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadDashboard() {
      try {
        const response = await fetch("/api/dashboard", { cache: "no-store" });

        if (!response.ok) {
          throw new Error("Unable to load dashboard");
        }

        const payload = (await response.json()) as DashboardPayload;

        if (!cancelled) {
          setData(payload);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Unable to load dashboard");
        }
      }
    }

    loadDashboard();

    return () => {
      cancelled = true;
    };
  }, []);

  const cards = data
    ? [
        { label: "Assets Available", value: data.kpis.assetsAvailable, icon: Package, tone: "text-go" },
        { label: "Assets Allocated", value: data.kpis.assetsAllocated, icon: ArrowLeftRight, tone: "text-signal" },
        { label: "Available", sublabel: "Bookable resources", value: data.kpis.bookableFree, icon: BookOpen, tone: "text-go" },
        { label: "Active Bookings", value: data.kpis.activeBookings, icon: CalendarDays, tone: "text-signal" },
        { label: "Pending Transfers", value: data.kpis.pendingTransfers, icon: ArrowLeftRight, tone: "text-warn" },
        { label: "Upcoming Returns", value: data.kpis.upcomingReturns, icon: Clock, tone: "text-ink3" },
      ]
    : [];

  return (
    <div>
      <PageHeader title="Today's Overview" />

      {error && (
        <div className="mb-6 rounded-lg border border-danger/30 bg-danger_bg px-4 py-3 text-sm text-danger">
          {error}
        </div>
      )}

      {!data && !error ? (
        <div className="flex min-h-[18rem] items-center justify-center text-sm text-ink3">
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Loading dashboard
        </div>
      ) : null}

      {data ? (
        <>
          <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {cards.map((card) => {
              const Icon = card.icon;

              return (
                <div key={card.label + card.sublabel} className="af-card p-5">
                  <div className="mb-5 flex items-start justify-between">
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-widest text-ink3">{card.label}</p>
                      {card.sublabel && <p className="mt-1 text-xs text-ink3">{card.sublabel}</p>}
                    </div>
                    <Icon size={16} className={card.tone} />
                  </div>
                  <p className="text-3xl font-semibold text-ink">{formatNumber(card.value)}</p>
                </div>
              );
            })}
          </div>

          {data.overdueReturns > 0 && (
            <div className="mb-6 flex items-center gap-3 rounded-lg border border-danger/30 bg-danger_bg px-5 py-3">
              <AlertTriangle size={16} className="shrink-0 text-danger" />
              <p className="text-sm font-medium text-danger">
                {data.overdueReturns} assets overdue for return - flagged for follow-up
              </p>
            </div>
          )}

          <div className="mb-6 grid grid-cols-1 gap-3 md:grid-cols-3">
            <Link href="/assets?register=1" className="af-btn-primary justify-start px-5 py-3">
              <Plus size={15} />
              Register Asset
            </Link>
            <Link href="/resource-booking?book=1" className="af-btn-primary justify-start px-5 py-3">
              <BookOpen size={15} />
              Book Resource
            </Link>
            <Link href="/maintenance?raise=1" className="af-btn-primary justify-start px-5 py-3">
              <Wrench size={15} />
              Raise Requests
            </Link>
          </div>

          <div className="af-card overflow-hidden">
            <div className="border-b border-border px-5 py-4">
              <SectionHeader title="Recent Activity" className="mb-0" />
            </div>
            <div className="divide-y divide-border">
              {data.recentActivity.length > 0 ? (
                data.recentActivity.map((event) => (
                  <div key={event.id} className="px-5 py-3 text-sm text-ink2">
                    {event.text}
                  </div>
                ))
              ) : (
                <div className="px-5 py-8 text-center text-sm text-ink3">No recent activity yet.</div>
              )}
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
