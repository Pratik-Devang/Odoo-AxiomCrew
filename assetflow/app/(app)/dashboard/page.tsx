"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  BookOpen,
  CalendarDays,
  ChevronRight,
  ClipboardList,
  Clock,
  Loader2,
  Package,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import { AssetTag } from "@/components/asset-tag";

type ActivityType = "allocation" | "booking" | "maintenance" | "transfer";
type KpiKey =
  | "assetsAvailable"
  | "assetsAllocated"
  | "bookableFree"
  | "activeBookings"
  | "pendingTransfers"
  | "upcomingReturns";

type DashboardPayload = {
  kpis: {
    assetsAvailable: number;
    assetsAllocated: number;
    bookableFree: number;
    activeBookings: number;
    pendingTransfers: number;
    upcomingReturns: number;
  };
  summary: {
    totalAssets: number;
    utilizationPercent: number;
    departmentAllocation: Array<{ name: string; count: number }>;
    activitySeries: number[];
  };
  trends: Record<KpiKey, number[]>;
  insights: {
    auditDueThisWeek: number;
    topBooking: { assetName: string; count: number } | null;
    oldestMaintenance: { assetName: string; ageDays: number } | null;
  };
  overdueReturns: number;
  recentActivity: Array<{
    id: string;
    type: ActivityType;
    timestamp: string;
    text: string;
  }>;
};

const formatNumber = (value: number) => new Intl.NumberFormat("en").format(value);

const toneColors = {
  go: "#3A9E6F",
  accent: "#6B5FE4",
  warn: "#D4860A",
  neutral: "#C8C5BC",
  ink: "#1A1F2E",
} as const;

const departmentColors = ["#6B5FE4", "#3A9E6F", "#D4860A", "#5A6170"];

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
        {
          key: "assetsAvailable",
          label: "Assets Available",
          value: data.kpis.assetsAvailable,
          sublabel: `${formatNumber(data.kpis.assetsAvailable)} assets ready to assign`,
          icon: Package,
          toneClass: "af-kpi-go",
          color: toneColors.go,
        },
        {
          key: "assetsAllocated",
          label: "Assets Allocated",
          value: data.kpis.assetsAllocated,
          sublabel: "Assets currently assigned",
          icon: Package,
          toneClass: "af-kpi-accent",
          color: toneColors.accent,
        },
        {
          key: "bookableFree",
          label: "Available Bookable",
          value: data.kpis.bookableFree,
          sublabel: "Rooms and resources open now",
          icon: BookOpen,
          toneClass: "af-kpi-go",
          color: toneColors.go,
        },
        {
          key: "activeBookings",
          label: "Active Bookings",
          value: data.kpis.activeBookings,
          sublabel: "Reservations in progress",
          icon: BookOpen,
          toneClass: "af-kpi-accent",
          color: toneColors.accent,
        },
        {
          key: "pendingTransfers",
          label: "Pending Transfers",
          value: data.kpis.pendingTransfers,
          sublabel: "Requests awaiting approval",
          icon: Package,
          toneClass: "af-kpi-warn",
          color: toneColors.warn,
        },
        {
          key: "upcomingReturns",
          label: "Upcoming Returns",
          value: data.kpis.upcomingReturns,
          sublabel: "Returns approaching soon",
          icon: Clock,
          toneClass: "af-kpi-neutral",
          color: toneColors.neutral,
        },
      ]
    : [];

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between border-b border-border pb-4">
        <div>
          <h1 className="font-display text-[22px] font-semibold tracking-[-0.3px] text-ink">Dashboard</h1>
          <p className="mt-1 text-sm text-ink3">A structured overview of assets, bookings, transfers, and returns.</p>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-md border border-danger bg-danger_bg px-4 py-3 text-sm font-semibold text-danger">
          <AlertTriangle size={16} strokeWidth={1.5} />
          {error}
        </div>
      )}

      {!data && !error ? (
        <div className="flex min-h-[18rem] items-center justify-center text-sm font-medium text-ink3">
          <Loader2 className="mr-2 h-4 w-4 animate-spin text-signal" />
          Loading dashboard...
        </div>
      ) : null}

      {data ? (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {cards.map((card) => {
              const Icon = card.icon;
              const trend = data.trends[card.key as KpiKey] ?? [];

              return (
                <div key={card.label} className={`af-kpi-card ${card.toneClass}`}>
                  <div className="flex items-start justify-between gap-4">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-ink3">{card.label}</p>
                    <Icon size={18} strokeWidth={1.5} className="text-ink3" />
                  </div>
                  <div className="mt-3 flex items-end justify-between gap-4">
                    <p className="font-display text-[44px] font-bold leading-none tracking-[-0.5px] text-ink">
                      {formatNumber(card.value)}
                    </p>
                    <Sparkline values={trend} color={card.color} />
                  </div>
                  <p className="mt-2 text-xs text-ink3">{trendLabel(trend)}</p>
                  <p className="mt-1 text-xs text-ink3">{card.sublabel}</p>
                </div>
              );
            })}
          </div>

          <UtilizationStrip data={data} />

          {data.overdueReturns > 0 && (
            <div className="flex items-center gap-3 rounded-md border border-danger bg-danger_bg px-5 py-3">
              <AlertTriangle size={16} strokeWidth={1.5} className="shrink-0 text-danger" />
              <p className="text-sm font-semibold text-danger">
                {data.overdueReturns} assets overdue for return and flagged for follow-up.
              </p>
            </div>
          )}

          <InsightBand data={data} />

          <div className="overflow-hidden rounded-md border border-border bg-surface">
            <div className="flex items-center justify-between border-b border-border px-6 py-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-ink3">Recent Activity</p>
            </div>
            <div>
              {data.recentActivity.length > 0 ? (
                data.recentActivity.map((event, index) => {
                  const match = /(AF-\d+)/.exec(event.text);
                  const tag = match ? match[1] : null;
                  const cleanText = tag
                    ? event.text.replace(tag, "").replace(/^\s*-\s*|\s*-\s*$/, "").trim()
                    : event.text;
                  const isLive = index === 0 && isFresh(event.timestamp);

                  return (
                    <div
                      key={event.id}
                      className="flex min-h-14 items-center gap-3 border-b border-border px-6 py-3 last:border-b-0 hover:bg-canvas"
                    >
                      {isLive ? <span className="af-live-pulse shrink-0" aria-label="New activity" /> : null}
                      <ActivityDot type={event.type} />
                      {tag ? <AssetTag tag={tag} /> : <span className="af-asset-id">SYS</span>}
                      <p className="min-w-0 flex-1 text-sm text-ink">{cleanText}</p>
                      <span className="text-xs text-ink3">{formatRelativeTime(event.timestamp)}</span>
                      <ChevronRight size={14} strokeWidth={1.5} className="text-ink3" />
                    </div>
                  );
                })
              ) : (
                <div className="px-6 py-8 text-center text-sm text-ink3">No recent activity.</div>
              )}
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}

function Sparkline({ values, color, width = 60, height = 24 }: { values: number[]; color: string; width?: number; height?: number }) {
  const path = sparklinePath(values, width, height);

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} aria-hidden="true" className="shrink-0">
      <path d={path} fill="none" stroke={color} strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
    </svg>
  );
}

