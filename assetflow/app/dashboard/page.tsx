import { PageHeader } from "@/components/page-header";
import { SectionHeader } from "@/components/section-header";
import { AssetTag } from "@/components/asset-tag";
import { StatusChip } from "@/components/status-chip";
import {
  Package,
  ArrowLeftRight,
  Wrench,
  CalendarDays,
  AlertTriangle,
  TrendingUp,
  Clock,
  RotateCcw,
  Plus,
  BookOpen,
} from "lucide-react";

const kpiCards = [
  { label: "Assets Available", value: "1,284", delta: "+12 today", deltaColor: "text-go", icon: Package, iconColor: "text-go" },
  { label: "Allocated", value: "847", delta: "67% utilization", deltaColor: "text-signal", icon: ArrowLeftRight, iconColor: "text-signal" },
  { label: "Maintenance Today", value: "9", delta: "3 high priority", deltaColor: "text-violet", icon: Wrench, iconColor: "text-violet" },
  { label: "Active Bookings", value: "34", delta: "8 ending today", deltaColor: "text-signal", icon: CalendarDays, iconColor: "text-signal" },
  { label: "Pending Transfers", value: "17", delta: "5 awaiting approval", deltaColor: "text-warn", icon: RotateCcw, iconColor: "text-warn" },
  { label: "Upcoming Returns", value: "23", delta: "Due this week", deltaColor: "text-ink3", icon: Clock, iconColor: "text-ink3" },
];

const recentActivity = [
  { tag: "AF-0114", action: "Allocated to Priya Shah", by: "Ravi M.", when: "2h ago", status: "ALLOCATED" as const },
  { tag: "AF-0032", action: "Maintenance requested", by: "Ananya K.", when: "5h ago", status: "UNDER_MAINTENANCE" as const },
  { tag: "AF-0209", action: "Returned from allocation", by: "Marcus R.", when: "6h ago", status: "AVAILABLE" as const },
  { tag: "AF-0087", action: "Transfer approved", by: "System", when: "8h ago", status: "ALLOCATED" as const },
  { tag: "AF-0041", action: "Audit verified", by: "Elena T.", when: "1d ago", status: "AVAILABLE" as const },
  { tag: "AF-0155", action: "Booked for Meeting Room A", by: "Liam P.", when: "1d ago", status: "RESERVED" as const },
];

const upcomingEvents = [
  { type: "Return", asset: "AF-0114", detail: "Priya Shah — due in 2h", urgent: true },
  { type: "Booking", asset: "AF-0302", detail: "Meeting Room B — 14:00–16:00", urgent: false },
  { type: "Return", asset: "AF-0087", detail: "Marcus Reed — due tomorrow", urgent: false },
  { type: "Maintenance", asset: "AF-0032", detail: "Scheduled service — tomorrow", urgent: false },
];

export default function DashboardPage() {
  return (
    <div>
      <PageHeader
        title="Dashboard"
        action={
          <button className="af-btn-primary">
            <Plus size={14} />
            Register Asset
          </button>
        }
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-6 mb-4">
        {kpiCards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="af-card p-4">
              <div className="flex items-start justify-between mb-3">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-ink3">{card.label}</p>
                <Icon size={14} className={card.iconColor} />
              </div>
              <p className="text-3xl font-semibold text-ink mb-1">{card.value}</p>
              <p className={`text-xs ${card.deltaColor}`}>● {card.delta}</p>
            </div>
          );
        })}
      </div>

      {/* Overdue Returns Strip */}
      <div className="flex items-center justify-between rounded-lg border border-warn/30 bg-warn_bg px-5 py-3 mb-6">
        <div className="flex items-center gap-3">
          <AlertTriangle size={16} className="text-warn shrink-0" />
          <div>
            <span className="text-sm font-semibold text-warn">7 OVERDUE RETURNS</span>
            <span className="mx-2 text-warn/50">·</span>
            <span className="text-sm text-warn/80">Assets past expected return date</span>
          </div>
        </div>
        <button className="af-btn-secondary text-warn border-warn/30 hover:bg-warn_bg">
          View All →
        </button>
      </div>

      {/* Two column layout */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left: activity + upcoming */}
        <div className="lg:col-span-2 space-y-6">
          {/* Recent Activity */}
          <div className="af-card overflow-hidden">
            <div className="px-5 py-4 border-b border-border">
              <SectionHeader title="Recent Activity" className="mb-0" />
            </div>
            <table className="w-full">
              <thead>
                <tr>
                  <th className="af-th">Asset Tag</th>
                  <th className="af-th">Action</th>
                  <th className="af-th">Status</th>
                  <th className="af-th">By</th>
                  <th className="af-th">When</th>
                </tr>
              </thead>
              <tbody>
                {recentActivity.map((row) => (
                  <tr key={row.tag} className="hover:bg-sunken transition-colors">
                    <td className="af-td">
                      <AssetTag tag={row.tag} />
                    </td>
                    <td className="af-td text-ink2">{row.action}</td>
                    <td className="af-td">
                      <StatusChip status={row.status} size="sm" />
                    </td>
                    <td className="af-td text-ink3">{row.by}</td>
                    <td className="af-td text-ink3">{row.when}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Upcoming Events */}
          <div className="af-card p-5">
            <SectionHeader title="Upcoming Events — Next 48h" />
            <div className="space-y-3">
              {upcomingEvents.map((ev, i) => (
                <div
                  key={i}
                  className={`flex items-center gap-4 rounded-md px-4 py-3 border ${
                    ev.urgent ? "border-danger/30 bg-danger_bg" : "border-border bg-sunken"
                  }`}
                >
                  <span
                    className={`text-[10px] font-semibold uppercase tracking-widest rounded px-1.5 py-0.5 ${
                      ev.type === "Return"
                        ? "bg-warn_bg text-warn"
                        : ev.type === "Booking"
                        ? "bg-signal/10 text-signal"
                        : "bg-violet_bg text-violet"
                    }`}
                  >
                    {ev.type}
                  </span>
                  <AssetTag tag={ev.asset} />
                  <span className="text-sm text-ink2 flex-1">{ev.detail}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Quick Actions */}
        <div className="space-y-4">
          <SectionHeader title="Quick Actions" />
          {[
            { icon: Package, title: "Register Asset", desc: "Add a new asset to the registry", href: "/assets" },
            { icon: BookOpen, title: "Book Resource", desc: "Reserve a room, vehicle, or equipment", href: "/bookings" },
            { icon: Wrench, title: "Maintenance Request", desc: "Raise a maintenance ticket", href: "/maintenance" },
            { icon: TrendingUp, title: "View Reports", desc: "Utilization and audit analytics", href: "/reports" },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <a key={item.href} href={item.href} className="af-card p-4 flex items-start gap-4 hover:shadow-md transition-shadow block">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-signal/10">
                  <Icon size={18} className="text-signal" />
                </div>
                <div>
                  <p className="text-sm font-medium text-ink">{item.title}</p>
                  <p className="text-xs text-ink3 mt-0.5">{item.desc}</p>
                </div>
              </a>
            );
          })}
        </div>
      </div>
    </div>
  );
}
