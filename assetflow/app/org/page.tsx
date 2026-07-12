"use client";

import { useState } from "react";
import { PageHeader } from "@/components/page-header";
import { SectionHeader } from "@/components/section-header";
import { StatusChip } from "@/components/status-chip";
import { Plus, GitMerge, UserPlus, ShieldAlert, Check } from "lucide-react";

// Mock Departments
const departments = [
  { id: 1, name: "Operations", head: "Marcus Reed", status: "ACTIVE", level: 0 },
  { id: 2, name: "Facilities", head: "Ethan Brown", status: "ACTIVE", level: 1, parent: "Operations" },
  { id: 3, name: "Technology", head: "Priya Shah", status: "ACTIVE", level: 0 },
  { id: 4, name: "Engineering", head: "Noah Williams", status: "ACTIVE", level: 1, parent: "Technology" },
];

// Mock Asset Categories
const categories = [
  { id: 1, name: "Electronics", fields: 4, count: 124 },
  { id: 2, name: "Furniture", fields: 2, count: 86 },
  { id: 3, name: "AV Equipment", fields: 3, count: 32 },
  { id: 4, name: "Vehicles", fields: 5, count: 12 },
  { id: 5, name: "Office Equipment", fields: 2, count: 54 },
];

// Mock Employee Directory
const initialEmployees = [
  { id: 1, name: "Avery Admin", email: "admin@assetflow.local", dept: "Operations", role: "ADMIN", status: "ACTIVE" },
  { id: 2, name: "Priya Shah", email: "priya.shah@assetflow.local", dept: "Technology", role: "DEPARTMENT_HEAD", status: "ACTIVE" },
  { id: 3, name: "Marcus Reed", email: "marcus.reed@assetflow.local", dept: "Operations", role: "DEPARTMENT_HEAD", status: "ACTIVE" },
  { id: 4, name: "Elena Torres", email: "elena.torres@assetflow.local", dept: "Operations", role: "ASSET_MANAGER", status: "ACTIVE" },
  { id: 5, name: "Noah Williams", email: "noah.williams@assetflow.local", dept: "Technology", role: "ASSET_MANAGER", status: "ACTIVE" },
  { id: 6, name: "Mia Chen", email: "mia.chen@assetflow.local", dept: "Technology", role: "EMPLOYEE", status: "ACTIVE" },
  { id: 7, name: "Liam Patel", email: "liam.patel@assetflow.local", dept: "Technology", role: "EMPLOYEE", status: "ACTIVE" },
];

