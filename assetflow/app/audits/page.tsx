"use client";

import { useState } from "react";
import { PageHeader } from "@/components/page-header";
import { SectionHeader } from "@/components/section-header";
import { StatusChip } from "@/components/status-chip";
import { AssetTag } from "@/components/asset-tag";
import { ClipboardList, Plus, FileDown, CheckCircle2, ChevronRight, AlertTriangle, ArrowLeft } from "lucide-react";

// Mock Audit Cycles
const initialCycles = [
  { id: 1, name: "Q3 physical verification", scope: "Technology (Floor 2)", range: "Oct 1 - Oct 15, 2026", auditors: "Elena Torres, Noah Williams", status: "OPEN", progress: 65, total: 20, verified: 13 },
  { id: 2, name: "Facilities Equipment Review", scope: "Facilities (Warehouse B)", range: "Nov 1 - Nov 10, 2026", auditors: "Marcus Reed", status: "OPEN", progress: 0, total: 15, verified: 0 },
  { id: 3, name: "Annual Compliance Audit", scope: "All Departments", range: "Jan 5 - Jan 25, 2026", auditors: "Avery Admin", status: "CLOSED", progress: 100, total: 150, verified: 150 },
];

// Mock Assets in Scope for Cycle 1
const initialAuditItems = [
  { id: 1, tag: "AF-0001", name: "Dell XPS 15 Laptop", expectedLocation: "Floor 2, Desk 14", verification: "VERIFIED", notes: "Verified in physical possession of Priya Shah" },
  { id: 2, tag: "AF-0006", name: "MacBook Pro 14\"", expectedLocation: "Floor 2, Desk 22", verification: "PENDING", notes: "" },
  { id: 3, tag: "AF-0009", name: "Cisco IP Phone 8800", expectedLocation: "Store Room B", verification: "MISSING", notes: "Not found in store room during check" },
  { id: 4, tag: "AF-0012", name: "Ergonomic Keyboard", expectedLocation: "Store Room A", verification: "DAMAGED", notes: "USB port loose, needs maintenance" },
];