function UtilizationStrip({ data }: { data: DashboardPayload }) {
  return (
    <div className="grid min-h-[72px] grid-cols-1 gap-4 bg-canvas md:grid-cols-[220px_1fr_220px]">
      <div className="flex items-center gap-3">
        <Donut percent={data.summary.utilizationPercent} color={toneColors.accent} />
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-ink3">Asset Utilization</p>
          <p className="mt-1 text-sm font-medium text-ink">
            {formatNumber(data.kpis.assetsAllocated)} of {formatNumber(data.summary.totalAssets)} assets
          </p>
        </div>
      </div>

      <div className="flex flex-col justify-center">
        <div className="mb-2 flex items-center justify-between">
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-ink3">Allocation by department</p>
          <span className="text-xs text-ink3">{formatNumber(data.kpis.assetsAllocated)} allocated</span>
        </div>
        <SegmentBar segments={data.summary.departmentAllocation} />
      </div>

      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-ink3">7-day activity</p>
          <p className="mt-1 text-sm font-medium text-ink">
            {formatNumber(data.summary.activitySeries.reduce((sum, value) => sum + value, 0))} events
          </p>
        </div>
        <Sparkline values={data.summary.activitySeries} color={toneColors.ink} width={88} height={28} />
      </div>
    </div>
  );
}

