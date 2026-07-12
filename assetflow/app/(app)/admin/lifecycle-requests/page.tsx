"use client";

import { useEffect, useState, useMemo } from "react";
import { format } from "date-fns";
import {
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  Loader2,
  SlidersHorizontal,
  ChevronRight,
  Shield,
  User,
  Building,
  Calendar,
  MessageSquare,
  AlertTriangle,
  ArrowRight,
} from "lucide-react";
import { AssetTag } from "@/components/asset-tag";
import { StatusChip } from "@/components/status-chip";

interface UserProfile {
  id: number;
  name: string;
  role: string;
  departmentId: number | null;
}

interface LifecycleRequest {
  id: number;
  assetId: number;
  requestedById: number;
  requestedStatus: string;
  reason: string;
  notes: string | null;
  status: "PENDING" | "APPROVED" | "REJECTED";
  adminMessage: string | null;
  reviewedById: number | null;
  reviewedAt: string | null;
  createdAt: string;
  asset: {
    id: number;
    tag: string;
    name: string;
    status: string;
    department: { id: number; name: string } | null;
  };
  requestedBy: {
    id: number;
    name: string;
    role: string;
    department: { id: number; name: string } | null;
  };
  reviewedBy: {
    id: number;
    name: string;
  } | null;
}

export default function LifecycleAdminPage() {
  const [requests, setRequests] = useState<LifecycleRequest[]>([]);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Filters & Search
  const [statusFilter, setStatusFilter] = useState<"PENDING" | "APPROVED" | "REJECTED" | "ALL">("PENDING");
  const [searchQuery, setSearchQuery] = useState("");

  // Drawer
  const [selectedRequest, setSelectedRequest] = useState<LifecycleRequest | null>(null);
  const [adminMessageInput, setAdminMessageInput] = useState("");

  const loadData = async () => {
    setLoading(true);
    try {
      const [resRequests, resMe] = await Promise.all([
        fetch("/api/lifecycle-requests", { cache: "no-store" }),
        fetch("/api/users/me", { cache: "no-store" }),
      ]);

      if (resRequests.ok) {
        const reqData = await resRequests.json();
        setRequests(reqData.requests || []);
      }
      if (resMe.ok) {
        const meData = await resMe.json();
        setCurrentUser(meData.user || null);
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to load workflow data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleReview = async (action: "APPROVE" | "REJECT") => {
    if (!selectedRequest) return;

    if (action === "REJECT" && !adminMessageInput.trim()) {
      setErrorMsg("A rejection reason/message is required.");
      return;
    }

    setActionLoading(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const res = await fetch(`/api/lifecycle-requests/${selectedRequest.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          adminMessage: adminMessageInput,
        }),
      });

      const payload = await res.json();
      if (!res.ok) {
        throw new Error(payload.error || "Failed to submit decision.");
      }

      setSuccessMsg(`Lifecycle request successfully ${action.toLowerCase()}ed.`);
      setAdminMessageInput("");
      setSelectedRequest(null);
      await loadData();
    } catch (err: any) {
      setErrorMsg(err.message || "Action failed.");
    } finally {
      setActionLoading(false);
    }
  };

  // Filter and Search logic
  const filteredRequests = useMemo(() => {
    return requests.filter((req) => {
      // 1. Status Filter
      if (statusFilter !== "ALL" && req.status !== statusFilter) {
        return false;
      }
      // 2. Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const assetName = req.asset.name.toLowerCase();
        const assetTag = req.asset.tag.toLowerCase();
        const requester = req.requestedBy.name.toLowerCase();
        const department = req.asset.department?.name.toLowerCase() || "";
        const details = req.reason.toLowerCase();

        return (
          assetName.includes(q) ||
          assetTag.includes(q) ||
          requester.includes(q) ||
          department.includes(q) ||
          details.includes(q)
        );
      }
      return true;
    });
  }, [requests, statusFilter, searchQuery]);

  if (loading) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-signal" />
        <p className="text-xs font-bold uppercase tracking-widest text-ink3">Loading Lifecycle Requests...</p>
      </div>
    );
  }

  if (currentUser?.role !== "ADMIN") {
    return (
      <div className="flex h-[50vh] flex-col items-center justify-center text-center p-6 space-y-4">
        <Shield size={48} className="text-danger" />
        <h2 className="text-lg font-bold text-ink uppercase tracking-wider">Access Denied</h2>
        <p className="text-sm text-ink3 max-w-md">
          Only administrators are authorized to access the Lifecycle Request Approval Dashboard.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b-2 border-ink pb-4 gap-4">
        <div>
          <h1 className="text-lg font-bold uppercase tracking-widest text-ink">Lifecycle Requests</h1>
          <p className="text-xs text-ink3 mt-0.5">Approve, reject, and audit asset state transitions</p>
        </div>
      </div>

      {/* Message banners */}
      {errorMsg && (
        <div className="flex items-center gap-3 border-2 border-danger bg-danger_bg px-4 py-3 text-danger font-bold text-xs rounded-lg">
          <AlertTriangle size={14} className="shrink-0" />
          <span>{errorMsg}</span>
          <button onClick={() => setErrorMsg("")} className="ml-auto text-danger hover:opacity-85">
            ✕
          </button>
        </div>
      )}
      {successMsg && (
        <div className="flex items-center gap-3 border-2 border-go bg-go_bg px-4 py-3 text-go font-bold text-xs rounded-lg">
          <CheckCircle2 size={14} className="shrink-0" />
          <span>{successMsg}</span>
          <button onClick={() => setSuccessMsg("")} className="ml-auto text-go hover:opacity-85">
            ✕
          </button>
        </div>
      )}

      {/* Toolbar & Filters */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-canvas border-2 border-ink p-4 rounded-xl">
        {/* Status filters */}
        <div className="flex border-2 border-ink rounded-lg overflow-hidden shrink-0">
          {(["PENDING", "APPROVED", "REJECTED", "ALL"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setStatusFilter(tab)}
              className={`px-4 py-2 text-xs font-bold uppercase transition ${
                statusFilter === tab
                  ? "bg-ink text-white"
                  : "bg-surface text-ink hover:bg-canvas"
              } ${tab !== "PENDING" ? "border-l-2 border-ink" : ""}`}
            >
              {tab === "PENDING" ? "Pending" : tab === "APPROVED" ? "Approved" : tab === "REJECTED" ? "Rejected" : "All"}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink3" />
          <input
            type="text"
            placeholder="Search by asset tag, name, requester, or department..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="af-input pl-10 w-full text-xs"
          />
        </div>
      </div>

      {/* Requests Table */}
      <div className="border-2 border-ink bg-surface rounded-xl overflow-x-auto">
        {filteredRequests.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center text-ink3 text-xs italic">
            <SlidersHorizontal size={36} className="text-ink3/40 mb-3" />
            No lifecycle requests match your selected filters.
          </div>
        ) : (
          <table className="w-full min-w-[850px] border-collapse text-left text-xs">
            <thead>
              <tr className="bg-canvas border-b-2 border-ink font-bold text-ink uppercase tracking-wider">
                <th className="p-4 border-r border-ink/10">Asset</th>
                <th className="p-4 border-r border-ink/10">Department</th>
                <th className="p-4 border-r border-ink/10">Requested By</th>
                <th className="p-4 border-r border-ink/10">Action</th>
                <th className="p-4 border-r border-ink/10">Date</th>
                <th className="p-4">Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredRequests.map((req) => (
                <tr
                  key={req.id}
                  onClick={() => {
                    setSelectedRequest(req);
                    setAdminMessageInput("");
                  }}
                  className="border-b border-ink/10 last:border-0 hover:bg-canvas/40 cursor-pointer transition"
                >
                  <td className="p-4 border-r border-ink/10">
                    <div className="flex items-center gap-3">
                      <AssetTag tag={req.asset.tag} />
                      <span className="font-bold text-ink hover:text-signal transition">
                        {req.asset.name}
                      </span>
                    </div>
                  </td>
                  <td className="p-4 border-r border-ink/10 font-medium text-ink2">
                    {req.asset.department?.name || "No department"}
                  </td>
                  <td className="p-4 border-r border-ink/10">
                    <div className="font-semibold text-ink">{req.requestedBy.name}</div>
                    <div className="text-[10px] text-ink3 font-medium uppercase tracking-wider">
                      {req.requestedBy.role.replace("_", " ")}
                    </div>
                  </td>
                  <td className="p-4 border-r border-ink/10">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                      req.requestedStatus === "RETIRED"
                        ? "bg-gray_bg text-ink2 border border-ink2/20"
                        : req.requestedStatus === "LOST"
                        ? "bg-danger_bg text-danger border border-danger/20"
                        : "bg-orange-100 text-orange-700 border border-orange-200"
                    }`}>
                      {req.requestedStatus}
                    </span>
                  </td>
                  <td className="p-4 border-r border-ink/10 text-ink2">
                    {format(new Date(req.createdAt), "dd MMM yyyy, HH:mm")}
                  </td>
                  <td className="p-4">
                    <StatusChip status={req.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Review Drawer */}
      {selectedRequest && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/60" onClick={() => setSelectedRequest(null)}>
          <div className="flex-1"></div>
          <div
            className="w-full max-w-md bg-surface border-l-2 border-ink p-6 space-y-6 h-full overflow-y-auto flex flex-col justify-between"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="space-y-6">
              {/* Drawer Header */}
              <div className="flex justify-between items-center border-b border-ink/10 pb-3">
                <h3 className="text-sm font-bold uppercase tracking-widest text-ink flex items-center gap-2">
                  <Shield size={16} className="text-signal" /> Request Details
                </h3>
                <button
                  onClick={() => setSelectedRequest(null)}
                  className="text-ink3 hover:text-ink transition text-lg"
                >
                  ✕
                </button>
              </div>

              {/* Asset Information Card */}
              <div className="bg-canvas border-2 border-ink p-4 rounded-xl space-y-3">
                <div className="text-[10px] font-bold uppercase text-ink3 tracking-widest">
                  Asset Information
                </div>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="block text-ink3 text-[9px] uppercase font-bold">Asset Tag</span>
                    <div className="mt-1">
                      <AssetTag tag={selectedRequest.asset.tag} />
                    </div>
                  </div>
                  <div>
                    <span className="block text-ink3 text-[9px] uppercase font-bold">Owner Department</span>
                    <span className="font-bold text-ink mt-1 block">
                      {selectedRequest.asset.department?.name || "Unassigned"}
                    </span>
                  </div>
                  <div>
                    <span className="block text-ink3 text-[9px] uppercase font-bold">Current Status</span>
                    <span className="mt-1 block">
                      <StatusChip status={selectedRequest.asset.status} size="sm" />
                    </span>
                  </div>
                  <div>
                    <span className="block text-ink3 text-[9px] uppercase font-bold">Requested Status</span>
                    <span className="font-bold text-danger mt-1 block uppercase">
                      {selectedRequest.requestedStatus}
                    </span>
                  </div>
                </div>
              </div>

              {/* Requester Profile */}
              <div className="space-y-2">
                <div className="text-[10px] font-bold uppercase text-ink3 tracking-widest">
                  Requester Details
                </div>
                <div className="flex items-center gap-3 bg-canvas/30 p-3 rounded-lg border border-ink/5 text-xs">
                  <div className="w-8 h-8 rounded-full bg-ink/5 border border-ink/15 flex items-center justify-center text-ink font-bold shrink-0">
                    {selectedRequest.requestedBy.name.charAt(0)}
                  </div>
                  <div>
                    <div className="font-bold text-ink">{selectedRequest.requestedBy.name}</div>
                    <div className="text-[10px] text-ink3 font-medium uppercase tracking-wider mt-0.5">
                      {selectedRequest.requestedBy.role.replace("_", " ")} · {selectedRequest.requestedBy.department?.name || "Corporate"}
                    </div>
                  </div>
                </div>
              </div>

              {/* Reason & Notes */}
              <div className="space-y-3.5 text-xs">
                <div>
                  <span className="text-ink3 font-bold text-[9px] uppercase tracking-wider block">
                    Reason for Request
                  </span>
                  <div className="mt-1.5 p-3 bg-canvas/40 border border-ink/10 rounded-lg text-ink font-medium leading-relaxed">
                    {selectedRequest.reason}
                  </div>
                </div>

                {selectedRequest.notes && (
                  <div>
                    <span className="text-ink3 font-bold text-[9px] uppercase tracking-wider block">
                      Additional Notes
                    </span>
                    <div className="mt-1.5 p-3 bg-canvas/40 border border-ink/10 rounded-lg text-ink2 leading-relaxed">
                      {selectedRequest.notes}
                    </div>
                  </div>
                )}
              </div>

              {/* Request Timeline */}
              <div className="space-y-3 border-t border-ink/10 pt-4">
                <div className="text-[10px] font-bold uppercase text-ink3 tracking-widest">
                  Timeline
                </div>
                <div className="relative pl-6 border-l-2 border-ink/10 space-y-5 text-xs py-1">
                  {/* Step 1: Created */}
                  <div className="relative">
                    <span className="absolute -left-[31px] top-0.5 w-4 h-4 rounded-full bg-signal border border-white flex items-center justify-center text-white text-[8px] font-bold">
                      ✓
                    </span>
                    <div className="font-semibold text-ink">Request Submitted</div>
                    <div className="text-ink3 text-[10px] mt-0.5">
                      by {selectedRequest.requestedBy.name} · {format(new Date(selectedRequest.createdAt), "dd MMM, HH:mm")}
                    </div>
                  </div>

                  {/* Step 2: Reviewed */}
                  {selectedRequest.status !== "PENDING" && (
                    <div className="relative">
                      <span className={`absolute -left-[31px] top-0.5 w-4 h-4 rounded-full border border-white flex items-center justify-center text-white text-[8px] font-bold ${
                        selectedRequest.status === "APPROVED" ? "bg-go" : "bg-danger"
                      }`}>
                        ✓
                      </span>
                      <div className="font-semibold text-ink">
                        Reviewed & {selectedRequest.status === "APPROVED" ? "Approved" : "Rejected"}
                      </div>
                      <div className="text-ink3 text-[10px] mt-0.5">
                        by {selectedRequest.reviewedBy?.name || "Admin"} · {selectedRequest.reviewedAt ? format(new Date(selectedRequest.reviewedAt), "dd MMM, HH:mm") : ""}
                      </div>
                      {selectedRequest.adminMessage && (
                        <div className="mt-2 p-2 bg-canvas border border-ink/5 rounded text-xs text-ink">
                          <span className="font-bold text-[9px] uppercase text-ink3 block mb-0.5">Admin Comment</span>
                          &ldquo;{selectedRequest.adminMessage}&rdquo;
                        </div>
                      )}
                    </div>
                  )}

                  {selectedRequest.status === "PENDING" && (
                    <div className="relative">
                      <span className="absolute -left-[31px] top-0.5 w-4 h-4 rounded-full bg-warn border border-white flex items-center justify-center text-white text-[8px] font-bold">
                        🕒
                      </span>
                      <div className="font-semibold text-ink2">Awaiting Approval</div>
                      <div className="text-ink3 text-[10px] mt-0.5">Waiting for administrator review</div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Admin Decision Actions */}
            {selectedRequest.status === "PENDING" && (
              <div className="border-t border-ink/10 pt-4 space-y-4">
                <div>
                  <label className="block text-[9px] font-bold uppercase tracking-wider text-ink3 mb-1.5">
                    Admin Comment <span className="text-danger font-bold">* required for rejection</span>
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Enter review decision message..."
                    value={adminMessageInput}
                    onChange={(e) => setAdminMessageInput(e.target.value)}
                    className="af-input w-full text-xs"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => handleReview("REJECT")}
                    disabled={actionLoading}
                    className="w-full flex items-center justify-center gap-1.5 border-2 border-danger text-danger hover:bg-danger_bg/15 font-bold text-xs py-2.5 transition rounded-lg"
                  >
                    <XCircle size={14} />
                    Reject Request
                  </button>

                  <button
                    onClick={() => handleReview("APPROVE")}
                    disabled={actionLoading}
                    className="w-full flex items-center justify-center gap-1.5 bg-ink text-white border-2 border-ink hover:bg-ink/90 font-bold text-xs py-2.5 transition rounded-lg"
                  >
                    {actionLoading ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <CheckCircle2 size={14} />
                    )}
                    Approve Request
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
