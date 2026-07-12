"use client";

import { useState } from "react";
import { StatusChip } from "@/components/status-chip";
import { AssetTag } from "@/components/asset-tag";
import { Plus, ClipboardList, CheckSquare, AlertTriangle, ChevronRight } from "lucide-react";

type AuditStatus = "OPEN" | "CLOSED";
type Verification = "PENDING" | "VERIFIED" | "MISSING" | "DAMAGED";

type AuditCycle = {
  id: number; name: string; department: string; status: AuditStatus;
  startDate: string; endDate: string; total: number; verified: number; missing: number; damaged: number;
};

type AuditItem = {
  id: number; tag: string; asset: string; location: string; verification: Verification; auditor: string;
};

const auditCycles: AuditCycle[] = [
  { id: 1, name: "Q4 2025 — Technology",  department: "Technology", status: "OPEN",   startDate: "Dec 1, 2025",  endDate: "Dec 31, 2025", total: 45, verified: 38, missing: 2, damaged: 1 },
  { id: 2, name: "Q4 2025 — Operations",  department: "Operations", status: "OPEN",   startDate: "Dec 1, 2025",  endDate: "Dec 31, 2025", total: 28, verified: 18, missing: 0, damaged: 3 },
  { id: 3, name: "Q3 2025 — Facilities",  department: "Facilities", status: "CLOSED", startDate: "Sep 1, 2025",  endDate: "Sep 30, 2025", total: 17, verified: 17, missing: 0, damaged: 0 },
];

const auditItems: AuditItem[] = [
  { id: 1, tag: "AF-0001", asset: "Dell XPS 15 Laptop",  location: "Floor 2, Desk 14",  verification: "VERIFIED", auditor: "Elena T." },
  { id: 2, tag: "AF-0003", asset: "Canon EOS R6 Camera", location: "Service Center",     verification: "MISSING",  auditor: "Elena T." },
  { id: 3, tag: "AF-0006", asset: "MacBook Pro 14\"",    location: "Floor 2, Desk 22",  verification: "VERIFIED", auditor: "Marcus R." },
  { id: 4, tag: "AF-0008", asset: "Toyota HiAce Van",    location: "Parking Lot B",     verification: "DAMAGED",  auditor: "Marcus R." },
  { id: 5, tag: "AF-0009", asset: "Cisco IP Phone",      location: "Store Room B",      verification: "PENDING",  auditor: "—" },
  { id: 6, tag: "AF-0012", asset: "Keyboard + Mouse Set",location: "Store Room A",      verification: "VERIFIED", auditor: "Elena T." },
];