function InsightBand({ data }: { data: DashboardPayload }) {
  const insights = [
    {
      icon: ClipboardList,
      text:
        data.insights.auditDueThisWeek > 0
          ? `${data.insights.auditDueThisWeek} assets due for audit this week`
          : "No audit items due this week",
      href: "/audits",
      className: "bg-violet_bg text-signal",
      label: "View audits",
    },
    {
      icon: CalendarDays,
      text: data.insights.topBooking
        ? `${data.insights.topBooking.assetName} has ${data.insights.topBooking.count} bookings today`
        : "No resource bookings scheduled today",
      href: "/resource-booking",
      className: "bg-go_bg text-go",
      label: "View planner",
    },
    {
      icon: Wrench,
      text: data.insights.oldestMaintenance
        ? `${data.insights.oldestMaintenance.assetName} maintenance pending ${data.insights.oldestMaintenance.ageDays} days`
        : "No maintenance request is waiting",
      href: "/maintenance",
      className: "bg-warn_bg text-warn",
      label: "View maintenance",
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
      {insights.map((insight) => (
        <InsightPanel key={insight.href} {...insight} />
      ))}
    </div>
  );
}

function InsightPanel({
  icon: Icon,
  text,
  href,
  className,
  label,
}: {
  icon: LucideIcon;
  text: string;
  href: string;
  className: string;
  label: string;
}) {
  return (
    <div className={`flex min-h-16 items-center gap-3 rounded-md px-4 py-3 ${className}`}>
      <Icon size={18} strokeWidth={1.5} className="shrink-0" />
      <p className="min-w-0 flex-1 text-sm font-medium text-ink">{text}</p>
      <Link href={href} className="inline-flex shrink-0 items-center gap-1 text-xs font-semibold text-ink hover:text-signal" aria-label={label}>
        View
        <ArrowRight size={13} strokeWidth={1.5} />
      </Link>
    </div>
  );
}

function Donut({ percent, color }: { percent: number; color: string }) {
  const radius = 18;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (Math.min(100, Math.max(0, percent)) / 100) * circumference;

  return (
    <svg width="52" height="52" viewBox="0 0 52 52" className="shrink-0" aria-label={`${percent}% utilized`}>
      <circle cx="26" cy="26" r={radius} fill="none" stroke="#E4E2DC" strokeWidth="6" />
      <circle
        cx="26"
        cy="26"
        r={radius}
        fill="none"
        stroke={color}
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        strokeWidth="6"
        transform="rotate(-90 26 26)"
      />
      <text x="26" y="29" textAnchor="middle" className="fill-ink font-display text-[12px] font-semibold">
        {percent}%
      </text>
    </svg>
  );
}

function SegmentBar({ segments }: { segments: Array<{ name: string; count: number }> }) {
  const total = segments.reduce((sum, segment) => sum + segment.count, 0);

  if (total === 0) {
    return <div className="h-2 rounded-full bg-border" />;
  }

  return (
    <div>
      <div className="flex h-2 overflow-hidden rounded-full bg-border">
        {segments.map((segment, index) => (
          <div
            key={segment.name}
            className="h-full"
            style={{
              width: `${(segment.count / total) * 100}%`,
              backgroundColor: departmentColors[index % departmentColors.length],
            }}
          />
        ))}
      </div>
      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
        {segments.map((segment, index) => (
          <span key={segment.name} className="inline-flex items-center gap-1.5 text-xs text-ink3">
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: departmentColors[index % departmentColors.length] }} />
            {segment.name}
          </span>
        ))}
      </div>
    </div>
  );
}

function ActivityDot({ type }: { type: ActivityType }) {
  const className: Record<ActivityType, string> = {
    allocation: "bg-signal",
    maintenance: "bg-warn",
    booking: "bg-go",
    transfer: "bg-ink",
  };

  return <span className={`h-2 w-2 shrink-0 rounded-full ${className[type]}`} aria-hidden="true" />;
}

function sparklinePath(values: number[], width: number, height: number) {
  const safeValues = values.length > 0 ? values : [0, 0];
  const min = Math.min(...safeValues);
  const max = Math.max(...safeValues);
  const range = max - min || 1;
  const xStep = safeValues.length > 1 ? width / (safeValues.length - 1) : width;
  const padding = 3;

  return safeValues
    .map((value, index) => {
      const x = index * xStep;
      const y = height - padding - ((value - min) / range) * (height - padding * 2);
      return `${index === 0 ? "M" : "L"} ${x.toFixed(2)} ${y.toFixed(2)}`;
    })
    .join(" ");
}

function trendLabel(values: number[]) {
  if (values.length < 2) return "No trend data yet";

  const delta = values[values.length - 1] - values[0];
  if (delta > 0) return `Up ${formatNumber(delta)} from week start`;
  if (delta < 0) return `Down ${formatNumber(Math.abs(delta))} from week start`;
  return "No change from week start";
}

function isFresh(timestamp: string) {
  return Date.now() - new Date(timestamp).getTime() < 30 * 60 * 1000;
}

function formatRelativeTime(timestamp: string) {
  const diffMs = Date.now() - new Date(timestamp).getTime();
  const minutes = Math.max(0, Math.floor(diffMs / 60_000));

  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}
