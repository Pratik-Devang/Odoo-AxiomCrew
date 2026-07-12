"use client";

import { useState } from "react";
import { StatusChip } from "@/components/status-chip";
import { AssetTag } from "@/components/asset-tag";
import { Search, Plus, X, Package, Filter, ChevronRight } from "lucide-react";

const STATUSES = ["All", "AVAILABLE", "ALLOCATED", "UNDER_MAINTENANCE", "RESERVED", "RETIRED"];
const CATEGORIES = ["All", "Electronics", "Furniture", "AV Equipment", "Office Equipment", "Vehicles"];

const assets = [
  { tag: "AF-0001", name: "Dell XPS 15 Laptop",             category: "Electronics",     status: "ALLOCATED",          holder: "Priya Shah",        location: "Floor 2, Desk 14",    condition: "Good" },
  { tag: "AF-0002", name: "Herman Miller Aeron Chair",       category: "Furniture",       status: "AVAILABLE",          holder: "—",                 location: "Store Room A",         condition: "Excellent" },
  { tag: "AF-0003", name: "Canon EOS R6 Camera",            category: "Electronics",     status: "UNDER_MAINTENANCE",  holder: "—",                 location: "Service Center",       condition: "Fair" },
  { tag: "AF-0004", name: "Standing Desk 180cm",            category: "Furniture",       status: "AVAILABLE",          holder: "—",                 location: "Floor 3, Bay 5",       condition: "Good" },
  { tag: "AF-0005", name: "Projector Epson EB-L510U",       category: "AV Equipment",    status: "RESERVED",           holder: "Meeting Room B",    location: "Floor 1",             condition: "Good" },
  { tag: "AF-0006", name: 'MacBook Pro 14"',                category: "Electronics",     status: "ALLOCATED",          holder: "Liam Patel",        location: "Floor 2, Desk 22",    condition: "Excellent" },
  { tag: "AF-0007", name: "Whiteboard 240x120",             category: "Office Equipment",status: "AVAILABLE",          holder: "—",                 location: "Floor 3, Room 12",    condition: "Good" },
  { tag: "AF-0008", name: "Toyota HiAce Van",               category: "Vehicles",        status: "ALLOCATED",          holder: "Ethan Brown",       location: "Parking Lot B",       condition: "Good" },
  { tag: "AF-0009", name: "Cisco IP Phone 8800",            category: "Electronics",     status: "AVAILABLE",          holder: "—",                 location: "Store Room B",         condition: "Excellent" },
  { tag: "AF-0010", name: 'Sony Bravia 65" TV',             category: "AV Equipment",    status: "ALLOCATED",          holder: "Conference Room A", location: "Floor 1",             condition: "Good" },
  { tag: "AF-0011", name: "HP LaserJet Pro",                category: "Office Equipment",status: "UNDER_MAINTENANCE",  holder: "—",                 location: "Service Center",       condition: "Fair" },
  { tag: "AF-0012", name: "Ergonomic Keyboard + Mouse Set", category: "Electronics",     status: "AVAILABLE",          holder: "—",                 location: "Store Room A",         condition: "Good" },
];

type Asset = (typeof assets)[0];

