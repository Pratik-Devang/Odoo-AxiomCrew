import type { ReactNode } from "react";
import { Zap } from "lucide-react";

export function AuthCard({ title, subtitle, children }: { title: string; subtitle?: string; children: ReactNode }) {
  return (
    <div className="flex min-h-[100dvh]">
      {/* Left panel — solid ink, flat design */}
      <div className="hidden lg:flex lg:w-[46%] flex-col justify-between bg-ink px-12 py-10 border-r-2 border-ink">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center border-2 border-signal bg-signal">
            <Zap size={14} className="text-white fill-white" />
          </div>
          <span className="text-sm font-bold uppercase tracking-widest text-white">AssetFlow</span>
        </div>

        {/* Center decorative block */}
        <div className="flex flex-1 flex-col items-start justify-center gap-8 py-16">
          <div className="border-l-4 border-signal pl-6">
            <p className="text-3xl font-bold leading-tight text-white">
              Enterprise<br />Asset Management
            </p>
          </div>
          <div className="space-y-3">
            {[
              "Track the full asset lifecycle",
              "Role-based approval workflows",
              "Maintenance, audits & bookings",
            ].map((item) => (
              <div key={item} className="flex items-center gap-3">
                <div className="h-1.5 w-1.5 shrink-0 bg-signal" />
                <p className="text-sm text-white/50">{item}</p>
              </div>
            ))}
          </div>
        </div>

        <p className="text-[10px] font-bold uppercase tracking-widest text-white/20">
          AssetFlow &copy; 2026
        </p>
      </div>

      {/* Right panel — form */}
      <div className="flex flex-1 items-center justify-center bg-canvas px-6 py-12">
        <div className="w-full max-w-[400px]">
          {/* Mobile logo */}
          <div className="mb-8 flex items-center gap-2 lg:hidden">
            <div className="flex h-7 w-7 items-center justify-center border-2 border-signal bg-signal">
              <Zap size={12} className="text-white fill-white" />
            </div>
            <span className="text-sm font-bold uppercase tracking-widest text-ink">AssetFlow</span>
          </div>

          {/* Title */}
          <div className="mb-6 border-l-4 border-signal pl-4">
            <h1 className="text-xl font-bold tracking-tight text-ink">{title}</h1>
            {subtitle && <p className="mt-1 text-sm text-ink3">{subtitle}</p>}
          </div>

          {/* Form content (from children) */}
          <div className="border-2 border-ink bg-surface p-6">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
