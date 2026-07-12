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
  ChevronRight,
} from "lucide-react";

const kpiCards = [
  { label: "Assets Available",  value: "1,284", delta: "+12 today",         deltaColor: "text-go",     icon: Package,       accent: "bg-go" },
  { label: "Allocated",         value: "847",   delta: "67% utilization",   deltaColor: "text-signal", icon: ArrowLeftRight, accent: "bg-signal" },
  { label: "Maintenance Today", value: "9",     delta: "3 high priority",   deltaColor: "text-violet", icon: Wrench,         accent: "bg-violet" },
  { label: "Active Bookings",   value: "34",    delta: "8 ending today",    deltaColor: "text-signal", icon: CalendarDays,   accent: "bg-signal" },
  { label: "Pending Transfers", value: "17",    delta: "5 awaiting approval", deltaColor: "text-warn", icon: RotateCcw,      accent: "bg-warn" },
  { label: "Upcoming Returns",  value: "23",    delta: "Due this week",     deltaColor: "text-ink3",   icon: Clock,          accent: "bg-ink2" },
];

const recentActivity = [
  { tag: "AF-0114", action: "Allocated to Priya Shah",        by: "Ravi M.",   when: "2h ago",  status: "ALLOCATED"         as const },
  { tag: "AF-0032", action: "Maintenance requested",           by: "Ananya K.", when: "5h ago",  status: "UNDER_MAINTENANCE" as const },
  { tag: "AF-0209", action: "Returned from allocation",        by: "Marcus R.", when: "6h ago",  status: "AVAILABLE"         as const },
  { tag: "AF-0087", action: "Transfer approved",               by: "System",    when: "8h ago",  status: "ALLOCATED"         as const },
  { tag: "AF-0041", action: "Audit verified",                  by: "Elena T.",  when: "1d ago",  status: "AVAILABLE"         as const },
  { tag: "AF-0155", action: "Booked for Meeting Room A",       by: "Liam P.",   when: "1d ago",  status: "RESERVED"          as const },
];

const upcomingEvents = [
  { type: "Return",      asset: "AF-0114", detail: "Priya Shah — due in 2h",            urgent: true  },
  { type: "Booking",     asset: "AF-0302", detail: "Meeting Room B — 14:00–16:00",      urgent: false },
  { type: "Return",      asset: "AF-0087", detail: "Marcus Reed — due tomorrow",        urgent: false },
  { type: "Maintenance", asset: "AF-0032", detail: "Scheduled service — tomorrow",      urgent: false },
];

const typeColors: Record<string, string> = {
  Return:      "border-warn bg-warn_bg text-warn",
  Booking:     "border-signal bg-surface text-signal",
  Maintenance: "border-violet bg-violet_bg text-violet",
};