function AssetDetailDrawer({ asset, onClose }: { asset: Asset | null; onClose: () => void }) {
  const [tab, setTab] = useState<"details" | "history">("details");
  if (!asset) return null;

  const details = [
    { label: "Asset Tag",       value: <AssetTag tag={asset.tag} /> },
    { label: "Category",        value: asset.category },
    { label: "Status",          value: <StatusChip status={asset.status} /> },
    { label: "Current Holder",  value: asset.holder || "Unassigned" },
    { label: "Location",        value: asset.location },
    { label: "Condition",       value: asset.condition },
  ];

  const history = [
    { event: "Allocated",   detail: "Assigned to Priya Shah",     date: "Dec 10, 2025" },
    { event: "Returned",    detail: "Returned to store",           date: "Nov 28, 2025" },
    { event: "Maintenance", detail: "Screen replaced",             date: "Nov 15, 2025" },
    { event: "Registered",  detail: "Asset added to registry",     date: "Jan 5, 2025" },
  ];

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-ink/30" onClick={onClose}>
      <div
        className="w-[460px] h-full bg-surface border-l-2 border-ink flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drawer header */}
        <div className="flex items-start justify-between border-b-2 border-ink p-5">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-ink3 mb-1">Asset Detail</p>
            <h2 className="text-base font-bold text-ink">{asset.name}</h2>
            <AssetTag tag={asset.tag} />
          </div>
          <button onClick={onClose} className="border border-ink p-1 text-ink2 hover:bg-danger hover:border-danger hover:text-white transition-colors">
            <X size={14} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b-2 border-ink">
          {(["details", "history"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 py-2.5 text-[10px] font-bold uppercase tracking-widest border-b-2 -mb-[2px] transition-colors ${
                tab === t ? "border-signal text-signal bg-canvas" : "border-transparent text-ink3 hover:text-ink"
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto">
          {tab === "details" ? (
            <dl className="divide-y divide-ink/10">
              {details.map((d) => (
                <div key={d.label} className="flex items-center justify-between px-5 py-3.5">
                  <dt className="text-[10px] font-bold uppercase tracking-widest text-ink3 w-32 shrink-0">{d.label}</dt>
                  <dd className="text-sm text-ink text-right">{d.value}</dd>
                </div>
              ))}
            </dl>
          ) : (
            <div className="divide-y divide-ink/10">
              {history.map((h, i) => (
                <div key={i} className="flex items-center gap-4 px-5 py-3.5">
                  <div className="h-2 w-2 shrink-0 bg-signal" />
                  <div className="flex-1">
                    <p className="text-xs font-bold text-ink">{h.event}</p>
                    <p className="text-[11px] text-ink3">{h.detail}</p>
                  </div>
                  <span className="font-mono text-[10px] text-ink3">{h.date}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="border-t-2 border-ink p-4 flex gap-2">
          <button className="af-btn-primary flex-1 text-xs">Allocate</button>
          <button className="af-btn-secondary flex-1 text-xs">Maintenance</button>
        </div>
      </div>
    </div>
  );
}

export default function AssetsPage() {
  const [query, setQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");
  const [filterCategory, setFilterCategory] = useState("All");
  const [selected, setSelected] = useState<Asset | null>(null);

  const filtered = assets.filter((a) => {
    const matchQ = !query || a.name.toLowerCase().includes(query.toLowerCase()) || a.tag.toLowerCase().includes(query.toLowerCase());
    const matchS = filterStatus === "All" || a.status === filterStatus;
    const matchC = filterCategory === "All" || a.category === filterCategory;
    return matchQ && matchS && matchC;
  });

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b-2 border-ink pb-4">
        <div>
          <h1 className="text-lg font-bold uppercase tracking-widest text-ink">Asset Registry</h1>
          <p className="text-xs text-ink3 mt-0.5">{assets.length} total assets</p>
        </div>
        <button className="af-btn-primary gap-1.5">
          <Plus size={13} />
          Register Asset
        </button>
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[220px]">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink3" />
          <input
            type="search"
            placeholder="Search by tag or name…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="af-input pl-8 text-xs"
          />
        </div>

        <div className="flex items-center gap-1">
          <Filter size={12} className="text-ink3" />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="border-2 border-ink bg-surface px-2 py-1.5 text-xs font-medium text-ink outline-none focus:border-signal"
          >
            {STATUSES.map((s) => <option key={s}>{s}</option>)}
          </select>

          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="border-2 border-ink bg-surface px-2 py-1.5 text-xs font-medium text-ink outline-none focus:border-signal"
          >
            {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
          </select>
        </div>

        <span className="border border-ink/30 bg-canvas px-2 py-1 text-[10px] font-bold text-ink3">
          {filtered.length} results
        </span>
      </div>

      {/* Table */}
      <div className="border-2 border-ink bg-surface overflow-hidden">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-20">
            <Package size={32} className="text-ink3" />
            <p className="text-sm font-bold text-ink3">No assets match your filters</p>
            <button onClick={() => { setQuery(""); setFilterStatus("All"); setFilterCategory("All"); }} className="af-btn-secondary">
              Clear filters
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-canvas">
                  <th className="af-th">Tag</th>
                  <th className="af-th">Name</th>
                  <th className="af-th">Category</th>
                  <th className="af-th">Status</th>
                  <th className="af-th">Holder</th>
                  <th className="af-th">Location</th>
                  <th className="af-th">Condition</th>
                  <th className="af-th w-8"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((asset) => (
                  <tr
                    key={asset.tag}
                    onClick={() => setSelected(asset)}
                    className="cursor-pointer hover:bg-canvas transition-colors group"
                  >
                    <td className="af-td"><AssetTag tag={asset.tag} /></td>
                    <td className="af-td font-medium text-ink">{asset.name}</td>
                    <td className="af-td text-ink3">{asset.category}</td>
                    <td className="af-td"><StatusChip status={asset.status} size="sm" /></td>
                    <td className="af-td text-ink2">{asset.holder}</td>
                    <td className="af-td text-ink3">{asset.location}</td>
                    <td className="af-td">
                      <span className={`border text-[9px] font-bold uppercase px-1.5 py-0.5 ${
                        asset.condition === "Excellent" ? "border-go bg-go_bg text-go"
                          : asset.condition === "Good" ? "border-ink2 bg-canvas text-ink2"
                          : "border-warn bg-warn_bg text-warn"
                      }`}>
                        {asset.condition}
                      </span>
                    </td>
                    <td className="af-td">
                      <ChevronRight size={13} className="text-ink3 group-hover:text-signal transition-colors" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selected && <AssetDetailDrawer asset={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}
