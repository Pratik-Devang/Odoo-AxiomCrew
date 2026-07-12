"use client";

import { useState } from "react";
import { PageHeader } from "@/components/page-header";
import { SectionHeader } from "@/components/section-header";
import { AssetTag } from "@/components/asset-tag";
import { StatusChip } from "@/components/status-chip";
import { Plus, Check, X, AlertOctagon } from "lucide-react";

// Mock tickets
const initialTickets = [
  { id: 1, title: "Laptop Screen Cracked", assetTag: "AF-0114", category: "Electronics", raisedBy: "Priya Shah", when: "2d ago", priority: "HIGH", status: "PENDING" },
  { id: 2, title: "Chair gas lift leaking", assetTag: "AF-0032", category: "Furniture", raisedBy: "Marcus Reed", when: "3d ago", priority: "MEDIUM", status: "APPROVED" },
  { id: 3, title: "Projector lamp burnt out", assetTag: "AF-0055", category: "AV Equipment", raisedBy: "Elena Torres", when: "5d ago", priority: "CRITICAL", status: "IN_PROGRESS" },
  { id: 4, title: "Van brakes squealing", assetTag: "AF-0008", category: "Vehicles", raisedBy: "Ethan Brown", when: "1w ago", priority: "CRITICAL", status: "RESOLVED" },
  { id: 5, title: "Keyboard keys sticky", assetTag: "AF-0012", category: "Electronics", raisedBy: "Liam Patel", when: "10d ago", priority: "LOW", status: "REJECTED" },
];

const priorityBadges: Record<string, string> = {
  LOW: "bg-go_bg text-go",
  MEDIUM: "bg-warn_bg text-warn",
  HIGH: "bg-danger_bg text-danger",
  CRITICAL: "bg-red-700 text-white font-bold",
};

const columns = [
  { id: "PENDING", label: "Pending" },
  { id: "APPROVED", label: "Approved" },
  { id: "IN_PROGRESS", label: "In Progress" },
  { id: "RESOLVED", label: "Resolved" },
  { id: "REJECTED", label: "Rejected" },
];

export default function MaintenancePage() {
  const [tickets, setTickets] = useState(initialTickets);
  const [toastMsg, setToastMsg] = useState("");

  const updateStatus = (ticketId: number, nextStatus: string) => {
    const updated = tickets.map((t) => {
      if (t.id === ticketId) {
        return { ...t, status: nextStatus };
      }
      return t;
    });
    setTickets(updated);

    const ticket = tickets.find(t => t.id === ticketId);
    if (ticket) {
      if (nextStatus === "APPROVED" || nextStatus === "IN_PROGRESS") {
        showToast(`${ticket.assetTag} status updated to Under Maintenance`);
      } else {
        showToast(`Ticket for ${ticket.assetTag} marked as ${nextStatus.toLowerCase()}`);
      }
    }
  };

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(""), 4000);
  };

  return (
    <div className="relative">
      <PageHeader
        title="Maintenance Management"
        action={
          <button className="af-btn-primary">
            <Plus size={14} />
            Raise Request
          </button>
        }
      />

      {/* Kanban Board */}
      <div className="flex gap-4 overflow-x-auto pb-4 items-start select-none min-h-[calc(100vh-14rem)]">
        {columns.map((col) => {
          const colTickets = tickets.filter((t) => t.status === col.id);
          return (
            <div key={col.id} className="w-[300px] shrink-0 bg-sunken rounded-lg p-3">
              <div className="flex items-center justify-between mb-4 px-1">
                <SectionHeader title={col.label} className="mb-0" />
                <span className="bg-surface border border-border px-1.5 py-0.5 rounded text-[10px] font-semibold text-ink3">
                  {colTickets.length}
                </span>
              </div>

              <div className="space-y-3">
                {colTickets.map((t) => (
                  <div key={t.id} className="af-kanban-card">
                    <div className="flex items-center justify-between mb-2">
                      <span className={`text-[9px] uppercase tracking-wider font-semibold rounded px-1.5 py-0.5 ${priorityBadges[t.priority]}`}>
                        {t.priority}
                      </span>
                      <AssetTag tag={t.assetTag} />
                    </div>
                    <h3 className="text-sm font-semibold text-ink mb-1">{t.title}</h3>
                    <p className="text-[11px] text-ink3 mb-3">Raised by {t.raisedBy} · {t.when}</p>

                    {/* Pending actions for Asset Managers / Admins */}
                    {t.status === "PENDING" && (
                      <div className="flex gap-2 border-t border-border pt-3 mt-3">
                        <button
                          onClick={() => updateStatus(t.id, "APPROVED")}
                          className="flex-1 af-btn-secondary gap-1 border-go/30 text-go bg-go_bg hover:bg-go/25 hover:text-go px-2 py-1 text-[11px]"
                        >
                          <Check size={12} />
                          Approve
                        </button>
                        <button
                          onClick={() => updateStatus(t.id, "REJECTED")}
                          className="flex-1 af-btn-secondary gap-1 border-danger/30 text-danger bg-danger_bg hover:bg-danger/25 hover:text-danger px-2 py-1 text-[11px]"
                        >
                          <X size={12} />
                          Reject
                        </button>
                      </div>
                    )}

                    {t.status === "APPROVED" && (
                      <button
                        onClick={() => updateStatus(t.id, "IN_PROGRESS")}
                        className="w-full af-btn-secondary text-[11px] py-1 border-signal/30 text-signal bg-signal/5"
                      >
                        Start Maintenance
                      </button>
                    )}

                    {t.status === "IN_PROGRESS" && (
                      <button
                        onClick={() => updateStatus(t.id, "RESOLVED")}
                        className="w-full af-btn-secondary text-[11px] py-1 border-go/30 text-go bg-go_bg"
                      >
                        Mark Resolved
                      </button>
                    )}

                    {(t.status === "RESOLVED" || t.status === "REJECTED") && (
                      <div className="text-[11px] text-center text-ink3 border-t border-border pt-2 mt-2">
                        Ticket Closed
                      </div>
                    )}
                  </div>
                ))}

                {colTickets.length === 0 && (
                  <div className="py-8 text-center text-xs text-ink3 bg-surface/50 border border-dashed border-border rounded-lg">
                    No tickets
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Floating Toast Notification */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 bg-ink text-white rounded-lg px-4 py-3 shadow-md text-sm flex items-center gap-2 border border-white/10 animate-slide-up">
          <AlertOctagon size={16} className="text-violet" />
          <span>{toastMsg}</span>
        </div>
      )}

      <style>{`
        @keyframes slideUp {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        .animate-slide-up {
          animation: slideUp 0.15s ease-out;
        }
      `}</style>
    </div>
  );
}
