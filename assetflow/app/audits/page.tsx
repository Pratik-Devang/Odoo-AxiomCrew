"use client";

import { useEffect, useState, useCallback } from "react";
import { PageHeader } from "@/components/page-header";
import { SectionHeader } from "@/components/section-header";
import { StatusChip } from "@/components/status-chip";
import { AssetTag } from "@/components/asset-tag";
import { 
  ClipboardList, 
  Plus, 
  CheckCircle2, 
  ChevronRight, 
  AlertTriangle, 
  ArrowLeft,
  Loader2,
  Calendar,
  User,
  MapPin,
  Check,
  X,
  FileText
} from "lucide-react";

interface UserProfile {
  id: number;
  name: string;
  email: string;
  role: "EMPLOYEE" | "DEPARTMENT_HEAD" | "ASSET_MANAGER" | "ADMIN";
}

interface Department {
  id: number;
  name: string;
  status: string;
}

interface AuditorUser {
  id: number;
  name: string;
  email: string;
  status: string;
}

interface AuditItem {
  id: number;
  auditCycleId: number;
  assetId: number;
  expectedLocation: string;
  verification: "PENDING" | "VERIFIED" | "MISSING" | "DAMAGED";
  verifiedById: number | null;
  verifiedAt: string | null;
  notes: string | null;
  asset: {
    id: number;
    tag: string;
    name: string;
    location: string;
    status: string;
  };
  verifiedBy: {
    id: number;
    name: string;
  } | null;
}

interface AuditCycle {
  id: number;
  title: string;
  scopeDepartmentId: number | null;
  scopeLocation: string | null;
  startDate: string;
  endDate: string;
  status: "OPEN" | "CLOSED";
  createdAt: string;
  scopeDepartment: { id: number; name: string } | null;
  auditors: {
    user: {
      id: number;
      name: string;
      email: string;
    };
  }[];
  items: AuditItem[];
}