export default function AuditsPage() {
  const [selectedCycle, setSelectedCycle] = useState<AuditCycle | null>(auditCycles[0]);

  const pct = selectedCycle ? Math.round((selectedCycle.verified / selectedCycle.total) * 100) : 0;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b-2 border-ink pb-4">
        <div>
          <h1 className="text-lg font-bold uppercase tracking-widest text-ink">Audits</h1>
          <p className="text-xs text-ink3 mt-0.5">{auditCycles.filter(c => c.status === "OPEN").length} open cycles</p>
        </div>
        <button className="af-btn-primary gap-1.5">
          <Plus size={13} />
          New Audit Cycle
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Left: cycle list */}
        <div className="space-y-2">
          <p className="text-[9px] font-bold uppercase tracking-[0.15em] text-ink3">Audit Cycles</p>
          <div className="border-2 border-ink divide-y-2 divide-ink">
            {auditCycles.map((cycle) => {
              const cycPct = Math.round((cycle.verified / cycle.total) * 100);
              const isSelected = selectedCycle?.id === cycle.id;
              return (
                <button
                  key={cycle.id}
                  onClick={() => setSelectedCycle(cycle)}
                  className={`w-full text-left px-4 py-3.5 transition-colors ${isSelected ? "bg-ink text-white" : "bg-surface hover:bg-canvas"}`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <p className={`text-xs font-bold leading-tight ${isSelected ? "text-white" : "text-ink"}`}>{cycle.name}</p>
                    <span className={`border text-[9px] font-bold uppercase px-1.5 py-px ml-2 shrink-0 ${
                      cycle.status === "OPEN"
                        ? isSelected ? "border-signal bg-signal text-white" : "border-go text-go"
                        : isSelected ? "border-white/30 text-white/50" : "border-ink3 text-ink3"
                    }`}>
                      {cycle.status}
                    </span>
                  </div>
                  {/* Progress bar */}
                  <div className={`h-1 w-full ${isSelected ? "bg-white/20" : "bg-sunken"}`}>
                    <div
                      className={`h-full ${isSelected ? "bg-signal" : "bg-go"}`}
                      style={{ width: `${cycPct}%` }}
                    />
                  </div>
                  <div className={`flex justify-between mt-1 text-[9px] ${isSelected ? "text-white/60" : "text-ink3"}`}>
                    <span>{cycPct}% verified</span>
                    <span>{cycle.verified}/{cycle.total}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right: detail panel */}
        {selectedCycle && (
          <div className="lg:col-span-2 space-y-4">
            {/* KPI row */}
            <div className="flex gap-px border-2 border-ink bg-ink">
              {[
                { label: "Total",    value: selectedCycle.total,    color: "bg-surface" },
                { label: "Verified", value: selectedCycle.verified,  color: "bg-go_bg" },
                { label: "Missing",  value: selectedCycle.missing,   color: "bg-danger_bg" },
                { label: "Damaged",  value: selectedCycle.damaged,   color: "bg-warn_bg" },
              ].map((stat) => (
                <div key={stat.label} className={`flex-1 ${stat.color} px-4 py-3`}>
                  <p className="text-[9px] font-bold uppercase tracking-widest text-ink3">{stat.label}</p>
                  <p className="text-2xl font-bold text-ink">{stat.value}</p>
                </div>
              ))}
            </div>

            {/* Progress bar */}
            <div className="border-2 border-ink bg-surface px-4 py-3">
              <div className="flex justify-between mb-2">
                <p className="text-[10px] font-bold uppercase tracking-widest text-ink3">Verification Progress</p>
                <p className="text-xs font-bold text-ink">{pct}%</p>
              </div>
              <div className="h-3 w-full bg-canvas border border-ink/20">
                <div className="h-full bg-signal transition-all" style={{ width: `${pct}%` }} />
              </div>
            </div>

            {/* Discrepancy alerts */}
            {(selectedCycle.missing > 0 || selectedCycle.damaged > 0) && (
              <div className="flex items-center gap-3 border-2 border-warn bg-warn_bg px-4 py-3">
                <AlertTriangle size={14} className="text-warn shrink-0" />
                <p className="text-xs font-bold text-warn">
                  {selectedCycle.missing} missing, {selectedCycle.damaged} damaged — review required.
                </p>
              </div>
            )}

            {/* Items table */}
            <div className="border-2 border-ink bg-surface overflow-hidden">
              <div className="border-b-2 border-ink bg-canvas px-4 py-2.5 flex items-center justify-between">
                <p className="text-[10px] font-bold uppercase tracking-widest text-ink">
                  <ClipboardList size={12} className="inline mr-1.5 mb-px" />
                  Checksheet
                </p>
                <span className="text-[9px] text-ink3">{auditItems.length} items</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-canvas">
                      <th className="af-th">Tag</th>
                      <th className="af-th">Asset</th>
                      <th className="af-th">Location</th>
                      <th className="af-th">Verification</th>
                      <th className="af-th">Auditor</th>
                      <th className="af-th w-8"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {auditItems.map((item) => (
                      <tr key={item.id} className="hover:bg-canvas transition-colors">
                        <td className="af-td"><AssetTag tag={item.tag} /></td>
                        <td className="af-td font-medium text-ink">{item.asset}</td>
                        <td className="af-td text-xs text-ink3">{item.location}</td>
                        <td className="af-td"><StatusChip status={item.verification} size="sm" /></td>
                        <td className="af-td text-ink3">{item.auditor}</td>
                        <td className="af-td">
                          {item.verification === "PENDING" && (
                            <button className="flex items-center gap-1 text-[10px] font-bold text-signal hover:text-signal2 transition-colors">
                              <CheckSquare size={12} /> Verify
                            </button>
                          )}
                          {item.verification !== "PENDING" && (
                            <ChevronRight size={12} className="text-ink3" />
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
