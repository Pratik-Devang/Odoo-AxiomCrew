"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { SectionHeader } from "@/components/section-header";
import { StatusChip } from "@/components/status-chip";
import { AssetTag } from "@/components/asset-tag";
import { EmptyState } from "@/components/empty-state";
import { Search, SlidersHorizontal, Plus, X, ChevronRight, Package, Loader2 } from "lucide-react";

interface Asset {
  id: number;
  tag: string;
  name: string;
  status: string;
  location: string;
  condition: string;
  acquisitionDate: string;
  acquisitionCost: string;
  category: { id: number; name: string };
  currentHolder: { id: number; name: string } | null;
  currentHolderDepartment: { id: number; name: string } | null;
}

interface MaintenanceRequest {
  id: number;
  status: string;
  issueDescription: string;
  technicianName: string | null;
  raisedAt: string;
}

interface AssetDetailDrawerProps {
  asset: Asset | null;
  onClose: () => void;
}

function AssetDetailDrawer({ asset, onClose }: AssetDetailDrawerProps) {
  const [tab, setTab] = useState<"details" | "history">("details");
  const [history, setHistory] = useState<{ event: string; detail: string; date: string }[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  useEffect(() => {
    if (!asset) return;

    const fetchHistory = async () => {
      setIsLoadingHistory(true);
      try {
        const response = await fetch(`/api/maintenance-requests?assetId=${asset.id}`, { cache: "no-store" });
        if (response.ok) {
          const data = await response.json();
          const requests: MaintenanceRequest[] = data.requests || [];

          // Map maintenance requests to history format
          const maintenanceHistory = requests.map((req) => ({
            event: `Maintenance — ${req.status.replace("_", " ")}`,
            detail: `${req.issueDescription}${req.technicianName ? ` (tech: ${req.technicianName})` : ""}`,
            date: new Date(req.raisedAt).toLocaleDateString(undefined, {
              month: "short",
              day: "numeric",
              year: "numeric",
            }),
          }));

          // Add a base registration event
          const registrationEvent = {
            event: "Registered",
            detail: "Asset added to registry",
            date: new Date(asset.acquisitionDate).toLocaleDateString(undefined, {
              month: "short",
              day: "numeric",
              year: "numeric",
            }),
          };

          setHistory([...maintenanceHistory, registrationEvent]);
        }
      } catch (err) {
        console.error("Failed to load asset maintenance history:", err);
      } finally {
        setIsLoadingHistory(false);
      }
    };

    void fetchHistory();
  }, [asset]);

  if (!asset) return null;

  const currentHolderName = asset.currentHolder?.name || asset.currentHolderDepartment?.name || "—";

  const details = [
    { label: "Asset Tag", value: <AssetTag tag={asset.tag} /> },
    { label: "Category", value: asset.category.name },
    { label: "Status", value: <StatusChip status={asset.status} /> },
    { label: "Current Holder", value: currentHolderName },
    { label: "Location", value: asset.location },
    { label: "Condition", value: asset.condition },
    {
      label: "Acquisition Date",
      value: new Date(asset.acquisitionDate).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
      }),
    },
    { label: "Acquisition Cost", value: `$${parseFloat(asset.acquisitionCost).toFixed(2)}` },
  ];

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/30" onClick={onClose}>
      <div
        className="w-[480px] h-full bg-surface border-l border-border shadow-lg flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        style={{ animation: "slideInRight 0.2s ease-out" }}
      >
        {/* Header */}
        <div className="flex items-start justify-between p-5 border-b border-border">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <AssetTag tag={asset.tag} />
              <StatusChip status={asset.status} size="sm" />
            </div>
            <h2 className="text-lg font-semibold text-ink leading-snug">{asset.name}</h2>
          </div>
          <button onClick={onClose} className="text-ink3 hover:text-ink transition p-1 rounded hover:bg-sunken">
            <X size={18} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-border px-5">
          {(["details", "history"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`mr-6 py-3 text-sm font-medium transition border-b-2 capitalize ${
                tab === t ? "border-signal text-ink font-semibold" : "border-transparent text-ink3 hover:text-ink"
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5">
          {tab === "details" && (
            <dl className="space-y-4">
              {details.map((d) => (
                <div key={d.label} className="flex items-start justify-between py-2 border-b border-border last:border-0">
                  <dt className="text-xs font-semibold uppercase tracking-widest text-ink3 mt-0.5">{d.label}</dt>
                  <dd className="text-sm text-ink text-right font-medium">{d.value}</dd>
                </div>
              ))}
            </dl>
          )}
          {tab === "history" && (
            <div className="relative min-h-[150px]">
              {isLoadingHistory ? (
                <div className="absolute inset-0 flex items-center justify-center">
                  <Loader2 size={24} className="animate-spin text-signal" />
                  <span className="ml-2 text-xs text-ink3">Loading history...</span>
                </div>
              ) : (
                <>
                  <div className="absolute left-2.5 top-2.5 bottom-2.5 w-px bg-border" />
                  <div className="space-y-5 pl-8">
                    {history.map((h, i) => (
                      <div key={i} className="relative">
                        <div className="absolute -left-7 top-1 h-3 w-3 rounded-full border-2 border-signal bg-surface" />
                        <p className="text-sm font-semibold text-ink">{h.event}</p>
                        <p className="text-xs text-ink2 mt-0.5 leading-relaxed">{h.detail}</p>
                        <p className="text-[10px] text-ink3 mt-1 font-mono">{h.date}</p>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="border-t border-border p-4 flex gap-3">
          <Link href={`/maintenance`} className="flex-1 af-btn-primary">
            Manage Maintenance
          </Link>
          <button onClick={onClose} className="flex-1 af-btn-secondary">
            Close
          </button>
        </div>
      </div>
      <style>{`
        @keyframes slideInRight {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
}

export default function AssetsPage() {
  const [search, setSearch] = useState("");
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [assetsList, setAssetsList] = useState<Asset[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAssets = async () => {
      try {
        const response = await fetch("/api/assets", { cache: "no-store" });
        if (response.ok) {
          const data = await response.json();
          setAssetsList(data.assets || []);
        }
      } catch (err) {
        console.error("Failed to load assets:", err);
      } finally {
        setIsLoading(false);
      }
    };
    void fetchAssets();
  }, []);

  const filtered = assetsList.filter(
    (a) =>
      a.name.toLowerCase().includes(search.toLowerCase()) ||
      a.tag.toLowerCase().includes(search.toLowerCase()) ||
      a.category.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <PageHeader
        title="Asset Registry"
      />

      {/* Search bar */}
      <div className="flex gap-3 mb-4">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink3" />
          <input
            type="text"
            placeholder="Search by name, tag, or category…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-border bg-surface pl-9 pr-4 py-2.5 text-sm text-ink placeholder:text-ink3 focus:border-signal focus:outline-none focus:ring-1 focus:ring-signal/30"
          />
        </div>
        <button
          className="af-btn-secondary gap-2 px-4 opacity-50 cursor-not-allowed"
          disabled
        >
          <SlidersHorizontal size={14} />
          Filters
        </button>
      </div>

      {/* Stats row */}
      <div className="flex gap-6 mb-4 px-1">
        {[
          { label: "Total", count: assetsList.length },
          { label: "Available", count: assetsList.filter((a) => a.status === "AVAILABLE").length },
          { label: "Allocated", count: assetsList.filter((a) => a.status === "ALLOCATED").length },
          { label: "Maintenance", count: assetsList.filter((a) => a.status === "UNDER_MAINTENANCE").length },
        ].map((s) => (
          <div key={s.label} className="flex items-center gap-1.5">
            <span className="text-xs text-ink3">{s.label}:</span>
            <span className="text-xs font-semibold text-ink">{s.count}</span>
          </div>
        ))}
      </div>

      {/* Table / List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20 bg-surface rounded-lg border border-border">
          <Loader2 size={24} className="animate-spin text-signal mr-2" />
          <span className="text-sm text-ink3">Loading assets...</span>
        </div>
      ) : (
        <div className="af-card overflow-hidden">
          {filtered.length === 0 ? (
            <EmptyState icon={Package} heading="No assets found" description="Try adjusting your search or filters." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr>
                    <th className="af-th">Asset Tag</th>
                    <th className="af-th">Name</th>
                    <th className="af-th">Category</th>
                    <th className="af-th">Status</th>
                    <th className="af-th">Assigned To</th>
                    <th className="af-th">Location</th>
                    <th className="af-th">Condition</th>
                    <th className="af-th w-8" />
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((asset) => {
                    const assignedTo = asset.currentHolder?.name || asset.currentHolderDepartment?.name || "—";
                    return (
                      <tr
                        key={asset.tag}
                        className="hover:bg-sunken transition-colors cursor-pointer"
                        onClick={() => setSelectedAsset(asset)}
                      >
                        <td className="af-td">
                          <AssetTag tag={asset.tag} />
                        </td>
                        <td className="af-td font-semibold text-ink leading-snug">{asset.name}</td>
                        <td className="af-td text-ink2">{asset.category.name}</td>
                        <td className="af-td">
                          <StatusChip status={asset.status} size="sm" />
                        </td>
                        <td className="af-td text-ink2">{assignedTo}</td>
                        <td className="af-td text-ink3">{asset.location}</td>
                        <td className="af-td text-ink3">{asset.condition}</td>
                        <td className="af-td">
                          <ChevronRight size={14} className="text-ink3" />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Detail drawer */}
      {selectedAsset && (
        <AssetDetailDrawer asset={selectedAsset} onClose={() => setSelectedAsset(null)} />
      )}
    </div>
  );
}
