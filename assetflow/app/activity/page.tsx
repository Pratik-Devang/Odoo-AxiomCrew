"use client";

import { useState } from "react";
import { PageHeader } from "@/components/page-header";
import { SectionHeader } from "@/components/section-header";
import { 
  Bell, Package, Wrench, Calendar, AlertTriangle, ArrowLeftRight, ClipboardCheck, 
  Check, Eye
} from "lucide-react";

// Mock Notifications
const initialNotifications = [
  { id: 1, type: "ASSET_ASSIGNED", message: "New asset AF-0114 has been assigned to you.", time: "2h ago", isRead: false, icon: Package, iconColor: "text-signal bg-signal/10" },
  { id: 2, type: "MAINTENANCE_APPROVED", message: "Maintenance request for AF-0032 was approved.", time: "5h ago", isRead: false, icon: Wrench, iconColor: "text-violet bg-violet_bg" },
  { id: 3, type: "BOOKING_CONFIRMED", message: "Booking for Meeting Room B has been confirmed.", time: "1d ago", isRead: true, icon: Calendar, iconColor: "text-go bg-go_bg" },
  { id: 4, type: "OVERDUE_RETURN", message: "Asset AF-0008 return is overdue by 3 days.", time: "3d ago", isRead: false, icon: AlertTriangle, iconColor: "text-warn bg-warn_bg" },
  { id: 5, type: "TRANSFER_APPROVED", message: "Transfer request for AF-0087 has been approved.", time: "4d ago", isRead: true, icon: ArrowLeftRight, iconColor: "text-signal bg-signal/10" },
  { id: 6, type: "AUDIT_DISCREPANCY", message: "Audit cycle Q3 reported 2 missing items.", time: "1w ago", isRead: true, icon: ClipboardCheck, iconColor: "text-danger bg-danger_bg" },
];

// Mock Audit Log
const auditLogs = [
  { time: "2026-07-12 10:14:22", actor: "Avery Admin", initials: "AA", role: "ADMIN", action: "ALLOCATED", target: "AF-0114", details: "Assigned Dell Laptop to Priya Shah" },
  { time: "2026-07-12 09:41:05", actor: "Elena Torres", initials: "ET", role: "ASSET_MANAGER", action: "APPROVED", target: "AF-0032", details: "Approved maintenance request raised by Marcus R." },
  { time: "2026-07-12 08:12:59", actor: "Marcus Reed", initials: "MR", role: "DEPT_HEAD", action: "CREATED", target: "AF-0099", details: "Registered Standing Desk in Facilities" },
  { time: "2026-07-11 16:30:12", actor: "Priya Shah", initials: "PS", role: "DEPT_HEAD", action: "RETURNED", target: "AF-0209", details: "Returned monitor to Store Room A" },
  { time: "2026-07-11 14:05:44", actor: "Noah Williams", initials: "NW", role: "ASSET_MANAGER", action: "TRANSFER", target: "AF-0087", details: "Transferred camera custody to Mia Chen" },
];

const roleClasses: Record<string, string> = {
  ADMIN: "bg-violet_bg text-violet",
  ASSET_MANAGER: "bg-signal/10 text-signal",
  DEPT_HEAD: "bg-go_bg text-go",
  EMPLOYEE: "bg-gray_bg text-ink3",
};

export default function ActivityPage() {
  const [activeTab, setActiveTab] = useState<"notifications" | "audit">("notifications");
  const [notifications, setNotifications] = useState(initialNotifications);

  const markAsRead = (id: number) => {
    setNotifications(notifications.map(n => n.id === id ? { ...n, isRead: true } : n));
  };

  const markAllAsRead = () => {
    setNotifications(notifications.map(n => ({ ...n, isRead: true })));
  };

  return (
    <div>
      <PageHeader 
        title="Activity & Notifications" 
        action={
          activeTab === "notifications" && notifications.some(n => !n.isRead) && (
            <button 
              onClick={markAllAsRead}
              className="af-btn-secondary gap-1.5"
            >
              <Check size={14} /> Mark all read
            </button>
          )
        }
      />

      {/* Tabs */}
      <div className="flex border-b border-border mb-6">
        {[
          ["notifications", `Notifications (${notifications.filter(n => !n.isRead).length} unread)`],
          ["audit", "Audit Log"],
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

      {/* Content */}
      {activeTab === "notifications" ? (
        <div className="af-card overflow-hidden divide-y divide-border">
          {notifications.map((n) => {
            const Icon = n.icon;
            return (
              <div 
                key={n.id}
                className={`px-5 py-4 flex items-start gap-4 hover:bg-sunken/30 transition-colors ${
                  !n.isRead ? "border-l-2 border-signal pl-[18px]" : ""
                }`}
              >
                <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${n.iconColor}`}>
                  <Icon size={16} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm text-ink ${!n.isRead ? "font-medium" : "text-ink2"}`}>
                    {n.message}
                  </p>
                  <p className="text-[11px] text-ink3 mt-1">{n.time}</p>
                </div>
                {!n.isRead && (
                  <button 
                    onClick={() => markAsRead(n.id)}
                    className="af-btn-secondary gap-1 text-[11px] px-2.5 py-1"
                  >
                    <Eye size={12} />
                    Mark read
                  </button>
                )}
              </div>
            );
          })}
          {notifications.length === 0 && (
            <div className="py-12 text-center text-ink3 text-sm">
              No notifications.
            </div>
          )}
        </div>
      ) : (
        // Audit Log
        <div className="af-card overflow-hidden">
          <div className="p-4 border-b border-border bg-gray_bg">
            <SectionHeader title="System Event Logs" className="mb-0" />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr>
                  <th className="af-th">Timestamp</th>
                  <th className="af-th">Actor</th>
                  <th className="af-th">Role</th>
                  <th className="af-th">Action</th>
                  <th className="af-th">Target</th>
                  <th className="af-th">Details</th>
                </tr>
              </thead>
              <tbody>
                {auditLogs.map((log, idx) => (
                  <tr key={idx} className="hover:bg-sunken/40 transition-colors">
                    <td className="af-td font-mono text-xs text-ink3">{log.time}</td>
                    <td className="af-td">
                      <div className="flex items-center gap-2">
                        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-signal text-[10px] font-semibold text-white">
                          {log.initials}
                        </div>
                        <span className="text-sm font-semibold text-ink">{log.actor}</span>
                      </div>
                    </td>
                    <td className="af-td">
                      <span className={`text-[10px] font-semibold tracking-wider rounded px-1.5 py-0.5 ${roleClasses[log.role]}`}>
                        {log.role.replace("_", " ")}
                      </span>
                    </td>
                    <td className="af-td">
                      <span className="font-mono text-xs font-semibold bg-gray_bg text-ink2 px-1.5 py-0.5 rounded border border-border">
                        {log.action}
                      </span>
                    </td>
                    <td className="af-td">
                      <span className="font-mono text-xs text-signal font-medium bg-signal/5 px-1.5 py-0.5 rounded">
                        {log.target}
                      </span>
                    </td>
                    <td className="af-td text-ink2 text-xs">{log.details}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
