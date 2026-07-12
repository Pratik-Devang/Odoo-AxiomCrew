"use client";

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid } from "recharts";
import { TrendingUp, TrendingDown, Download } from "lucide-react";

const utilizationData = [
  { month: "Jul", rate: 72 }, { month: "Aug", rate: 75 }, { month: "Sep", rate: 68 },
  { month: "Oct", rate: 82 }, { month: "Nov", rate: 79 }, { month: "Dec", rate: 85 },
];

const categoryData = [
  { category: "Electronics",     allocated: 52, available: 18 },
  { category: "Furniture",       allocated: 30, available: 20 },
  { category: "AV Equipment",    allocated: 12, available: 4  },
  { category: "Office Equipment",allocated: 8,  available: 12 },
  { category: "Vehicles",        allocated: 5,  available: 2  },
];

const maintenanceTrend = [
  { month: "Jul", tickets: 8  }, { month: "Aug", tickets: 11 }, { month: "Sep", tickets: 6  },
  { month: "Oct", tickets: 14 }, { month: "Nov", tickets: 9  }, { month: "Dec", tickets: 12 },
];

const kpis = [
  { label: "Avg Utilization",  value: "77%",  delta: "+5% vs last quarter", up: true  },
  { label: "Assets Audited",   value: "284",  delta: "92% of registry",     up: true  },
  { label: "Maintenance Cost", value: "₹2.4L",delta: "-12% vs last quarter",up: false },
  { label: "Avg Return Time",  value: "18d",  delta: "+2d vs target",       up: false },
];

export default function ReportsPage() {
  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between border-b-2 border-ink pb-4">
        <div>
          <h1 className="text-lg font-bold uppercase tracking-widest text-ink">Reports & Analytics</h1>
          <p className="text-xs text-ink3 mt-0.5">Q4 2025 — All departments</p>
        </div>
        <button className="af-btn-secondary gap-1.5">
          <Download size={13} />
          Export CSV
        </button>
      </div>

      {/* KPI Mosaic */}
      <div className="flex gap-px border-2 border-ink bg-ink">
        {kpis.map((k) => (
          <div key={k.label} className="flex-1 bg-surface px-4 py-4">
            <p className="text-[9px] font-bold uppercase tracking-[0.15em] text-ink3 mb-2">{k.label}</p>
            <p className="text-3xl font-bold text-ink leading-none">{k.value}</p>
            <div className={`flex items-center gap-1 mt-2 text-[10px] font-semibold ${k.up ? "text-go" : "text-danger"}`}>
              {k.up ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
              {k.delta}
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Utilization Trend */}
        <div className="border-2 border-ink bg-surface">
          <div className="border-b-2 border-ink px-4 py-3 bg-canvas">
            <p className="text-[10px] font-bold uppercase tracking-widest text-ink">Asset Utilization Rate — 6 Months</p>
          </div>
          <div className="p-4">
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={utilizationData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E0E0DA" />
                <XAxis dataKey="month" tick={{ fontSize: 10, fontWeight: 700, fill: "#8A8A8A" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: "#8A8A8A" }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ border: "2px solid #1A1A1A", borderRadius: 0, fontSize: 11, fontWeight: 700 }}
                  cursor={{ stroke: "#0066FF", strokeWidth: 1 }}
                />
                <Line type="monotone" dataKey="rate" stroke="#0066FF" strokeWidth={2} dot={{ fill: "#0066FF", r: 3, strokeWidth: 0 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Breakdown */}
        <div className="border-2 border-ink bg-surface">
          <div className="border-b-2 border-ink px-4 py-3 bg-canvas">
            <p className="text-[10px] font-bold uppercase tracking-widest text-ink">Assets by Category</p>
          </div>
          <div className="p-4">
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={categoryData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E0E0DA" vertical={false} />
                <XAxis dataKey="category" tick={{ fontSize: 9, fontWeight: 700, fill: "#8A8A8A" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: "#8A8A8A" }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ border: "2px solid #1A1A1A", borderRadius: 0, fontSize: 11, fontWeight: 700 }}
                  cursor={{ fill: "#F4F4F0" }}
                />
                <Bar dataKey="allocated" fill="#0066FF" radius={0} maxBarSize={28} />
                <Bar dataKey="available" fill="#16A34A" radius={0} maxBarSize={28} />
              </BarChart>
            </ResponsiveContainer>
            <div className="flex gap-4 mt-3 justify-center">
              <div className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 bg-signal inline-block" /><span className="text-[10px] font-bold text-ink3">Allocated</span></div>
              <div className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 bg-go inline-block" /><span className="text-[10px] font-bold text-ink3">Available</span></div>
            </div>
          </div>
        </div>

        {/* Maintenance Trend */}
        <div className="border-2 border-ink bg-surface">
          <div className="border-b-2 border-ink px-4 py-3 bg-canvas">
            <p className="text-[10px] font-bold uppercase tracking-widest text-ink">Maintenance Tickets — 6 Months</p>
          </div>
          <div className="p-4">
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={maintenanceTrend} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E0E0DA" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 10, fontWeight: 700, fill: "#8A8A8A" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: "#8A8A8A" }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ border: "2px solid #1A1A1A", borderRadius: 0, fontSize: 11, fontWeight: 700 }}
                  cursor={{ fill: "#F4F4F0" }}
                />
                <Bar dataKey="tickets" fill="#7C3AED" radius={0} maxBarSize={28} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Maintained Assets */}
        <div className="border-2 border-ink bg-surface">
          <div className="border-b-2 border-ink px-4 py-3 bg-canvas">
            <p className="text-[10px] font-bold uppercase tracking-widest text-ink">Top Maintained Assets (YTD)</p>
          </div>
          <div className="divide-y divide-ink/10">
            {[
              { tag: "AF-0003", name: "Canon EOS R6",       count: 4, cost: "₹42,000" },
              { tag: "AF-0011", name: "HP LaserJet Pro",    count: 3, cost: "₹18,500" },
              { tag: "AF-0008", name: "Toyota HiAce Van",   count: 3, cost: "₹67,000" },
              { tag: "AF-0001", name: "Dell XPS 15",        count: 2, cost: "₹12,000" },
              { tag: "AF-0005", name: "Projector EB-L510U", count: 2, cost: "₹8,200"  },
            ].map((item, i) => (
              <div key={item.tag} className="flex items-center gap-3 px-4 py-3">
                <span className="w-5 text-[10px] font-bold text-ink3">{i + 1}.</span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-ink truncate">{item.name}</p>
                  <p className="text-[10px] text-ink3 font-mono">{item.tag}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-bold text-ink">{item.count} repairs</p>
                  <p className="text-[10px] text-ink3">{item.cost}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