export default function OrgSetupPage() {
  const [activeTab, setActiveTab] = useState<"depts" | "categories" | "employees">("depts");
  const [employees, setEmployees] = useState(initialEmployees);
  
  // Promotion modal state
  const [promoTarget, setPromoTarget] = useState<(typeof initialEmployees)[0] | null>(null);
  const [promoRole, setPromoRole] = useState<string>("");

  const handlePromote = (empId: number, newRole: string) => {
    const updated = employees.map(emp => {
      if (emp.id === empId) {
        return { ...emp, role: newRole };
      }
      return emp;
    });
    setEmployees(updated);
    setPromoTarget(null);
  };

  return (
    <div>
      <PageHeader 
        title="Organization Setup" 
        action={
          activeTab === "depts" ? (
            <button className="af-btn-primary"><Plus size={14} /> Add Department</button>
          ) : activeTab === "categories" ? (
            <button className="af-btn-primary"><Plus size={14} /> Add Category</button>
          ) : (
            <button className="af-btn-primary"><UserPlus size={14} /> Add Employee</button>
          )
        }
      />

      {/* Tabs */}
      <div className="flex border-b border-border mb-6">
        {[
          ["depts", "Departments"],
          ["categories", "Asset Categories"],
          ["employees", "Employee Directory"],
        ].map(([tabId, label]) => (
          <button
            key={tabId}
            onClick={() => setActiveTab(tabId as any)}
            className={`mr-6 py-3 text-sm font-medium transition border-b-2 ${
              activeTab === tabId ? "border-signal text-ink" : "border-transparent text-ink3 hover:text-ink"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Tab A — Departments */}
        {activeTab === "depts" && (
          <>
            <div className="lg:col-span-2 af-card overflow-hidden">
              <div className="p-4 border-b border-border bg-gray_bg">
                <SectionHeader title="Department Structure" className="mb-0" />
              </div>
              <div className="divide-y divide-border">
                {departments.map((dept) => (
                  <div 
                    key={dept.id} 
                    className="flex items-center justify-between px-5 py-4 hover:bg-sunken/40 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      {dept.level > 0 && (
                        <div className="flex items-center">
                          <div className="w-5 h-5 border-l-2 border-b-2 border-border/80 rounded-bl mr-2" />
                          <GitMerge size={14} className="text-ink3" />
                        </div>
                      )}
                      <div>
                        <p className="text-sm font-semibold text-ink">{dept.name}</p>
                        {dept.parent && (
                          <span className="text-[10px] text-ink3">Sub-department of {dept.parent}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <p className="text-xs text-ink2 font-medium">{dept.head}</p>
                        <p className="text-[9px] text-ink3 uppercase tracking-wider">Dept Head</p>
                      </div>
                      <StatusChip status={dept.status} size="sm" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
            {/* Slide-in panel representation */}
            <div className="af-card p-5">
              <SectionHeader title="New Department" />
              <form className="space-y-4" onSubmit={e => e.preventDefault()}>
                <div>
                  <label className="block text-xs font-medium text-ink2 mb-1.5">Department Name</label>
                  <input type="text" placeholder="e.g. Sales" className="af-input" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-ink2 mb-1.5">Parent Department (Optional)</label>
                  <select className="af-input">
                    <option value="">None (Top Level)</option>
                    <option value="1">Operations</option>
                    <option value="3">Technology</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-ink2 mb-1.5">Department Head</label>
                  <select className="af-input">
                    <option value="">Select Employee...</option>
                    <option value="2">Priya Shah</option>
                    <option value="3">Marcus Reed</option>
                  </select>
                </div>
                <button type="submit" className="w-full af-btn-primary">Create Department</button>
              </form>
            </div>
          </>
        )}

        {/* Tab B — Asset Categories */}
        {activeTab === "categories" && (
          <div className="lg:col-span-3 af-card overflow-hidden">
            <table className="w-full">
              <thead>
                <tr>
                  <th className="af-th">Category</th>
                  <th className="af-th">Custom Fields</th>
                  <th className="af-th">Asset Count</th>
                  <th className="af-th w-24">Action</th>
                </tr>
              </thead>
              <tbody>
                {categories.map((cat) => (
                  <tr key={cat.id} className="hover:bg-sunken/40 transition-colors">
                    <td className="af-td font-semibold text-ink">{cat.name}</td>
                    <td className="af-td">
                      <span className="bg-gray_bg text-ink2 rounded-full px-2 py-0.5 text-xs font-medium border border-border">
                        +{cat.fields} fields
                      </span>
                    </td>
                    <td className="af-td text-ink2">{cat.count} items</td>
                    <td className="af-td">
                      <button className="text-xs text-signal font-semibold hover:text-signal2">Edit Config</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Tab C — Employee Directory */}
        {activeTab === "employees" && (
          <div className="lg:col-span-3 af-card overflow-hidden">
            <table className="w-full">
              <thead>
                <tr>
                  <th className="af-th">Employee</th>
                  <th className="af-th">Email</th>
                  <th className="af-th">Department</th>
                  <th className="af-th">Role</th>
                  <th className="af-th">Status</th>
                  <th className="af-th w-32">Actions</th>
                </tr>
              </thead>
              <tbody>
                {employees.map((emp) => (
                  <tr key={emp.id} className="hover:bg-sunken/40 transition-colors">
                    <td className="af-td font-semibold text-ink">{emp.name}</td>
                    <td className="af-td text-ink3 font-mono text-xs">{emp.email}</td>
                    <td className="af-td text-ink2">{emp.dept}</td>
                    <td className="af-td">
                      <span className={`text-[10px] font-semibold uppercase tracking-wider rounded px-2 py-0.5 ${
                        emp.role === 'ADMIN' ? 'bg-violet_bg text-violet' :
                        emp.role === 'ASSET_MANAGER' ? 'bg-signal/15 text-signal' :
                        emp.role === 'DEPARTMENT_HEAD' ? 'bg-go_bg text-go' : 'bg-gray_bg text-ink3'
                      }`}>
                        {emp.role.replace("_", " ")}
                      </span>
                    </td>
                    <td className="af-td">
                      <StatusChip status={emp.status} size="sm" />
                    </td>
                    <td className="af-td">
                      {emp.role !== 'ADMIN' && (
                        <select
                          value={emp.role}
                          onChange={(e) => {
                            setPromoTarget(emp);
                            setPromoRole(e.target.value);
                          }}
                          className="rounded border border-border bg-surface px-2 py-1 text-xs text-ink focus:outline-none"
                        >
                          <option value="EMPLOYEE">Employee</option>
                          <option value="DEPARTMENT_HEAD">Dept Head</option>
                          <option value="ASSET_MANAGER">Asset Manager</option>
                        </select>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

      </div>

      {/* Confirmation Promotion Modal */}
      {promoTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-[420px] rounded-lg border border-border bg-surface p-6 shadow-lg animate-scale-up">
            <div className="flex items-start gap-3 mb-4">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-warn_bg">
                <ShieldAlert size={18} className="text-warn" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-ink">Change Role Permissions?</h3>
                <p className="text-xs text-ink3 mt-1">
                  You are changing the role of <span className="font-semibold text-ink">{promoTarget.name}</span> to{" "}
                  <span className="font-semibold text-ink">{promoRole.replace("_", " ")}</span>.
                </p>
              </div>
            </div>

            <div className="rounded border border-warn/30 bg-warn_bg/20 p-3 mb-5 text-xs text-warn">
              ⚠️ Role promotions affect system access permissions, resource approval rights, and dashboard controls immediately.
            </div>

            <div className="flex gap-3 justify-end">
              <button 
                onClick={() => setPromoTarget(null)} 
                className="af-btn-secondary"
              >
                Cancel
              </button>
              <button 
                onClick={() => handlePromote(promoTarget.id, promoRole)} 
                className="af-btn-primary bg-signal hover:bg-signal2"
              >
                Confirm Changes
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes scaleUp {
          from { transform: scale(0.95); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        .animate-scale-up {
          animation: scaleUp 0.15s ease-out;
        }
      `}</style>
    </div>
  );
}
