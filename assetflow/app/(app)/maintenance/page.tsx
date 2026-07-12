"use client";

import { useEffect, useState, useCallback } from "react";
import { PageHeader } from "@/components/page-header";
import { SectionHeader } from "@/components/section-header";
import { AssetTag } from "@/components/asset-tag";
import { Plus, Check, X, AlertOctagon, User, Wrench, Loader2 } from "lucide-react";

interface UserProfile {
  id: number;
  name: string;
  email: string;
  role: "EMPLOYEE" | "DEPARTMENT_HEAD" | "ASSET_MANAGER" | "ADMIN";
}

interface Asset {
  id: number;
  tag: string;
  name: string;
  status: string;
  category: { id: number; name: string };
}

interface MaintenanceRequest {
  id: number;
  assetId: number;
  raisedById: number;
  issueDescription: string;
  priority: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  status: "PENDING" | "APPROVED" | "REJECTED" | "TECHNICIAN_ASSIGNED" | "IN_PROGRESS" | "RESOLVED";
  technicianName: string | null;
  approvedById: number | null;
  raisedAt: string;
  resolvedAt: string | null;
  photoUrl: string | null;
  asset: {
    id: number;
    tag: string;
    name: string;
    status: string;
    category: { name: string };
  };
  raisedBy: {
    id: number;
    name: string;
    email: string;
  };
}

const priorityBadges: Record<string, string> = {
  LOW: "bg-go_bg text-go",
  MEDIUM: "bg-warn_bg text-warn",
  HIGH: "bg-danger_bg text-danger",
  CRITICAL: "bg-red-700 text-white font-bold",
};

const columns = [
  { id: "PENDING", label: "Pending" },
  { id: "APPROVED", label: "Approved" },
  { id: "TECHNICIAN_ASSIGNED", label: "Technician Assigned" },
  { id: "IN_PROGRESS", label: "In Progress" },
  { id: "RESOLVED", label: "Resolved" },
] as const;

