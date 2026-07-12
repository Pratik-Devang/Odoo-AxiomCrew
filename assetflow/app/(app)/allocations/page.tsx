"use client";

import { useState } from "react";
import { PageHeader } from "@/components/page-header";
import { SectionHeader } from "@/components/section-header";
import { StatusChip } from "@/components/status-chip";
import { AssetTag } from "@/components/asset-tag";
import { AlertTriangle, Lock, ArrowLeftRight, Plus, Check, X } from "lucide-react";

const allocations = [
  { id: 1, tag: "AF-0001", asset: "Dell XPS 15 Laptop", holder: "Priya Shah", dept: "Technology", since: "Dec 1, 2025", due: "Jan 15, 2026", status: "ALLOCATED", overdue: false },
  { id: 2, tag: "AF-0006", asset: "MacBook Pro 14\"", holder: "Liam Patel", dept: "Technology", since: "Nov 20, 2025", due: "Dec 20, 2025", status: "ALLOCATED", overdue: true },
  { id: 3, tag: "AF-0008", asset: "Toyota HiAce Van", holder: "Ethan Brown", dept: "Facilities", since: "Dec 5, 2025", due: "Dec 19, 2025", status: "ALLOCATED", overdue: true },
  { id: 4, tag: "AF-0010", asset: "Sony Bravia 65\" TV", holder: "Conference Room A", dept: "Operations", since: "Oct 1, 2025", due: null, status: "ALLOCATED", overdue: false },
];

const transferRequests = [
  { id: 1, tag: "AF-0003", asset: "Canon EOS R6 Camera", from: "Priya Shah", to: "Noah Williams", reason: "Project reassignment", status: "REQUESTED", requestedAt: "Dec 12, 2025" },
  { id: 2, tag: "AF-0009", asset: "Cisco IP Phone", from: "Marcus Reed", to: "Mia Chen", reason: "Department transfer", status: "APPROVED", requestedAt: "Dec 10, 2025" },
];

type TabType = "active" | "overdue" | "transfers";

export default function AllocationsPage() {
  const [tab, setTab] = useState<TabType>("active");
  const [selected, setSelected] = useState<(typeof allocations)[0] | null>(null);

  const displayed = tab === "overdue" ? allocations.filter((a) => a.overdue) : allocations;

  return (
    <div>
      <PageHeader
        title="Allocation & Transfer"
        action={
          <button className="af-btn-primary">
            <Plus size={14} />
            New Allocation
          </button>
        }
      />

      {/* Tabs */}
      <div className="flex border-b border-border mb-6">
        {([["active", "Active Allocations"], ["overdue", `Overdue (${allocations.filter((a) => a.overdue).length})`], ["transfers", "Transfer Requests"]] as [TabType, string][]).map(([t, label]) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`mr-6 py-3 text-sm font-medium transition border-b-2 ${
              tab === t ? "border-signal text-ink" : "border-transparent text-ink3 hover:text-ink"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* List */}
        <div className="lg:col-span-2">
          {tab !== "transfers" ? (
            <div className="af-card overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr>
                    <th className="af-th">Asset</th>
                    <th className="af-th">Holder</th>
                    <th className="af-th">Department</th>
                    <th className="af-th">Since</th>
                    <th className="af-th">Due</th>
                  </tr>
                </thead>
                <tbody>
                  {displayed.map((row) => (
                    <tr
                      key={row.id}
                      onClick={() => setSelected(row)}
                      className={`cursor-pointer hover:bg-sunken transition-colors ${
                        row.overdue ? "border-l-4 border-danger" : ""
                      }`}
                    >
                      <td className="af-td">
                        <div className="flex flex-col gap-1">
                          <AssetTag tag={row.tag} />
                          <span className="text-xs text-ink">{row.asset}</span>
                        </div>
                      </td>
                      <td className="af-td text-ink2">{row.holder}</td>
                      <td className="af-td text-ink3">{row.dept}</td>
                      <td className="af-td text-ink3">{row.since}</td>
                      <td className="af-td">
                        {row.due ? (
                          <span className={row.overdue ? "text-danger font-medium text-xs" : "text-ink3 text-xs"}>
                            {row.overdue && "⚠ "}{row.due}
                          </span>
                        ) : (
                          <span className="text-ink3 text-xs">No return date</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="space-y-3">
              {transferRequests.map((req) => (
                <div key={req.id} className="af-card p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <AssetTag tag={req.tag} />
                      <span className="text-sm font-medium text-ink">{req.asset}</span>
                    </div>
                    <StatusChip status={req.status === "REQUESTED" ? "RESERVED" : "AVAILABLE"} size="sm" />
                  </div>
                  <div className="flex items-center gap-2 text-xs text-ink3 mb-2">
                    <span>{req.from}</span>
                    <ArrowLeftRight size={12} />
                    <span className="text-ink">{req.to}</span>
                  </div>
                  <p className="text-xs text-ink3 mb-3">{req.reason}</p>
                  {/* Stepper */}
                  <div className="flex items-center gap-2">
                    {["Requested", "Approved", "Re-Allocated"].map((step, i) => {
                      const filled = req.status === "APPROVED" ? i <= 1 : i === 0;
                      return (
                        <div key={step} className="flex items-center gap-2">
                          <div className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-medium ${filled ? "bg-signal text-white" : "border border-border2 text-ink3"}`}>
                            {filled ? <Check size={10} /> : i + 1}
                          </div>
                          <span className={`text-xs ${filled ? "text-ink" : "text-ink3"}`}>{step}</span>
                          {i < 2 && <div className={`h-px w-6 ${filled ? "bg-signal" : "bg-border"}`} />}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Action panel */}
        <div>
          {selected ? (
            <div className="af-card p-5 sticky top-20">
              <SectionHeader title="Allocation Detail" />
              <div className="space-y-3 mb-4">
                <AssetTag tag={selected.tag} />
                <p className="text-sm font-medium text-ink">{selected.asset}</p>
                {selected.overdue && (
                  <div className="rounded-lg border border-warn/40 bg-warn_bg p-4">
                    <div className="flex items-center gap-2 mb-1">
                      <Lock size={14} className="text-warn" />
                      <span className="text-xs font-semibold text-warn">Overdue Return</span>
                    </div>
                    <p className="text-xs text-warn/80">Currently held by {selected.holder}</p>
                    <p className="text-xs text-warn/80">Was due: {selected.due}</p>
                    <button className="mt-3 w-full af-btn-secondary text-warn border-warn/30">
                      Request Transfer →
                    </button>
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <button className="af-btn-primary w-full">Mark as Returned</button>
                <button className="af-btn-secondary w-full">Request Transfer</button>
              </div>
            </div>
          ) : (
            <div className="af-card p-5 flex flex-col items-center justify-center py-12 text-center">
              <ArrowLeftRight size={32} className="text-ink3 mb-3" />
              <p className="text-sm text-ink3">Select an allocation to view details</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
