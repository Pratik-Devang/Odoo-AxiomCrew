"use client";

import { useState } from "react";
import { Building2, Users, Tag, Plus, ChevronRight, Shield, Pencil } from "lucide-react";

type OrgTab = "departments" | "employees" | "categories";

const departments = [
  { id: 1, name: "Technology",  head: "Mia Chen",     parent: null,         members: 12, status: "ACTIVE" },
  { id: 2, name: "Operations",  head: "Ethan Brown",  parent: null,         members: 9,  status: "ACTIVE" },
  { id: 3, name: "Facilities",  head: "Noah Williams",parent: null,         members: 5,  status: "ACTIVE" },
  { id: 4, name: "IT Support",  head: "—",            parent: "Technology", members: 4,  status: "ACTIVE" },
];

const employees = [
  { id: 1,  name: "Avery Admin",     email: "admin@assetflow.local",  role: "ADMIN",           dept: "Technology",  status: "ACTIVE" },
  { id: 2,  name: "Morgan Manager",  email: "manager@assetflow.local",role: "ASSET_MANAGER",   dept: "Operations",  status: "ACTIVE" },
  { id: 3,  name: "Mia Chen",        email: "mia@assetflow.local",    role: "DEPARTMENT_HEAD", dept: "Technology",  status: "ACTIVE" },
  { id: 4,  name: "Liam Patel",      email: "liam@assetflow.local",   role: "EMPLOYEE",        dept: "Technology",  status: "ACTIVE" },
  { id: 5,  name: "Priya Shah",      email: "priya@assetflow.local",  role: "EMPLOYEE",        dept: "Technology",  status: "ACTIVE" },
  { id: 6,  name: "Ethan Brown",     email: "ethan@assetflow.local",  role: "DEPARTMENT_HEAD", dept: "Facilities",  status: "ACTIVE" },
  { id: 7,  name: "Noah Williams",   email: "noah@assetflow.local",   role: "DEPARTMENT_HEAD", dept: "Operations",  status: "ACTIVE" },
  { id: 8,  name: "Elena Tanaka",    email: "elena@assetflow.local",  role: "EMPLOYEE",        dept: "Facilities",  status: "ACTIVE" },
  { id: 9,  name: "Marcus Reed",     email: "marcus@assetflow.local", role: "EMPLOYEE",        dept: "Operations",  status: "ACTIVE" },
  { id: 10, name: "Ananya Kumar",    email: "ananya@assetflow.local", role: "EMPLOYEE",        dept: "Technology",  status: "ACTIVE" },
];

const categories = [
  { id: 1, name: "Electronics",      description: "Laptops, phones, cameras, AV",    count: 42 },
  { id: 2, name: "Furniture",        description: "Desks, chairs, shelving",           count: 28 },
  { id: 3, name: "AV Equipment",     description: "Projectors, screens, speakers",    count: 14 },
  { id: 4, name: "Office Equipment", description: "Printers, whiteboards, stationery",count: 22 },
  { id: 5, name: "Vehicles",         description: "Cars, vans, motorcycles",          count: 7  },
];

const roleMeta: Record<string, { label: string; style: string }> = {
  ADMIN:           { label: "Admin",         style: "border-signal text-signal" },
  ASSET_MANAGER:   { label: "Asset Manager", style: "border-go text-go" },
  DEPARTMENT_HEAD: { label: "Dept Head",     style: "border-warn text-warn" },
  EMPLOYEE:        { label: "Employee",      style: "border-ink3 text-ink3" },
};

const TABS: [OrgTab, string, React.ElementType][] = [
  ["departments", "Departments",  Building2],
  ["employees",   "Employees",    Users],
  ["categories",  "Categories",   Tag],
];

