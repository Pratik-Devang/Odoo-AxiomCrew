"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { format } from "date-fns";
import { ChevronDown, Loader2, Package, Plus, Search, X } from "lucide-react";
import { AssetTag } from "@/components/asset-tag";
import { Badge, type BadgeStatus } from "@/components/badge";
import { SectionHeader } from "@/components/section-header";

type AssetStatus =
  | "AVAILABLE"
  | "ALLOCATED"
  | "RESERVED"
  | "UNDER_MAINTENANCE"
  | "LOST"
  | "RETIRED"
  | "DISPOSED";

type AssetRow = {
  id: number;
  tag: string;
  name: string;
  categoryId: number;
  serialNumber: string;
  acquisitionDate: string;
  acquisitionCost: string;
  condition: string;
  location: string;
  isBookable: boolean;
  status: AssetStatus;
  currentHolderDepartmentId: number | null;
  category: { id: number; name: string };
  currentHolder: { id: number; name: string; department: { id: number; name: string } | null } | null;
  currentHolderDepartment: { id: number; name: string } | null;
};

type AssetDetail = AssetRow & {
  createdAt: string;
  allocations: Array<{
    id: number;
    allocatedAt: string;
    expectedReturnDate: string | null;
    returnedAt: string | null;
    status: string;
    employee: { name: string; email: string; department: { name: string } | null } | null;
    department: { name: string } | null;
  }>;
  maintenanceRequests: Array<{
    id: number;
    raisedAt: string;
    resolvedAt: string | null;
    issueDescription: string;
    priority: string;
    status: string;
    technicianName: string | null;
    raisedBy: { name: string };
  }>;
};

type Category = { id: number; name: string; status: string };
type Department = { id: number; name: string; status: string };

const statusOptions: Array<{ value: AssetStatus; label: string }> = [
  { value: "AVAILABLE", label: "Available" },
  { value: "ALLOCATED", label: "Allocated" },
  { value: "RESERVED", label: "Reserved" },
  { value: "UNDER_MAINTENANCE", label: "Under Maintenance" },
  { value: "LOST", label: "Lost" },
  { value: "RETIRED", label: "Retired" },
  { value: "DISPOSED", label: "Disposed" },
];

const statusToBadge: Record<AssetStatus, BadgeStatus> = {
  AVAILABLE: "available",
  ALLOCATED: "allocated",
  RESERVED: "reserved",
  UNDER_MAINTENANCE: "maintenance",
  LOST: "lost",
  RETIRED: "retired",
  DISPOSED: "disposed",
};

const emptyForm = {
  name: "",
  categoryId: "",
  serialNumber: "",
  acquisitionDate: new Date().toISOString().slice(0, 10),
  acquisitionCost: "",
  condition: "Good",
  location: "",
  isBookable: false,
};

