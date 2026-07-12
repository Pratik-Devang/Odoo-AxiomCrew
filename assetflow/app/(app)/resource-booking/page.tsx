"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import { AssetTag } from "@/components/asset-tag";
import { StatusChip } from "@/components/status-chip";
import {
  ChevronLeft,
  ChevronRight,
  Clock,
  X,
  Loader2,
  AlertTriangle,
  Bookmark,
  Wrench,
  Search,
  Check,
  Calendar,
  AlertOctagon,
  Trash2,
  Plus,
  RefreshCw,
  Sliders,
  Menu,
} from "lucide-react";
import { format, addDays, isToday, startOfWeek, parseISO, isSameDay, differenceInMinutes } from "date-fns";

// ==========================================
// Interfaces & Constants
// ==========================================
interface Resource {
  id: number;
  tag: string;
  name: string;
  isBookable: boolean;
  status: string;
  location: string;
  category: { name: string };
  bookingCount?: number;
  underMaintenance?: boolean;
}

interface Booking {
  id: number;
  assetId: number;
  bookedById: number;
  startTime: string;
  endTime: string;
  status: string;
  asset: { id: number; tag: string; name: string };
  bookedBy: { id: number; name: string; role: string };
}

interface MaintenanceRequest {
  id: number;
  assetId: number;
  issueDescription: string;
  priority: string;
  status: string;
  technicianName: string | null;
  raisedAt: string;
  resolvedAt: string | null;
  asset: { id: number; tag: string; name: string };
}

interface CalendarEvent {
  id: string;
  type: "BOOKING" | "MAINTENANCE";
  assetId: number;
  assetName: string;
  assetTag: string;
  title: string;
  start: Date;
  end: Date;
  status: string;
  metadata: Record<string, any>;
}

interface ConflictPreview {
  assetId: number;
  startTime: Date;
  endTime: Date;
}

const HOURS = [
  "08:00", "09:00", "10:00", "11:00", "12:00",
  "13:00", "14:00", "15:00", "16:00", "17:00", "18:00"
];

// ==========================================
// Helper: Position layout calculators
// ==========================================
function getLayoutProps(start: Date, end: Date) {
  const startHour = start.getHours();
  const startMin = start.getMinutes();
  const endHour = end.getHours();
  const endMin = end.getMinutes();

  const businessStart = 8 * 60; // 08:00
  const businessEnd = 18 * 60;  // 18:00

  const rawStart = startHour * 60 + startMin;
  const rawEnd = endHour * 60 + endMin;

  const clampedStart = Math.max(businessStart, Math.min(businessEnd, rawStart));
  const clampedEnd = Math.max(businessStart, Math.min(businessEnd, rawEnd));

  const durationMinutes = Math.max(0, clampedEnd - clampedStart);
  const topPercent = ((clampedStart - businessStart) / (businessEnd - businessStart)) * 100;
  const heightPercent = (durationMinutes / (businessEnd - businessStart)) * 100;

  return {
    top: `${topPercent}%`,
    height: `${heightPercent}%`,
    duration: durationMinutes,
  };
}

// ==========================================
// Sub-components
// ==========================================

// 1. Toolbar component
function CalendarToolbar({
  view,
  setView,
  currentWeekStart,
  setCurrentWeekStart,
  selectedDayDate,
  setSelectedDayDate,
  onPrev,
  onNext,
  onToday,
  resources,
  selectedResourceId,
  setSelectedResourceId,
  filterType,
  setFilterType,
  onRefresh,
  onNewBooking,
}: {
  view: "day" | "week";
  setView: (v: "day" | "week") => void;
  currentWeekStart: Date;
  setCurrentWeekStart: (d: Date) => void;
  selectedDayDate: Date;
  setSelectedDayDate: (d: Date) => void;
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
  resources: Resource[];
  selectedResourceId: number | null;
  setSelectedResourceId: (id: number | null) => void;
  filterType: "all" | "bookings" | "maintenance";
  setFilterType: (f: "all" | "bookings" | "maintenance") => void;
  onRefresh: () => void;
  onNewBooking: () => void;
}) {
  const dateLabel = useMemo(() => {
    if (view === "day") {
      return format(selectedDayDate, "dd MMM yyyy");
    }
    const end = addDays(currentWeekStart, 6);
    return `${format(currentWeekStart, "dd MMM")} – ${format(end, "dd MMM yyyy")}`;
  }, [view, selectedDayDate, currentWeekStart]);

  return (
    <div className="flex flex-wrap gap-4 items-center justify-between bg-canvas border-2 border-ink p-4 rounded-xl">
      {/* Date navigation */}
      <div className="flex items-center gap-2">
        <button
          onClick={onPrev}
          className="border-2 border-ink p-1.5 bg-surface text-ink hover:bg-canvas rounded-lg transition"
          title="Previous"
        >
          <ChevronLeft size={16} />
        </button>
        <button
          onClick={onToday}
          className="border-2 border-ink px-3 py-1.5 text-xs font-bold uppercase text-ink hover:bg-canvas bg-surface rounded-lg transition"
        >
          Today
        </button>
        <button
          onClick={onNext}
          className="border-2 border-ink p-1.5 bg-surface text-ink hover:bg-canvas rounded-lg transition"
          title="Next"
        >
          <ChevronRight size={16} />
        </button>
        <span className="text-sm font-bold text-ink ml-2 min-w-[130px]">{dateLabel}</span>
      </div>

      {/* Date Picker input */}
      <div className="relative flex items-center">
        <Calendar size={14} className="absolute left-3 text-ink3 pointer-events-none" />
        <input
          type="date"
          value={format(view === "day" ? selectedDayDate : currentWeekStart, "yyyy-MM-dd")}
          onChange={(e) => {
            if (e.target.value) {
              const parsed = new Date(e.target.value);
              setSelectedDayDate(parsed);
              if (view === "week") {
                setCurrentWeekStart(startOfWeek(parsed, { weekStartsOn: 1 }));
              }
            }
          }}
          className="af-input pl-9 pr-3 py-1.5 text-xs font-bold w-36"
        />
      </div>

      {/* Resource selector (active only in day view or filters in week view) */}
      <div className="flex items-center gap-2">
        <label className="text-[10px] font-bold text-ink3 uppercase">Resource:</label>
        <select
          value={selectedResourceId || ""}
          onChange={(e) => setSelectedResourceId(e.target.value ? Number(e.target.value) : null)}
          className="af-input text-xs font-semibold py-1.5"
        >
          <option value="">All Resources</option>
          {resources.map((r) => (
            <option key={r.id} value={r.id}>
              {r.tag} - {r.name}
            </option>
          ))}
        </select>
      </div>

      {/* Filters dropdown */}
      <div className="flex items-center gap-2">
        <label className="text-[10px] font-bold text-ink3 uppercase">Filter:</label>
        <select
          value={filterType}
          onChange={(e: any) => setFilterType(e.target.value)}
          className="af-input py-1.5 text-xs font-semibold"
        >
          <option value="all">All Entries</option>
          <option value="bookings">Bookings Only</option>
          <option value="maintenance">Maintenance Only</option>
        </select>
      </div>

      {/* Switcher & Actions */}
      <div className="flex items-center gap-2">
        <div className="flex border-2 border-ink rounded-lg overflow-hidden">
          <button
            onClick={() => setView("day")}
            className={`px-3 py-1.5 text-[10px] font-bold uppercase transition ${
              view === "day" ? "bg-ink text-white" : "bg-surface text-ink hover:bg-canvas"
            }`}
          >
            Day
          </button>
          <button
            onClick={() => setView("week")}
            className={`px-3 py-1.5 text-[10px] font-bold uppercase border-l-2 border-ink transition ${
              view === "week" ? "bg-ink text-white" : "bg-surface text-ink hover:bg-canvas"
            }`}
          >
            Week
          </button>
        </div>

        <button
          onClick={onRefresh}
          className="border-2 border-ink p-1.5 bg-surface text-ink hover:bg-canvas rounded-lg transition"
          title="Refresh Calendar"
        >
          <RefreshCw size={14} />
        </button>

        <button onClick={onNewBooking} className="af-btn-primary py-1.5 text-xs gap-1">
          <Plus size={13} /> Book Slot
        </button>
      </div>
    </div>
  );
}