export default function AuditsPage() {
  const [cycles, setCycles] = useState<AuditCycle[]>([]);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [usersList, setUsersList] = useState<AuditorUser[]>([]);
  const [selectedCycleId, setSelectedCycleId] = useState<number | null>(null);
  const [activeItemIndex, setActiveItemIndex] = useState<number | null>(null);
  const [toastMsg, setToastMsg] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  // Verification Form State
  const [verificationStatus, setVerificationStatus] = useState<"VERIFIED" | "MISSING" | "DAMAGED" | "PENDING">("PENDING");
  const [verificationNotes, setVerificationNotes] = useState("");
  const [savingVerification, setSavingVerification] = useState(false);

  // Expand discrepancy report section
  const [discrepancyExpanded, setDiscrepancyExpanded] = useState(false);

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [submittingCycle, setSubmittingCycle] = useState(false);
  const [modalError, setModalError] = useState("");
  const [selectedAuditors, setSelectedAuditors] = useState<number[]>([]);

  // Closing cycle state
  const [closingCycleId, setClosingCycleId] = useState<number | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(""), 4000);
  };

  const loadData = useCallback(async () => {
    try {
      const [cycleResponse, userResponse] = await Promise.all([
        fetch("/api/audit-cycles", { cache: "no-store" }),
        fetch("/api/auth/me", { cache: "no-store" }),
      ]);

      if (cycleResponse.ok) {
        const cycleData = await cycleResponse.json();
        setCycles(cycleData.cycles || []);
      }
      if (userResponse.ok) {
        const userData = await userResponse.json();
        setCurrentUser(userData.user);
      }
    } catch (err) {
      console.error("Failed to load audit page data:", err);
      showToast("Failed to load audit cycles.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadModalData = async () => {
    try {
      const [deptResponse, usersResponse] = await Promise.all([
        fetch("/api/departments", { cache: "no-store" }),
        fetch("/api/users", { cache: "no-store" }),
      ]);

      if (deptResponse.ok) {
        const data = await deptResponse.json();
        setDepartments(data.departments || []);
      }
      if (usersResponse.ok) {
        const data = await usersResponse.json();
        setUsersList(data.users || []);
      }
    } catch (err) {
      console.error("Failed to load departments or users for modal:", err);
    }
  };

  useEffect(() => {
    void loadData();
  }, [loadData]);

  // Find the selected cycle
  const selectedCycle = cycles.find((c) => c.id === selectedCycleId);
  const activeItem = selectedCycle && activeItemIndex !== null ? selectedCycle.items[activeItemIndex] : null;

  // Initialize verification inputs when active item changes
  useEffect(() => {
    if (activeItem) {
      setVerificationStatus(activeItem.verification);
      setVerificationNotes(activeItem.notes || "");
    } else {
      setVerificationStatus("PENDING");
      setVerificationNotes("");
    }
  }, [activeItem]);

  const isManager = currentUser?.role === "ASSET_MANAGER" || currentUser?.role === "ADMIN";

  // Check if current user is an auditor for the selected cycle, or ADMIN
  const isAuditorForCycle = selectedCycle?.auditors.some((a) => a.user.id === currentUser?.id) || currentUser?.role === "ADMIN";

  const handleOpenModal = async () => {
    setModalError("");
    setSelectedAuditors([]);
    setModalOpen(true);
    await loadModalData();
  };

  const handleCreateCycle = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setModalError("");
    setSubmittingCycle(true);

    const formData = new FormData(e.currentTarget);
    const scopeDeptIdVal = formData.get("scopeDepartmentId");

    const body = {
      title: String(formData.get("title")),
      scopeDepartmentId: scopeDeptIdVal ? Number(scopeDeptIdVal) : null,
      scopeLocation: String(formData.get("scopeLocation")),
      startDate: String(formData.get("startDate")),
      endDate: String(formData.get("endDate")),
      auditorIds: selectedAuditors,
    };

    try {
      const response = await fetch("/api/audit-cycles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const resData = await response.json();
      if (!response.ok) {
        throw new Error(resData.error || "Failed to create audit cycle");
      }

      showToast(`Audit cycle "${resData.cycle?.title || "New Cycle"}" created successfully.`);
      setModalOpen(false);
      await loadData();
    } catch (err: any) {
      setModalError(err.message || "An error occurred");
    } finally {
      setSubmittingCycle(false);
    }
  };

  const handleVerifyItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeItem) return;
    setSavingVerification(true);

    try {
      const response = await fetch(`/api/audit-items/${activeItem.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          verification: verificationStatus === "PENDING" ? "VERIFIED" : verificationStatus,
          notes: verificationNotes,
        }),
      });

      const resData = await response.json();
      if (!response.ok) {
        throw new Error(resData.error || "Failed to save verification");
      }

      showToast(`Verification saved for asset ${activeItem.asset.tag}.`);

      // Refresh data
      await loadData();

      // Auto-advance to next pending item in the current cycle
      if (selectedCycle) {
        const nextPendingIdx = selectedCycle.items.findIndex(
          (item, idx) => idx > (activeItemIndex || 0) && item.verification === "PENDING"
        );
        if (nextPendingIdx !== -1) {
          setActiveItemIndex(nextPendingIdx);
        } else {
          // If no subsequent pending, look from the beginning
          const firstPendingIdx = selectedCycle.items.findIndex(
            (item) => item.verification === "PENDING"
          );
          if (firstPendingIdx !== -1) {
            setActiveItemIndex(firstPendingIdx);
          } else {
            setActiveItemIndex(null); // Clear selected item if all are verified
          }
        }
      }
    } catch (err: any) {
      showToast(err.message || "Failed to save verification");
    } finally {
      setSavingVerification(false);
    }
  };

  const handleCloseCycle = async (cycleId: number) => {
    setClosingCycleId(cycleId);
    try {
      const response = await fetch(`/api/audit-cycles/${cycleId}/close`, {
        method: "POST",
      });

      const resData = await response.json();
      if (!response.ok) {
        throw new Error(resData.error || "Failed to close cycle");
      }

      showToast(`Audit cycle "${resData.cycle?.title || ""}" closed. Discrepancy report generated and missing assets marked as LOST.`);
      setActiveItemIndex(null);
      await loadData();
    } catch (err: any) {
      showToast(err.message || "Failed to close audit cycle");
    } finally {
      setClosingCycleId(null);
    }
  };

  const toggleAuditor = (userId: number) => {
    if (selectedAuditors.includes(userId)) {
      setSelectedAuditors(selectedAuditors.filter((id) => id !== userId));
    } else {
      setSelectedAuditors([...selectedAuditors, userId]);
    }
  };

  const getProgressPercentage = (cycle: AuditCycle) => {
    if (!cycle.items.length) return 0;
    const completed = cycle.items.filter((item) => item.verification !== "PENDING").length;
    return Math.round((completed / cycle.items.length) * 100);
  };

  const getDiscrepancies = (cycle: AuditCycle) => {
    return cycle.items.filter(
      (item) => item.verification === "MISSING" || item.verification === "DAMAGED"
    );
  };

  return (
    <div className="relative flex flex-col min-h-[calc(100vh-8rem)]">
      {selectedCycle ? (
        // ── 1. DETAILED WORKSPACE VIEW ──
        <div className="flex-1 flex flex-col gap-6">
          {/* Header area with back button */}
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border/40 pb-4">
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  setSelectedCycleId(null);
                  setActiveItemIndex(null);
                }}
                className="af-btn-secondary p-2"
                title="Back to cycles"
              >
                <ArrowLeft size={16} />
              </button>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-bold tracking-tight text-ink">{selectedCycle.title}</h1>
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold border ${
                      selectedCycle.status === "OPEN"
                        ? "border-signal/30 bg-signal/5 text-signal"
                        : "border-gray-500/30 bg-gray-500/5 text-gray-500"
                    }`}
                  >
                    {selectedCycle.status}
                  </span>
                </div>
                <p className="text-xs text-ink3 mt-1 flex flex-wrap items-center gap-x-2 gap-y-1">
                  {selectedCycle.scopeDepartment && (
                    <span className="flex items-center gap-0.5">
                      <FileText size={12} />
                      Dept: {selectedCycle.scopeDepartment.name}
                    </span>
                  )}
                  {selectedCycle.scopeLocation && (
                    <span className="flex items-center gap-0.5">
                      <MapPin size={12} />
                      Location: {selectedCycle.scopeLocation}
                    </span>
                  )}
                  <span className="flex items-center gap-0.5">
                    <Calendar size={12} />
                    {new Date(selectedCycle.startDate).toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                    })}{" "}
                    -{" "}
                    {new Date(selectedCycle.endDate).toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </span>
                </p>
              </div>
            </div>

            {/* Auditors banner */}
            <div className="rounded-lg bg-surface border border-border px-4 py-2 text-xs text-ink2">
              <span className="font-semibold text-ink block mb-0.5">Auditors Assigned:</span>
              <span className="text-ink3">
                {selectedCycle.auditors.map((a) => a.user.name).join(", ") || "None"}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            {/* Left Column: Scope Assets & Discrepancies */}
            <div className="lg:col-span-2 space-y-6">
              {/* Discrepancy report banner */}
              {getDiscrepancies(selectedCycle).length > 0 && (
                <div className="af-card border-l-4 border-danger p-4 shadow-sm bg-danger_bg/10">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <AlertTriangle size={18} className="text-danger" />
                      <span className="text-sm font-semibold text-danger">
                        {getDiscrepancies(selectedCycle).length} assets flagged - discrepancy report generated
                        automatically
                      </span>
                    </div>
                    <button
                      onClick={() => setDiscrepancyExpanded(!discrepancyExpanded)}
                      className="text-xs font-semibold text-danger hover:underline"
                    >
                      {discrepancyExpanded ? "Hide Details" : "View Discrepancy List"}
                    </button>
                  </div>

                  {/* Discrepancy List */}
                  {discrepancyExpanded && (
                    <div className="mt-4 border-t border-danger/10 pt-3 space-y-2">
                      <p className="text-[11px] font-semibold text-ink3 uppercase tracking-wider mb-2">Flagged Items</p>
                      {getDiscrepancies(selectedCycle).map((item) => (
                        <div key={item.id} className="flex justify-between items-start gap-4 text-xs py-1">
                          <div>
                            <div className="flex items-center gap-1.5">
                              <AssetTag tag={item.asset.tag} />
                              <span className="font-medium text-ink">{item.asset.name}</span>
                            </div>
                            <p className="text-[10px] text-ink3 mt-0.5">
                              Expected location: <span className="font-medium">{item.expectedLocation}</span>
                            </p>
                            {item.notes && (
                              <p className="text-[10px] text-ink2 italic mt-0.5">
                                Notes: &ldquo;{item.notes}&rdquo;
                              </p>
                            )}
                          </div>
                          <StatusChip status={item.verification} size="sm" />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Assets in Scope list */}
              <div className="af-card overflow-hidden">
                <div className="px-5 py-4 border-b border-border bg-sunken flex items-center justify-between">
                  <SectionHeader title="Assets In Scope" className="mb-0 text-sm font-semibold text-ink2" />
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-ink3">
                      {selectedCycle.items.filter((i) => i.verification !== "PENDING").length} /{" "}
                      {selectedCycle.items.length} verified
                    </span>
                    <span className="bg-surface border border-border px-2 py-0.5 rounded text-[10px] font-semibold text-ink3">
                      {getProgressPercentage(selectedCycle)}%
                    </span>
                  </div>
                </div>

                <div className="divide-y divide-border">
                  {selectedCycle.items.map((item, idx) => (
                    <div
                      key={item.id}
                      onClick={() => {
                        // Select this item
                        setActiveItemIndex(idx);
                      }}
                      className={`flex items-center justify-between px-5 py-4 cursor-pointer hover:bg-sunken/45 transition-colors ${
                        activeItemIndex === idx ? "bg-sunken/60 border-l-4 border-signal" : ""
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <AssetTag tag={item.asset.tag} />
                        <div>
                          <p className="text-sm font-semibold text-ink leading-snug">{item.asset.name}</p>
                          <p className="text-xs text-ink3 mt-0.5">Expected: {item.expectedLocation}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <StatusChip status={item.verification} size="sm" />
                        <ChevronRight size={14} className="text-ink3" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Column: Verification panel & Close Cycle actions */}
            <div className="space-y-6">
              {/* Verification panel */}
              {activeItem ? (
                <div className="af-card p-5 sticky top-20 bg-surface border border-border shadow-sm">
                  <SectionHeader title="Verification Workspace" />

                  <form onSubmit={handleVerifyItem} className="space-y-4">
                    <div>
                      <span className="text-[10px] text-ink3 font-semibold uppercase tracking-wider block mb-1">
                        Active Item
                      </span>
                      <AssetTag tag={activeItem.asset.tag} className="mb-1 inline-block" />
                      <p className="text-sm font-semibold text-ink">{activeItem.asset.name}</p>
                      <p className="text-xs text-ink3 mt-1.5 leading-relaxed">
                        Location check: <span className="font-mono text-ink2 bg-sunken/50 px-1 py-0.5 rounded text-[11px]">{activeItem.expectedLocation}</span>
                      </p>
                    </div>

                    <div className="border-t border-border/40 pt-4">
                      <label className="block text-xs font-semibold text-ink2 mb-2">
                        Mark Verification Status
                      </label>

                      {selectedCycle.status === "CLOSED" ? (
                        <div className="flex flex-col gap-1.5 bg-gray_bg border border-border/40 rounded p-2.5">
                          <p className="text-xs font-medium text-ink2">
                            Current verification: <span className="font-bold">{activeItem.verification}</span>
                          </p>
                          {activeItem.notes && (
                            <p className="text-xs text-ink3 italic">
                              Notes: &ldquo;{activeItem.notes}&rdquo;
                            </p>
                          )}
                          <p className="text-[10px] text-danger font-medium mt-1">
                            This audit cycle is closed and locked.
                          </p>
                        </div>
                      ) : !isAuditorForCycle ? (
                        <div className="bg-danger_bg border border-danger/10 rounded p-3 text-xs text-danger">
                          You are not authorized to verify items. Only assigned auditors and admins can edit.
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <div className="grid grid-cols-3 gap-2">
                            {[
                              { id: "VERIFIED", label: "Verified", color: "border-go/40 bg-go_bg text-go hover:bg-go_bg/80" },
                              { id: "MISSING", label: "Missing", color: "border-danger/40 bg-danger_bg text-danger hover:bg-danger_bg/80" },
                              { id: "DAMAGED", label: "Damaged", color: "border-warn/40 bg-warn_bg text-warn hover:bg-warn_bg/80" },
                            ].map((statusOpt) => (
                              <button
                                key={statusOpt.id}
                                type="button"
                                onClick={() => setVerificationStatus(statusOpt.id as any)}
                                className={`af-btn-secondary text-[11px] py-2 border transition ${
                                  verificationStatus === statusOpt.id
                                    ? statusOpt.color
                                    : "border-border hover:bg-sunken"
                                }`}
                              >
                                {statusOpt.label}
                              </button>
                            ))}
                          </div>

                          <div className="mt-3">
                            <label className="block text-xs font-semibold text-ink2 mb-1.5">
                              Verification Notes / Description
                            </label>
                            <textarea
                              value={verificationNotes}
                              onChange={(e) => setVerificationNotes(e.target.value)}
                              placeholder="e.g. Serial checked, item damaged in shipping..."
                              rows={3}
                              className="af-input text-xs"
                            />
                          </div>

                          <button
                            type="submit"
                            disabled={savingVerification}
                            className="w-full af-btn-primary text-xs py-2 mt-2"
                          >
                            {savingVerification && <Loader2 size={12} className="animate-spin mr-1" />}
                            Save Verification
                          </button>
                        </div>
                      )}
                    </div>
                  </form>
                </div>
              ) : (
                <div className="af-card p-6 text-center py-12 text-ink3 border border-border/50">
                  Select a scoped asset from the list to update its verification status.
                </div>
              )}

              {/* Close cycle actions */}
              {isManager && selectedCycle.status === "OPEN" && (
                <div className="af-card p-4 border border-border shadow-sm space-y-3 bg-surface">
                  <SectionHeader title="Cycle Operations" className="text-xs mb-1" />
                  <p className="text-xs text-ink3 leading-relaxed">
                    Closing the cycle locks all verifications. Any asset currently flagged as <strong>MISSING</strong> will be set to <strong>LOST</strong> in the registry.
                  </p>
                  <button
                    onClick={() => handleCloseCycle(selectedCycle.id)}
                    disabled={closingCycleId !== null}
                    className="w-full af-btn-danger text-xs py-2"
                  >
                    {closingCycleId === selectedCycle.id ? (
                      <Loader2 size={12} className="animate-spin mr-1 inline" />
                    ) : null}
                    Close Audit Cycle
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        // ── 2. AUDIT CYCLES LIST VIEW ──
        <div className="flex-1 flex flex-col gap-6">
          <PageHeader
            title="Audit Cycles"
            action={
              isManager ? (
                <button onClick={handleOpenModal} className="af-btn-primary">
                  <Plus size={14} />
                  New Audit Cycle
                </button>
              ) : undefined
            }
          />

          <div className="af-card overflow-hidden">
            {cycles.length === 0 ? (
              <div className="py-20 text-center text-sm text-ink3">
                <ClipboardList size={40} className="mx-auto text-ink3 opacity-40 mb-3" />
                No audit cycles registered. Click &ldquo;New Audit Cycle&rdquo; to begin.
              </div>
            ) : (
              <div className="overflow-x-auto">
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
                    {cycles.map((cycle) => {
                      const progress = getProgressPercentage(cycle);
                      const isClosed = cycle.status === "CLOSED";

                      // Build scope label
                      const deptName = cycle.scopeDepartment?.name;
                      const locName = cycle.scopeLocation;
                      const scopeText = 
                        deptName && locName ? `${deptName} (${locName})` :
                        deptName ? `Dept: ${deptName}` :
                        locName ? `Loc: ${locName}` : "All Active Assets";

                      return (
                        <tr
                          key={cycle.id}
                          onClick={() => {
                            setSelectedCycleId(cycle.id);
                            setActiveItemIndex(cycle.items.length > 0 ? 0 : null);
                          }}
                          className="hover:bg-sunken/45 transition-colors cursor-pointer"
                        >
                          <td className="af-td font-semibold text-ink leading-snug">{cycle.title}</td>
                          <td className="af-td text-ink2 text-xs">{scopeText}</td>
                          <td className="af-td text-ink3 text-xs">
                            {new Date(cycle.startDate).toLocaleDateString(undefined, {
                              month: "short",
                              day: "numeric",
                            })}{" "}
                            -{" "}
                            {new Date(cycle.endDate).toLocaleDateString(undefined, {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })}
                          </td>
                          <td className="af-td text-ink3 text-xs max-w-[150px] truncate">
                            {cycle.auditors.map((a) => a.user.name).join(", ") || "—"}
                          </td>
                          <td className="af-td">
                            <span
                              className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold border ${
                                !isClosed
                                  ? "border-signal/30 bg-signal/5 text-signal"
                                  : "border-gray-500/30 bg-gray-500/5 text-gray-500"
                              }`}
                            >
                              {cycle.status}
                            </span>
                          </td>
                          <td className="af-td">
                            <div className="flex items-center gap-3">
                              <div className="w-24 bg-sunken rounded-full h-1.5 overflow-hidden">
                                <div
                                  className={`h-1.5 rounded-full ${isClosed ? "bg-gray-500" : "bg-signal"}`}
                                  style={{ width: `${progress}%` }}
                                />
                              </div>
                              <span className="text-xs font-semibold text-ink">{progress}%</span>
                            </div>
                          </td>
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
        </div>
      )}

      {/* New Audit Cycle Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4" role="dialog" aria-modal="true" aria-label="Create New Audit Cycle">
          <div className="w-full max-w-lg rounded-xl border border-border bg-surface p-6 shadow-2xl overflow-y-auto max-h-[90vh] custom-scrollbar">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-base font-semibold text-ink">Create New Audit Cycle</h2>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="rounded p-1 text-ink3 hover:bg-sunken hover:text-ink transition"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreateCycle} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-ink2 mb-1.5">
                  Audit Title <span className="text-danger">*</span>
                </label>
                <input
                  type="text"
                  name="title"
                  required
                  placeholder="e.g. Q3 2026 Operations Audit"
                  className="af-input"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-ink2 mb-1.5">
                    Timeline: Start Date <span className="text-danger">*</span>
                  </label>
                  <input
                    type="date"
                    name="startDate"
                    required
                    className="af-input text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-ink2 mb-1.5">
                    Timeline: End Date <span className="text-danger">*</span>
                  </label>
                  <input
                    type="date"
                    name="endDate"
                    required
                    className="af-input text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-border/40 pt-3">
                <div>
                  <label className="block text-xs font-semibold text-ink2 mb-1.5">
                    Scope Department (Optional)
                  </label>
                  <select name="scopeDepartmentId" className="af-input">
                    <option value="">-- All Departments --</option>
                    {departments
                      .filter((d) => d.status === "ACTIVE")
                      .map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.name}
                        </option>
                      ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-ink2 mb-1.5">
                    Scope Location (Optional)
                  </label>
                  <input
                    type="text"
                    name="scopeLocation"
                    placeholder="e.g. Floor 2, Warehouse B"
                    className="af-input"
                  />
                </div>
              </div>

              <div className="border-t border-border/40 pt-3">
                <label className="block text-xs font-semibold text-ink2 mb-2">
                  Assign Auditors (Select at least one) <span className="text-danger">*</span>
                </label>
                <div className="border border-border rounded-lg p-3 max-h-[140px] overflow-y-auto space-y-2 custom-scrollbar bg-surface/50">
                  {usersList
                    .filter((u) => u.status === "ACTIVE")
                    .map((user) => (
                      <label key={user.id} className="flex items-center gap-2 text-xs text-ink cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedAuditors.includes(user.id)}
                          onChange={() => toggleAuditor(user.id)}
                          className="rounded border-border text-signal focus:ring-signal/30 h-3.5 w-3.5"
                        />
                        <span>
                          {user.name} <span className="text-ink3 font-mono text-[10px]">({user.email})</span>
                        </span>
                      </label>
                    ))}
                </div>
              </div>

              {modalError && (
                <div role="alert" className="text-xs text-danger bg-danger_bg border border-danger/20 rounded p-2.5">
                  {modalError}
                </div>
              )}

              <div className="flex justify-end gap-3 border-t border-border/40 pt-4 mt-6">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="af-btn-secondary px-4 py-2"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingCycle || selectedAuditors.length === 0}
                  className="af-btn-primary px-4 py-2"
                >
                  {submittingCycle && <Loader2 size={12} className="animate-spin mr-1" />}
                  Create Cycle
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Floating Toast Notification */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 bg-ink text-white rounded-lg px-4 py-3 shadow-lg text-sm flex items-center gap-2 border border-white/10 animate-slide-up">
          <AlertTriangle size={16} className="text-violet" />
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
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #D6D4CE;
          border-radius: 2px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #B8B6B0;
        }
      `}</style>
    </div>
  );
}