export default function AssetsPage() {
  const searchParams = useSearchParams();
  const [assets, setAssets] = useState<AssetRow[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [query, setQuery] = useState("");
  const [categoryId, setCategoryId] = useState("all");
  const [status, setStatus] = useState("all");
  const [departmentId, setDepartmentId] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [registerOpen, setRegisterOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [currentUser, setCurrentUser] = useState<{ id: number; name: string; role: string } | null>(null);

  useEffect(() => {
    if (searchParams.get("register") === "1") {
      setRegisterOpen(true);
    }
  }, [searchParams]);

  useEffect(() => {
    let cancelled = false;

    async function loadLookups() {
      const [categoriesResponse, departmentsResponse, userResponse] = await Promise.all([
        fetch("/api/categories", { cache: "no-store" }),
        fetch("/api/departments", { cache: "no-store" }),
        fetch("/api/auth/me", { cache: "no-store" }),
      ]);

      if (!categoriesResponse.ok || !departmentsResponse.ok) {
        throw new Error("Unable to load filters");
      }

      const categoriesPayload = (await categoriesResponse.json()) as { categories: Category[] };
      const departmentsPayload = (await departmentsResponse.json()) as { departments: Department[] };
      let userPayload = null;
      if (userResponse.ok) {
        userPayload = (await userResponse.json()) as { user: { id: number; name: string; role: string } };
      }

      if (!cancelled) {
        setCategories(categoriesPayload.categories);
        setDepartments(departmentsPayload.departments);
        if (userPayload) {
          setCurrentUser(userPayload.user);
        }
      }
    }

    loadLookups().catch((err) => {
      if (!cancelled) setError(err instanceof Error ? err.message : "Unable to load filters");
    });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    const timeout = window.setTimeout(async () => {
      setLoading(true);
      setError("");

      const params = new URLSearchParams();
      if (query.trim()) params.set("search", query.trim());
      if (categoryId !== "all") params.set("categoryId", categoryId);
      if (status !== "all") params.set("status", status);
      if (departmentId !== "all") params.set("departmentId", departmentId);

      try {
        const response = await fetch(`/api/assets?${params.toString()}`, {
          cache: "no-store",
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error("Unable to load assets");
        }

        const payload = (await response.json()) as { assets: AssetRow[] };
        setAssets(payload.assets);
      } catch (err) {
        if (!controller.signal.aborted) {
          setError(err instanceof Error ? err.message : "Unable to load assets");
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }, 180);

    return () => {
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, [query, categoryId, status, departmentId]);

  const activeCategories = useMemo(() => categories.filter((category) => category.status === "ACTIVE"), [categories]);

  async function reloadAssets() {
    const response = await fetch("/api/assets", { cache: "no-store" });
    if (response.ok) {
      const payload = (await response.json()) as { assets: AssetRow[] };
      setAssets(payload.assets);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between border-b-2 border-ink pb-4">
        <div>
          <h1 className="text-lg font-bold uppercase tracking-widest text-ink">Asset Registry</h1>
          <p className="mt-0.5 text-xs text-ink3">{assets.length} visible assets</p>
        </div>
        {(currentUser?.role === "ADMIN" || currentUser?.role === "DEPARTMENT_HEAD") && (
          <button onClick={() => setRegisterOpen(true)} className="af-btn-primary">
            <Plus size={13} />
            Register Asset
          </button>
        )}
      </div>

      <div className="space-y-3">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink3" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            type="search"
            placeholder="Search by tag, serial, or QR code..."
            className="af-input pl-9"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          <FilterSelect label="Category" value={categoryId} onChange={setCategoryId}>
            <option value="all">All categories</option>
            {activeCategories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </FilterSelect>
          <FilterSelect label="Status" value={status} onChange={setStatus}>
            <option value="all">All statuses</option>
            {statusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </FilterSelect>
          <FilterSelect label="Department" value={departmentId} onChange={setDepartmentId}>
            <option value="all">All departments</option>
            {departments.map((department) => (
              <option key={department.id} value={department.id}>
                {department.name}
              </option>
            ))}
          </FilterSelect>
        </div>
      </div>

      {error && <div className="border border-danger bg-danger_bg px-4 py-3 text-sm text-danger">{error}</div>}

      <div className="border-2 border-ink bg-surface">
        {loading ? (
          <div className="flex min-h-[18rem] items-center justify-center text-sm text-ink3">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Loading assets
          </div>
        ) : assets.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-20">
            <Package size={32} className="text-ink3" />
            <p className="text-sm font-bold text-ink3">No assets match your filters</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-canvas">
                  <th className="af-th">Tag</th>
                  <th className="af-th">Name</th>
                  <th className="af-th">Category</th>
                  <th className="af-th">Status</th>
                  <th className="af-th">Location</th>
                </tr>
              </thead>
              <tbody>
                {assets.map((asset) => (
                  <tr
                    key={asset.id}
                    onClick={() => setSelectedId(asset.id)}
                    className="cursor-pointer transition-colors hover:bg-canvas"
                  >
                    <td className="af-td">
                      <AssetTag tag={asset.tag} />
                    </td>
                    <td className="af-td font-medium text-ink">{asset.name}</td>
                    <td className="af-td text-ink2">{asset.category.name}</td>
                    <td className="af-td">
                      <Badge status={statusToBadge[asset.status]} />
                    </td>
                    <td className="af-td text-ink2">{asset.location}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {registerOpen && (
        <RegisterAssetModal
          categories={activeCategories}
          onClose={() => setRegisterOpen(false)}
          onCreated={(asset) => {
            setAssets((current) => [asset, ...current].sort((a, b) => a.tag.localeCompare(b.tag)));
            setRegisterOpen(false);
          }}
        />
      )}

      {selectedId && (
        <AssetDetailDrawer
          assetId={selectedId}
          onClose={() => setSelectedId(null)}
          onUpdated={(asset) => {
            setAssets((current) => current.map((item) => (item.id === asset.id ? asset : item)));
            reloadAssets();
          }}
        />
      )}
    </div>
  );
}

function FilterSelect({
  label,
  value,
  onChange,
  children,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  children: React.ReactNode;
}) {
  return (
    <label className="relative inline-flex items-center gap-2 border-2 border-ink bg-surface px-3 py-1.5 text-xs font-bold uppercase tracking-widest text-ink">
      {label}
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="appearance-none bg-transparent pr-5 text-xs font-semibold normal-case tracking-normal text-ink2 outline-none"
      >
        {children}
      </select>
      <ChevronDown size={12} className="pointer-events-none absolute right-2 text-ink3" />
    </label>
  );
}

function RegisterAssetModal({
  categories,
  onClose,
  onCreated,
}: {
  categories: Category[];
  onClose: () => void;
  onCreated: (asset: AssetRow) => void;
}) {
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      const response = await fetch("/api/assets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          categoryId: Number(form.categoryId),
          acquisitionCost: Number(form.acquisitionCost),
        }),
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error ?? "Unable to register asset");
      }

      onCreated(payload.asset as AssetRow);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to register asset");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 px-4" onClick={onClose}>
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-2xl border-2 border-ink bg-surface"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b-2 border-ink px-5 py-4">
          <div>
            <h2 className="text-sm font-bold uppercase tracking-widest text-ink">Register Asset</h2>
            <p className="mt-1 text-xs text-ink3">Tag is generated server-side.</p>
          </div>
          <button type="button" onClick={onClose} className="border border-ink p-1 text-ink2 hover:bg-sunken">
            <X size={14} />
          </button>
        </div>

        <div className="grid gap-4 p-5 sm:grid-cols-2">
          {error && <div className="sm:col-span-2 border border-danger bg-danger_bg px-3 py-2 text-xs text-danger">{error}</div>}
          <FormField label="Name">
            <input
              required
              value={form.name}
              onChange={(event) => setForm({ ...form, name: event.target.value })}
              className="af-input"
            />
          </FormField>
          <FormField label="Category">
            <select
              required
              value={form.categoryId}
              onChange={(event) => setForm({ ...form, categoryId: event.target.value })}
              className="af-input"
            >
              <option value="">Select category</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </FormField>
          <FormField label="Serial Number">
            <input
              required
              value={form.serialNumber}
              onChange={(event) => setForm({ ...form, serialNumber: event.target.value })}
              className="af-input"
            />
          </FormField>
          <FormField label="Acquisition Date">
            <input
              required
              type="date"
              value={form.acquisitionDate}
              onChange={(event) => setForm({ ...form, acquisitionDate: event.target.value })}
              className="af-input"
            />
          </FormField>
          <FormField label="Acquisition Cost">
            <input
              required
              type="number"
              min="0"
              step="0.01"
              value={form.acquisitionCost}
              onChange={(event) => setForm({ ...form, acquisitionCost: event.target.value })}
              className="af-input"
            />
          </FormField>
          <FormField label="Condition">
            <input
              required
              value={form.condition}
              onChange={(event) => setForm({ ...form, condition: event.target.value })}
              className="af-input"
            />
          </FormField>
          <FormField label="Location">
            <input
              required
              value={form.location}
              onChange={(event) => setForm({ ...form, location: event.target.value })}
              className="af-input"
            />
          </FormField>
          <label className="flex items-center gap-2 pt-6 text-sm font-semibold text-ink">
            <input
              type="checkbox"
              checked={form.isBookable}
              onChange={(event) => setForm({ ...form, isBookable: event.target.checked })}
              className="h-4 w-4 accent-signal"
            />
            Bookable resource
          </label>
        </div>

        <div className="flex justify-end gap-2 border-t-2 border-ink px-5 py-4">
          <button type="button" onClick={onClose} className="af-btn-secondary">
            Cancel
          </button>
          <button type="submit" disabled={submitting} className="af-btn-primary">
            {submitting ? <Loader2 size={13} className="animate-spin" /> : <Plus size={13} />}
            Register Asset
          </button>
        </div>
      </form>
    </div>
  );
}

function AssetDetailDrawer({
  assetId,
  onClose,
  onUpdated,
}: {
  assetId: number;
  onClose: () => void;
  onUpdated: (asset: AssetRow) => void;
}) {
  const [asset, setAsset] = useState<AssetDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [edit, setEdit] = useState({ name: "", location: "", condition: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadAsset() {
      setLoading(true);
      const response = await fetch(`/api/assets/${assetId}`, { cache: "no-store" });

      if (!response.ok) {
        throw new Error("Unable to load asset detail");
      }

      const payload = (await response.json()) as { asset: AssetDetail };

      if (!cancelled) {
        setAsset(payload.asset);
        setEdit({
          name: payload.asset.name,
          location: payload.asset.location,
          condition: payload.asset.condition,
        });
      }
    }

    loadAsset()
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : "Unable to load asset detail");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [assetId]);

  async function saveEdits() {
    setSaving(true);
    setError("");

    try {
      const response = await fetch(`/api/assets/${assetId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(edit),
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error ?? "Unable to update asset");
      }

      setAsset(payload.asset as AssetDetail);
      onUpdated(payload.asset as AssetRow);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to update asset");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-ink/40" onClick={onClose}>
      <div
        className="flex h-full w-full max-w-2xl flex-col overflow-hidden border-l-2 border-ink bg-surface"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between border-b-2 border-ink p-5">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-ink3">Asset Detail</p>
            <div className="mt-2 flex items-center gap-3">
              {asset && <AssetTag tag={asset.tag} />}
              {asset && <Badge status={statusToBadge[asset.status]} />}
            </div>
          </div>
          <button onClick={onClose} className="border border-ink p-1 text-ink2 hover:bg-sunken">
            <X size={14} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          {loading ? (
            <div className="flex min-h-[18rem] items-center justify-center text-sm text-ink3">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Loading asset
            </div>
          ) : asset ? (
            <div className="space-y-6">
              {error && <div className="border border-danger bg-danger_bg px-3 py-2 text-xs text-danger">{error}</div>}
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField label="Name">
                  <input value={edit.name} onChange={(event) => setEdit({ ...edit, name: event.target.value })} className="af-input" />
                </FormField>
                <ReadOnlyField label="Category" value={asset.category.name} />
                <ReadOnlyField label="Serial Number" value={asset.serialNumber} />
                <ReadOnlyField label="Acquisition Date" value={format(new Date(asset.acquisitionDate), "MMM d, yyyy")} />
                <ReadOnlyField label="Acquisition Cost" value={String(asset.acquisitionCost)} />
                <FormField label="Condition">
                  <input
                    value={edit.condition}
                    onChange={(event) => setEdit({ ...edit, condition: event.target.value })}
                    className="af-input"
                  />
                </FormField>
                <FormField label="Location">
                  <input
                    value={edit.location}
                    onChange={(event) => setEdit({ ...edit, location: event.target.value })}
                    className="af-input"
                  />
                </FormField>
                <ReadOnlyField label="Bookable" value={asset.isBookable ? "Yes" : "No"} />
              </div>

              <div className="flex justify-end">
                <button onClick={saveEdits} disabled={saving} className="af-btn-primary">
                  {saving && <Loader2 size={13} className="animate-spin" />}
                  Save Basic Edits
                </button>
              </div>

              <HistorySection title="Allocation History">
                {asset.allocations.length > 0 ? (
                  asset.allocations.map((allocation) => (
                    <div key={allocation.id} className="border border-border bg-canvas px-4 py-3 text-xs text-ink2">
                      <p className="font-bold text-ink">
                        {allocation.employee?.name ?? allocation.department?.name ?? "Unassigned"} · {allocation.status}
                      </p>
                      <p className="mt-1 text-ink3">
                        {allocation.employee?.department?.name ?? allocation.department?.name ?? "No department"} ·{" "}
                        {format(new Date(allocation.allocatedAt), "MMM d, yyyy")}
                        {allocation.returnedAt ? ` to ${format(new Date(allocation.returnedAt), "MMM d, yyyy")}` : ""}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-ink3">No allocation history yet.</p>
                )}
              </HistorySection>

              <HistorySection title="Maintenance History">
                {asset.maintenanceRequests.length > 0 ? (
                  asset.maintenanceRequests.map((request) => (
                    <div key={request.id} className="border border-border bg-canvas px-4 py-3 text-xs text-ink2">
                      <p className="font-bold text-ink">
                        {format(new Date(request.raisedAt), "MMM d, yyyy")} · {request.status.replaceAll("_", " ")}
                      </p>
                      <p className="mt-1 text-ink3">{request.issueDescription}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-ink3">No maintenance history yet.</p>
                )}
              </HistorySection>
            </div>
          ) : (
            <p className="text-sm text-danger">Asset not found.</p>
          )}
        </div>
      </div>
    </div>
  );
}

function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-widest text-ink3">{label}</span>
      {children}
    </label>
  );
}

function ReadOnlyField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-widest text-ink3">{label}</span>
      <div className="border border-border bg-canvas px-3 py-2 text-sm text-ink">{value}</div>
    </div>
  );
}

function HistorySection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <SectionHeader title={title} />
      <div className="space-y-2">{children}</div>
    </section>
  );
}
