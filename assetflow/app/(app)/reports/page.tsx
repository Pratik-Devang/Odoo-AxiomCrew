"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Activity, AlertTriangle, ArchiveX, FileDown, Loader2, TrendingUp, Wrench, type LucideIcon } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { SectionHeader } from "@/components/section-header";

type ReportPayload = {
  departmentUsage: Array<{ name: string; count: number }>;
  maintenanceFrequency: Array<{ name: string; count: number }>;
  mostUsedAssets: Array<{ id: number; label: string; score: number }>;
  idleAssets: Array<{ id: number; label: string; unusedDays: number }>;
  maintenanceDue: Array<{ id: number; label: string; reasons: string[] }>;
};

const chartTheme = {
  ink: "#1A1F2E",
  muted: "#7C8494",
  border: "#E4E2DC",
  grid: "#E8E5DE",
  surface: "#FFFFFF",
  canvas: "#F8F7F4",
  accent: "#6B5FE4",
  accentLight: "#EEECFB",
  go: "#3A9E6F",
  goLight: "#E8F5EE",
  warn: "#D4860A",
};

function exportCsv(data: ReportPayload) {
  const rows = [
    ["Section", "Item", "Value"],
    ...data.departmentUsage.map((item) => ["Utilization by department", item.name, String(item.count)]),
    ...data.maintenanceFrequency.map((item) => ["Maintenance frequency", item.name, String(item.count)]),
    ...data.mostUsedAssets.map((item) => ["Most used assets", item.label, String(item.score)]),
    ...data.idleAssets.map((item) => ["Idle assets", item.label, `${item.unusedDays} days`]),
    ...data.maintenanceDue.map((item) => ["Maintenance / retirement", item.label, item.reasons.join("; ")]),
  ];

  const csv = rows
    .map((row) => row.map((cell) => `"${cell.replaceAll('"', '""')}"`).join(","))
    .join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = "assetflow-report.csv";
  link.click();
  URL.revokeObjectURL(url);
}

