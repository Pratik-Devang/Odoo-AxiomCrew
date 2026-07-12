import type { ReactNode } from "react";

export function AuthCard({ title, subtitle, children }: { title: string; subtitle?: string; children: ReactNode }) {
  return (
    <div className="flex min-h-screen">
      {/* Left — dark half */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between bg-ink px-12 py-10">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded bg-signal text-xs font-semibold text-white">
            AF
          </div>
          <span className="text-sm font-semibold tracking-tight text-white">AssetFlow</span>
        </div>
        <div className="relative flex-1 flex items-center justify-center overflow-hidden">
          <span className="select-none text-[200px] font-bold leading-none text-white/5 tracking-tighter">
            AF
          </span>
        </div>
        <div className="space-y-2">
          <p className="text-white/60 text-sm leading-relaxed">
            Enterprise Asset & Resource Management.
          </p>
          <p className="text-white/40 text-xs">
            Track assets, manage allocations, run audits — all in one platform.
          </p>
        </div>
      </div>

      {/* Right — form half */}
      <div className="flex flex-1 items-center justify-center bg-canvas px-6 py-12">
        <div className="w-full max-w-[400px] rounded-xl border border-border bg-surface p-8 shadow-sm">
          {/* Mobile logo */}
          <div className="mb-6 flex items-center gap-2 lg:hidden">
            <div className="flex h-7 w-7 items-center justify-center rounded bg-signal text-xs font-semibold text-white">
              AF
            </div>
            <span className="text-sm font-semibold tracking-tight text-ink">AssetFlow</span>
          </div>
          <div className="mb-6">
            <h1 className="text-xl font-semibold tracking-tight text-ink">{title}</h1>
            {subtitle && <p className="mt-1 text-sm text-ink3">{subtitle}</p>}
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}
