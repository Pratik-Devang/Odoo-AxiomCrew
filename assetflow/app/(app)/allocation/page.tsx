"use client";

import { useEffect, useState, useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { StatusChip } from "@/components/status-chip";
import { AssetTag } from "@/components/asset-tag";
import {
  Search,
  Plus,
  X,
  AlertTriangle,
  ArrowLeftRight,
  Check,
  History,
  CornerDownLeft,
  Calendar,
  User as UserIcon,
  Building,
  Loader2,
} from "lucide-react";
import { format } from "date-fns";

interface Asset {
  id: number;
  tag: string;
  name: string;
  serialNumber: string;
  condition: string;
  location: string;
  isBookable: boolean;
  status: string;
  currentHolderId: number | null;
  currentHolderDepartmentId: number | null;
  currentHolder?: {
    id: number;
    name: string;
    department?: { id: number; name: string };
  };
  currentHolderDepartment?: {
    id: number;
    name: string;
  };
  allocations: {
    id: number;
    allocatedAt: string;
    expectedReturnDate: string | null;
    returnedAt: string | null;
    returnConditionNotes: string | null;
    status: string;
    employee?: { id: number; name: string; department?: { name: string } } | null;
    department?: { id: number; name: string } | null;
  }[];
}

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  department?: { id: number; name: string };
}

interface Department {
  id: number;
  name: string;
}

interface TransferRequest {
  id: number;
  assetId: number;
  reason: string;
  requestedAt: string;
  asset: { id: number; tag: string; name: string };
  fromEmployee: { id: number; name: string; department?: { name: string } };
  toEmployee: { id: number; name: string; department?: { name: string } };
}

