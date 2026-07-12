"use client";

import { useState } from "react";
import { AssetTag } from "@/components/asset-tag";
import { Bell, Package, Wrench, CalendarDays, ArrowLeftRight, AlertTriangle, Check } from "lucide-react";

type NotifType = "ASSET_ASSIGNED" | "MAINTENANCE_APPROVED" | "MAINTENANCE_REJECTED" | "BOOKING_CONFIRMED" | "BOOKING_CANCELLED" | "TRANSFER_APPROVED" | "OVERDUE_RETURN" | "AUDIT_DISCREPANCY";

type Notification = {
  id: number; type: NotifType; title: string; body: string;
  tag?: string; read: boolean; when: string;
};

const initialNotifications: Notification[] = [
  { id: 1,  type: "OVERDUE_RETURN",       title: "Overdue Return",         body: "MacBook Pro 14\" is 3 days past due return date.",   tag: "AF-0006", read: false, when: "2h ago"  },
  { id: 2,  type: "MAINTENANCE_APPROVED", title: "Maintenance Approved",   body: "Dell XPS 15 maintenance request approved.",            tag: "AF-0001", read: false, when: "4h ago"  },
  { id: 3,  type: "ASSET_ASSIGNED",       title: "Asset Assigned",         body: "Cisco IP Phone assigned to Mia Chen.",                 tag: "AF-0009", read: false, when: "5h ago"  },
  { id: 4,  type: "BOOKING_CONFIRMED",    title: "Booking Confirmed",      body: "Projector booked for Meeting Room A, 14:00.",          tag: "AF-0005", read: true,  when: "8h ago"  },
  { id: 5,  type: "TRANSFER_APPROVED",    title: "Transfer Approved",      body: "Canon EOS R6 transfer to Noah Williams approved.",     tag: "AF-0003", read: true,  when: "1d ago"  },
  { id: 6,  type: "AUDIT_DISCREPANCY",    title: "Audit Discrepancy",      body: "2 assets missing in Q4 Technology audit cycle.",       tag: undefined, read: false, when: "1d ago"  },
  { id: 7,  type: "MAINTENANCE_REJECTED", title: "Maintenance Rejected",   body: "HP LaserJet repair request rejected — out of budget.", tag: "AF-0011", read: true,  when: "2d ago"  },
  { id: 8,  type: "BOOKING_CANCELLED",    title: "Booking Cancelled",      body: "Toyota HiAce Van booking for Dec 14 cancelled.",      tag: "AF-0008", read: true,  when: "2d ago"  },
];

const typeIcon: Record<NotifType, React.ElementType> = {
  ASSET_ASSIGNED:       Package,
  MAINTENANCE_APPROVED: Wrench,
  MAINTENANCE_REJECTED: Wrench,
  BOOKING_CONFIRMED:    CalendarDays,
  BOOKING_CANCELLED:    CalendarDays,
  TRANSFER_APPROVED:    ArrowLeftRight,
  OVERDUE_RETURN:       AlertTriangle,
  AUDIT_DISCREPANCY:    AlertTriangle,
};

const typeStyle: Record<NotifType, string> = {
  ASSET_ASSIGNED:       "border-signal text-signal bg-surface",
  MAINTENANCE_APPROVED: "border-go text-go bg-go_bg",
  MAINTENANCE_REJECTED: "border-danger text-danger bg-danger_bg",
  BOOKING_CONFIRMED:    "border-signal text-signal bg-surface",
  BOOKING_CANCELLED:    "border-ink3 text-ink3 bg-canvas",
  TRANSFER_APPROVED:    "border-go text-go bg-go_bg",
  OVERDUE_RETURN:       "border-danger text-danger bg-danger_bg",
  AUDIT_DISCREPANCY:    "border-warn text-warn bg-warn_bg",
};

export default function ActivityPage() {
  const [notifications, setNotifications] = useState(initialNotifications);
  const [filter, setFilter] = useState<"all" | "unread">("all");

  const markAllRead = () => setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  const markRead    = (id: number) => setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, read: true } : n));

  const unread    = notifications.filter((n) => !n.read);
  const displayed = filter === "unread" ? unread : notifications;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b-2 border-ink pb-4">
        <div>
          <h1 className="text-lg font-bold uppercase tracking-widest text-ink">Activity & Notifications</h1>
          <p className="text-xs text-ink3 mt-0.5">{unread.length} unread notifications</p>
        </div>
        {unread.length > 0 && (
          <button onClick={markAllRead} className="af-btn-secondary gap-1.5">
            <Check size={12} />
            Mark all read
          </button>
        )}
      </div>

      {/* Filter tabs */}
      <div className="flex items-center gap-0 border-b-2 border-ink">
        {([["all", "All"], ["unread", `Unread (${unread.length})`]] as const).map(([f, label]) => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-5 py-2.5 text-[10px] font-bold uppercase tracking-widest border-b-2 -mb-[2px] transition-colors ${
              filter === f ? "border-signal text-signal bg-canvas" : "border-transparent text-ink3 hover:text-ink"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Notification feed */}
      <div className="border-2 border-ink bg-surface divide-y-2 divide-ink">
        {displayed.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-20">
            <Bell size={28} className="text-ink3" />
            <p className="text-sm font-bold text-ink3">No unread notifications</p>
          </div>
        ) : (
          displayed.map((notif) => {
            const Icon = typeIcon[notif.type];
            const style = typeStyle[notif.type];
            return (
              <div
                key={notif.id}
                className={`flex items-start gap-4 px-5 py-4 transition-colors ${notif.read ? "bg-surface" : "bg-canvas border-l-4 border-signal"}`}
              >
                {/* Icon */}
                <div className={`flex h-8 w-8 shrink-0 items-center justify-center border ${style}`}>
                  <Icon size={13} />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className={`text-xs font-bold ${notif.read ? "text-ink" : "text-ink"}`}>{notif.title}</p>
                    {!notif.read && <span className="h-1.5 w-1.5 rounded-full bg-signal shrink-0" />}
                  </div>
                  <p className="text-xs text-ink3 leading-relaxed">{notif.body}</p>
                  {notif.tag && (
                    <div className="mt-1.5">
                      <AssetTag tag={notif.tag} />
                    </div>
                  )}
                </div>

                {/* Meta + action */}
                <div className="flex flex-col items-end gap-2 shrink-0">
                  <span className="font-mono text-[10px] text-ink3">{notif.when}</span>
                  {!notif.read && (
                    <button
                      onClick={() => markRead(notif.id)}
                      className="text-[9px] font-bold uppercase tracking-widest text-ink3 hover:text-signal transition-colors"
                    >
                      Mark read
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
