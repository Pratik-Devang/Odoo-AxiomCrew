"use client";

import { useEffect, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { Bell, Check, Loader2 } from "lucide-react";
import { PageHeader } from "@/components/page-header";

type NotificationRecord = {
  id: number;
  type: string;
  message: string;
  isRead: boolean;
  createdAt: string;
};

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<NotificationRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const unreadCount = notifications.filter((notification) => !notification.isRead).length;

  useEffect(() => {
    let cancelled = false;

    async function loadNotifications() {
      try {
        const response = await fetch("/api/notifications", { cache: "no-store" });

        if (!response.ok) {
          throw new Error("Unable to load notifications");
        }

        const payload = (await response.json()) as { notifications: NotificationRecord[] };

        if (!cancelled) {
          setNotifications(payload.notifications);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Unable to load notifications");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadNotifications();

    return () => {
      cancelled = true;
    };
  }, []);

  async function markAsRead(id: number) {
    setNotifications((current) =>
      current.map((notification) => (notification.id === id ? { ...notification, isRead: true } : notification))
    );

    await fetch(`/api/notifications/${id}/read`, { method: "PATCH" });
  }

  async function markAllAsRead() {
    setNotifications((current) => current.map((notification) => ({ ...notification, isRead: true })));
    await fetch("/api/notifications/read-all", { method: "PATCH" });
  }

  return (
    <div>
      <PageHeader
        title="Notifications"
        action={
          unreadCount > 0 ? (
            <button onClick={markAllAsRead} className="af-btn-secondary">
              <Check size={14} />
              Mark all as read
            </button>
          ) : null
        }
      />

      {error && (
        <div className="mb-6 rounded-lg border border-danger/30 bg-danger_bg px-4 py-3 text-sm text-danger">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex min-h-[18rem] items-center justify-center text-sm text-ink3">
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Loading notifications
        </div>
      ) : (
        <div className="af-card overflow-hidden divide-y divide-border">
          {notifications.length > 0 ? (
            notifications.map((notification) => (
              <button
                key={notification.id}
                onClick={() => markAsRead(notification.id)}
                className={`flex w-full items-start gap-4 px-5 py-4 text-left transition hover:bg-sunken ${
                  notification.isRead ? "bg-surface" : "border-l-2 border-signal bg-signal/5 pl-[18px]"
                }`}
              >
                <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-signal/10 text-signal">
                  <Bell size={15} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className={`text-sm ${notification.isRead ? "text-ink2" : "font-semibold text-ink"}`}>
                    {notification.message}
                  </p>
                  <div className="mt-1 flex items-center gap-2 text-[11px] text-ink3">
                    <span>{notification.type.replaceAll("_", " ").toLowerCase()}</span>
                    <span>·</span>
                    <span>{formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}</span>
                  </div>
                </div>
                {!notification.isRead && <span className="mt-2 h-2 w-2 rounded-full bg-signal" />}
              </button>
            ))
          ) : (
            <div className="px-5 py-12 text-center text-sm text-ink3">No notifications yet.</div>
          )}
        </div>
      )}
    </div>
  );
}
