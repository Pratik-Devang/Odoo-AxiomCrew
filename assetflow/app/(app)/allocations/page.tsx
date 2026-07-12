"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { StatusChip } from "@/components/status-chip";
import { AssetTag } from "@/components/asset-tag";
import { AlertTriangle, ArrowLeftRight, Plus, Check, X, Clock, Loader2 } from "lucide-react";
import { format } from "date-fns";

interface Asset {
  id: number;
  tag: string;
  name: string;
  status: string;
  allocations: {
    id: number;
    allocatedAt: string;
    expectedReturnDate: string | null;
    returnedAt: string | null;
    status: string;
    employee?: { id: number; name: string; department?: { name: string } } | null;
    department?: { id: number; name: string } | null;
  }[];
}

interface TransferRequest {
  id: number;
  reason: string;
  requestedAt: string;
  asset: { id: number; tag: string; name: string; currentHolderDepartmentId: number | null };
  fromEmployee: { id: number; name: string };
  toEmployee: { id: number; name: string };
}

interface User {
  id: number;
  role: string;
  departmentId: number | null;
}

type TabType = "active" | "overdue" | "transfers";

export default function AllocationsPage() {
  const router = useRouter();
  const [tab, setTab] = useState<TabType>("active");
  const [assets, setAssets] = useState<Asset[]>([]);
  const [transferRequests, setTransferRequests] = useState<TransferRequest[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setError(null);
      const [resAssets, resTransfers, resMe] = await Promise.all([
        fetch("/api/assets"),
        fetch("/api/transfer-requests"),
        fetch("/api/users/me"),
      ]);

      if (!resAssets.ok || !resTransfers.ok || !resMe.ok) {
        throw new Error("Failed to load allocations data from endpoints.");
      }

      const dataAssets = await resAssets.json();
      const dataTransfers = await resTransfers.json();
      const dataMe = await resMe.json();

      setAssets(dataAssets.assets || []);
      setTransferRequests(dataTransfers.transferRequests || []);
      setCurrentUser(dataMe.user || null);
    } catch (err: any) {
      setError(err.message || "Something went wrong while loading allocations.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const activeAllocations = useMemo(() => {
    const list: any[] = [];
    assets.forEach((asset) => {
      const active = asset.allocations.find((a) => a.status === "ACTIVE");
      if (active) {
        const isOverdue =
          active.expectedReturnDate && new Date(active.expectedReturnDate) < new Date();
        list.push({
          id: active.id,
          assetId: asset.id,
          tag: asset.tag,
          assetName: asset.name,
          holder: active.employee?.name || active.department?.name || "Unassigned",
          dept: active.employee?.department?.name || active.department?.name || "",
          since: format(new Date(active.allocatedAt), "MMM dd, yyyy"),
          due: active.expectedReturnDate
            ? format(new Date(active.expectedReturnDate), "MMM dd, yyyy")
            : null,
          overdue: !!isOverdue,
          employeeId: active.employee?.id || null,
        });
      }
    });
    return list;
  }, [assets]);

  const displayed = useMemo(() => {
    if (tab === "overdue") {
      return activeAllocations.filter((a) => a.overdue);
    }
    return activeAllocations;
  }, [tab, activeAllocations]);

  const overdueCount = useMemo(() => {
    return activeAllocations.filter((a) => a.overdue).length;
  }, [activeAllocations]);

  const isManager = useMemo(() => {
    if (!currentUser) return false;
    return ["ADMIN", "ASSET_MANAGER"].includes(currentUser.role);
  }, [currentUser]);

  const isManagerOrHead = useMemo(() => {
    if (!currentUser) return false;
    return ["ADMIN", "ASSET_MANAGER", "DEPARTMENT_HEAD"].includes(currentUser.role);
  }, [currentUser]);

  const canApprove = (req: TransferRequest) => {
    if (!currentUser) return false;
    if (currentUser.role === "ADMIN" || currentUser.role === "ASSET_MANAGER") return true;
    if (currentUser.role === "DEPARTMENT_HEAD") {
      const assetDeptId = req.asset.currentHolderDepartmentId;
      return assetDeptId !== null && currentUser.departmentId === assetDeptId;
    }
    return false;
  };

  // Handle return action
  const handleReturn = async (allocationId: number, assetTag: string) => {
    const notes = window.prompt(`Enter return condition notes for asset ${assetTag} (optional):`);
    if (notes === null) return; // User cancelled prompt

    setActionLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch(`/api/allocations/${allocationId}/return`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ returnConditionNotes: notes }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to process return.");
      }

      setSuccess(`Asset ${assetTag} marked as returned successfully.`);
      await loadData();
    } catch (err: any) {
      setError(err.message || "An error occurred.");
    } finally {
      setActionLoading(false);
    }
  };

  // Handle transfer approval/rejection
  const handleTransferDecision = async (requestId: number, action: "APPROVE" | "REJECT") => {
    setActionLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch(`/api/transfer-requests/${requestId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || `Failed to ${action.toLowerCase()} transfer request.`);
      }

      setSuccess(`Transfer request successfully ${action === "APPROVE" ? "approved" : "rejected"}.`);
      await loadData();
    } catch (err: any) {
      setError(err.message || "An error occurred.");
    } finally {
      setActionLoading(false);
    }
  };

  const TABS: [TabType, string][] = [
    ["active", "Active Allocations"],
    ["overdue", `Overdue (${overdueCount})`],
    ["transfers", "Transfer Requests"],
  ];

  if (loading) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-signal" />
        <p className="text-xs font-bold uppercase tracking-widest text-ink3">Loading Allocations...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b-2 border-ink pb-4">
        <div>
          <h1 className="text-lg font-bold uppercase tracking-widest text-ink">Allocation & Transfer</h1>
          <p className="text-xs text-ink3 mt-0.5">{activeAllocations.length} active allocations</p>
        </div>
        {isManager && (
          <button onClick={() => router.push("/allocation")} className="af-btn-primary gap-1.5 text-xs">
            <Plus size={13} />
            New Allocation
          </button>
        )}
      </div>

      {/* Message banners */}
      {error && (
        <div className="flex items-center gap-3 border-2 border-danger bg-danger_bg px-4 py-3 text-danger font-bold text-xs">
          <AlertTriangle size={14} className="shrink-0" />
          <span>{error}</span>
        </div>
      )}
      {success && (
        <div className="flex items-center gap-3 border-2 border-go bg-go_bg px-4 py-3 text-go font-bold text-xs">
          <Check size={14} className="shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {/* Overdue alert banner */}
      {overdueCount > 0 && (
        <div className="flex items-center gap-3 border-2 border-danger bg-danger_bg px-4 py-3">
          <AlertTriangle size={14} className="text-danger shrink-0" />
          <p className="text-xs font-bold text-danger">
            {overdueCount} allocation{overdueCount > 1 ? "s" : ""} are overdue — immediate action required.
          </p>
        </div>
      )}

      {/* Tab bar */}
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
          {displayed.length === 0 ? (
            <p className="text-xs font-bold text-ink3 text-center py-20">
              No {tab === "overdue" ? "overdue" : "active"} allocations found.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-canvas">
                    <th className="af-th text-left">Asset</th>
                    <th className="af-th text-left">Name</th>
                    <th className="af-th text-left">Holder</th>
                    <th className="af-th text-left">Department</th>
                    <th className="af-th text-left">Since</th>
                    <th className="af-th text-left">Due Date</th>
                    <th className="af-th text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {displayed.map((row) => (
                    <tr
                      key={row.id}
                      className={`hover:bg-canvas transition-colors ${
                        row.overdue ? "bg-danger_bg/30" : ""
                      }`}
                    >
                      <td className="af-td">
                        <AssetTag tag={row.tag} />
                      </td>
                      <td className="af-td font-medium text-ink">{row.assetName}</td>
                      <td className="af-td text-ink2">{row.holder}</td>
                      <td className="af-td text-ink3">{row.dept}</td>
                      <td className="af-td font-mono text-xs text-ink3">{row.since}</td>
                      <td className="af-td">
                        {row.due ? (
                          <span
                            className={`flex items-center gap-1.5 font-mono text-xs ${
                              row.overdue ? "text-danger font-bold" : "text-ink3"
                            }`}
                          >
                            {row.overdue && <Clock size={11} />}
                            {row.due}
                            {row.overdue && (
                              <span className="border border-danger bg-danger_bg text-danger text-[9px] font-bold uppercase px-1 py-px">
                                Overdue
                              </span>
                            )}
                          </span>
                        ) : (
                          <span className="text-xs text-ink3">Permanent</span>
                        )}
                      </td>
                      <td className="af-td text-right">
                        <div className="inline-flex items-center gap-2">
                          <button
                            onClick={() => router.push(`/allocation?assetId=${row.assetId}`)}
                            className="af-btn-secondary text-[10px] px-2.5 py-1.5 flex items-center gap-1"
                          >
                            <ArrowLeftRight size={11} />
                            Transfer
                          </button>
                          {(isManager || row.employeeId === currentUser?.id) && (
                            <button
                              onClick={() => handleReturn(row.id, row.tag)}
                              disabled={actionLoading}
                              className="border border-go bg-go_bg text-go hover:bg-go hover:text-white text-[10px] px-2.5 py-1.5 font-bold transition-colors flex items-center gap-1"
                              title="Mark Returned"
                            >
                              <Check size={11} /> Return
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        /* Transfer requests */
        <div className="border-2 border-ink bg-surface overflow-hidden">
          {transferRequests.length === 0 ? (
            <p className="text-xs font-bold text-ink3 text-center py-20">
              No pending transfer requests found.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-canvas">
                    <th className="af-th text-left">Asset</th>
                    <th className="af-th text-left">Name</th>
                    <th className="af-th text-left">From</th>
                    <th className="af-th text-left">To</th>
                    <th className="af-th text-left">Reason</th>
                    <th className="af-th text-left">Requested</th>
                    <th className="af-th text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {transferRequests.map((req) => (
                    <tr key={req.id} className="hover:bg-canvas transition-colors">
                      <td className="af-td">
                        <AssetTag tag={req.asset.tag} />
                      </td>
                      <td className="af-td font-medium text-ink">{req.asset.name}</td>
                      <td className="af-td text-ink2">{req.fromEmployee.name}</td>
                      <td className="af-td text-ink2">{req.toEmployee.name}</td>
                      <td className="af-td text-xs text-ink3 max-w-[160px] truncate" title={req.reason}>
                        {req.reason}
                      </td>
                      <td className="af-td font-mono text-xs text-ink3">
                        {format(new Date(req.requestedAt), "MMM dd, yyyy")}
                      </td>
                      <td className="af-td text-right">
                        {canApprove(req) ? (
                          <div className="inline-flex gap-2">
                            <button
                              onClick={() => handleTransferDecision(req.id, "APPROVE")}
                              disabled={actionLoading}
                              className="border border-go bg-go_bg text-go hover:bg-go hover:text-white text-[10px] px-2.5 py-1.5 font-bold transition-colors flex items-center gap-1"
                            >
                              <Check size={11} /> Approve
                            </button>
                            <button
                              onClick={() => handleTransferDecision(req.id, "REJECT")}
                              disabled={actionLoading}
                              className="border border-danger bg-danger_bg text-danger hover:bg-danger hover:text-white text-[10px] px-2.5 py-1.5 font-bold transition-colors flex items-center gap-1"
                            >
                              <X size={11} /> Reject
                            </button>
                          </div>
                        ) : (
                          <span className="text-[10px] font-bold text-ink3 uppercase tracking-widest">
                            Pending Review
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
