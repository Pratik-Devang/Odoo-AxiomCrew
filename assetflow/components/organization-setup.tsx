"use client";

import { Pencil, Plus, UserCog, X } from "lucide-react";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import { Badge } from "@/components/badge";

type RecordStatus = "ACTIVE" | "INACTIVE";
type UserRole = "EMPLOYEE" | "DEPARTMENT_HEAD" | "ASSET_MANAGER" | "ADMIN";

type Department = {
  id: number;
  name: string;
  headId: number | null;
  parentDepartmentId: number | null;
  status: RecordStatus;
  head: { id: number; name: string; email: string } | null;
  parentDepartment: { id: number; name: string } | null;
};

type Category = { id: number; name: string; status: RecordStatus };

type User = {
  id: number;
  name: string;
  email: string;
  departmentId: number | null;
  department: { id: number; name: string } | null;
  role: UserRole;
  status: RecordStatus;
};

type Tab = "departments" | "categories" | "employees";
type ModalState =
  | { kind: "department"; item?: Department }
  | { kind: "category"; item?: Category }
  | { kind: "employee"; item: User }
  | null;

const fieldClass =
  "w-full rounded-md border-2 border-ink bg-surface px-3 py-2.5 text-sm text-ink outline-none transition focus:border-signal";

async function readJson<T>(response: Response): Promise<T> {
  const data = (await response.json()) as T & { error?: string };
  if (!response.ok) throw new Error(data.error ?? "Request failed");
  return data;
}

