import type { ReactNode } from "react";
import { Zap } from "lucide-react";

export function AuthCard({ title, subtitle, children }: { title: string; subtitle?: string; children: ReactNode }) {
  return (
    <div className="flex min-h-[100dvh]">
      <div className="hidden flex-col justify-between bg-depth px-12 py-10 lg:flex lg:w-[46%]">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-signal">
            <Zap size={15} strokeWidth={1.5} className="text-white" />
          </div>
          <span className="font-display text-lg font-semibold tracking-tight text-white">AssetFlow</span>
        </div>

        <div className="flex flex-1 flex-col items-start justify-center gap-8 py-16">
          <div className="border-l-4 border-signal pl-6">
            <p className="font-display text-3xl font-semibold leading-tight text-white">
              Enterprise
              <br />
              Asset Management
            </p>
          </div>
          <div className="space-y-3">
            {[
              "Track the full asset lifecycle",
              "Role-based approval workflows",
              "Maintenance, audits & bookings",
            ].map((item) => (
              <div key={item} className="flex items-center gap-3">
                <div className="h-1.5 w-1.5 shrink-0 rounded-full bg-signal" />
                <p className="text-sm text-white/60">{item}</p>
              </div>
            ))}
          </div>
        </div>

        <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-white/25">
          AssetFlow &copy; 2026
        </p>
      </div>

      <div className="flex flex-1 items-center justify-center bg-canvas px-6 py-12">
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

          <div className="rounded-md border border-border bg-surface p-6">{children}</div>
        </div>
      </div>
    </div>
  );
}