export default function OrgPage() {
  const [tab, setTab] = useState<OrgTab>("departments");

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b-2 border-ink pb-4">
        <div>
          <h1 className="text-lg font-bold uppercase tracking-widest text-ink">Organization Setup</h1>
          <p className="text-xs text-ink3 mt-0.5">{departments.length} departments · {employees.length} users · {categories.length} categories</p>
        </div>
        <button className="af-btn-primary gap-1.5">
          <Plus size={13} />
          {tab === "departments" ? "Add Department" : tab === "employees" ? "Invite User" : "Add Category"}
        </button>
      </div>

      {/* Tab bar */}
      <div className="flex border-b-2 border-ink">
        {TABS.map(([t, label, Icon]) => (
          <button key={t} onClick={() => setTab(t)}
            className={`flex items-center gap-2 px-5 py-2.5 text-[10px] font-bold uppercase tracking-widest border-b-2 -mb-[2px] transition-colors ${
              tab === t ? "border-signal text-signal bg-canvas" : "border-transparent text-ink3 hover:text-ink"
            }`}
          >
            <Icon size={12} />
            {label}
          </button>
        ))}
      </div>

      {/* Departments */}
      {tab === "departments" && (
        <div className="border-2 border-ink bg-surface overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-canvas">
                  <th className="af-th">Department</th>
                  <th className="af-th">Head</th>
                  <th className="af-th">Parent</th>
                  <th className="af-th">Members</th>
                  <th className="af-th">Status</th>
                  <th className="af-th w-20">Actions</th>
                </tr>
              </thead>
              <tbody>
                {departments.map((dept) => (
                  <tr key={dept.id} className="hover:bg-canvas transition-colors">
                    <td className="af-td">
                      <div className="flex items-center gap-2">
                        <div className="flex h-6 w-6 items-center justify-center border border-ink/20 bg-canvas">
                          <Building2 size={11} className="text-ink3" />
                        </div>
                        <span className="font-bold text-ink text-xs">{dept.name}</span>
                      </div>
                    </td>
                    <td className="af-td text-ink2">{dept.head}</td>
                    <td className="af-td">
                      {dept.parent ? (
                        <span className="flex items-center gap-1 text-xs text-ink3">
                          <ChevronRight size={11} />{dept.parent}
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold uppercase text-ink3">Root</span>
                      )}
                    </td>
                    <td className="af-td">
                      <span className="font-mono text-xs font-bold text-ink">{dept.members}</span>
                    </td>
                    <td className="af-td">
                      <span className="border border-go text-go text-[9px] font-bold uppercase px-1.5 py-0.5">
                        {dept.status}
                      </span>
                    </td>
                    <td className="af-td">
                      <button className="flex items-center gap-1 text-[10px] font-bold text-ink3 hover:text-signal transition-colors">
                        <Pencil size={11} /> Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Employees */}
      {tab === "employees" && (
        <div className="border-2 border-ink bg-surface overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-canvas">
                  <th className="af-th">Name</th>
                  <th className="af-th">Email</th>
                  <th className="af-th">Role</th>
                  <th className="af-th">Department</th>
                  <th className="af-th">Status</th>
                  <th className="af-th w-20">Actions</th>
                </tr>
              </thead>
              <tbody>
                {employees.map((emp) => {
                  const rm = roleMeta[emp.role];
                  return (
                    <tr key={emp.id} className="hover:bg-canvas transition-colors">
                      <td className="af-td">
                        <div className="flex items-center gap-2.5">
                          <div className="flex h-6 w-6 shrink-0 items-center justify-center border border-ink/20 bg-canvas text-[9px] font-bold text-ink2">
                            {emp.name.slice(0, 2).toUpperCase()}
                          </div>
                          <span className="font-bold text-xs text-ink">{emp.name}</span>
                        </div>
                      </td>
                      <td className="af-td font-mono text-xs text-ink3">{emp.email}</td>
                      <td className="af-td">
                        <span className={`border text-[9px] font-bold uppercase px-1.5 py-0.5 ${rm.style}`}>
                          {rm.label}
                        </span>
                      </td>
                      <td className="af-td text-ink2">{emp.dept}</td>
                      <td className="af-td">
                        <span className="border border-go text-go text-[9px] font-bold uppercase px-1.5 py-0.5">
                          {emp.status}
                        </span>
                      </td>
                      <td className="af-td">
                        <div className="flex items-center gap-2">
                          <button className="flex items-center gap-1 text-[10px] font-bold text-ink3 hover:text-signal transition-colors">
                            <Shield size={11} /> Role
                          </button>
                          <button className="flex items-center gap-1 text-[10px] font-bold text-ink3 hover:text-signal transition-colors">
                            <Pencil size={11} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Categories */}
      {tab === "categories" && (
        <div className="border-2 border-ink bg-surface divide-y-2 divide-ink">
          {categories.map((cat) => (
            <div key={cat.id} className="flex items-center gap-4 px-5 py-4 hover:bg-canvas transition-colors">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center border-2 border-ink bg-canvas">
                <Tag size={13} className="text-ink2" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-ink">{cat.name}</p>
                <p className="text-[11px] text-ink3 mt-0.5">{cat.description}</p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-xs font-bold text-ink">{cat.count}</p>
                <p className="text-[10px] text-ink3">assets</p>
              </div>
              <button className="text-ink3 hover:text-signal transition-colors ml-2">
                <Pencil size={13} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
