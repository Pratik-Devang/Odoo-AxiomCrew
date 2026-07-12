"use client";

import { useState } from "react";
import { PageHeader } from "@/components/page-header";
import { SectionHeader } from "@/components/section-header";
import { StatusChip } from "@/components/status-chip";
import { AssetTag } from "@/components/asset-tag";
import { EmptyState } from "@/components/empty-state";
import { Search, SlidersHorizontal, Plus, X, ChevronRight, Package } from "lucide-react";

const assets = [
  { tag: "AF-0001", name: "Dell XPS 15 Laptop", category: "Electronics", status: "ALLOCATED", holder: "Priya Shah", location: "Floor 2, Desk 14", condition: "Good" },
  { tag: "AF-0002", name: "Herman Miller Aeron Chair", category: "Furniture", status: "AVAILABLE", holder: "—", location: "Store Room A", condition: "Excellent" },
  { tag: "AF-0003", name: "Canon EOS R6 Camera", category: "Electronics", status: "UNDER_MAINTENANCE", holder: "—", location: "Service Center", condition: "Fair" },
  { tag: "AF-0004", name: "Standing Desk 180cm", category: "Furniture", status: "AVAILABLE", holder: "—", location: "Floor 3, Bay 5", condition: "Good" },
  { tag: "AF-0005", name: "Projector Epson EB-L510U", category: "AV Equipment", status: "RESERVED", holder: "Meeting Room B", location: "Floor 1", condition: "Good" },
  { tag: "AF-0006", name: "MacBook Pro 14\"", category: "Electronics", status: "ALLOCATED", holder: "Liam Patel", location: "Floor 2, Desk 22", condition: "Excellent" },
  { tag: "AF-0007", name: "Whiteboard 240x120", category: "Office Equipment", status: "AVAILABLE", holder: "—", location: "Floor 3, Room 12", condition: "Good" },
  { tag: "AF-0008", name: "Toyota HiAce Van", category: "Vehicles", status: "ALLOCATED", holder: "Ethan Brown", location: "Parking Lot B", condition: "Good" },
  { tag: "AF-0009", name: "Cisco IP Phone 8800", category: "Electronics", status: "AVAILABLE", holder: "—", location: "Store Room B", condition: "Excellent" },
  { tag: "AF-0010", name: "Sony Bravia 65\" TV", category: "AV Equipment", status: "ALLOCATED", holder: "Conference Room A", location: "Floor 1", condition: "Good" },
  { tag: "AF-0011", name: "HP LaserJet Pro", category: "Office Equipment", status: "UNDER_MAINTENANCE", holder: "—", location: "Service Center", condition: "Fair" },
  { tag: "AF-0012", name: "Ergonomic Keyboard + Mouse Set", category: "Electronics", status: "AVAILABLE", holder: "—", location: "Store Room A", condition: "Good" },
];

interface AssetDetailDrawerProps {
  asset: (typeof assets)[0] | null;
  onClose: () => void;
}

function AssetDetailDrawer({ asset, onClose }: AssetDetailDrawerProps) {
  const [tab, setTab] = useState<"details" | "history">("details");

  if (!asset) return null;

  const details = [
    { label: "Asset Tag", value: <AssetTag tag={asset.tag} /> },
    { label: "Category", value: asset.category },
    { label: "Status", value: <StatusChip status={asset.status} /> },
    { label: "Current Holder", value: asset.holder || "Unassigned" },
    { label: "Location", value: asset.location },
    { label: "Condition", value: asset.condition },
  ];

  const history = [
    { event: "Allocated", detail: "Assigned to Priya Shah", date: "Dec 10, 2025" },
    { event: "Returned", detail: "Returned to store", date: "Nov 28, 2025" },
    { event: "Maintenance", detail: "Screen replaced", date: "Nov 15, 2025" },
    { event: "Registered", detail: "Asset added to registry", date: "Jan 5, 2025" },
  ];

  return (
    <div className="fixed inset-0 z-50 flex justify-end" onClick={onClose}>
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
            <h2 className="text-lg font-semibold text-ink">{asset.name}</h2>
          </div>
          <button onClick={onClose} className="text-ink3 hover:text-ink transition">
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
                tab === t ? "border-signal text-ink" : "border-transparent text-ink3 hover:text-ink"
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
                  <dt className="text-xs font-medium uppercase tracking-widest text-ink3">{d.label}</dt>
                  <dd className="text-sm text-ink text-right">{d.value}</dd>
                </div>
              ))}
            </dl>
          )}
          {tab === "history" && (
            <div className="relative">
              <div className="absolute left-2 top-2 bottom-2 w-px bg-border" />
              <div className="space-y-5 pl-8">
                {history.map((h, i) => (
                  <div key={i} className="relative">
                    <div className="absolute -left-6 top-1 h-3 w-3 rounded-full border-2 border-signal bg-surface" />
                    <p className="text-sm font-medium text-ink">{h.event}</p>
                    <p className="text-xs text-ink3">{h.detail}</p>
                    <p className="text-xs text-ink3 mt-0.5">{h.date}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="border-t border-border p-4 flex gap-3">
          <button className="af-btn-primary flex-1">Allocate</button>
          <button className="af-btn-secondary flex-1">Raise Maintenance</button>
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
  const [selectedAsset, setSelectedAsset] = useState<(typeof assets)[0] | null>(null);
  const [filterOpen, setFilterOpen] = useState(false);

  const filtered = assets.filter(
    (a) =>
      a.name.toLowerCase().includes(search.toLowerCase()) ||
      a.tag.toLowerCase().includes(search.toLowerCase()) ||
      a.category.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <PageHeader
        title="Asset Registry"
        action={
          <button className="af-btn-primary">
            <Plus size={14} />
            Register Asset
          </button>
        }
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
          onClick={() => setFilterOpen(!filterOpen)}
          className="af-btn-secondary gap-2 px-4"
        >
          <SlidersHorizontal size={14} />
          Filters
        </button>
      </div>

      {/* Stats row */}
      <div className="flex gap-6 mb-4 px-1">
        {[
          { label: "Total", count: assets.length },
          { label: "Available", count: assets.filter((a) => a.status === "AVAILABLE").length },
          { label: "Allocated", count: assets.filter((a) => a.status === "ALLOCATED").length },
          { label: "Maintenance", count: assets.filter((a) => a.status === "UNDER_MAINTENANCE").length },
        ].map((s) => (
          <div key={s.label} className="flex items-center gap-1.5">
            <span className="text-xs text-ink3">{s.label}:</span>
            <span className="text-xs font-semibold text-ink">{s.count}</span>
          </div>
        ))}
      </div>

      {/* Table */}
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
                {filtered.map((asset) => (
                  <tr
                    key={asset.tag}
                    className="hover:bg-sunken transition-colors cursor-pointer"
                    onClick={() => setSelectedAsset(asset)}
                  >
                    <td className="af-td">
                      <AssetTag tag={asset.tag} />
                    </td>
                    <td className="af-td font-medium text-ink">{asset.name}</td>
                    <td className="af-td text-ink3">{asset.category}</td>
                    <td className="af-td">
                      <StatusChip status={asset.status} size="sm" />
                    </td>
                    <td className="af-td text-ink3">{asset.holder}</td>
                    <td className="af-td text-ink3">{asset.location}</td>
                    <td className="af-td text-ink3">{asset.condition}</td>
                    <td className="af-td">
                      <ChevronRight size={14} className="text-ink3" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Detail drawer */}
      {selectedAsset && (
        <AssetDetailDrawer asset={selectedAsset} onClose={() => setSelectedAsset(null)} />
      )}
    </div>
  );
}
