"use client";

import { useState } from "react";
import { StatusChip } from "@/components/status-chip";
import { AssetTag } from "@/components/asset-tag";
import { Wrench, Plus, AlertTriangle, Check, X, ChevronRight } from "lucide-react";

type Priority = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
type MStatus  = "PENDING" | "APPROVED" | "REJECTED" | "TECHNICIAN_ASSIGNED" | "IN_PROGRESS" | "RESOLVED";

type Ticket = {
  id: number; tag: string; asset: string; issue: string;
  priority: Priority; status: MStatus; requestedBy: string; date: string;
};

const initialTickets: Ticket[] = [
  { id: 1, tag: "AF-0003", asset: "Canon EOS R6",      issue: "Lens autofocus failure",   priority: "HIGH",     status: "IN_PROGRESS",        requestedBy: "Priya Shah",   date: "Dec 10, 2025" },
  { id: 2, tag: "AF-0011", asset: "HP LaserJet Pro",   issue: "Paper jam, roller worn",   priority: "MEDIUM",   status: "TECHNICIAN_ASSIGNED", requestedBy: "Mia Chen",     date: "Dec 11, 2025" },
  { id: 3, tag: "AF-0008", asset: "Toyota HiAce Van",  issue: "Engine check light on",    priority: "CRITICAL", status: "PENDING",             requestedBy: "Ethan Brown",  date: "Dec 12, 2025" },
  { id: 4, tag: "AF-0006", asset: "MacBook Pro 14\"",  issue: "Battery not charging",     priority: "LOW",      status: "PENDING",             requestedBy: "Liam Patel",   date: "Dec 13, 2025" },
  { id: 5, tag: "AF-0001", asset: "Dell XPS 15",       issue: "Screen flickering",        priority: "MEDIUM",   status: "APPROVED",            requestedBy: "Noah Williams",date: "Dec 9, 2025"  },
  { id: 6, tag: "AF-0002", asset: "Aeron Chair",       issue: "Armrest broken",           priority: "LOW",      status: "RESOLVED",            requestedBy: "Elena T.",     date: "Dec 7, 2025"  },
];

const COLUMNS: { status: MStatus; label: string }[] = [
  { status: "PENDING",             label: "Pending" },
  { status: "APPROVED",            label: "Approved" },
  { status: "TECHNICIAN_ASSIGNED", label: "Assigned" },
  { status: "IN_PROGRESS",         label: "In Progress" },
  { status: "RESOLVED",            label: "Resolved" },
];

const priorityStyle: Record<Priority, string> = {
  LOW:      "border-ink3 text-ink3",
  MEDIUM:   "border-warn text-warn",
  HIGH:     "border-danger text-danger",
  CRITICAL: "border-danger bg-danger text-white",
};