export default function AllocationPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const urlAssetId = searchParams.get("assetId");

  const [assets, setAssets] = useState<Asset[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [pendingTransfers, setPendingTransfers] = useState<TransferRequest[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Selector state
  const [selectedAssetId, setSelectedAssetId] = useState<number | null>(null);
  const [assetSearchQuery, setAssetSearchQuery] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);

  // Allocate form state
  const [targetType, setTargetType] = useState<"employee" | "department">("employee");
  const [allocateEmployeeId, setAllocateEmployeeId] = useState("");
  const [allocateDeptId, setAllocateDeptId] = useState("");
  const [expectedReturnDate, setExpectedReturnDate] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  // Transfer Request form state
  const [transferToEmployeeId, setTransferToEmployeeId] = useState("");
  const [transferReason, setTransferReason] = useState("");

  // Return dialog state
  const [showReturnDialog, setShowReturnDialog] = useState(false);
  const [returnNotes, setReturnNotes] = useState("");
  const [returningAllocationId, setReturningAllocationId] = useState<number | null>(null);

  const isManagerOrHead = useMemo(() => {
    if (!currentUser) return false;
    return ["ADMIN", "ASSET_MANAGER", "DEPARTMENT_HEAD"].includes(currentUser.role);
  }, [currentUser]);

  const loadData = async () => {
    try {
      setError(null);
      const [resAssets, resMe, resUsers, resDepts, resTransfers] = await Promise.all([
        fetch("/api/assets"),
        fetch("/api/users/me"),
        fetch("/api/users"),
        fetch("/api/departments"),
        fetch("/api/transfer-requests"),
      ]);

      if (!resAssets.ok || !resMe.ok || !resUsers.ok || !resDepts.ok || !resTransfers.ok) {
        throw new Error("Failed to load setup data from endpoints.");
      }

      const dataAssets = await resAssets.json();
      const dataMe = await resMe.json();
      const dataUsers = await resUsers.json();
      const dataDepts = await resDepts.json();
      const dataTransfers = await resTransfers.json();

      setAssets(dataAssets.assets || []);
      setCurrentUser(dataMe.user || null);
      setUsers(dataUsers.users || []);
      setDepartments(dataDepts.departments || []);
      setPendingTransfers(dataTransfers.transferRequests || []);
    } catch (err: any) {
      setError(err.message || "An error occurred while loading page data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Pre-select asset if assetId parameter exists in URL
  useEffect(() => {
    if (assets.length > 0 && urlAssetId) {
      const matched = assets.find((a) => a.id === Number(urlAssetId));
      if (matched) {
        setSelectedAssetId(matched.id);
        setAssetSearchQuery(`${matched.tag} - ${matched.name}`);
      }
    }
  }, [urlAssetId, assets]);

  const selectedAsset = useMemo(() => {
    return assets.find((a) => a.id === selectedAssetId) || null;
  }, [selectedAssetId, assets]);

  // Find active allocation for currently selected asset
  const activeAllocation = useMemo(() => {
    if (!selectedAsset) return null;
    return selectedAsset.allocations.find((a) => a.status === "ACTIVE") || null;
  }, [selectedAsset]);

  const filteredAssets = useMemo(() => {
    if (!assetSearchQuery) return assets.slice(0, 10);
    const query = assetSearchQuery.toLowerCase();
    return assets.filter(
      (a) => a.name.toLowerCase().includes(query) || a.tag.toLowerCase().includes(query)
    );
  }, [assetSearchQuery, assets]);

  const handleAssetSelect = (asset: Asset) => {
    setSelectedAssetId(asset.id);
    setAssetSearchQuery(`${asset.tag} - ${asset.name}`);
    setShowDropdown(false);
    setError(null);
    setSuccess(null);
    // Reset forms
    setAllocateEmployeeId("");
    setAllocateDeptId("");
    setExpectedReturnDate("");
    setTransferToEmployeeId("");
    setTransferReason("");
  };

  const handleClearSelection = () => {
    setSelectedAssetId(null);
    setAssetSearchQuery("");
    setError(null);
    setSuccess(null);
    router.push("/allocation");
  };

  // Direct Allocation Submit
  const handleAllocateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAssetId) return;

    setActionLoading(true);
    setError(null);
    setSuccess(null);

    const body = {
      assetId: selectedAssetId,
      employeeId: targetType === "employee" ? Number(allocateEmployeeId) : null,
      departmentId: targetType === "department" ? Number(allocateDeptId) : null,
      expectedReturnDate: expectedReturnDate || null,
    };

    try {
      const res = await fetch("/api/allocations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to allocate asset.");
      }

      setSuccess(`Asset allocated successfully!`);
      // Reload assets
      await loadData();
    } catch (err: any) {
      setError(err.message || "Something went wrong.");
    } finally {
      setActionLoading(false);
    }
  };

  // Transfer Request Submit
  const handleTransferRequestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAssetId) return;

    setActionLoading(true);
    setError(null);
    setSuccess(null);

    const body = {
      assetId: selectedAssetId,
      toEmployeeId: Number(transferToEmployeeId),
      reason: transferReason,
    };

    try {
      const res = await fetch("/api/transfer-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to submit transfer request.");
      }

      setSuccess("Transfer request submitted successfully and is pending approval.");
      setTransferToEmployeeId("");
      setTransferReason("");
      await loadData();
    } catch (err: any) {
      setError(err.message || "Something went wrong.");
    } finally {
      setActionLoading(false);
    }
  };

  // Transfer Approval Action
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
      setError(err.message || "Something went wrong.");
    } finally {
      setActionLoading(false);
    }
  };

  // Return Action Submit
  const handleReturnSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!returningAllocationId) return;

    setActionLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch(`/api/allocations/${returningAllocationId}/return`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ returnConditionNotes: returnNotes }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to return asset.");
      }

      setSuccess("Asset marked as returned and is now available.");
      setShowReturnDialog(false);
      setReturnNotes("");
      setReturningAllocationId(null);
      await loadData();
    } catch (err: any) {
      setError(err.message || "Something went wrong.");
    } finally {
      setActionLoading(false);
    }
  };

  const openReturnDialog = (allocId: number) => {
    setReturningAllocationId(allocId);
    setReturnNotes("");
    setShowReturnDialog(true);
  };

  if (loading) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-signal" />
        <p className="text-xs font-bold uppercase tracking-widest text-ink3">Loading Asset Registry...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="border-b-2 border-ink pb-4">
        <h1 className="text-lg font-bold uppercase tracking-widest text-ink">Allocation & Transfer</h1>
        <p className="text-xs text-ink3 mt-0.5">Manage item assignments and request transfers</p>
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

      {/* Asset Selector */}
      <div className="border-2 border-ink bg-surface p-5 space-y-4">
        <label className="block text-[10px] font-bold uppercase tracking-widest text-ink3">
          Select Asset for Allocation or Transfer
        </label>
        <div className="relative">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink3" />
              <input
                type="text"
                placeholder="Search asset by tag (e.g. AF-0001) or name..."
                value={assetSearchQuery}
                onChange={(e) => {
                  setAssetSearchQuery(e.target.value);
                  setShowDropdown(true);
                }}
                onFocus={() => setShowDropdown(true)}
                className="af-input pl-9 text-xs w-full"
              />
            </div>
            {selectedAssetId && (
              <button
                type="button"
                onClick={handleClearSelection}
                className="border-2 border-ink bg-canvas px-3 text-xs font-bold text-ink hover:bg-ink hover:text-white transition-colors flex items-center gap-1.5"
              >
                <X size={12} /> Clear
              </button>
            )}
          </div>

          {/* Selector Dropdown */}
          {showDropdown && filteredAssets.length > 0 && (
            <div className="absolute z-10 left-0 right-0 mt-1 border-2 border-ink bg-surface shadow-md max-h-60 overflow-y-auto">
              {filteredAssets.map((asset) => (
                <button
                  key={asset.id}
                  onClick={() => handleAssetSelect(asset)}
                  className="w-full text-left px-4 py-2 text-xs hover:bg-canvas border-b border-ink/5 flex items-center justify-between"
                >
                  <div>
                    <span className="font-bold text-ink mr-2">{asset.tag}</span>
                    <span className="text-ink2">{asset.name}</span>
                  </div>
                  <StatusChip status={asset.status} size="sm" />
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {selectedAsset && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Main Action Block (Allocate OR Transfer Banner/Form) */}
          <div className="md:col-span-2 space-y-6">
            {activeAllocation ? (
              /* IF ALREADY ALLOCATED */
              <div className="space-y-6">
                {/* Red Conflict Banner */}
                <div className="border-2 border-danger bg-danger_bg p-4 flex gap-3 items-start">
                  <AlertTriangle size={18} className="text-danger shrink-0 mt-0.5" />
                  <div>
                    <h3 className="text-xs font-bold text-danger uppercase tracking-wider">Blocked Re-allocation</h3>
                    <p className="text-xs text-danger mt-1">
                      Already Allocated to{" "}
                      <span className="font-bold">
                        {activeAllocation.employee?.name || activeAllocation.department?.name}
                      </span>{" "}
                      {activeAllocation.employee?.department?.name && (
                        <span>({activeAllocation.employee.department.name})</span>
                      )}{" "}
                      — Direct re-allocation is blocked. Submit a transfer request below.
                    </p>
                  </div>
                </div>

                {/* Transfer Request Form */}
                <form
                  onSubmit={handleTransferRequestSubmit}
                  className="border-2 border-ink bg-surface p-5 space-y-4"
                >
                  <div className="flex items-center gap-2 border-b border-ink/10 pb-3">
                    <ArrowLeftRight size={14} className="text-signal" />
                    <h2 className="text-xs font-bold uppercase tracking-widest text-ink">
                      Submit Transfer Request
                    </h2>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[9px] font-bold uppercase tracking-wider text-ink3 mb-1.5">
                        From Current Holder (Locked)
                      </label>
                      <input
                        type="text"
                        disabled
                        value={
                          activeAllocation.employee?.name ||
                          activeAllocation.department?.name ||
                          "Unknown"
                        }
                        className="af-input w-full bg-canvas text-ink3 text-xs border-dashed"
                      />
                    </div>

                    <div>
                      <label className="block text-[9px] font-bold uppercase tracking-wider text-ink3 mb-1.5">
                        To Employee
                      </label>
                      <select
                        required
                        value={transferToEmployeeId}
                        onChange={(e) => setTransferToEmployeeId(e.target.value)}
                        className="af-input w-full text-xs"
                      >
                        <option value="">-- Select Recipient Employee --</option>
                        {users
                          .filter((u) => u.id !== activeAllocation.employee?.id)
                          .map((u) => (
                            <option key={u.id} value={u.id}>
                              {u.name} {u.department ? `(${u.department.name})` : ""}
                            </option>
                          ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[9px] font-bold uppercase tracking-wider text-ink3 mb-1.5">
                      Reason for Transfer
                    </label>
                    <textarea
                      required
                      rows={3}
                      placeholder="Explain why this transfer is needed (e.g. project reassignment, new department join)..."
                      value={transferReason}
                      onChange={(e) => setTransferReason(e.target.value)}
                      className="af-input w-full text-xs"
                    ></textarea>
                  </div>

                  <div className="flex justify-between items-center pt-2">
                    <button
                      type="button"
                      onClick={() => openReturnDialog(activeAllocation.id)}
                      className="border border-danger bg-danger_bg text-danger hover:bg-danger hover:text-white font-bold text-xs px-4 py-2 transition-colors flex items-center gap-1.5"
                    >
                      <CornerDownLeft size={13} /> Return Asset
                    </button>

                    <button
                      type="submit"
                      disabled={actionLoading}
                      className="af-btn-primary text-xs px-5 py-2 flex items-center gap-1.5"
                    >
                      {actionLoading && <Loader2 size={12} className="animate-spin" />}
                      Submit Request
                    </button>
                  </div>
                </form>
              </div>
            ) : (
              /* IF AVAILABLE OR OTHER STATUS (BUT NOT ACTIVE ALLOCATION) */
              <div className="space-y-6">
                {["RETIRED", "DISPOSED", "LOST"].includes(selectedAsset.status) ? (
                  <div className="border-2 border-warn bg-warn_bg p-4 flex gap-3 items-start">
                    <AlertTriangle size={18} className="text-warn shrink-0 mt-0.5" />
                    <div>
                      <h3 className="text-xs font-bold text-warn uppercase tracking-wider">Allocation Blocked</h3>
                      <p className="text-xs text-warn mt-1">
                        This asset is marked as <span className="font-bold">{selectedAsset.status.toLowerCase()}</span> and cannot be allocated.
                      </p>
                    </div>
                  </div>
                ) : (
                  <form
                    onSubmit={handleAllocateSubmit}
                    className="border-2 border-ink bg-surface p-5 space-y-4"
                  >
                    <div className="flex items-center gap-2 border-b border-ink/10 pb-3">
                      <Plus size={14} className="text-signal" />
                      <h2 className="text-xs font-bold uppercase tracking-widest text-ink">
                        Create New Allocation
                      </h2>
                    </div>

                    <div className="flex gap-4 border-b border-ink/5 pb-2">
                      <label className="flex items-center gap-2 text-xs font-bold text-ink cursor-pointer">
                        <input
                          type="radio"
                          name="targetType"
                          checked={targetType === "employee"}
                          onChange={() => setTargetType("employee")}
                          className="accent-signal"
                        />
                        Allocate to Employee
                      </label>
                      <label className="flex items-center gap-2 text-xs font-bold text-ink cursor-pointer">
                        <input
                          type="radio"
                          name="targetType"
                          checked={targetType === "department"}
                          onChange={() => setTargetType("department")}
                          className="accent-signal"
                        />
                        Allocate to Department
                      </label>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {targetType === "employee" ? (
                        <div>
                          <label className="block text-[9px] font-bold uppercase tracking-wider text-ink3 mb-1.5">
                            Employee
                          </label>
                          <select
                            required
                            value={allocateEmployeeId}
                            onChange={(e) => setAllocateEmployeeId(e.target.value)}
                            className="af-input w-full text-xs"
                          >
                            <option value="">-- Select Employee --</option>
                            {users.map((u) => (
                              <option key={u.id} value={u.id}>
                                {u.name} {u.department ? `(${u.department.name})` : ""}
                              </option>
                            ))}
                          </select>
                        </div>
                      ) : (
                        <div>
                          <label className="block text-[9px] font-bold uppercase tracking-wider text-ink3 mb-1.5">
                            Department
                          </label>
                          <select
                            required
                            value={allocateDeptId}
                            onChange={(e) => setAllocateDeptId(e.target.value)}
                            className="af-input w-full text-xs"
                          >
                            <option value="">-- Select Department --</option>
                            {departments.map((d) => (
                              <option key={d.id} value={d.id}>
                                {d.name}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}

                      <div>
                        <label className="block text-[9px] font-bold uppercase tracking-wider text-ink3 mb-1.5">
                          Expected Return Date (Optional)
                        </label>
                        <div className="relative">
                          <Calendar size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink3" />
                          <input
                            type="date"
                            value={expectedReturnDate}
                            onChange={(e) => setExpectedReturnDate(e.target.value)}
                            className="af-input pl-9 w-full text-xs"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end pt-2">
                      <button
                        type="submit"
                        disabled={actionLoading}
                        className="af-btn-primary text-xs px-5 py-2 flex items-center gap-1.5"
                      >
                        {actionLoading && <Loader2 size={12} className="animate-spin" />}
                        Allocate Asset
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )}
          </div>

          {/* Quick Details Sidebar */}
          <div className="border-2 border-ink bg-surface p-5 space-y-4">
            <div className="border-b border-ink/10 pb-2">
              <span className="text-[9px] font-bold uppercase tracking-widest text-ink3 block">Selected Item</span>
              <h3 className="text-sm font-bold text-ink mt-0.5">{selectedAsset.name}</h3>
              <div className="mt-1.5">
                <AssetTag tag={selectedAsset.tag} />
              </div>
            </div>

            <dl className="space-y-3 text-xs">
              <div className="flex justify-between border-b border-ink/5 pb-1.5">
                <dt className="text-ink3">Status</dt>
                <dd>
                  <StatusChip status={selectedAsset.status} size="sm" />
                </dd>
              </div>
              <div className="flex justify-between border-b border-ink/5 pb-1.5">
                <dt className="text-ink3">Serial Number</dt>
                <dd className="font-mono text-ink font-semibold">{selectedAsset.serialNumber || "—"}</dd>
              </div>
              <div className="flex justify-between border-b border-ink/5 pb-1.5">
                <dt className="text-ink3">Condition</dt>
                <dd className="font-bold text-ink uppercase tracking-wide text-[10px]">{selectedAsset.condition}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-ink3">Location</dt>
                <dd className="text-ink font-medium">{selectedAsset.location || "—"}</dd>
              </div>
            </dl>
          </div>
        </div>
      )}

      {/* Pending Transfers List/Table */}
      {isManagerOrHead && pendingTransfers.length > 0 && (
        <div className="border-2 border-ink bg-surface p-5 space-y-4">
          <div className="flex items-center gap-2 border-b border-ink/10 pb-3">
            <ArrowLeftRight size={14} className="text-signal" />
            <h2 className="text-xs font-bold uppercase tracking-widest text-ink">
              Pending Transfer Approvals
            </h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-canvas">
                  <th className="af-th text-left">Asset</th>
                  <th className="af-th text-left">From Current Holder</th>
                  <th className="af-th text-left">To Recipient</th>
                  <th className="af-th text-left">Reason</th>
                  <th className="af-th text-left">Requested At</th>
                  <th className="af-th text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink/10 text-xs">
                {pendingTransfers.map((req) => (
                  <tr key={req.id} className="hover:bg-canvas transition-colors">
                    <td className="af-td py-3">
                      <div className="flex flex-col gap-0.5">
                        <AssetTag tag={req.asset.tag} />
                        <span className="font-medium text-ink">{req.asset.name}</span>
                      </div>
                    </td>
                    <td className="af-td text-ink2 py-3">
                      <div className="flex flex-col">
                        <span className="font-semibold">{req.fromEmployee.name}</span>
                        {req.fromEmployee.department && (
                          <span className="text-[10px] text-ink3">{req.fromEmployee.department.name}</span>
                        )}
                      </div>
                    </td>
                    <td className="af-td text-ink2 py-3">
                      <div className="flex flex-col">
                        <span className="font-semibold">{req.toEmployee.name}</span>
                        {req.toEmployee.department && (
                          <span className="text-[10px] text-ink3">{req.toEmployee.department.name}</span>
                        )}
                      </div>
                    </td>
                    <td className="af-td text-ink3 max-w-[200px] truncate py-3" title={req.reason}>
                      {req.reason}
                    </td>
                    <td className="af-td font-mono text-[10px] text-ink3 py-3">
                      {format(new Date(req.requestedAt), "MMM dd, yyyy HH:mm")}
                    </td>
                    <td className="af-td py-3 text-right">
                      <div className="inline-flex gap-2">
                        <button
                          onClick={() => handleTransferDecision(req.id, "APPROVE")}
                          disabled={actionLoading}
                          className="border border-go bg-go_bg text-go hover:bg-go hover:text-white font-bold text-[10px] px-2.5 py-1.5 transition-colors flex items-center gap-1"
                        >
                          <Check size={11} /> Approve
                        </button>
                        <button
                          onClick={() => handleTransferDecision(req.id, "REJECT")}
                          disabled={actionLoading}
                          className="border border-danger bg-danger_bg text-danger hover:bg-danger hover:text-white font-bold text-[10px] px-2.5 py-1.5 transition-colors flex items-center gap-1"
                        >
                          <X size={11} /> Reject
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Selected Asset History Section */}
      {selectedAsset && (
        <div className="border-2 border-ink bg-surface p-5 space-y-4">
          <div className="flex items-center gap-2 border-b border-ink/10 pb-3">
            <History size={14} className="text-signal" />
            <h2 className="text-xs font-bold uppercase tracking-widest text-ink">
              Allocation & Activity History
            </h2>
          </div>

          {selectedAsset.allocations.length === 0 ? (
            <p className="text-xs font-bold text-ink3 text-center py-6">
              No previous allocation history recorded for this item.
            </p>
          ) : (
            <div className="relative border-l border-ink/20 pl-4 ml-2 space-y-4">
              {selectedAsset.allocations.map((alloc) => {
                const holderText = alloc.employee?.name || alloc.department?.name || "Unassigned";
                const departmentText = alloc.employee?.department?.name || alloc.department?.name || "";

                let actionLabel = "Allocated";
                let badgeStyle = "bg-canvas border-ink3 text-ink2";

                if (alloc.status === "RETURNED") {
                  actionLabel = "Returned";
                  badgeStyle = "bg-go_bg border-go text-go";
                } else if (alloc.status === "TRANSFERRED") {
                  actionLabel = "Transferred";
                  badgeStyle = "bg-warn_bg border-warn text-warn";
                } else if (alloc.status === "ACTIVE") {
                  actionLabel = "Active Allocation";
                  badgeStyle = "bg-signal/15 border-signal text-signal";
                }

                // Check for overdue flag dynamically
                const isOverdue =
                  alloc.status === "ACTIVE" &&
                  alloc.expectedReturnDate &&
                  new Date(alloc.expectedReturnDate) < new Date();

                return (
                  <div key={alloc.id} className="relative group text-xs">
                    {/* Circle marker */}
                    <div className="absolute -left-[21px] top-1.5 h-2 w-2 rounded-full border border-ink bg-surface group-hover:bg-signal transition-colors"></div>

                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-ink3">
                          {format(new Date(alloc.allocatedAt), "MMM dd, yyyy")}
                        </span>
                        <span
                          className={`border text-[9px] font-bold uppercase px-1.5 py-0.5 ${badgeStyle}`}
                        >
                          {actionLabel}
                        </span>
                        <span className="text-ink font-semibold">{holderText}</span>
                        {departmentText && (
                          <span className="text-ink3">({departmentText})</span>
                        )}
                        {isOverdue && (
                          <span className="border border-danger bg-danger_bg text-danger text-[8px] font-bold uppercase px-1 py-0.5">
                            Overdue
                          </span>
                        )}
                      </div>

                      {alloc.expectedReturnDate && (
                        <div className="text-[10px] text-ink3">
                          Due: {format(new Date(alloc.expectedReturnDate), "MMM dd, yyyy")}
                        </div>
                      )}
                    </div>

                    {/* Condition notes display */}
                    {alloc.status === "RETURNED" && alloc.returnConditionNotes && (
                      <p className="mt-1 text-ink3 italic pl-2 border-l border-ink/10">
                        Condition: {alloc.returnConditionNotes}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Return Condition Modal Dialog */}
      {showReturnDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4">
          <div className="border-2 border-ink bg-surface max-w-md w-full p-6 space-y-4 shadow-lg">
            <div className="flex justify-between items-center border-b border-ink/10 pb-3">
              <h3 className="text-xs font-bold uppercase tracking-widest text-ink flex items-center gap-1.5">
                <CornerDownLeft size={14} className="text-signal" /> Return Confirmation
              </h3>
              <button
                onClick={() => setShowReturnDialog(false)}
                className="text-ink3 hover:text-ink transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleReturnSubmit} className="space-y-4">
              <div>
                <label className="block text-[9px] font-bold uppercase tracking-wider text-ink3 mb-1.5">
                  Check-in Condition Notes
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="Describe the condition of the asset (e.g. Returned in good condition, slight scratch on lid)..."
                  value={returnNotes}
                  onChange={(e) => setReturnNotes(e.target.value)}
                  className="af-input w-full text-xs"
                ></textarea>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowReturnDialog(false)}
                  className="border-2 border-ink bg-canvas px-4 py-2 text-xs font-bold text-ink hover:bg-canvas transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="af-btn-primary text-xs px-4 py-2 flex items-center gap-1.5"
                >
                  {actionLoading && <Loader2 size={12} className="animate-spin" />}
                  Confirm Return
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