// 2. Resource Sidebar (Day view only)
function ResourceSidebar({
  resources,
  selectedId,
  onSelect,
  searchQuery,
  setSearchQuery,
}: {
  resources: Resource[];
  selectedId: number | null;
  onSelect: (id: number | null) => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
}) {
  return (
    <div className="border-2 border-ink bg-surface rounded-xl p-4 space-y-4 h-full">
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-ink3" size={13} />
        <input
          type="text"
          placeholder="Filter resources..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="af-input pl-8 py-1.5 text-xs w-full"
        />
      </div>

      <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
        <div
          onClick={() => onSelect(null)}
          className={`p-2 rounded border text-xs font-semibold cursor-pointer transition ${
            selectedId === null ? "bg-signal/15 border-signal text-signal" : "border-ink/10 hover:bg-canvas"
          }`}
        >
          All Resources
        </div>
        {resources.map((res) => {
          const isSelected = selectedId === res.id;
          return (
            <div
              key={res.id}
              onClick={() => onSelect(res.id)}
              className={`p-3 border rounded-lg cursor-pointer transition text-xs relative ${
                isSelected ? "border-signal bg-signal/5" : "border-ink/15 hover:border-ink/50"
              }`}
            >
              <div className="flex justify-between items-start">
                <div className="min-w-0 pr-2">
                  <span className="font-bold text-ink block truncate">{res.name}</span>
                  <div className="mt-1 flex items-center gap-1.5">
                    <AssetTag tag={res.tag} />
                    {res.underMaintenance && (
                      <span className="bg-warn_bg text-warn border border-warn/15 text-[8px] font-bold px-1 rounded flex items-center gap-0.5">
                        <Wrench size={7} /> maint
                      </span>
                    )}
                  </div>
                </div>
                <span
                  className={`w-2.5 h-2.5 rounded-full border shrink-0 ${
                    res.underMaintenance
                      ? "bg-warn border-warn/30"
                      : res.status === "AVAILABLE"
                      ? "bg-go border-go/30"
                      : "bg-signal border-signal/30"
                  }`}
                ></span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// 3. Mini Upcoming Bookings slide drawer
function MiniUpcomingBookingsDrawer({
  isOpen,
  onClose,
  bookings,
  onCancel,
}: {
  isOpen: boolean;
  onClose: () => void;
  bookings: Booking[];
  onCancel: (id: number) => void;
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60">
      <div className="flex-1" onClick={onClose}></div>
      <div className="w-full max-w-sm bg-surface border-l-2 border-ink p-6 space-y-4 h-full overflow-y-auto flex flex-col">
        <div className="flex justify-between items-center border-b border-ink/10 pb-3">
          <h3 className="text-sm font-bold uppercase tracking-widest text-ink flex items-center gap-2">
            <Bookmark size={15} className="text-signal" /> My Bookings
          </h3>
          <button onClick={onClose} className="text-ink3 hover:text-ink transition">
            <X size={18} />
          </button>
        </div>

        {bookings.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center text-ink3 text-xs italic">
            No upcoming bookings scheduled.
          </div>
        ) : (
          <div className="space-y-3 flex-1 overflow-y-auto pr-1">
            {bookings.map((b) => (
              <div key={b.id} className="border-2 border-ink p-3 bg-canvas rounded-lg text-xs relative">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="font-bold text-ink block truncate">{b.asset?.name}</span>
                    <div className="mt-1">
                      <AssetTag tag={b.asset?.tag} />
                    </div>
                  </div>
                  <button
                    onClick={() => onCancel(b.id)}
                    className="text-ink3 hover:text-danger p-1 transition rounded hover:bg-danger_bg scale-90"
                    title="Cancel Booking"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
                <div className="mt-2.5 pt-2 border-t border-ink/5 grid grid-cols-2 gap-2 text-[10px] text-ink2">
                  <div>
                    <span className="block opacity-70">Date</span>
                    <span className="font-bold">{format(parseISO(b.startTime), "MMM dd, yyyy")}</span>
                  </div>
                  <div>
                    <span className="block opacity-70">Time</span>
                    <span className="font-bold font-mono">
                      {format(parseISO(b.startTime), "HH:mm")} - {format(parseISO(b.endTime), "HH:mm")}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// 4. Slide-over details drawer
function BookingDrawer({
  event,
  onClose,
  onCancel,
}: {
  event: CalendarEvent | null;
  onClose: () => void;
  onCancel: (id: number) => void;
}) {
  if (!event) return null;

  const isBooking = event.type === "BOOKING";

  return (
    <div className="fixed inset-0 z-40 flex justify-end bg-black/50">
      <div className="flex-1" onClick={onClose}></div>
      <div className="w-full max-w-sm bg-surface border-l-2 border-ink p-6 space-y-6 flex flex-col justify-between h-full overflow-y-auto">
        <div className="space-y-6">
          <div className="flex justify-between items-center border-b border-ink/10 pb-3">
            <h3 className="text-sm font-bold uppercase tracking-widest text-ink flex items-center gap-1.5">
              {isBooking ? <Bookmark size={15} className="text-signal" /> : <Wrench size={15} className="text-warn" />}
              {isBooking ? "Booking Details" : "Maintenance Ticket"}
            </h3>
            <button onClick={onClose} className="text-ink3 hover:text-ink transition">
              <X size={18} />
            </button>
          </div>

          <div className="space-y-3.5 text-xs text-ink2">
            <div>
              <span className="text-ink3 block font-bold text-[9px] uppercase tracking-wider">Resource</span>
              <span className="font-bold text-ink text-sm block mt-0.5">{event.assetName}</span>
            </div>

            <div>
              <span className="text-ink3 block font-bold text-[9px] uppercase tracking-wider">Asset Tag</span>
              <div className="mt-1">
                <AssetTag tag={event.assetTag} />
              </div>
            </div>

            <div>
              <span className="text-ink3 block font-bold text-[9px] uppercase tracking-wider">Schedule</span>
              <div className="flex items-center gap-1.5 font-semibold text-ink mt-0.5">
                <Clock size={13} className="text-ink3" />
                <span>
                  {format(event.start, "MMM dd, HH:mm")} – {format(event.end, "HH:mm")}
                </span>
              </div>
            </div>

            <div>
              <span className="text-ink3 block font-bold text-[9px] uppercase tracking-wider">Duration</span>
              <span className="font-semibold text-ink block mt-0.5">
                {differenceInMinutes(event.end, event.start)} minutes
              </span>
            </div>

            {isBooking ? (
              <>
                <div className="border-t border-ink/5 pt-3">
                  <span className="text-ink3 block font-bold text-[9px] uppercase tracking-wider">Booked By</span>
                  <span className="font-semibold text-ink block mt-0.5">{event.metadata.bookedBy}</span>
                </div>
                <div>
                  <span className="text-ink3 block font-bold text-[9px] uppercase tracking-wider">Department / Role</span>
                  <span className="font-semibold text-ink block mt-0.5">{event.metadata.role}</span>
                </div>
                <div>
                  <span className="text-ink3 block font-bold text-[9px] uppercase tracking-wider">Status</span>
                  <div className="mt-1">
                    <StatusChip status={event.status} />
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="border-t border-ink/5 pt-3">
                  <span className="text-ink3 block font-bold text-[9px] uppercase tracking-wider">Technician</span>
                  <span className="font-semibold text-ink block mt-0.5">{event.metadata.technicianName}</span>
                </div>
                <div>
                  <span className="text-ink3 block font-bold text-[9px] uppercase tracking-wider">Issue Description</span>
                  <p className="text-ink font-medium leading-relaxed bg-canvas p-2.5 rounded border border-ink/5 mt-0.5">
                    {event.metadata.issueDescription}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-ink3 block font-bold text-[9px] uppercase tracking-wider">Priority</span>
                    <span className="font-bold text-ink block mt-0.5">{event.metadata.priority}</span>
                  </div>
                  <div>
                    <span className="text-ink3 block font-bold text-[9px] uppercase tracking-wider">Workflow Status</span>
                    <div className="mt-1">
                      <StatusChip status={event.status} />
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {isBooking && event.status === "UPCOMING" && (
          <div className="border-t border-ink/10 pt-4 mt-6">
            <button
              onClick={() => onCancel(Number(event.id.replace("b-", "")))}
              className="w-full flex items-center justify-center gap-1.5 border-2 border-danger text-danger hover:bg-danger_bg/10 font-bold text-xs py-2.5 transition"
            >
              <Trash2 size={13} /> Cancel Booking
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// 5. Day View timeline grid (Google Calendar style)
function DayView({
  selectedDayDate,
  events,
  conflictPreview,
  onEventClick,
  setHoveredEvent,
  setHoverPosition,
  currentTimeOffset,
}: {
  selectedDayDate: Date;
  events: CalendarEvent[];
  conflictPreview: ConflictPreview | null;
  onEventClick: (ev: CalendarEvent) => void;
  setHoveredEvent: (ev: CalendarEvent | null) => void;
  setHoverPosition: (pos: { x: number; y: number } | null) => void;
  currentTimeOffset: number | null;
}) {
  const dayEvents = useMemo(() => {
    return events.filter((ev) => isSameDay(ev.start, selectedDayDate));
  }, [events, selectedDayDate]);

  const conflictProps = useMemo(() => {
    if (!conflictPreview || !isSameDay(conflictPreview.startTime, selectedDayDate)) return null;
    return getLayoutProps(conflictPreview.startTime, conflictPreview.endTime);
  }, [conflictPreview, selectedDayDate]);

  return (
    <div className="flex gap-4">
      {/* Hour labels */}
      <div className="flex flex-col justify-between py-2 text-[10px] font-bold text-ink3 font-mono h-[550px] w-12 select-none">
        {HOURS.map((h) => (
          <span key={h}>{h}</span>
        ))}
      </div>

      {/* Continuous Timeline Canvas */}
      <div className="relative flex-1 border-2 border-ink bg-canvas h-[550px] rounded-xl overflow-hidden shadow-sm">
        {/* Shading non-working hours: light-gray background overlay */}
        {/* We have grid lines for business hours 08:00 - 18:00 */}
        {HOURS.map((h, idx) => {
          const topPercent = (idx / (HOURS.length - 1)) * 100;
          return (
            <div
              key={h}
              style={{ top: `${topPercent}%` }}
              className="absolute left-0 right-0 border-t border-ink/10 pointer-events-none"
            ></div>
          );
        })}

        {/* Calendar event cards */}
        {dayEvents.map((ev) => {
          const layout = getLayoutProps(ev.start, ev.end);
          const isBooking = ev.type === "BOOKING";

          return (
            <div
              key={ev.id}
              style={{
                top: layout.top,
                height: layout.height,
              }}
              onClick={() => onEventClick(ev)}
              onMouseEnter={(e) => {
                setHoveredEvent(ev);
                setHoverPosition({ x: e.clientX, y: e.clientY });
              }}
              onMouseLeave={() => {
                setHoveredEvent(null);
                setHoverPosition(null);
              }}
              className={`absolute left-[5%] right-[5%] border-2 rounded-xl p-3 flex flex-col justify-between overflow-hidden shadow-md cursor-pointer transition duration-200 hover:scale-[1.005] hover:brightness-95 hover:shadow-lg select-none ${
                isBooking
                  ? "bg-signal/15 border-signal text-signal"
                  : "bg-warn_bg border-warn text-warn"
              }`}
            >
              <div className="flex items-start justify-between min-w-0">
                <span className="font-bold text-xs truncate leading-tight">{ev.title}</span>
                <span className="text-[8px] font-bold uppercase tracking-wider font-mono">
                  {ev.type}
                </span>
              </div>
              <div className="flex items-center justify-between text-[10px] mt-1">
                <span className="font-mono">
                  {format(ev.start, "HH:mm")} – {format(ev.end, "HH:mm")}
                </span>
                <span className="opacity-75 truncate text-[9px]">
                  {isBooking ? ev.metadata.bookedBy : ev.metadata.technicianName}
                </span>
              </div>
            </div>
          );
        })}

        {/* Conflict preview outline */}
        {conflictProps && (
          <div
            style={{
              top: conflictProps.top,
              height: conflictProps.height,
            }}
            className="absolute left-[8%] right-[8%] border-2 border-dashed border-danger bg-danger_bg/30 text-danger rounded-xl p-3 flex flex-col justify-center items-center text-center animate-pulse z-10 select-none"
          >
            <AlertTriangle size={16} className="mb-1" />
            <span className="font-bold text-xs">Conflict - Slot unavailable</span>
            <span className="text-[9px] mt-0.5 opacity-80 leading-none">
              Requested {format(conflictPreview!.startTime, "HH:mm")} – {format(conflictPreview!.endTime, "HH:mm")}
            </span>
          </div>
        )}

        {/* Google Calendar style line current time indicator */}
        {isToday(selectedDayDate) && currentTimeOffset !== null && (
          <div
            style={{ top: `${currentTimeOffset}%` }}
            className="absolute left-0 right-0 flex items-center pointer-events-none z-20"
          >
            <div className="w-2.5 h-2.5 rounded-full bg-danger -ml-1.5 border border-white"></div>
            <div className="flex-1 border-t-2 border-danger"></div>
          </div>
        )}
      </div>
    </div>
  );
}

// 6. Week View timeline grid (Odoo Planning style: Resources are rows, Days are columns)
function WeekView({
  weekDays,
  resources,
  events,
  conflictPreview,
  onEventClick,
  setHoveredEvent,
  setHoverPosition,
}: {
  weekDays: Date[];
  resources: Resource[];
  events: CalendarEvent[];
  conflictPreview: ConflictPreview | null;
  onEventClick: (ev: CalendarEvent) => void;
  setHoveredEvent: (ev: CalendarEvent | null) => void;
  setHoverPosition: (pos: { x: number; y: number } | null) => void;
}) {
  return (
    <div className="border-2 border-ink bg-surface rounded-xl overflow-x-auto">
      <table className="w-full min-w-[950px] border-collapse">
        <thead>
          <tr className="bg-canvas border-b-2 border-ink text-center">
            <th className="af-th w-48 text-left py-3 border-r border-ink/20">Resource</th>
            {weekDays.map((day) => (
              <th key={day.toISOString()} className="af-th py-3 border-r border-ink/10">
                <span className="block text-[10px] text-ink3 uppercase font-medium">{format(day, "eee")}</span>
                <span className="block text-sm font-bold text-ink mt-0.5">{format(day, "dd MMM")}</span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {resources.map((res) => (
            <tr key={res.id} className="border-b border-ink/15 hover:bg-canvas/5">
              {/* Resource Title Cell */}
              <td className="p-3 border-r border-ink/20 bg-canvas/30 align-middle">
                <div className="space-y-1">
                  <span className="font-bold text-xs text-ink block leading-snug truncate">{res.name}</span>
                  <div className="flex items-center gap-1.5">
                    <AssetTag tag={res.tag} />
                    {res.underMaintenance ? (
                      <span className="bg-warn_bg text-warn border border-warn/15 text-[8px] font-bold px-1 rounded flex items-center gap-0.5">
                        <Wrench size={7} /> maint
                      </span>
                    ) : (
                      <span className="bg-go_bg text-go border border-go/15 text-[8px] font-bold px-1 rounded">
                        active
                      </span>
                    )}
                  </div>
                </div>
              </td>

              {/* Day cells for week */}
              {weekDays.map((day) => {
                const cellEvents = events.filter(
                  (ev) => ev.assetId === res.id && isSameDay(ev.start, day)
                );

                const hasConflict =
                  conflictPreview &&
                  conflictPreview.assetId === res.id &&
                  isSameDay(conflictPreview.startTime, day);

                const conflictLayoutProps = conflictPreview ? getLayoutProps(conflictPreview.startTime, conflictPreview.endTime) : null;

                return (
                  <td
                    key={day.toISOString()}
                    className="p-1 border-r border-ink/10 last:border-0 align-top min-w-[110px] relative bg-canvas/5 h-28"
                  >
                    <div className="w-full h-full relative border border-dashed border-ink/5 rounded p-0.5">
                      {cellEvents.map((ev) => {
                        const layout = getLayoutProps(ev.start, ev.end);
                        const isBooking = ev.type === "BOOKING";

                        return (
                          <div
                            key={ev.id}
                            style={{
                              top: layout.top,
                              height: layout.height,
                            }}
                            onClick={() => onEventClick(ev)}
                            onMouseEnter={(e) => {
                              setHoveredEvent(ev);
                              setHoverPosition({ x: e.clientX, y: e.clientY });
                            }}
                            onMouseLeave={() => {
                              setHoveredEvent(null);
                              setHoverPosition(null);
                            }}
                            className={`absolute left-0.5 right-0.5 border rounded-lg px-1.5 py-1 text-[8px] font-bold leading-tight cursor-pointer overflow-hidden shadow-sm flex flex-col justify-between transition-all hover:scale-[1.01] hover:brightness-95 select-none ${
                              isBooking
                                ? "bg-signal/15 border-signal text-signal"
                                : "bg-warn_bg border-warn text-warn"
                            }`}
                          >
                            <div className="truncate mb-0.5">{ev.title}</div>
                            <div className="font-mono text-[7px] opacity-85 leading-none">
                              {format(ev.start, "HH:mm")}–{format(ev.end, "HH:mm")}
                            </div>
                          </div>
                        );
                      })}

                      {/* Conflict visual */}
                      {hasConflict && conflictLayoutProps && (
                        <div
                          style={{
                            top: conflictLayoutProps.top,
                            height: conflictLayoutProps.height,
                          }}
                          className="absolute left-0.5 right-0.5 border border-dashed border-danger bg-danger_bg/30 text-danger rounded px-1 py-0.5 text-[8px] font-bold leading-tight flex flex-col justify-center items-center text-center animate-pulse z-10 select-none"
                        >
                          Conflict - Slot unavailable
                        </div>
                      )}
                    </div>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ==========================================
// Main ResourceBookingPage
// ==========================================
export default function ResourceBookingPage() {
  const [view, setView] = useState<"day" | "week">("day");
  const [filterType, setFilterType] = useState<"all" | "bookings" | "maintenance">("all");
  const [searchQuery, setSearchQuery] = useState("");

  const [resources, setResources] = useState<Resource[]>([]);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [myBookings, setMyBookings] = useState<Booking[]>([]);

  const [selectedResourceId, setSelectedResourceId] = useState<number | null>(null);
  const [selectedDayDate, setSelectedDayDate] = useState<Date>(new Date());
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(() => {
    return startOfWeek(new Date(), { weekStartsOn: 1 });
  });

  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Modals & Panels
  const [showBookModal, setShowBookModal] = useState(false);
  const [showMyBookings, setShowMyBookings] = useState(false);
  const [bookStart, setBookStart] = useState("09:00");
  const [bookEnd, setBookEnd] = useState("10:00");
  const [bookAssetId, setBookAssetId] = useState<number>(0);

  // Hover Popover & Click Slide drawer
  const [hoveredEvent, setHoveredEvent] = useState<CalendarEvent | null>(null);
  const [hoverPosition, setHoverPosition] = useState<{ x: number; y: number } | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);

  // Client Side Conflict Preview
  const [conflictPreview, setConflictPreview] = useState<ConflictPreview | null>(null);

  // Red Time Indicator offset percentage for Day view
  const [currentTimeOffset, setCurrentTimeOffset] = useState<number | null>(null);

  const weekDays = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => addDays(currentWeekStart, i));
  }, [currentWeekStart]);

  const loadData = async () => {
    setIsLoading(true);
    setErrorMsg("");
    try {
      const [resAssets, resMaintenance, resMy] = await Promise.all([
        fetch("/api/assets", { cache: "no-store" }),
        fetch("/api/maintenance-requests", { cache: "no-store" }),
        fetch("/api/bookings?myBookings=true", { cache: "no-store" }),
      ]);

      if (!resAssets.ok || !resMaintenance.ok || !resMy.ok) {
        throw new Error("Failed to load layout scheduling components.");
      }

      const dataAssets = await resAssets.json();
      const dataMaintenance = await resMaintenance.json();
      const dataMy = await resMy.json();

      const allAssets: Resource[] = dataAssets.assets || [];
      const bookableItems = allAssets.filter((a) => a.isBookable);

      // Fetch bookings for the week range
      const startStr = format(currentWeekStart, "yyyy-MM-dd'T'00:00:00'Z'");
      const endStr = format(addDays(currentWeekStart, 7), "yyyy-MM-dd'T'00:00:00'Z'");
      const resBookings = await fetch(`/api/bookings?startDate=${startStr}&endDate=${endStr}`, { cache: "no-store" });
      const dataBookings = await resBookings.json();
      const bookingsList: Booking[] = dataBookings.bookings || [];

      // Process raw events into unified model
      const calendarEvents: CalendarEvent[] = [];

      bookingsList.forEach((b) => {
        calendarEvents.push({
          id: `b-${b.id}`,
          type: "BOOKING",
          assetId: b.assetId,
          assetName: b.asset?.name || "Resource",
          assetTag: b.asset?.tag || "",
          title: b.asset?.name || "Resource",
          start: parseISO(b.startTime),
          end: parseISO(b.endTime),
          status: b.status,
          metadata: {
            bookedBy: b.bookedBy?.name || "User",
            role: b.bookedBy?.role || "EMPLOYEE",
          },
        });
      });

      // Filter active maintenance requests
      const maintenanceList: MaintenanceRequest[] = dataMaintenance.requests || [];
      maintenanceList
        .filter((r) => ["APPROVED", "TECHNICIAN_ASSIGNED", "IN_PROGRESS", "RESOLVED"].includes(r.status))
        .forEach((r) => {
          const start = parseISO(r.raisedAt);
          const end = r.resolvedAt ? parseISO(r.resolvedAt) : addDays(start, 1); // 1-day fallback for ongoing

          calendarEvents.push({
            id: `m-${r.id}`,
            type: "MAINTENANCE",
            assetId: r.assetId,
            assetName: r.asset?.name || "Resource",
            assetTag: r.asset?.tag || "",
            title: `Maintenance: ${r.asset?.name}`,
            start,
            end,
            status: r.status,
            metadata: {
              technicianName: r.technicianName || "Pending",
              issueDescription: r.issueDescription,
              priority: r.priority,
            },
          });
        });

      setEvents(calendarEvents);
      setMyBookings(dataMy.bookings || []);

      // Compute statistics per resource
      const processedResources = bookableItems.map((res) => {
        const resBookingsCount = calendarEvents.filter((ev) => ev.assetId === res.id && ev.type === "BOOKING").length;
        const underMaintenance = res.status === "UNDER_MAINTENANCE" || calendarEvents.some((ev) => ev.assetId === res.id && ev.type === "MAINTENANCE" && ev.status !== "RESOLVED");

        return {
          ...res,
          bookingCount: resBookingsCount,
          underMaintenance,
        };
      });

      setResources(processedResources);

      if (processedResources.length > 0 && selectedResourceId === null) {
        setSelectedResourceId(processedResources[0].id);
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to load scheduler resources.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [currentWeekStart]);

  // Update current time indicator position for today's timeline
  useEffect(() => {
    const updateTimeOffset = () => {
      const now = new Date();
      const currentHours = now.getHours();
      const currentMinutes = now.getMinutes();
      const totalMinutes = currentHours * 60 + currentMinutes;

      const businessStart = 8 * 60; // 08:00
      const businessEnd = 18 * 60;  // 18:00

      if (totalMinutes >= businessStart && totalMinutes <= businessEnd) {
        const offsetPercent = ((totalMinutes - businessStart) / (businessEnd - businessStart)) * 100;
        setCurrentTimeOffset(offsetPercent);
      } else {
        setCurrentTimeOffset(null);
      }
    };

    updateTimeOffset();
    const interval = setInterval(updateTimeOffset, 60000);
    return () => clearInterval(interval);
  }, []);

  const handlePrev = () => {
    if (view === "day") {
      setSelectedDayDate((prev) => addDays(prev, -1));
    } else {
      setCurrentWeekStart((prev) => addDays(prev, -7));
    }
    setConflictPreview(null);
  };

  const handleNext = () => {
    if (view === "day") {
      setSelectedDayDate((prev) => addDays(prev, 1));
    } else {
      setCurrentWeekStart((prev) => addDays(prev, 7));
    }
    setConflictPreview(null);
  };

  const handleToday = () => {
    const today = new Date();
    setSelectedDayDate(today);
    setCurrentWeekStart(startOfWeek(today, { weekStartsOn: 1 }));
    setConflictPreview(null);
  };

  // Create booking submit handler
  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookAssetId) return;

    setActionLoading(true);
    setErrorMsg("");
    setSuccessMsg("");
    setConflictPreview(null);

    const activeDateStr = view === "day" ? format(selectedDayDate, "yyyy-MM-dd") : format(weekDays[0], "yyyy-MM-dd");
    const startISO = new Date(`${activeDateStr}T${bookStart}:00`).toISOString();
    const endISO = new Date(`${activeDateStr}T${bookEnd}:00`).toISOString();

    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          assetId: bookAssetId,
          startTime: startISO,
          endTime: endISO,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        if (res.status === 409 && data.code === "BOOKING_CONFLICT") {
          // Display client side red dashed conflict box
          setConflictPreview({
            assetId: bookAssetId,
            startTime: new Date(startISO),
            endTime: new Date(endISO),
          });
        }
        throw new Error(data.error || "A conflict occurred.");
      }

      setSuccessMsg("Time slot reserved successfully!");
      setShowBookModal(false);
      await loadData();
    } catch (err: any) {
      setErrorMsg(err.message || "Operation failed.");
    } finally {
      setActionLoading(false);
    }
  };

  // Cancel booking submit handler
  const handleCancelBooking = async (bookingId: number) => {
    if (!window.confirm("Do you want to cancel this booking?")) return;

    setActionLoading(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const res = await fetch(`/api/bookings/${bookingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "CANCEL" }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to cancel booking.");

      setSuccessMsg("Booking has been cancelled.");
      setSelectedEvent(null);
      await loadData();
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to cancel booking.");
    } finally {
      setActionLoading(false);
    }
  };

  // Filter events by selected resource (Day View) or search text
  const displayedEvents = useMemo(() => {
    return events.filter((ev) => {
      if (filterType === "bookings" && ev.type !== "BOOKING") return false;
      if (filterType === "maintenance" && ev.type !== "MAINTENANCE") return false;
      if (view === "day" && selectedResourceId !== null && ev.assetId !== selectedResourceId) return false;
      return true;
    });
  }, [events, filterType, view, selectedResourceId]);

  const searchFilteredResources = useMemo(() => {
    return resources.filter(
      (res) =>
        res.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        res.tag.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [resources, searchQuery]);

  return (
    <div className="space-y-6">
      {/* Title & Stats */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b-2 border-ink pb-4 gap-4">
        <div>
          <h1 className="text-lg font-bold uppercase tracking-widest text-ink">Resource Planner</h1>
          <p className="text-xs text-ink3 mt-0.5">Interactive visual timeline scheduler</p>
        </div>

        <button
          onClick={() => setShowMyBookings(true)}
          className="af-btn-secondary px-3 py-1.5 text-xs font-bold gap-1.5 self-start md:self-auto"
        >
          <Sliders size={13} /> My Bookings ({myBookings.length})
        </button>
      </div>

      {/* Messages */}
      {errorMsg && (
        <div className="flex items-center gap-2 border-2 border-danger bg-danger_bg px-4 py-3 text-danger font-bold text-xs rounded-lg">
          <AlertOctagon size={14} className="shrink-0" />
          <span>{errorMsg}</span>
          <button onClick={() => setErrorMsg("")} className="ml-auto text-danger hover:opacity-80">
            <X size={14} />
          </button>
        </div>
      )}
      {successMsg && (
        <div className="flex items-center gap-2 border-2 border-go bg-go_bg px-4 py-3 text-go font-bold text-xs rounded-lg">
          <Check size={14} className="shrink-0" />
          <span>{successMsg}</span>
          <button onClick={() => setSuccessMsg("")} className="ml-auto text-go hover:opacity-80">
            <X size={14} />
          </button>
        </div>
      )}

      {/* Toolbar */}
      <CalendarToolbar
        view={view}
        setView={setView}
        currentWeekStart={currentWeekStart}
        setCurrentWeekStart={setCurrentWeekStart}
        selectedDayDate={selectedDayDate}
        setSelectedDayDate={setSelectedDayDate}
        onPrev={handlePrev}
        onNext={handleNext}
        onToday={handleToday}
        resources={resources}
        selectedResourceId={selectedResourceId}
        setSelectedResourceId={setSelectedResourceId}
        filterType={filterType}
        setFilterType={setFilterType}
        onRefresh={loadData}
        onNewBooking={() => {
          if (resources.length > 0) {
            setBookAssetId(selectedResourceId || resources[0].id);
            setShowBookModal(true);
          }
        }}
      />

      {/* Legend display */}
      <div className="flex flex-wrap gap-4 px-4 py-2 bg-canvas/30 border-x-2 border-b-2 border-ink text-[10px] font-bold uppercase tracking-wider text-ink3 justify-end rounded-b-lg select-none">
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 bg-signal border border-signal rounded-sm"></span> Booking</span>
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 bg-warn border border-warn rounded-sm"></span> Maintenance</span>
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 bg-danger_bg border border-dashed border-danger rounded-sm animate-pulse"></span> Conflict</span>
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 bg-canvas border border-ink/20 rounded-sm"></span> Available</span>
      </div>

      {isLoading ? (
        <div className="flex h-96 items-center justify-center border-2 border-ink bg-surface rounded-xl">
          <Loader2 className="h-8 w-8 animate-spin text-signal mr-2" />
          <span className="text-xs font-bold uppercase tracking-widest text-ink3">Loading layout canvas...</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
          {/* DAY VIEW LAYOUT */}
          {view === "day" && (
            <>
              {/* Left sidebar listing resources */}
              <div className="lg:col-span-1">
                <ResourceSidebar
                  resources={resources}
                  selectedId={selectedResourceId}
                  onSelect={(id) => {
                    setSelectedResourceId(id);
                    setConflictPreview(null);
                  }}
                  searchQuery={searchQuery}
                  setSearchQuery={setSearchQuery}
                />
              </div>

              {/* Central scheduling canvas */}
              <div className="lg:col-span-3 border-2 border-ink bg-surface p-5 rounded-xl space-y-4 shadow-sm">
                <div className="flex items-center justify-between border-b border-ink/10 pb-3">
                  <div>
                    <span className="text-[9px] font-bold uppercase tracking-widest text-ink3 block">
                      Daily Schedule Canvas
                    </span>
                    <h3 className="text-xs font-bold text-ink mt-0.5">
                      {selectedResourceId
                        ? resources.find((r) => r.id === selectedResourceId)?.name
                        : "All Resources Combined"}
                    </h3>
                  </div>
                </div>

                {displayedEvents.length === 0 && !conflictPreview ? (
                  <div className="flex flex-col items-center justify-center gap-3 py-36 text-center select-none">
                    <span className="text-3xl">📅</span>
                    <p className="text-xs font-bold text-ink3 uppercase">
                      No bookings for this resource today.
                    </p>
                    <button
                      onClick={() => {
                        if (resources.length > 0) {
                          setBookAssetId(selectedResourceId || resources[0].id);
                          setShowBookModal(true);
                        }
                      }}
                      className="af-btn-primary py-1 px-3 text-[10px] uppercase font-bold"
                    >
                      Create a booking
                    </button>
                  </div>
                ) : (
                  <DayView
                    selectedDayDate={selectedDayDate}
                    events={displayedEvents}
                    conflictPreview={conflictPreview}
                    onEventClick={setSelectedEvent}
                    setHoveredEvent={setHoveredEvent}
                    setHoverPosition={setHoverPosition}
                    currentTimeOffset={currentTimeOffset}
                  />
                )}
              </div>
            </>
          )}

          {/* WEEK VIEW LAYOUT */}
          {view === "week" && (
            <div className="lg:col-span-4 space-y-4">
              {displayedEvents.length === 0 && !conflictPreview ? (
                <div className="flex flex-col items-center justify-center gap-3 py-36 text-center select-none border-2 border-ink bg-surface rounded-xl">
                  <span className="text-3xl">📅</span>
                  <p className="text-xs font-bold text-ink3 uppercase">
                    No bookings scheduled for this week.
                  </p>
                  <button
                    onClick={() => {
                      if (resources.length > 0) {
                        setBookAssetId(selectedResourceId || resources[0].id);
                        setShowBookModal(true);
                      }
                    }}
                    className="af-btn-primary py-1 px-3 text-[10px] uppercase font-bold"
                  >
                    Create a booking
                  </button>
                </div>
              ) : (
                <WeekView
                  weekDays={weekDays}
                  resources={searchFilteredResources}
                  events={displayedEvents}
                  conflictPreview={conflictPreview}
                  onEventClick={setSelectedEvent}
                  setHoveredEvent={setHoveredEvent}
                  setHoverPosition={setHoverPosition}
                />
              )}
            </div>
          )}
        </div>
      )}

      {/* Slide drawers and form modals */}
      <MiniUpcomingBookingsDrawer
        isOpen={showMyBookings}
        onClose={() => setShowMyBookings(false)}
        bookings={myBookings}
        onCancel={handleCancelBooking}
      />

      <BookingDrawer
        event={selectedEvent}
        onClose={() => setSelectedEvent(null)}
        onCancel={handleCancelBooking}
      />

      {/* Book slot modal */}
      {showBookModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="border-2 border-ink bg-surface max-w-sm w-full p-6 space-y-4 rounded-xl shadow-2xl">
            <div className="flex justify-between items-center border-b border-ink/10 pb-3">
              <h3 className="text-xs font-bold uppercase tracking-widest text-ink flex items-center gap-1.5">
                <Bookmark className="text-signal" size={14} /> Reserve Slot
              </h3>
              <button
                onClick={() => {
                  setShowBookModal(false);
                  setConflictPreview(null);
                }}
                className="text-ink3 hover:text-ink transition"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleBookingSubmit} className="space-y-4">
              <div>
                <label className="block text-[9px] font-bold uppercase tracking-wider text-ink3 mb-1">
                  Resource
                </label>
                <select
                  value={bookAssetId}
                  onChange={(e) => setBookAssetId(Number(e.target.value))}
                  className="af-input text-xs w-full font-semibold"
                  required
                >
                  <option value="">-- Choose Resource --</option>
                  {resources.map((res) => (
                    <option key={res.id} value={res.id}>
                      {res.tag} – {res.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[9px] font-bold uppercase tracking-wider text-ink3 mb-1">
                  Date
                </label>
                <input
                  type="text"
                  disabled
                  value={format(view === "day" ? selectedDayDate : weekDays[0], "MMMM dd, yyyy")}
                  className="af-input w-full bg-canvas text-ink3 text-xs border-dashed"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[9px] font-bold uppercase tracking-wider text-ink3 mb-1.5">
                    Start
                  </label>
                  <select
                    value={bookStart}
                    onChange={(e) => setBookStart(e.target.value)}
                    className="af-input w-full text-xs font-mono"
                  >
                    {HOURS.slice(0, -1).map((h) => (
                      <option key={h} value={h}>
                        {h}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[9px] font-bold uppercase tracking-wider text-ink3 mb-1.5">
                    End
                  </label>
                  <select
                    value={bookEnd}
                    onChange={(e) => setBookEnd(e.target.value)}
                    className="af-input w-full text-xs font-mono"
                  >
                    {HOURS.slice(1).map((h) => (
                      <option key={h} value={h}>
                        {h}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2.5 pt-2.5 border-t border-ink/10">
                <button
                  type="button"
                  onClick={() => {
                    setShowBookModal(false);
                    setConflictPreview(null);
                  }}
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
                  Confirm
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Hover popover details */}
      {hoveredEvent && hoverPosition && (
        <div
          style={{
            position: "fixed",
            left: `${hoverPosition.x + 12}px`,
            top: `${hoverPosition.y + 12}px`,
            zIndex: 100,
          }}
          className="bg-ink text-white border border-white/10 rounded-lg p-3 shadow-xl max-w-xs space-y-2 pointer-events-none select-none text-xs"
        >
          <div className="flex items-center gap-1.5 border-b border-white/10 pb-1.5">
            {hoveredEvent.type === "BOOKING" ? (
              <Bookmark size={12} className="text-signal" />
            ) : (
              <Wrench size={12} className="text-warn" />
            )}
            <span className="font-bold uppercase tracking-wider text-[9px] text-gray-400">
              {hoveredEvent.type}
            </span>
          </div>

          <div>
            <h4 className="font-bold text-gray-100 leading-tight">{hoveredEvent.assetName}</h4>
            <span className="font-mono text-[9px] text-gray-400 block mt-0.5">{hoveredEvent.assetTag}</span>
          </div>

          <div className="space-y-0.5 text-[10px] text-gray-300">
            <p>
              <span className="text-gray-400">Schedule:</span>{" "}
              {format(hoveredEvent.start, "HH:mm")} – {format(hoveredEvent.end, "HH:mm")}
            </p>
            <p>
              <span className="text-gray-400">Duration:</span>{" "}
              {differenceInMinutes(hoveredEvent.end, hoveredEvent.start)} minutes
            </p>

            {hoveredEvent.type === "BOOKING" ? (
              <>
                <p>
                  <span className="text-gray-400">Booked By:</span> {hoveredEvent.metadata.bookedBy}
                </p>
                <p>
                  <span className="text-gray-400">Role:</span> {hoveredEvent.metadata.role}
                </p>
              </>
            ) : (
              <>
                <p>
                  <span className="text-gray-400">Tech:</span> {hoveredEvent.metadata.technicianName}
                </p>
                <p>
                  <span className="text-gray-400">Issue:</span> {hoveredEvent.metadata.issueDescription}
                </p>
                <p>
                  <span className="text-gray-400">Priority:</span> {hoveredEvent.metadata.priority}
                </p>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