export default function AuditsPage() {
  const [cycles, setCycles] = useState(initialCycles);
  const [selectedCycleId, setSelectedCycleId] = useState<number | null>(null);
  const [auditItems, setAuditItems] = useState(initialAuditItems);
  const [activeItemIndex, setActiveItemIndex] = useState(1); // MacBook Pro is pending

  const selectedCycle = cycles.find(c => c.id === selectedCycleId);
  const activeItem = auditItems[activeItemIndex];

  const handleVerify = (status: "VERIFIED" | "MISSING" | "DAMAGED", notes: string) => {
    const updated = auditItems.map((item, idx) => {
      if (idx === activeItemIndex) {
        return { ...item, verification: status, notes };
      }
      return item;
    });
    setAuditItems(updated);
    
    // Auto-advance to next pending item if available
    const nextPending = updated.findIndex((item, idx) => idx > activeItemIndex && item.verification === "PENDING");
    if (nextPending !== -1) {
      setActiveItemIndex(nextPending);
    }
  };

  const handleCloseCycle = () => {
    if (!selectedCycleId) return;
    setCycles(cycles.map(c => c.id === selectedCycleId ? { ...c, status: "CLOSED", progress: 100 } : c));
  };

  return (
    <div>
      {selectedCycle ? (
        // Detailed Audit Workspace
        <div>
          <div className="flex items-center gap-3 mb-6">
            <button 
              onClick={() => setSelectedCycleId(null)}
              className="af-btn-secondary p-2"
            >
              <ArrowLeft size={16} />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-semibold tracking-tight text-ink">{selectedCycle.name}</h1>
                <StatusChip status={selectedCycle.status} size="sm" />
              </div>
              <p className="text-xs text-ink3 mt-0.5">{selectedCycle.scope} · {selectedCycle.range}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Col: List of assets in scope */}
            <div className="lg:col-span-2 space-y-4">
              <div className="af-card overflow-hidden">
                <div className="p-4 border-b border-border bg-gray_bg flex items-center justify-between">
                  <SectionHeader title="Assets In Scope" className="mb-0" />
                  <span className="text-xs font-semibold text-ink">{auditItems.length} Assets</span>
                </div>
                <div className="divide-y divide-border">
                  {auditItems.map((item, idx) => (
                    <div 
                      key={item.id}
                      onClick={() => setActiveItemIndex(idx)}
                      className={`flex items-center justify-between px-5 py-4 cursor-pointer hover:bg-sunken transition-colors ${
                        activeItemIndex === idx ? "bg-sunken/60 border-l-4 border-signal" : ""
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <AssetTag tag={item.tag} />
                        <div>
                          <p className="text-sm font-semibold text-ink">{item.name}</p>
                          <p className="text-[10px] text-ink3">Expected at: {item.expectedLocation}</p>
                        </div>
                      </div>
                      <StatusChip status={item.verification} size="sm" />
                    </div>
                  ))}
                </div>
              </div>

              {/* Discrepancy Report Summary */}
              <div className="af-card p-5 border-l-4 border-danger">
                <div className="flex items-center gap-2 mb-3">
                  <AlertTriangle size={18} className="text-danger" />
                  <SectionHeader title="Discrepancy Report" className="mb-0 text-danger" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-danger_bg border border-danger/10 rounded p-3">
                    <p className="text-xs font-medium text-danger">Missing Assets</p>
                    <p className="text-2xl font-semibold text-danger mt-1">
                      {auditItems.filter(item => item.verification === "MISSING").length}
                    </p>
                  </div>
                  <div className="bg-violet_bg border border-violet/10 rounded p-3">
                    <p className="text-xs font-medium text-violet">Damaged Assets</p>
                    <p className="text-2xl font-semibold text-violet mt-1">
                      {auditItems.filter(item => item.verification === "DAMAGED").length}
                    </p>
                  </div>
                </div>
                {selectedCycle.status === "OPEN" && (
                  <div className="mt-4 flex gap-3 justify-end">
                    <button onClick={handleCloseCycle} className="af-btn-danger bg-danger hover:bg-red-700">
                      Close Audit Cycle & Generate Report
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Right Col: Auditor Action Panel */}
            <div>
              {activeItem ? (
                <div className="af-card p-5 sticky top-20">
                  <SectionHeader title="Verification Workspace" />
                  <div className="space-y-4">
                    <div>
                      <span className="text-[10px] text-ink3 font-semibold uppercase tracking-wider block mb-1">Active Item</span>
                      <AssetTag tag={activeItem.tag} className="mb-1 inline-block" />
                      <p className="text-sm font-semibold text-ink">{activeItem.name}</p>
                      <p className="text-xs text-ink2 mt-1">Location check: <span className="font-mono text-xs">{activeItem.expectedLocation}</span></p>
                    </div>

                    <div className="border-t border-border pt-4">
                      <label className="block text-xs font-medium text-ink2 mb-2">Mark Verification Status</label>
                      <div className="grid grid-cols-3 gap-2">
                        {(["VERIFIED", "MISSING", "DAMAGED"] as const).map(status => (
                          <button
                            key={status}
                            onClick={() => handleVerify(status, activeItem.notes)}
                            className={`af-btn-secondary text-[11px] py-2 border ${
                              activeItem.verification === status 
                                ? status === 'VERIFIED' ? 'border-go/40 bg-go_bg text-go' :
                                  status === 'MISSING' ? 'border-danger/40 bg-danger_bg text-danger' :
                                  'border-violet/40 bg-violet_bg text-violet'
                                : ''
                            }`}
                          >
                            {status.toLowerCase()}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-ink2 mb-1.5 font-semibold">Verification Notes</label>
                      <textarea
                        value={activeItem.notes}
                        onChange={(e) => {
                          const updated = [...auditItems];
                          updated[activeItemIndex].notes = e.target.value;
                          setAuditItems(updated);
                        }}
                        placeholder="Add location details, serial number checks, or condition observations..."
                        rows={3}
                        className="af-input"
                      />
                    </div>

                    <button 
                      onClick={() => handleVerify(activeItem.verification as any, activeItem.notes)} 
                      className="w-full af-btn-primary"
                    >
                      Save Verification
                    </button>
                  </div>
                </div>
              ) : (
                <div className="af-card p-5 text-center py-12 text-ink3">
                  Select an item to verify.
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        // Audit Cycles List
        <div>
          <PageHeader 
            title="Audit Cycles" 
            action={
              <button className="af-btn-primary">
                <Plus size={14} />
                New Audit Cycle
              </button>
            }
          />

          <div className="af-card overflow-hidden">
            <table className="w-full">
              <thead>
                <tr>
                  <th className="af-th">Cycle Name</th>
                  <th className="af-th">Scope</th>
                  <th className="af-th">Timeline</th>
                  <th className="af-th">Auditors</th>
                  <th className="af-th">Status</th>
                  <th className="af-th">Progress</th>
                  <th className="af-th w-8" />
                </tr>
              </thead>
              <tbody>
                {cycles.map((cycle) => (
                  <tr 
                    key={cycle.id}
                    onClick={() => setSelectedCycleId(cycle.id)}
                    className="hover:bg-sunken/40 transition-colors cursor-pointer"
                  >
                    <td className="af-td font-semibold text-ink">{cycle.name}</td>
                    <td className="af-td text-ink2">{cycle.scope}</td>
                    <td className="af-td text-ink3 text-xs">{cycle.range}</td>
                    <td className="af-td text-ink3 text-xs">{cycle.auditors}</td>
                    <td className="af-td">
                      <StatusChip status={cycle.status === "OPEN" ? "PENDING" : "RESOLVED"} size="sm" />
                    </td>
                    <td className="af-td">
                      <div className="flex items-center gap-3">
                        <div className="w-24 bg-sunken rounded-full h-1.5">
                          <div 
                            className="bg-signal rounded-full h-1.5" 
                            style={{ width: `${cycle.progress}%` }}
                          />
                        </div>
                        <span className="text-xs font-semibold text-ink">{cycle.progress}%</span>
                      </div>
                    </td>
                    <td className="af-td">
                      <ChevronRight size={14} className="text-ink3" />
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
