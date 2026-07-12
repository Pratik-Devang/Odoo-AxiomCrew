"use client";

import { useEffect, useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { FileDown, Loader2, AlertTriangle } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { SectionHeader } from "@/components/section-header";

type ReportPayload = {
  departmentUsage: Array<{ name: string; count: number }>;
  maintenanceFrequency: Array<{ name: string; count: number }>;
  mostUsedAssets: Array<{ id: number; label: string; score: number }>;
  idleAssets: Array<{ id: number; label: string; unusedDays: number }>;
  maintenanceDue: Array<{ id: number; label: string; reasons: string[] }>;
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
            <div className="af-card p-5">
              <div className="mb-5 flex items-center justify-between">
                <SectionHeader title="Utilization by department" className="mb-0" />
                <span className="text-xs text-ink3">{totalUsage} total events</span>
              </div>
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.departmentUsage} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#D6D4CE" vertical={false} />
                    <XAxis dataKey="name" stroke="#8A8880" fontSize={11} tickLine={false} />
                    <YAxis stroke="#8A8880" fontSize={11} tickLine={false} allowDecimals={false} />
                    <Tooltip
                      contentStyle={{ backgroundColor: "#FFFFFF", borderColor: "#D6D4CE", borderRadius: "6px" }}
                      itemStyle={{ color: "#1C1C1A", fontSize: "12px" }}
                    />
                    <Bar dataKey="count" fill="#2563EB" radius={[4, 4, 0, 0]} maxBarSize={42} name="Usage events" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="af-card p-5">
              <SectionHeader title="Maintenance Frequency" />
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={data.maintenanceFrequency} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#D6D4CE" vertical={false} />
                    <XAxis dataKey="name" stroke="#8A8880" fontSize={11} tickLine={false} />
                    <YAxis stroke="#8A8880" fontSize={11} tickLine={false} allowDecimals={false} />
                    <Tooltip
                      contentStyle={{ backgroundColor: "#FFFFFF", borderColor: "#D6D4CE", borderRadius: "6px" }}
                      itemStyle={{ color: "#1C1C1A", fontSize: "12px" }}
                    />
                    <Line type="monotone" dataKey="count" stroke="#16A34A" strokeWidth={2} dot name="Requests" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
            <ReportList
              title="Most used assets"
              empty="No asset activity yet."
              items={data.mostUsedAssets.map((asset) => ({ id: asset.id, text: asset.label }))}
            />
            <ReportList
              title="Idle assets"
              empty="No available assets have been idle for 30+ days."
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

function ReportList({ title, items, empty }: { title: string; items: Array<{ id: number; text: string }>; empty: string }) {
  return (
    <div className="af-card p-5">
      <SectionHeader title={title} />
      {items.length > 0 ? (
        <div className="space-y-3">
          {items.map((item) => (
            <div key={item.id} className="rounded-md border border-border bg-sunken px-4 py-3 text-sm text-ink2">
              {item.text}
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-ink3">{empty}</p>
      )}
    </div>
  );
}