export default function MaintenancePage() {
  const [requests, setRequests] = useState<MaintenanceRequest[]>([]);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [toastMsg, setToastMsg] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [modalError, setModalError] = useState("");

  // Assign Tech Inline state
  const [assigningId, setAssigningId] = useState<number | null>(null);
  const [techNameInput, setTechNameInput] = useState("");

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(""), 4000);
  };

  const loadData = useCallback(async () => {
    try {
      const [reqResponse, userResponse] = await Promise.all([
        fetch("/api/maintenance-requests", { cache: "no-store" }),
        fetch("/api/auth/me", { cache: "no-store" }),
      ]);

      if (reqResponse.ok) {
        const reqData = await reqResponse.json();
        setRequests(reqData.requests || []);
      }
      if (userResponse.ok) {
        const userData = await userResponse.json();
        setCurrentUser(userData.user);
      }
    } catch (err) {
      console.error("Failed to load maintenance page data:", err);
      showToast("Failed to load data. Please refresh.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadAssets = async () => {
    try {
      const response = await fetch("/api/assets", { cache: "no-store" });
      if (response.ok) {
        const data = await response.json();
        setAssets(data.assets || []);
      }
    } catch (err) {
      console.error("Failed to load assets list:", err);
    }
  };

  useEffect(() => {
    void loadData();
  }, [loadData]);

  // Check if current user is allowed to manage transitions
  const isManager = currentUser?.role === "ASSET_MANAGER" || currentUser?.role === "ADMIN";

  const handleOpenModal = async () => {
    setModalError("");
    setModalOpen(true);
    await loadAssets();
  };

  const handleRaiseRequest = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setModalError("");
    setSubmitting(true);

    const formData = new FormData(e.currentTarget);
    const body = {
      assetId: Number(formData.get("assetId")),
      issueDescription: String(formData.get("issueDescription")),
      priority: String(formData.get("priority")),
      photoUrl: String(formData.get("photoUrl")),
    };

    try {
      const response = await fetch("/api/maintenance-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const resData = await response.json();
      if (!response.ok) {
        throw new Error(resData.error || "Failed to create request");
      }

      showToast(`Maintenance request raised successfully for ${resData.request?.asset?.tag || "asset"}`);
      setModalOpen(false);
      await loadData();
    } catch (err: any) {
      setModalError(err.message || "An error occurred");
    } finally {
      setSubmitting(false);
    }
  };

  const handleTransition = async (requestId: number, targetStatus: string, extraData: object = {}) => {
    try {
      const response = await fetch(`/api/maintenance-requests/${requestId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: targetStatus, ...extraData }),
      });

      const resData = await response.json();
      if (!response.ok) {
        throw new Error(resData.error || "Transition failed");
      }

      // Show toast
      if (targetStatus === "APPROVED") {
        showToast(`Request approved. Asset ${resData.request?.asset?.tag || ""} marked as Under Maintenance.`);
      } else if (targetStatus === "REJECTED") {
        showToast("Request rejected.");
      } else if (targetStatus === "RESOLVED") {
        showToast("Request resolved. Asset returned to Available.");
      } else {
        showToast(`Request updated to ${targetStatus.replace("_", " ")}.`);
      }

      setAssigningId(null);
      setTechNameInput("");
      await loadData();
    } catch (err: any) {
      showToast(err.message || "Failed to update ticket status");
    }
  };

  const formatRelativeTime = (dateStr: string) => {
    const created = new Date(dateStr);
    const diffMs = Date.now() - created.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays <= 0) {
      const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
      if (diffHrs <= 0) {
        const diffMins = Math.floor(diffMs / (1000 * 60));
        return diffMins <= 1 ? "Just now" : `${diffMins}m ago`;
      }
      return `${diffHrs}h ago`;
    }
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return created.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  };

  return (
    <div className="relative flex flex-col min-h-[calc(100vh-8rem)]">
      <PageHeader
        title="Maintenance Management"
        action={
          <button onClick={handleOpenModal} className="af-btn-primary">
            <Plus size={14} />
            Raise Request
          </button>
        }
      />

      {isLoading ? (
        <div className="flex-1 flex items-center justify-center py-20">
          <Loader2 size={32} className="animate-spin text-signal" />
          <span className="ml-2 text-sm text-ink3">Loading Kanban board...</span>
        </div>
      ) : (
        <>
          {/* Kanban Board */}
          <div className="flex gap-4 overflow-x-auto pb-4 items-start select-none flex-1 min-h-[500px]">
            {columns.map((col) => {
              const colTickets = requests.filter((r) => r.status === col.id);
              return (
                <div key={col.id} className="w-[310px] shrink-0 bg-sunken rounded-lg p-3 flex flex-col max-h-[calc(100vh-16rem)] border border-border/50 shadow-sm">
                  <div className="flex items-center justify-between mb-4 px-1 shrink-0">
                    <SectionHeader title={col.label} className="mb-0 text-sm font-semibold text-ink2" />
                    <span className="bg-surface border border-border px-2 py-0.5 rounded text-[10px] font-semibold text-ink3">
                      {colTickets.length}
                    </span>
                  </div>

                  <div className="space-y-3 overflow-y-auto flex-1 pr-1 custom-scrollbar">
                    {colTickets.map((t) => {
                      const isResolved = t.status === "RESOLVED";
                      return (
                        <div
                          key={t.id}
                          className={`af-kanban-card border p-4 transition-all duration-200 ${
                            isResolved
                              ? "border-go bg-go_bg/20 shadow-go/5 hover:border-go hover:shadow-md"
                              : "border-border hover:shadow-md bg-surface"
                          }`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span
                              className={`text-[9px] uppercase tracking-wider font-semibold rounded px-1.5 py-0.5 ${
                                priorityBadges[t.priority]
                              }`}
                            >
                              {t.priority}
                            </span>
                            <AssetTag tag={t.asset.tag} />
                          </div>

                          <h3 className="text-sm font-semibold text-ink leading-snug mb-1">
                            {t.asset.name}
                          </h3>
                          <p className="text-xs text-ink2 mb-2 line-clamp-3">
                            {t.issueDescription}
                          </p>

                          <div className="flex flex-col gap-1 border-t border-border/40 pt-2 mt-2">
                            <div className="flex justify-between items-center text-[10px] text-ink3">
                              <span className="flex items-center gap-1">
                                <User size={10} />
                                {t.raisedBy.name}
                              </span>
                              <span>{formatRelativeTime(t.raisedAt)}</span>
                            </div>

                            {/* Show Photo link if exists */}
                            {t.photoUrl && (
                              <a
                                href={t.photoUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[10px] text-signal hover:underline mt-1 block"
                              >
                                View Attachment Link
                              </a>
                            )}

                            {/* Show Technician name if assigned */}
                            {t.technicianName && (
                              <div className="mt-1.5 flex items-center gap-1 rounded bg-violet_bg/40 border border-violet/10 px-2 py-0.5 text-[10px] font-medium text-violet">
                                <Wrench size={10} />
                                <span>tech: {t.technicianName}</span>
                              </div>
                            )}
                          </div>

                          {/* Action Transitions (Managers / Admins only) */}
                          {isManager && (
                            <div className="border-t border-border/40 pt-3 mt-3">
                              {/* PENDING -> APPROVED / REJECTED */}
                              {t.status === "PENDING" && (
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => handleTransition(t.id, "APPROVED")}
                                    className="flex-1 af-btn-secondary gap-1 border-go/20 text-go bg-go_bg hover:bg-go/20 hover:text-go px-2 py-1.5 text-[10px]"
                                  >
                                    <Check size={10} />
                                    Approve
                                  </button>
                                  <button
                                    onClick={() => handleTransition(t.id, "REJECTED")}
                                    className="flex-1 af-btn-secondary gap-1 border-danger/20 text-danger bg-danger_bg hover:bg-danger/20 hover:text-danger px-2 py-1.5 text-[10px]"
                                  >
                                    <X size={10} />
                                    Reject
                                  </button>
                                </div>
                              )}

                              {/* APPROVED -> TECHNICIAN ASSIGNED */}
                              {t.status === "APPROVED" && (
                                <>
                                  {assigningId === t.id ? (
                                    <div className="space-y-2">
                                      <input
                                        type="text"
                                        placeholder="Technician name..."
                                        value={techNameInput}
                                        onChange={(e) => setTechNameInput(e.target.value)}
                                        className="af-input text-xs py-1.5 px-2"
                                        autoFocus
                                      />
                                      <div className="flex gap-2">
                                        <button
                                          onClick={() =>
                                            handleTransition(t.id, "TECHNICIAN_ASSIGNED", {
                                              technicianName: techNameInput,
                                            })
                                          }
                                          disabled={!techNameInput.trim()}
                                          className="flex-1 af-btn-primary text-[10px] py-1 text-white bg-signal"
                                        >
                                          Assign
                                        </button>
                                        <button
                                          onClick={() => {
                                            setAssigningId(null);
                                            setTechNameInput("");
                                          }}
                                          className="flex-1 af-btn-secondary text-[10px] py-1"
                                        >
                                          Cancel
                                        </button>
                                      </div>
                                    </div>
                                  ) : (
                                    <button
                                      onClick={() => setAssigningId(t.id)}
                                      className="w-full af-btn-secondary text-[10px] py-1.5 border-signal/20 text-signal bg-signal/5 hover:bg-signal/10"
                                    >
                                      Assign Technician
                                    </button>
                                  )}
                                </>
                              )}

                              {/* TECHNICIAN ASSIGNED -> IN PROGRESS */}
                              {t.status === "TECHNICIAN_ASSIGNED" && (
                                <button
                                  onClick={() => handleTransition(t.id, "IN_PROGRESS")}
                                  className="w-full af-btn-secondary text-[10px] py-1.5 border-violet/20 text-violet bg-violet_bg hover:bg-violet_bg/70"
                                >
                                  Start Maintenance
                                </button>
                              )}

                              {/* IN PROGRESS -> RESOLVED */}
                              {t.status === "IN_PROGRESS" && (
                                <button
                                  onClick={() => handleTransition(t.id, "RESOLVED")}
                                  className="w-full af-btn-secondary text-[10px] py-1.5 border-go/20 text-go bg-go_bg hover:bg-go_bg/70"
                                >
                                  Mark Resolved
                                </button>
                              )}
                            </div>
                          )}

                          {/* Closed display for resolved/rejected requests */}
                          {isResolved && (
                            <div className="text-[10px] text-center text-go border-t border-go/10 pt-2 mt-2 font-medium">
                              Ticket Resolved
                            </div>
                          )}
                        </div>
                      );
                    })}

                    {colTickets.length === 0 && (
                      <div className="py-8 text-center text-xs text-ink3 bg-surface/50 border border-dashed border-border rounded-lg">
                        No requests
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Kanban Board Footer Note */}
          <footer className="shrink-0 mt-6 py-4 border-t border-border/40 text-center text-xs text-ink3">
            Approving a card moves the asset to under maintenance, resolving returns it to available
          </footer>
        </>
      )}

      {/* Raise Request Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4" role="dialog" aria-modal="true" aria-label="Raise Maintenance Request">
          <div className="w-full max-w-md rounded-xl border border-border bg-surface p-6 shadow-2xl">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-base font-semibold text-ink">Raise Maintenance Request</h2>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="rounded p-1 text-ink3 hover:bg-sunken hover:text-ink transition"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleRaiseRequest} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-ink2 mb-1.5">
                  Select Asset <span className="text-danger">*</span>
                </label>
                <select name="assetId" required className="af-input">
                  <option value="">-- Choose an Asset --</option>
                  {assets.map((asset) => (
                    <option key={asset.id} value={asset.id}>
                      {asset.tag} — {asset.name} ({asset.status.replace("_", " ")})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink2 mb-1.5">
                  Issue Description <span className="text-danger">*</span>
                </label>
                <textarea
                  name="issueDescription"
                  required
                  rows={3}
                  placeholder="Describe the issue in detail..."
                  className="af-input resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink2 mb-1.5">
                  Priority <span className="text-danger">*</span>
                </label>
                <select name="priority" required defaultValue="MEDIUM" className="af-input">
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                  <option value="CRITICAL">Critical</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink2 mb-1.5">
                  Photo / Attachment URL (Optional)
                </label>
                <input
                  type="text"
                  name="photoUrl"
                  placeholder="e.g. https://example.com/asset-photo.jpg"
                  className="af-input"
                />
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
                  disabled={submitting}
                  className="af-btn-primary px-4 py-2"
                >
                  {submitting && <Loader2 size={12} className="animate-spin mr-1" />}
                  Raise Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Floating Toast Notification */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 bg-ink text-white rounded-lg px-4 py-3 shadow-lg text-sm flex items-center gap-2 border border-white/10 animate-slide-up">
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
