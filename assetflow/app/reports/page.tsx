"use client";

import { useState } from "react";
import { PageHeader } from "@/components/page-header";
import { SectionHeader } from "@/components/section-header";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  LineChart, Line 
} from "recharts";
import { FileDown, Calendar, TrendingUp } from "lucide-react";

// Mock Data
const utilizationData = [
  { name: "Laptops", rate: 87, count: 120 },
  { name: "Monitors", rate: 76, count: 150 },
  { name: "Desks", rate: 92, count: 80 },
  { name: "Vehicles", rate: 45, count: 10 },
  { name: "Projectors", rate: 58, count: 15 },
];

const maintenanceTrends = [
  { name: "Jul", cost: 1200, count: 8 },
  { name: "Aug", cost: 1900, count: 12 },
  { name: "Sep", cost: 950, count: 5 },
  { name: "Oct", cost: 2400, count: 15 },
  { name: "Nov", cost: 1500, count: 9 },
  { name: "Dec", cost: 3100, count: 18 },
];

// Heatmap data (7 days x 8 blocks)
const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const timeSlots = ["9:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00"];

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState<"utilization" | "maintenance" | "heatmap">("utilization");

  // Generate mock booking density for heatmap (values 0 - 1)
  const getBookingDensity = (dayIdx: number, timeIdx: number) => {
    // Arbitrary formula to generate nice visual distribution
    return ((dayIdx * 2 + timeIdx * 3) % 7) / 7;
  };

  return (
    <div>
      <PageHeader 
        title="Reports & Analytics" 
        action={
          <div className="flex gap-2">
            <button className="af-btn-secondary gap-1.5">
              <FileDown size={14} /> Export CSV
            </button>
            <button className="af-btn-secondary gap-1.5">
              <FileDown size={14} /> Export PDF
            </button>
          </div>
        }
      />

      {/* Tabs */}
      <div className="flex border-b border-border mb-6">
        {[
          ["utilization", "Asset Utilization"],
          ["maintenance", "Maintenance Cost Trends"],
          ["heatmap", "Booking Heatmap"],
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Chart Card (Left 2 cols) */}
        <div className="lg:col-span-2">
          {activeTab === "utilization" && (
            <div className="af-card p-5">
              <div className="flex items-center justify-between mb-6">
                <SectionHeader title="Asset Category Utilization Rates (%)" className="mb-0" />
                <span className="text-xs text-ink3">Target: &gt;75%</span>
              </div>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={utilizationData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
                    <XAxis dataKey="name" stroke="#8A8880" fontSize={11} tickLine={false} />
                    <YAxis stroke="#8A8880" fontSize={11} tickLine={false} domain={[0, 100]} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: "#FFFFFF", borderColor: "#D6D4CE", borderRadius: "6px" }}
                      itemStyle={{ color: "#1C1C1A", fontSize: "12px" }}
                      labelStyle={{ fontWeight: "bold", fontSize: "11px", color: "#8A8880" }}
                    />
                    <Bar dataKey="rate" fill="#2563EB" radius={[4, 4, 0, 0]} maxBarSize={40} name="Utilization %" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {activeTab === "maintenance" && (
            <div className="af-card p-5">
              <div className="flex items-center justify-between mb-6">
                <SectionHeader title="Monthly Maintenance Expenses ($)" className="mb-0" />
                <span className="text-xs text-ink3">Total YTD: $11,050</span>
              </div>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={maintenanceTrends} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
                    <XAxis dataKey="name" stroke="#8A8880" fontSize={11} tickLine={false} />
                    <YAxis stroke="#8A8880" fontSize={11} tickLine={false} />
                    <Tooltip
                      contentStyle={{ backgroundColor: "#FFFFFF", borderColor: "#D6D4CE", borderRadius: "6px" }}
                      itemStyle={{ color: "#1C1C1A", fontSize: "12px" }}
                      labelStyle={{ fontWeight: "bold", fontSize: "11px", color: "#8A8880" }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="cost" 
                      stroke="#2563EB" 
                      strokeWidth={2} 
                      dot={false}
                      name="Cost ($)"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {activeTab === "heatmap" && (
            <div className="af-card p-5">
              <div className="flex items-center justify-between mb-6">
                <SectionHeader title="Resource Booking Peak Hours Heatmap" className="mb-0" />
                <div className="flex items-center gap-1.5 text-xs text-ink3">
                  <span>Low</span>
                  <div className="h-3 w-16 bg-gradient-to-r from-signal/5 to-signal rounded" />
                  <span>High</span>
                </div>
              </div>

              {/* Heatmap Grid */}
              <div className="space-y-2">
                {/* Time slot labels header */}
                <div className="grid grid-cols-8 gap-1.5 pl-12 text-center text-[10px] font-semibold tracking-wider text-ink3">
                  {timeSlots.map(t => (
                    <div key={t}>{t}</div>
                  ))}
                </div>
                {/* Day rows */}
                {days.map((day, dayIdx) => (
                  <div key={day} className="flex items-center gap-3">
                    {/* Day label */}
                    <div className="w-9 font-semibold text-xs text-ink2 text-right">{day}</div>
                    {/* Cells */}
                    <div className="flex-1 grid grid-cols-8 gap-1.5">
                      {timeSlots.map((_, timeIdx) => {
                        const density = getBookingDensity(dayIdx, timeIdx);
                        return (
                          <div 
                            key={timeIdx}
                            className="aspect-video rounded border border-border/10 cursor-pointer transition"
                            style={{ 
                              backgroundColor: `rgba(37, 99, 235, ${Math.max(0.05, density)})` 
                            }}
                            title={`${day} at ${timeSlots[timeIdx]}: ${(density * 10).toFixed(0)} bookings`}
                          />
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Side Summary Cards (Right 1 col) */}
        <div className="space-y-4">
          <SectionHeader title="Summary Insights" />
          
          <div className="af-card p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp size={16} className="text-signal" />
              <h4 className="text-xs font-semibold uppercase tracking-widest text-ink2">High Utilization</h4>
            </div>
            <p className="text-xs text-ink3 leading-relaxed">
              Furniture and standing desk utilization is currently exceeding <span className="font-semibold text-ink">92%</span>, suggesting the need for additional procurement in Q1.
            </p>
          </div>

          <div className="af-card p-4">
            <div className="flex items-center gap-2 mb-2">
              <Calendar size={16} className="text-go" />
              <h4 className="text-xs font-semibold uppercase tracking-widest text-ink2">Peak Booking Hours</h4>
            </div>
            <p className="text-xs text-ink3 leading-relaxed">
              Conference rooms experience peak density between <span className="font-semibold text-ink">11:00 AM – 2:00 PM</span>. Suggest limiting recurring syncs to mornings or late afternoons.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