export default function MaintenancePage() {
  const [tickets, setTickets] = useState(initialTickets);
  const [view, setView] = useState<"kanban" | "list">("kanban");

  const approve = (id: number) =>
    setTickets((prev) => prev.map((t) => t.id === id ? { ...t, status: "APPROVED" } : t));
  const reject  = (id: number) =>
    setTickets((prev) => prev.map((t) => t.id === id ? { ...t, status: "REJECTED" } : t));

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b-2 border-ink pb-4">
        <div>
          <h1 className="text-lg font-bold uppercase tracking-widest text-ink">Maintenance</h1>
          <p className="text-xs text-ink3 mt-0.5">{tickets.filter(t => t.status === "PENDING").length} pending review</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex border-2 border-ink">
            {(["kanban", "list"] as const).map((v, i) => (
              <button key={v} onClick={() => setView(v)}
                className={`px-3 py-1.5 text-[10px] font-bold uppercase transition-colors ${i > 0 ? "border-l-2 border-ink" : ""} ${view === v ? "bg-ink text-white" : "bg-surface text-ink hover:bg-canvas"}`}
              >
                {v}
              </button>
            ))}
          </div>
          <button className="af-btn-primary gap-1.5">
            <Plus size={13} />
            New Request
          </button>
        </div>
      </div>

      {/* Critical alert */}
      {tickets.filter(t => t.priority === "CRITICAL" && t.status === "PENDING").length > 0 && (
        <div className="flex items-center gap-3 border-2 border-danger bg-danger_bg px-4 py-3">
          <AlertTriangle size={14} className="text-danger shrink-0" />
          <p className="text-xs font-bold text-danger">
            {tickets.filter(t => t.priority === "CRITICAL" && t.status === "PENDING").length} CRITICAL priority ticket awaiting approval.
          </p>
        </div>
      )}

      {view === "kanban" ? (
        /* Kanban columns */
        <div className="flex gap-0 overflow-x-auto border-2 border-ink">
          {COLUMNS.map((col, colIdx) => {
            const colTickets = tickets.filter((t) => t.status === col.status);
            return (
              <div key={col.status} className={`min-w-[220px] flex-1 flex flex-col ${colIdx > 0 ? "border-l-2 border-ink" : ""}`}>
                {/* Column header */}
                <div className="flex items-center justify-between border-b-2 border-ink bg-canvas px-3 py-2.5">
                  <p className="text-[9px] font-bold uppercase tracking-[0.15em] text-ink2">{col.label}</p>
                  <span className="border border-ink bg-surface px-1.5 py-px text-[9px] font-bold text-ink3">
                    {colTickets.length}
                  </span>
                </div>

                {/* Cards */}
                <div className="flex-1 bg-sunken p-2 space-y-2 min-h-[300px]">
                  {colTickets.length === 0 && (
                    <div className="flex items-center justify-center py-8">
                      <Wrench size={16} className="text-ink3/30" />
                    </div>
                  )}
                  {colTickets.map((ticket) => (
                    <div key={ticket.id} className="border-2 border-ink bg-surface p-3 space-y-2 cursor-pointer hover:bg-canvas transition-colors">
                      <div className="flex items-start justify-between gap-2">
                        <AssetTag tag={ticket.tag} />
                        <span className={`border text-[8px] font-bold uppercase px-1.5 py-px ${priorityStyle[ticket.priority]}`}>
                          {ticket.priority}
                        </span>
                      </div>
                      <p className="text-xs font-semibold text-ink leading-tight">{ticket.asset}</p>
                      <p className="text-[11px] text-ink3 leading-snug">{ticket.issue}</p>
                      <div className="flex items-center justify-between pt-1 border-t border-ink/10">
                        <span className="text-[10px] text-ink3">{ticket.requestedBy}</span>
                        {ticket.status === "PENDING" && (
                          <div className="flex gap-1">
                            <button onClick={() => approve(ticket.id)}
                              className="border border-go bg-go_bg text-go hover:bg-go hover:text-white p-1 transition-colors">
                              <Check size={10} />
                            </button>
                            <button onClick={() => reject(ticket.id)}
                              className="border border-danger bg-danger_bg text-danger hover:bg-danger hover:text-white p-1 transition-colors">
                              <X size={10} />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* List view */
        <div className="border-2 border-ink bg-surface overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-canvas">
                  <th className="af-th">Asset</th>
                  <th className="af-th">Name</th>
                  <th className="af-th">Issue</th>
                  <th className="af-th">Priority</th>
                  <th className="af-th">Status</th>
                  <th className="af-th">Requested By</th>
                  <th className="af-th">Date</th>
                  <th className="af-th">Actions</th>
                </tr>
              </thead>
              <tbody>
                {tickets.map((t) => (
                  <tr key={t.id} className="hover:bg-canvas transition-colors">
                    <td className="af-td"><AssetTag tag={t.tag} /></td>
                    <td className="af-td font-medium text-ink">{t.asset}</td>
                    <td className="af-td text-xs text-ink3 max-w-[160px] truncate">{t.issue}</td>
                    <td className="af-td">
                      <span className={`border text-[9px] font-bold uppercase px-1.5 py-0.5 ${priorityStyle[t.priority]}`}>{t.priority}</span>
                    </td>
                    <td className="af-td"><StatusChip status={t.status} size="sm" /></td>
                    <td className="af-td text-ink3">{t.requestedBy}</td>
                    <td className="af-td font-mono text-xs text-ink3">{t.date}</td>
                    <td className="af-td">
                      {t.status === "PENDING" && (
                        <div className="flex gap-1.5">
                          <button onClick={() => approve(t.id)} className="border border-go bg-go_bg text-go hover:bg-go hover:text-white text-[10px] px-2 py-1 font-bold flex items-center gap-1 transition-colors">
                            <Check size={10} /> Approve
                          </button>
                          <button onClick={() => reject(t.id)} className="border border-danger bg-danger_bg text-danger hover:bg-danger hover:text-white text-[10px] px-2 py-1 font-bold flex items-center gap-1 transition-colors">
                            <X size={10} /> Reject
                          </button>
                        </div>
                      )}
                      {t.status !== "PENDING" && (
                        <button className="text-ink3 hover:text-signal transition-colors"><ChevronRight size={13} /></button>
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