export default function ReportsPage() {
  const [data, setData] = useState<ReportPayload | null>(null);
  const [error, setError] = useState("");
  const [isUnauthorized, setIsUnauthorized] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadReports() {
      try {
        const response = await fetch("/api/reports", { cache: "no-store" });

        if (response.status === 403 || response.status === 401) {
          if (!cancelled) setIsUnauthorized(true);
          return;
        }

        const payload = (await response.json()) as ReportPayload;

        if (!cancelled) {
          setData(payload);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Unable to load reports");
        }
      }
    }

    loadReports();

    return () => {
      cancelled = true;
    };
  }, []);

  const totalUsage = useMemo(() => data?.departmentUsage.reduce((sum, item) => sum + item.count, 0) ?? 0, [data]);
  const totalMaintenance = useMemo(
    () => data?.maintenanceFrequency.reduce((sum, item) => sum + item.count, 0) ?? 0,
    [data],
  );

  if (isUnauthorized) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <AlertTriangle size={32} className="text-danger mb-3" />
        <h2 className="text-lg font-bold text-ink uppercase tracking-wider">Access Denied</h2>
        <p className="text-sm text-ink3 mt-1">You do not have permission to view reports.</p>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Reports & Analytics"
        action={
          data ? (
            <button onClick={() => exportCsv(data)} className="af-btn-primary">
              <FileDown size={14} />
              Export report
            </button>
          ) : null
        }
      />

      {error && (
        <div className="mb-6 rounded-lg border border-danger/30 bg-danger_bg px-4 py-3 text-sm text-danger">
          {error}
        </div>
      )}

      {!data && !error ? (
        <div className="flex min-h-[18rem] items-center justify-center text-sm text-ink3">
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Loading reports
        </div>
      ) : null}

      {data ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
            <ChartCard
              title="Utilization by department"
              value={totalUsage}
              suffix="events"
              icon={TrendingUp}
              tone="accent"
            >
              <div className="h-[292px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.departmentUsage} margin={{ top: 16, right: 10, left: -18, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="4 4" stroke={chartTheme.grid} vertical={false} />
                    <XAxis
                      dataKey="name"
                      axisLine={{ stroke: chartTheme.border }}
                      stroke={chartTheme.muted}
                      fontSize={11}
                      tickLine={false}
                      tickMargin={10}
                    />
                    <YAxis
                      axisLine={false}
                      stroke={chartTheme.muted}
                      fontSize={11}
                      tickLine={false}
                      tickMargin={8}
                      allowDecimals={false}
                    />
                    <Tooltip
                      cursor={{ fill: chartTheme.accentLight }}
                      content={<ChartTooltip metricLabel="Usage events" color={chartTheme.accent} />}
                    />
                    <Bar dataKey="count" fill={chartTheme.accent} radius={[6, 6, 0, 0]} maxBarSize={44} name="Usage events" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </ChartCard>

            <ChartCard
              title="Maintenance frequency"
              value={totalMaintenance}
              suffix="requests"
              icon={Wrench}
              tone="go"
            >
              <div className="h-[292px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={data.maintenanceFrequency} margin={{ top: 16, right: 12, left: -18, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="4 4" stroke={chartTheme.grid} vertical={false} />
                    <XAxis
                      dataKey="name"
                      axisLine={{ stroke: chartTheme.border }}
                      stroke={chartTheme.muted}
                      fontSize={11}
                      tickLine={false}
                      tickMargin={10}
                    />
                    <YAxis
                      axisLine={false}
                      stroke={chartTheme.muted}
                      fontSize={11}
                      tickLine={false}
                      tickMargin={8}
                      allowDecimals={false}
                    />
                    <Tooltip
                      cursor={{ stroke: chartTheme.border, strokeDasharray: "4 4" }}
                      content={<ChartTooltip metricLabel="Requests" color={chartTheme.go} />}
                    />
                    <Line
                      type="monotone"
                      dataKey="count"
                      stroke={chartTheme.go}
                      strokeWidth={2.5}
                      dot={{ r: 3, strokeWidth: 2, fill: chartTheme.surface, stroke: chartTheme.go }}
                      activeDot={{ r: 5, strokeWidth: 2, fill: chartTheme.go, stroke: chartTheme.surface }}
                      name="Requests"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </ChartCard>
          </div>

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
            <ReportList
              title="Most used assets"
              empty="No asset activity yet."
              icon={Activity}
              items={data.mostUsedAssets.map((asset) => ({ id: asset.id, text: asset.label }))}
            />
            <ReportList
              title="Idle assets"
              empty="No available assets have been idle for 30+ days."
              icon={ArchiveX}
              items={data.idleAssets.map((asset) => ({
                id: asset.id,
                text: `${asset.label}: unused ${asset.unusedDays} days`,
              }))}
            />
          </div>

          <div className="af-card p-5">
            <SectionHeader title="Assets due for maintenance / nearing retirement" />
            {data.maintenanceDue.length > 0 ? (
              <div className="divide-y divide-border">
                {data.maintenanceDue.map((asset) => (
                  <div key={asset.id} className="flex items-center justify-between gap-4 py-3">
                    <span className="text-sm font-medium text-ink">{asset.label}</span>
                    <span className="text-xs text-ink3">{asset.reasons.join(", ")}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-ink3">No assets currently match the maintenance heuristic.</p>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function ChartCard({
  title,
  value,
  suffix,
  icon: Icon,
  tone,
  children,
}: {
  title: string;
  value: number;
  suffix: string;
  icon: LucideIcon;
  tone: "accent" | "go";
  children: ReactNode;
}) {
  const toneClass =
    tone === "accent"
      ? "bg-violet_bg text-signal border-violet_bg"
      : "bg-go_bg text-go border-go_bg";

  return (
    <div className="af-card overflow-hidden">
      <div className="flex items-start justify-between gap-4 border-b border-border px-5 py-4">
        <div className="flex items-center gap-3">
          <div className={`flex h-9 w-9 items-center justify-center rounded-md border ${toneClass}`}>
            <Icon size={18} strokeWidth={1.5} />
          </div>
          <div>
            <SectionHeader title={title} className="mb-0" />
            <p className="mt-1 text-xs text-ink3">Last six reporting periods</p>
          </div>
        </div>
        <div className="text-right">
          <p className="font-display text-2xl font-semibold leading-none tracking-[-0.3px] text-ink">{value}</p>
          <p className="mt-1 text-xs text-ink3">{suffix}</p>
        </div>
      </div>
      <div className="px-5 py-4">{children}</div>
    </div>
  );
}

function ChartTooltip({
  active,
  payload,
  metricLabel,
  color,
}: {
  active?: boolean;
  payload?: Array<{ value?: number | string }>;
  metricLabel: string;
  color: string;
}) {
  if (!active || !payload?.length) return null;

  return (
    <div className="rounded-md border border-border bg-surface px-3 py-2 text-sm shadow-[0_4px_24px_rgba(30,42,58,0.10)]">
      <div className="mb-1 text-[11px] font-semibold uppercase tracking-[0.06em] text-ink3">{metricLabel}</div>
      <div className="flex items-center gap-2">
        <span className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} />
        <span className="font-display text-lg font-semibold leading-none text-ink">{payload[0].value}</span>
      </div>
    </div>
  );
}

function ReportList({
  title,
  items,
  empty,
  icon: Icon,
}: {
  title: string;
  items: Array<{ id: number; text: string }>;
  empty: string;
  icon: LucideIcon;
}) {
  return (
    <div className="af-card overflow-hidden">
      <div className="flex items-center gap-3 border-b border-border px-5 py-4">
        <div className="flex h-9 w-9 items-center justify-center rounded-md bg-violet_bg text-signal">
          <Icon size={18} strokeWidth={1.5} />
        </div>
        <SectionHeader title={title} className="mb-0" />
      </div>
      {items.length > 0 ? (
        <div className="divide-y divide-border">
          {items.map((item) => (
            <div key={item.id} className="flex min-h-12 items-center px-5 py-3 text-sm text-ink2 hover:bg-canvas">
              {item.text}
            </div>
          ))}
        </div>
      ) : (
        <p className="px-5 py-5 text-sm text-ink3">{empty}</p>
      )}
    </div>
  );
}