export default function DashboardPage() {
  return (
    <div className="space-y-5">
      {/* Page header */}
      <div className="flex items-center justify-between border-b-2 border-ink pb-4">
        <div>
          <h1 className="text-lg font-bold uppercase tracking-widest text-ink">Dashboard</h1>
          <p className="text-xs text-ink3 mt-0.5">System overview — real time</p>
        </div>
        <a href="/assets" className="af-btn-primary gap-1.5">
          <Plus size={13} />
          Register Asset
        </a>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 gap-px sm:grid-cols-3 xl:grid-cols-6 bg-ink border-2 border-ink">
        {kpiCards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="bg-surface p-4 flex flex-col gap-3">
              <div className="flex items-start justify-between">
                <p className="text-[9px] font-bold uppercase tracking-[0.15em] text-ink3 leading-tight">{card.label}</p>
                <div className={`flex h-5 w-5 items-center justify-center ${card.accent}`}>
                  <Icon size={11} className="text-white" />
                </div>
              </div>
              <p className="text-3xl font-bold text-ink leading-none">{card.value}</p>
              <p className={`text-[10px] font-semibold ${card.deltaColor}`}>{card.delta}</p>
            </div>
          );
        })}
      </div>

      {/* Overdue Alert Banner */}
      <div className="flex items-center justify-between border-2 border-warn bg-warn_bg px-4 py-3">
        <div className="flex items-center gap-3">
          <AlertTriangle size={14} className="text-warn shrink-0" />
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-warn">7 OVERDUE RETURNS</span>
            <span className="text-warn/40">—</span>
            <span className="text-xs text-warn/70">Assets past expected return date</span>
          </div>
        </div>
        <button className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-warn hover:text-warn/70 transition-colors">
          View All <ChevronRight size={11} />
        </button>
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        {/* Left col — activity + events */}
        <div className="lg:col-span-2 space-y-5">
          {/* Recent Activity Table */}
          <div className="border-2 border-ink bg-surface">
            <div className="flex items-center justify-between border-b-2 border-ink px-4 py-3">
              <p className="text-[10px] font-bold uppercase tracking-widest text-ink">Recent Activity</p>
              <a href="/activity" className="text-[10px] font-bold uppercase tracking-widest text-signal hover:text-signal2">
                View all →
              </a>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-canvas">
                    <th className="af-th">Asset</th>
                    <th className="af-th">Action</th>
                    <th className="af-th">Status</th>
                    <th className="af-th">By</th>
                    <th className="af-th">When</th>
                  </tr>
                </thead>
                <tbody>
                  {recentActivity.map((row) => (
                    <tr key={row.tag} className="hover:bg-canvas transition-colors">
                      <td className="af-td"><AssetTag tag={row.tag} /></td>
                      <td className="af-td text-ink2">{row.action}</td>
                      <td className="af-td"><StatusChip status={row.status} size="sm" /></td>
                      <td className="af-td text-ink3">{row.by}</td>
                      <td className="af-td font-mono text-xs text-ink3">{row.when}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Upcoming Events */}
          <div className="border-2 border-ink bg-surface">
            <div className="border-b-2 border-ink px-4 py-3">
              <p className="text-[10px] font-bold uppercase tracking-widest text-ink">Upcoming Events — Next 48h</p>
            </div>
            <div className="divide-y divide-ink/10">
              {upcomingEvents.map((ev, i) => (
                <div key={i} className="flex items-center gap-4 px-4 py-3">
                  <span className={`border text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 ${typeColors[ev.type]}`}>
                    {ev.type}
                  </span>
                  <AssetTag tag={ev.asset} />
                  <span className="text-xs text-ink2 flex-1">{ev.detail}</span>
                  {ev.urgent && (
                    <span className="border border-danger bg-danger_bg text-danger text-[9px] font-bold uppercase px-1.5 py-0.5">Urgent</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right col — Quick Actions */}
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-ink3 mb-3">Quick Actions</p>
          <div className="border-2 border-ink divide-y-2 divide-ink bg-surface">
            {[
              { icon: Package,    title: "Register Asset",       desc: "Add a new asset to registry",        href: "/assets" },
              { icon: BookOpen,   title: "Book Resource",        desc: "Reserve room, vehicle, or equipment", href: "/bookings" },
              { icon: Wrench,     title: "Maintenance Request",  desc: "Raise a maintenance ticket",          href: "/maintenance" },
              { icon: TrendingUp, title: "View Reports",         desc: "Utilization and audit analytics",     href: "/reports" },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <a key={item.href} href={item.href}
                  className="flex items-center gap-3 px-4 py-4 hover:bg-canvas transition-colors group"
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center border-2 border-ink bg-canvas group-hover:bg-signal group-hover:border-signal transition-colors">
                    <Icon size={14} className="text-ink group-hover:text-white transition-colors" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-ink">{item.title}</p>
                    <p className="text-[10px] text-ink3 mt-0.5">{item.desc}</p>
                  </div>
                  <ChevronRight size={13} className="text-ink3 shrink-0" />
                </a>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
