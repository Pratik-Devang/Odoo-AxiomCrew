"use client";

import { useState } from "react";
import { StatusChip } from "@/components/status-chip";
import { AssetTag } from "@/components/asset-tag";
import { AlertTriangle, ArrowLeftRight, Plus, Check, X, Clock } from "lucide-react";

const allocations = [
  { id: 1, tag: "AF-0001", asset: "Dell XPS 15 Laptop",    holder: "Priya Shah",        dept: "Technology", since: "Dec 1, 2025",  due: "Jan 15, 2026",  status: "ALLOCATED", overdue: false },
  { id: 2, tag: "AF-0006", asset: 'MacBook Pro 14"',        holder: "Liam Patel",        dept: "Technology", since: "Nov 20, 2025", due: "Dec 20, 2025",  status: "ALLOCATED", overdue: true  },
  { id: 3, tag: "AF-0008", asset: "Toyota HiAce Van",       holder: "Ethan Brown",       dept: "Facilities", since: "Dec 5, 2025",  due: "Dec 19, 2025",  status: "ALLOCATED", overdue: true  },
  { id: 4, tag: "AF-0010", asset: 'Sony Bravia 65" TV',     holder: "Conference Room A", dept: "Operations", since: "Oct 1, 2025",  due: null,            status: "ALLOCATED", overdue: false },
];

const transferRequests = [
  { id: 1, tag: "AF-0003", asset: "Canon EOS R6 Camera", from: "Priya Shah",   to: "Noah Williams", reason: "Project reassignment", status: "REQUESTED", requestedAt: "Dec 12, 2025" },
  { id: 2, tag: "AF-0009", asset: "Cisco IP Phone",      from: "Marcus Reed",  to: "Mia Chen",      reason: "Department transfer",  status: "APPROVED",  requestedAt: "Dec 10, 2025" },
];

type TabType = "active" | "overdue" | "transfers";

const TABS: [TabType, string][] = [
  ["active",    "Active Allocations"],
  ["overdue",   `Overdue (${allocations.filter((a) => a.overdue).length})`],
  ["transfers", "Transfer Requests"],
];

export default function AllocationsPage() {
  const [tab, setTab] = useState<TabType>("active");

  const overdueCount = allocations.filter((a) => a.overdue).length;
  const displayed = tab === "overdue" ? allocations.filter((a) => a.overdue) : allocations;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b-2 border-ink pb-4">
        <div>
          <h1 className="text-lg font-bold uppercase tracking-widest text-ink">Allocation & Transfer</h1>
          <p className="text-xs text-ink3 mt-0.5">{allocations.length} active allocations</p>
        </div>
        <button className="af-btn-primary gap-1.5">
          <Plus size={13} />
          New Allocation
        </button>
      </div>

      {/* Overdue alert */}
      {overdueCount > 0 && (
        <div className="flex items-center gap-3 border-2 border-danger bg-danger_bg px-4 py-3">
          <AlertTriangle size={14} className="text-danger shrink-0" />
          <p className="text-xs font-bold text-danger">
            {overdueCount} allocation{overdueCount > 1 ? "s" : ""} are overdue — immediate action required.
          </p>
        </div>
      )}

      {/* Flat tab bar */}
      <div className="flex border-b-2 border-ink">
        {TABS.map(([t, label]) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-5 py-2.5 text-[10px] font-bold uppercase tracking-widest border-b-2 -mb-[2px] transition-colors ${
              tab === t
                ? "border-signal text-signal bg-canvas"
                : "border-transparent text-ink3 hover:text-ink"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Active / Overdue table */}
      {tab !== "transfers" ? (
        <div className="border-2 border-ink bg-surface overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-canvas">
                  <th className="af-th">Asset</th>
                  <th className="af-th">Name</th>
                  <th className="af-th">Holder</th>
                  <th className="af-th">Department</th>
                  <th className="af-th">Since</th>
                  <th className="af-th">Due Date</th>
                  <th className="af-th">Actions</th>
                </tr>
              </thead>
              <tbody>
                {displayed.map((row) => (
                  <tr key={row.id} className={`hover:bg-canvas transition-colors ${row.overdue ? "bg-danger_bg/30" : ""}`}>
                    <td className="af-td"><AssetTag tag={row.tag} /></td>
                    <td className="af-td font-medium text-ink">{row.asset}</td>
                    <td className="af-td text-ink2">{row.holder}</td>
                    <td className="af-td text-ink3">{row.dept}</td>
                    <td className="af-td font-mono text-xs text-ink3">{row.since}</td>
                    <td className="af-td">
                      {row.due ? (
                        <span className={`flex items-center gap-1.5 font-mono text-xs ${row.overdue ? "text-danger font-bold" : "text-ink3"}`}>
                          {row.overdue && <Clock size={11} />}
                          {row.due}
                          {row.overdue && <span className="border border-danger bg-danger_bg text-danger text-[9px] font-bold uppercase px-1 py-px">Overdue</span>}
                        </span>
                      ) : (
                        <span className="text-xs text-ink3">Permanent</span>
                      )}
                    </td>
                    <td className="af-td">
                      <div className="flex items-center gap-1.5">
                        <button className="af-btn-secondary text-[10px] px-2 py-1">
                          <ArrowLeftRight size={11} />
                          Transfer
                        </button>
                        <button className="border border-go bg-go_bg text-go hover:bg-go hover:text-white text-[10px] px-2 py-1 font-bold transition-colors">
                          <Check size={11} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Transfer requests */
        <div className="border-2 border-ink bg-surface overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-canvas">
                  <th className="af-th">Asset</th>
                  <th className="af-th">Name</th>
                  <th className="af-th">From</th>
                  <th className="af-th">To</th>
                  <th className="af-th">Reason</th>
                  <th className="af-th">Requested</th>
                  <th className="af-th">Status</th>
                  <th className="af-th">Actions</th>
                </tr>
              </thead>
              <tbody>
                {transferRequests.map((req) => (
                  <tr key={req.id} className="hover:bg-canvas transition-colors">
                    <td className="af-td"><AssetTag tag={req.tag} /></td>
                    <td className="af-td font-medium text-ink">{req.asset}</td>
                    <td className="af-td text-ink2">{req.from}</td>
                    <td className="af-td text-ink2">{req.to}</td>
                    <td className="af-td text-xs text-ink3 max-w-[160px] truncate">{req.reason}</td>
                    <td className="af-td font-mono text-xs text-ink3">{req.requestedAt}</td>
                    <td className="af-td">
                      <StatusChip status={req.status === "REQUESTED" ? "PENDING" : "AVAILABLE"} size="sm" />
                    </td>
                    <td className="af-td">
                      {req.status === "REQUESTED" && (
                        <div className="flex gap-1.5">
                          <button className="border border-go bg-go_bg text-go hover:bg-go hover:text-white text-[10px] px-2 py-1 font-bold transition-colors flex items-center gap-1">
                            <Check size={11} /> Approve
                          </button>
                          <button className="border border-danger bg-danger_bg text-danger hover:bg-danger hover:text-white text-[10px] px-2 py-1 font-bold transition-colors flex items-center gap-1">
                            <X size={11} /> Reject
                          </button>
                        </div>
                      )}
                      {req.status === "APPROVED" && (
                        <span className="text-[10px] font-bold text-go uppercase tracking-widest">Approved</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