export function OrganizationSetup() {
  const [activeTab, setActiveTab] = useState<Tab>("departments");
  const [departments, setDepartments] = useState<Department[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [modal, setModal] = useState<ModalState>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [modalError, setModalError] = useState("");

  const loadData = useCallback(async () => {
    setError("");
    try {
      const [departmentData, categoryData, userData] = await Promise.all([
        fetch("/api/departments", { cache: "no-store" }).then((response) =>
          readJson<{ departments: Department[] }>(response),
        ),
        fetch("/api/categories", { cache: "no-store" }).then((response) =>
          readJson<{ categories: Category[] }>(response),
        ),
        fetch("/api/users", { cache: "no-store" }).then((response) =>
          readJson<{ users: User[] }>(response),
        ),
      ]);
      setDepartments(departmentData.departments);
      setCategories(categoryData.categories);
      setUsers(userData.users);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load organization data");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  function openAddModal() {
    setModalError("");
    if (activeTab === "departments") setModal({ kind: "department" });
    if (activeTab === "categories") setModal({ kind: "category" });
  }

  async function mutate(url: string, method: "POST" | "PATCH", body: object) {
    const response = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    await readJson(response);
  }

  async function handleModalSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!modal) return;
    setModalError("");
    setIsSaving(true);
    const form = new FormData(event.currentTarget);

    try {
      if (modal.kind === "department") {
        const body = {
          name: String(form.get("name") ?? ""),
          headId: form.get("headId") ? Number(form.get("headId")) : null,
          parentDepartmentId: form.get("parentDepartmentId")
            ? Number(form.get("parentDepartmentId"))
            : null,
          status: String(form.get("status")) as RecordStatus,
        };
        await mutate(
          modal.item ? `/api/departments/${modal.item.id}` : "/api/departments",
          modal.item ? "PATCH" : "POST",
          body,
        );
      }

      if (modal.kind === "category") {
        const body = {
          name: String(form.get("name") ?? ""),
          status: String(form.get("status")) as RecordStatus,
        };
        await mutate(
          modal.item ? `/api/categories/${modal.item.id}` : "/api/categories",
          modal.item ? "PATCH" : "POST",
          body,
        );
      }

      if (modal.kind === "employee") {
        await mutate(`/api/users/${modal.item.id}`, "PATCH", {
          role: String(form.get("role")),
          departmentId: form.get("departmentId") ? Number(form.get("departmentId")) : null,
          status: String(form.get("status")) as RecordStatus,
        });
      }

      setModal(null);
      await loadData();
    } catch (saveError) {
      setModalError(saveError instanceof Error ? saveError.message : "Unable to save changes");
    } finally {
      setIsSaving(false);
    }
  }

  async function toggleDepartment(department: Department) {
    setError("");
    try {
      await mutate(`/api/departments/${department.id}`, "PATCH", {
        status: department.status === "ACTIVE" ? "INACTIVE" : "ACTIVE",
      });
      await loadData();
    } catch (toggleError) {
      setError(toggleError instanceof Error ? toggleError.message : "Unable to update department");
    }
  }

  async function toggleCategory(category: Category) {
    setError("");
    try {
      await mutate(`/api/categories/${category.id}`, "PATCH", {
        status: category.status === "ACTIVE" ? "INACTIVE" : "ACTIVE",
      });
      await loadData();
    } catch (toggleError) {
      setError(toggleError instanceof Error ? toggleError.message : "Unable to update category");
    }
  }

  return (
    <div className="flex min-h-full flex-col">
      <div className="mb-7 flex flex-wrap items-center justify-between gap-4 border-b-2 border-ink">
        <div className="flex gap-7" role="tablist" aria-label="Organization setup sections">
          {([
            ["departments", "Departments"],
            ["categories", "Categories"],
            ["employees", "Employee"],
          ] as const).map(([value, label]) => (
            <button
              key={value}
              type="button"
              role="tab"
              aria-selected={activeTab === value}
              onClick={() => setActiveTab(value)}
              className={`border-b-2 px-1 pb-3 text-sm font-medium transition ${
                activeTab === value
                  ? "border-go text-go"
                  : "border-transparent text-ink3 hover:text-ink"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {activeTab !== "employees" ? (
          <button
            type="button"
            onClick={openAddModal}
            className="mb-3 inline-flex items-center gap-2 af-btn-primary"
          >
            <Plus size={15} /> Add
          </button>
        ) : null}
      </div>

      {error ? (
        <div role="alert" className="mb-5 border-2 border-danger bg-danger_bg px-4 py-3 text-sm font-semibold text-danger">
          {error}
        </div>
      ) : null}

      {isLoading ? (
        <div className="py-16 text-center text-sm text-ink3">Loading organization data…</div>
      ) : (
        <div className="overflow-x-auto rounded-xl border-2 border-ink bg-surface">
          {activeTab === "departments" ? (
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="bg-ink text-xs uppercase tracking-wider text-white/60">
                <tr>
                  <th className="px-5 py-3.5 font-medium">Department</th>
                  <th className="px-5 py-3.5 font-medium">Head</th>
                  <th className="px-5 py-3.5 font-medium">Parent Dept</th>
                  <th className="px-5 py-3.5 font-medium">Status</th>
                  <th className="px-5 py-3.5 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink/20">
                {departments.map((department) => (
                  <tr key={department.id} className="text-ink2 transition hover:bg-canvas">
                    <td className="px-5 py-4 font-semibold text-ink">{department.name}</td>
                    <td className="px-5 py-4">{department.head?.name ?? "—"}</td>
                    <td className="px-5 py-4">{department.parentDepartment?.name ?? "—"}</td>
                    <td className="px-5 py-4"><StatusBadge status={department.status} /></td>
                    <td className="px-5 py-4">
                      <div className="flex justify-end gap-2">
                        <ActionButton onClick={() => { setModalError(""); setModal({ kind: "department", item: department }); }}>
                          <Pencil size={13} /> Edit
                        </ActionButton>
                        <ActionButton onClick={() => void toggleDepartment(department)}>
                          {department.status === "ACTIVE" ? "Deactivate" : "Activate"}
                        </ActionButton>
                      </div>
                    </td>
                  </tr>
                ))}
                {!departments.length ? <EmptyRow columns={5} label="No departments yet" /> : null}
              </tbody>
            </table>
          ) : null}

          {activeTab === "categories" ? (
            <table className="w-full min-w-[560px] text-left text-sm">
              <thead className="bg-ink text-xs uppercase tracking-wider text-white/60">
                <tr>
                  <th className="px-5 py-3.5 font-medium">Category Name</th>
                  <th className="px-5 py-3.5 font-medium">Status</th>
                  <th className="px-5 py-3.5 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink/20">
                {categories.map((category) => (
                  <tr key={category.id} className="text-ink2 transition hover:bg-canvas">
                    <td className="px-5 py-4 font-semibold text-ink">{category.name}</td>
                    <td className="px-5 py-4"><StatusBadge status={category.status} /></td>
                    <td className="px-5 py-4">
                      <div className="flex justify-end gap-2">
                        <ActionButton onClick={() => { setModalError(""); setModal({ kind: "category", item: category }); }}>
                          <Pencil size={13} /> Edit
                        </ActionButton>
                        <ActionButton onClick={() => void toggleCategory(category)}>
                          {category.status === "ACTIVE" ? "Deactivate" : "Activate"}
                        </ActionButton>
                      </div>
                    </td>
                  </tr>
                ))}
                {!categories.length ? <EmptyRow columns={3} label="No categories yet" /> : null}
              </tbody>
            </table>
          ) : null}

          {activeTab === "employees" ? (
            <table className="w-full min-w-[850px] text-left text-sm">
              <thead className="bg-ink text-xs uppercase tracking-wider text-white/60">
                <tr>
                  <th className="px-5 py-3.5 font-medium">Name</th>
                  <th className="px-5 py-3.5 font-medium">Email</th>
                  <th className="px-5 py-3.5 font-medium">Department</th>
                  <th className="px-5 py-3.5 font-medium">Role</th>
                  <th className="px-5 py-3.5 font-medium">Status</th>
                  <th className="px-5 py-3.5 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink/20">
                {users.map((user) => (
                  <tr key={user.id} className="text-ink2 transition hover:bg-canvas">
                    <td className="px-5 py-4 font-semibold text-ink">{user.name}</td>
                    <td className="px-5 py-4 text-ink2">{user.email}</td>
                    <td className="px-5 py-4">{user.department?.name ?? "—"}</td>
                    <td className="px-5 py-4">{formatRole(user.role)}</td>
                    <td className="px-5 py-4"><StatusBadge status={user.status} /></td>
                    <td className="px-5 py-4 text-right">
                      {user.role === "ADMIN" ? (
                        <span className="text-xs text-ink2">Seeded admin</span>
                      ) : (
                        <ActionButton onClick={() => { setModalError(""); setModal({ kind: "employee", item: user }); }}>
                          <UserCog size={14} /> Promote
                        </ActionButton>
                      )}
                    </td>
                  </tr>
                ))}
                {!users.length ? <EmptyRow columns={6} label="No employees found" /> : null}
              </tbody>
            </table>
          ) : null}
        </div>
      )}

      <p className="mt-auto pt-8 text-xs text-ink3">
        Editing a department here also drives the picklist in Screen 4 &amp; 5
      </p>

      {modal ? (
        <Modal title={modalTitle(modal)} onClose={() => setModal(null)}>
          <form onSubmit={handleModalSubmit} className="space-y-4">
            {modal.kind === "department" ? (
              <DepartmentFields department={modal.item} departments={departments} users={users} />
            ) : null}
            {modal.kind === "category" ? <CategoryFields category={modal.item} /> : null}
            {modal.kind === "employee" ? (
              <EmployeeFields user={modal.item} departments={departments} />
            ) : null}

            {modalError ? <p role="alert" className="text-sm font-semibold text-danger">{modalError}</p> : null}

            <div className="flex justify-end gap-3 border-t border-ink/20 pt-5">
              <button type="button" onClick={() => setModal(null)} className="af-btn-secondary">
                Cancel
              </button>
              <button type="submit" disabled={isSaving} className="af-btn-primary disabled:opacity-60">
                {isSaving ? "Saving…" : "Save"}
              </button>
            </div>
          </form>
        </Modal>
      ) : null}
    </div>
  );
}

function DepartmentFields({ department, departments, users }: { department?: Department; departments: Department[]; users: User[] }) {
  return (
    <>
      <Field label="Name"><input name="name" required minLength={2} defaultValue={department?.name} className={fieldClass} /></Field>
      <Field label="Head">
        <select name="headId" defaultValue={department?.headId ?? ""} className={fieldClass}>
          <option value="">No head assigned</option>
          {users.map((user) => <option key={user.id} value={user.id}>{user.name} — {user.email}</option>)}
        </select>
      </Field>
      <Field label="Parent department">
        <select name="parentDepartmentId" defaultValue={department?.parentDepartmentId ?? ""} className={fieldClass}>
          <option value="">No parent department</option>
          {departments.filter((item) => item.id !== department?.id).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
        </select>
      </Field>
      <StatusField defaultValue={department?.status} />
    </>
  );
}

function CategoryFields({ category }: { category?: Category }) {
  return (
    <>
      <Field label="Category name"><input name="name" required minLength={2} defaultValue={category?.name} className={fieldClass} /></Field>
      <StatusField defaultValue={category?.status} />
    </>
  );
}

function EmployeeFields({ user, departments }: { user: User; departments: Department[] }) {
  return (
    <>
      <div className="border-2 border-ink bg-canvas px-4 py-3">
        <p className="text-sm font-semibold text-ink">{user.name}</p>
        <p className="mt-0.5 text-xs text-ink3">{user.email}</p>
      </div>
      <Field label="Role">
        <select name="role" defaultValue={user.role} className={fieldClass}>
          <option value="EMPLOYEE">Employee</option>
          <option value="DEPARTMENT_HEAD">Department Head</option>
          <option value="ASSET_MANAGER">Asset Manager</option>
        </select>
      </Field>
      <Field label="Department">
        <select name="departmentId" defaultValue={user.departmentId ?? ""} className={fieldClass}>
          <option value="">No department</option>
          {departments.map((department) => <option key={department.id} value={department.id}>{department.name}</option>)}
        </select>
      </Field>
      <StatusField defaultValue={user.status} />
    </>
  );
}

function StatusField({ defaultValue = "ACTIVE" }: { defaultValue?: RecordStatus }) {
  return (
    <Field label="Status">
      <select name="status" defaultValue={defaultValue} className={fieldClass}>
        <option value="ACTIVE">Active</option>
        <option value="INACTIVE">Inactive</option>
      </select>
    </Field>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block"><span className="mb-1.5 block text-xs font-semibold text-ink2">{label}</span>{children}</label>;
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4" role="dialog" aria-modal="true" aria-label={title} onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <div className="w-full max-w-md border-2 border-ink bg-surface p-6 shadow-2xl">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-ink">{title}</h2>
          <button type="button" onClick={onClose} aria-label="Close" className="p-1.5 text-ink3 hover:bg-canvas hover:text-ink"><X size={18} /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

function ActionButton({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return <button type="button" onClick={onClick} className="inline-flex items-center gap-1.5 border border-ink px-2.5 py-1.5 text-xs font-semibold text-ink2 transition hover:border-go hover:bg-go_bg hover:text-go">{children}</button>;
}

function StatusBadge({ status }: { status: RecordStatus }) {
  return <Badge status={status === "ACTIVE" ? "active" : "inactive"} />;
}

function EmptyRow({ columns, label }: { columns: number; label: string }) {
  return <tr><td colSpan={columns} className="px-5 py-12 text-center text-sm text-ink2">{label}</td></tr>;
}

function modalTitle(modal: NonNullable<ModalState>) {
  if (modal.kind === "employee") return "Update employee access";
  if (modal.kind === "department") return modal.item ? "Edit department" : "Add department";
  return modal.item ? "Edit category" : "Add category";
}

function formatRole(role: UserRole) {
  return role.split("_").map((word) => word[0] + word.slice(1).toLowerCase()).join(" ");
}

