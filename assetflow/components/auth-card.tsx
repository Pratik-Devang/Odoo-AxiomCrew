import type { ReactNode } from "react";
import { CalendarDays, Laptop, Monitor, Wrench, Zap } from "lucide-react";

export function AuthCard({ title, subtitle, children }: { title: string; subtitle?: string; children: ReactNode }) {
  return (
    <div className="flex min-h-[100dvh]">
      <div className="relative hidden overflow-hidden bg-depth px-12 py-10 lg:flex lg:w-[46%] lg:flex-col">
        <div className="af-auth-orb af-auth-orb-violet" />
        <div className="af-auth-orb af-auth-orb-sage" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.045)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.045)_1px,transparent_1px)] bg-[length:42px_42px]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_25%_20%,rgba(255,255,255,0.08),transparent_34%),linear-gradient(180deg,transparent_0%,rgba(30,42,58,0.74)_100%)]" />
        <div className="absolute inset-y-0 right-0 w-px bg-white/10" />

        <div className="relative z-10 flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-signal">
            <Zap size={15} strokeWidth={1.5} className="text-white" />
          </div>
          <span className="font-display text-lg font-semibold tracking-tight text-white">AssetFlow</span>
        </div>

        <div className="relative z-10 flex flex-1 flex-col justify-center py-12">
          <div className="max-w-md">
            <h2 className="font-display text-[44px] font-bold leading-[1.02] tracking-[-0.5px] text-white">
              Every asset, allocated and <span className="text-[#B8B2FF]">tracked.</span>
            </h2>
            <p className="mt-5 max-w-sm text-lg leading-7 text-[#D7DEE8]">
              A calmer way to manage equipment, rooms, maintenance, and accountability across your organization.
            </p>
          </div>

          <div className="mt-10 grid max-w-md gap-3">
            <AuthAssetCard
              delay="100ms"
              icon={<Laptop size={15} strokeWidth={1.7} />}
              title="MacBook Pro 14"
              tag="AF-0001"
              status="Allocated"
              tone="go"
            />
            <AuthAssetCard
              delay="250ms"
              icon={<Wrench size={15} strokeWidth={1.7} />}
              title="Projector Cart"
              tag="AF-0004"
              status="Maintenance"
              tone="warn"
            />
            <AuthAssetCard
              delay="400ms"
              icon={<CalendarDays size={15} strokeWidth={1.7} />}
              title="Conference Room B2"
              tag="AF-0005"
              status="Booked"
              tone="signal"
            />
          </div>
        </div>

        <div className="relative z-10 grid grid-cols-3 gap-6 border-t border-white/10 pt-6">
          <AuthStat value="2.4k" label="assets" />
          <AuthStat value="18" label="depts" />
          <AuthStat value="99%" label="uptime" />
        </div>
      </div>

      <div className="flex flex-1 items-center justify-center bg-[linear-gradient(90deg,#F0EEE9_0%,#F8F7F4_18%,#F8F7F4_100%)] px-6 py-12">
        <div className="w-full max-w-[400px]">
          <div className="mb-8 flex items-center gap-2 lg:hidden">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-signal">
              <Zap size={13} strokeWidth={1.5} className="text-white" />
            </div>
            <span className="font-display text-base font-semibold tracking-tight text-ink">AssetFlow</span>
          </div>

          <div className="mb-6 border-l-4 border-signal pl-4">
            <h1 className="font-display text-[22px] font-semibold tracking-[-0.3px] text-ink">{title}</h1>
            {subtitle && <p className="mt-1 text-sm text-ink3">{subtitle}</p>}
          </div>

          {children}
        </div>
      </div>
    </div>
  );
}

function AuthStat({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <div className="flex items-center gap-2 font-display text-2xl font-semibold tracking-[-0.3px] text-white">
        {label === "uptime" && <span className="af-auth-live-dot" />}
        {value}
      </div>
      <div className="mt-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-[#AAB5C4]">{label}</div>
    </div>
  );
}

function AuthAssetCard({
  delay,
  icon,
  title,
  tag,
  status,
  tone,
}: {
  delay: string;
  icon: ReactNode;
  title: string;
  tag: string;
  status: string;
  tone: "go" | "warn" | "signal";
}) {
  return (
    <div className="af-auth-asset-card" style={{ animationDelay: delay }}>
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-md border border-white/12 bg-white/[0.07] text-white/75">
          {icon}
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-semibold text-white">{title}</div>
          <div className="mt-1 font-mono text-[10px] font-semibold text-[#B8B2FF]">{tag}</div>
        </div>
        <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.08em] text-white/50">
          <span className={`af-auth-status-dot af-auth-status-dot-${tone}`} />
          {status}
        </div>
      </div>
    </div>
  );
}
