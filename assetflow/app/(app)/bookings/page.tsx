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
} from "lucide-react";
import { format, addDays, isToday, startOfWeek, parseISO, isSameDay } from "date-fns";

const HOURS = [
  "08:00", "09:00", "10:00", "11:00", "12:00",
  "13:00", "14:00", "15:00", "16:00", "17:00", "18:00"
];

interface Resource {
  id: number;
  tag: string;
  name: string;
  status: string;
  location: string;
  bookingCount: number;
  underMaintenance: boolean;
}

interface CalendarEvent {
  id: string;
  type: "BOOKING" | "MAINTENANCE";
  assetId: number;
  assetName: string;
  assetTag: string;
  title: string;
  start: string;
  end: string;
  color: string;
  status: string;
  topPercent: number;
  heightPercent: number;
  durationMinutes: number;
  metadata: {
    bookedBy?: string;
    bookedById?: number;
    role?: string;
    technicianName?: string;
    issueDescription?: string;
    raisedBy?: string;
    priority?: string;
  };
}

interface ConflictPreview {
  assetId: number;
  startTime: string;
  endTime: string;
}

export default function UnifiedCalendarPage() {
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(() => {
    return startOfWeek(new Date(), { weekStartsOn: 1 });
  });

  const [view, setView] = useState<"week" | "day">("week");
  const [filterType, setFilterType] = useState<"all" | "bookings" | "maintenance">("all");
  const [searchQuery, setSearchQuery] = useState("");

  const [resources, setResources] = useState<Resource[]>([]);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [selectedResourceId, setSelectedResourceId] = useState<number | null>(null);
  const [selectedDayDate, setSelectedDayDate] = useState<Date>(new Date());

  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Booking Create Form state
  const [showBookModal, setShowBookModal] = useState(false);
  const [bookStart, setBookStart] = useState("09:00");
  const [bookEnd, setBookEnd] = useState("10:00");
  const [bookAssetId, setBookAssetId] = useState<number>(0);
  const [actionLoading, setActionLoading] = useState(false);

  // Client Side Conflict Preview
  const [conflictPreview, setConflictPreview] = useState<ConflictPreview | null>(null);

  // Drawer / Popover Detail states
  const [hoveredEvent, setHoveredEvent] = useState<CalendarEvent | null>(null);
  const [hoverPosition, setHoverPosition] = useState<{ x: number; y: number } | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);

  // Red Time Indicator state for day view
  const [currentTimeOffset, setCurrentTimeOffset] = useState<number | null>(null);

  const weekDays = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => addDays(currentWeekStart, i));
  }, [currentWeekStart]);

  const loadCalendarData = async () => {
    setIsLoading(true);
    setErrorMsg("");
    const weekStartParam = format(currentWeekStart, "yyyy-MM-dd");
    try {
      const res = await fetch(`/api/calendar?weekStart=${weekStartParam}`, { cache: "no-store" });
      if (!res.ok) throw new Error("Failed to retrieve calendar model.");
      const data = await res.json();
      setResources(data.resources || []);
      setEvents(data.events || []);

      // Autofill first resource if none is selected
      if (data.resources?.length > 0 && selectedResourceId === null) {
        setSelectedResourceId(data.resources[0].id);
      }
    } catch (err: any) {
      setErrorMsg(err.message || "An error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCalendarData();
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

  const handlePrevWeek = () => {
    setCurrentWeekStart((prev) => addDays(prev, -7));
    setConflictPreview(null);
  };

  const handleNextWeek = () => {
    setCurrentWeekStart((prev) => addDays(prev, 7));
    setConflictPreview(null);
  };

  const handleToday = () => {
    const today = new Date();
    setCurrentWeekStart(startOfWeek(today, { weekStartsOn: 1 }));
    setSelectedDayDate(today);
    setConflictPreview(null);
  };

  // Filters & Searching
  const filteredResources = useMemo(() => {
    return resources.filter((res) => {
      const matchesSearch =
        res.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        res.tag.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesSearch;
    });
  }, [resources, searchQuery]);

  // Filtered Events depending on dropdown filter
  const displayedEvents = useMemo(() => {
    return events.filter((ev) => {
      if (filterType === "bookings" && ev.type !== "BOOKING") return false;
      if (filterType === "maintenance" && ev.type !== "MAINTENANCE") return false;
      return true;
    });
  }, [events, filterType]);

  // Create booking
  const handleCreateBooking = async (e: React.FormEvent) => {
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
            startTime: startISO,
            endTime: endISO,
          });
        }
        throw new Error(data.error || "A conflict occurred.");
      }

      setSuccessMsg("Booking scheduled successfully!");
      setShowBookModal(false);
      await loadCalendarData();
    } catch (err: any) {
      setErrorMsg(err.message || "Operation failed.");
    } finally {
      setActionLoading(false);
    }
  };

  // Cancel booking
  const handleCancelBooking = async (bookingIdStr: string) => {
    if (!window.confirm("Do you want to cancel this booking?")) return;
    const cleanId = bookingIdStr.replace("b-", "");

    setActionLoading(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const res = await fetch(`/api/bookings/${cleanId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "CANCEL" }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to cancel booking.");

      setSuccessMsg("Booking has been cancelled.");
      setSelectedEvent(null);
      await loadCalendarData();
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to cancel booking.");
    } finally {
      setActionLoading(false);
    }
  };

  // Render a specific hour segment label
  const renderedHours = useMemo(() => {
    return Array.from({ length: 11 }, (_, i) => {
      const h = i + 8;
      return h < 10 ? `0${h}:00` : `${h}:00`;
    });
  }, []);

  // Conflict positioning percentages helper
  const conflictLayout = useMemo(() => {
    if (!conflictPreview) return null;
    const start = new Date(conflictPreview.startTime);
    const end = new Date(conflictPreview.endTime);

    const businessStart = 8 * 60; // 08:00
    const businessEnd = 18 * 60;  // 18:00

    const rawStart = start.getHours() * 60 + start.getMinutes();
    const rawEnd = end.getHours() * 60 + end.getMinutes();

    const clampedStart = Math.max(businessStart, Math.min(businessEnd, rawStart));
    const clampedEnd = Math.max(businessStart, Math.min(businessEnd, rawEnd));

    const duration = clampedEnd - clampedStart;
    const top = ((clampedStart - businessStart) / (businessEnd - businessStart)) * 100;
    const height = (duration / (businessEnd - businessStart)) * 100;

    return { top, height };
  }, [conflictPreview]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header toolbar */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between border-b-2 border-ink pb-4 gap-4">
        <div>
          <h1 className="text-lg font-bold uppercase tracking-widest text-ink flex items-center gap-2">
            <Calendar className="text-signal" size={20} /> Scheduling Planner
          </h1>
          <p className="text-xs text-ink3 mt-0.5">
            Resource reservation and maintenance scheduling dashboard
          </p>
        </div>

        {/* Filters and Search toolbar */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-ink3" size={13} />
            <input
              type="text"
              placeholder="Search resource..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="af-input pl-8 py-1.5 text-xs w-48"
            />
          </div>

          <select
            value={filterType}
            onChange={(e: any) => setFilterType(e.target.value)}
            className="af-input py-1.5 text-xs font-semibold"
          >
            <option value="all">All Entries</option>
            <option value="bookings">Bookings Only</option>
            <option value="maintenance">Maintenance Only</option>
          </select>

          <div className="flex border-2 border-ink">
            <button
              onClick={() => {
                setView("week");
                setConflictPreview(null);
              }}
              className={`px-3 py-1.5 text-[10px] font-bold uppercase transition-colors ${
                view === "week" ? "bg-ink text-white" : "bg-surface text-ink hover:bg-canvas"
              }`}
            >
              Week View
            </button>
            <button
              onClick={() => {
                setView("day");
                setConflictPreview(null);
              }}
              className={`px-3 py-1.5 text-[10px] font-bold uppercase border-l-2 border-ink transition-colors ${
                view === "day" ? "bg-ink text-white" : "bg-surface text-ink hover:bg-canvas"
              }`}
            >
              Day View
            </button>
          </div>

          <button
            onClick={() => {
              if (resources.length > 0) {
                setBookAssetId(selectedResourceId || resources[0].id);
                setShowBookModal(true);
              }
            }}
            className="af-btn-primary py-1.5 text-xs gap-1.5"
          >
            <Plus size={13} /> Book Slot
          </button>
        </div>
      </div>

      {/* Message Notifications */}
      {errorMsg && (
        <div className="flex items-center gap-2 border-2 border-danger bg-danger_bg px-4 py-3 text-danger font-bold text-xs">
          <AlertOctagon size={14} className="shrink-0" />
          <span>{errorMsg}</span>
          <button onClick={() => setErrorMsg("")} className="ml-auto text-danger hover:opacity-85">
            <X size={14} />
          </button>
        </div>
      )}
      {successMsg && (
        <div className="flex items-center gap-2 border-2 border-go bg-go_bg px-4 py-3 text-go font-bold text-xs">
          <Check size={14} className="shrink-0" />
          <span>{successMsg}</span>
          <button onClick={() => setSuccessMsg("")} className="ml-auto text-go hover:opacity-85">
            <X size={14} />
          </button>
        </div>
      )}

      {/* Week selection slider controls */}
      <div className="flex items-center justify-between border-2 border-ink bg-canvas px-4 py-3 rounded-t-lg">
        <div className="flex gap-2">
          <button
            onClick={handlePrevWeek}
            className="flex items-center gap-1 border-2 border-ink px-3 py-1 text-[10px] font-bold uppercase text-ink hover:bg-sunken bg-surface transition-colors"
          >
            <ChevronLeft size={12} /> Prev Week
          </button>
          <button
            onClick={handleToday}
            className="border-2 border-ink px-3 py-1 text-[10px] font-bold uppercase text-ink hover:bg-sunken bg-surface transition-colors"
          >
            Today
          </button>
        </div>
        <p className="text-xs font-bold uppercase tracking-widest text-ink">
          {format(currentWeekStart, "dd MMM")} – {format(addDays(currentWeekStart, 6), "dd MMM yyyy")}
        </p>
        <button
          onClick={handleNextWeek}
          className="flex items-center gap-1 border-2 border-ink px-3 py-1 text-[10px] font-bold uppercase text-ink hover:bg-sunken bg-surface transition-colors"
        >
          Next Week <ChevronRight size={12} />
        </button>
      </div>

      {/* Legend display */}
      <div className="flex flex-wrap gap-4 px-4 py-2 bg-canvas/30 border-x-2 border-b-2 border-ink text-[10px] font-bold uppercase tracking-wider text-ink3 justify-end rounded-b-lg select-none">
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 bg-signal border border-signal rounded-sm"></span> Booking</span>
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 bg-warn border border-warn rounded-sm"></span> Maintenance</span>
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 bg-danger_bg border border-dashed border-danger rounded-sm animate-pulse"></span> Conflict preview</span>
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 bg-canvas border border-ink/20 rounded-sm"></span> Available</span>
      </div>

      {isLoading ? (
        <div className="flex h-96 items-center justify-center border-2 border-ink bg-surface rounded-lg">
          <Loader2 className="h-8 w-8 animate-spin text-signal mr-2" />
          <span className="text-xs font-bold uppercase tracking-widest text-ink3">Loading calendar grid...</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
          {/* ======================================================== */}
          {/* VIEW: WEEK VIEW (Odoo Planning style: Resources are rows, Days are columns) */}
          {/* ======================================================== */}
          {view === "week" && (
            <div className="lg:col-span-4 border-2 border-ink bg-surface rounded-lg overflow-x-auto">
              <table className="w-full min-w-[950px] border-collapse">
                <thead>
                  <tr className="bg-canvas border-b-2 border-ink text-center">
                    <th className="af-th w-48 text-left py-3.5 border-r border-ink/20">Resource</th>
                    {weekDays.map((day) => (
                      <th key={day.toISOString()} className="af-th py-3.5 border-r border-ink/10">
                        <span className="block text-[10px] text-ink3 uppercase font-medium">{format(day, "eee")}</span>
                        <span className="block text-sm font-bold text-ink mt-0.5">{format(day, "dd MMM")}</span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredResources.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-20 text-center text-xs font-bold text-ink3 italic">
                        No resources found matching search query.
                      </td>
                    </tr>
                  ) : (
                    filteredResources.map((res) => (
                      <tr key={res.id} className="border-b border-ink/15 hover:bg-canvas/10">
                        {/* Resource title sidebar cell */}
                        <td className="p-3 border-r border-ink/20 bg-canvas/30 align-middle">
                          <div className="space-y-1">
                            <span className="font-bold text-xs text-ink block leading-snug truncate">
                              {res.name}
                            </span>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <AssetTag tag={res.tag} />
                              {res.underMaintenance ? (
                                <span className="bg-warn_bg text-warn border border-warn/15 text-[8px] font-bold uppercase px-1 rounded flex items-center gap-0.5">
                                  <Wrench size={7} /> maint
                                </span>
                              ) : (
                                <span className="bg-go_bg text-go border border-go/15 text-[8px] font-bold uppercase px-1 rounded">
                                  active
                                </span>
                              )}
                            </div>
                            <span className="text-[9px] font-bold text-ink3 block font-mono">
                              Bookings this week: {res.bookingCount}
                            </span>
                          </div>
                        </td>

                        {/* Event cells for week days */}
                        {weekDays.map((day) => {
                          const cellEvents = displayedEvents.filter(
                            (ev) => ev.assetId === res.id && isSameDay(parseISO(ev.start), day)
                          );

                          // Check if conflict preview is active for this day and resource
                          const hasConflictPreview =
                            conflictPreview &&
                            conflictPreview.assetId === res.id &&
                            isSameDay(parseISO(conflictPreview.startTime), day);

                          return (
                            <td
                              key={day.toISOString()}
                              className="p-1 border-r border-ink/10 last:border-0 align-top min-w-[110px] relative bg-canvas/5 h-28"
                            >
                              <div className="w-full h-full relative border border-dashed border-ink/5 rounded p-0.5">
                                {cellEvents.map((ev) => (
                                  <div
                                    key={ev.id}
                                    style={{
                                      top: `${ev.topPercent}%`,
                                      height: `${ev.heightPercent}%`,
                                    }}
                                    onClick={() => setSelectedEvent(ev)}
                                    onMouseEnter={(e) => {
                                      setHoveredEvent(ev);
                                      setHoverPosition({ x: e.clientX, y: e.clientY });
                                    }}
                                    onMouseLeave={() => {
                                      setHoveredEvent(null);
                                      setHoverPosition(null);
                                    }}
                                    className={`absolute left-0.5 right-0.5 border rounded px-1.5 py-1 text-[8px] font-bold leading-tight cursor-pointer overflow-hidden shadow-sm flex flex-col justify-between transition-all hover:scale-[1.01] hover:brightness-95 select-none ${
                                      ev.type === "BOOKING"
                                        ? "bg-signal/15 border-signal text-signal"
                                        : "bg-warn_bg border-warn text-warn"
                                    }`}
                                  >
                                    <div className="truncate mb-0.5">{ev.title}</div>
                                    <div className="font-mono text-[7px] opacity-80 leading-none">
                                      {format(parseISO(ev.start), "HH:mm")}–{format(parseISO(ev.end), "HH:mm")}
                                    </div>
                                  </div>
                                ))}

                                {/* Visual dashed red conflict block */}
                                {hasConflictPreview && conflictLayout && (
                                  <div
                                    style={{
                                      top: `${conflictLayout.top}%`,
                                      height: `${conflictLayout.height}%`,
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
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* ======================================================== */}
          {/* VIEW: DAY VIEW (Google Calendar style: Resources are in sidebar, timeline for 1 day) */}
          {/* ======================================================== */}
          {view === "day" && (
            <>
              {/* Left sidebar: Resource listing */}
              <div className="lg:col-span-1 border-2 border-ink bg-surface rounded-lg p-4 space-y-4">
                <div className="border-b border-ink/10 pb-2">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-ink">Resources</h3>
                </div>

                <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
                  {filteredResources.length === 0 ? (
                    <p className="text-xs font-bold text-ink3 text-center py-6 italic">No items found</p>
                  ) : (
                    filteredResources.map((res) => {
                      const isSelected = selectedResourceId === res.id;
                      return (
                        <div
                          key={res.id}
                          onClick={() => {
                            setSelectedResourceId(res.id);
                            setConflictPreview(null);
                          }}
                          className={`border-2 p-3 bg-canvas relative cursor-pointer text-xs rounded transition-all ${
                            isSelected
                              ? "border-signal bg-signal/5"
                              : "border-ink hover:border-ink/75"
                          }`}
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <span className="font-bold text-ink block leading-snug truncate">
                                {res.name}
                              </span>
                              <div className="mt-1 flex items-center gap-1.5">
                                <AssetTag tag={res.tag} />
                                {res.underMaintenance && (
                                  <span className="bg-warn_bg text-warn text-[8px] font-bold uppercase px-1 rounded flex items-center gap-0.5 border border-warn/15">
                                    <Wrench size={7} /> maint
                                  </span>
                                )}
                              </div>
                            </div>

                            <span
                              className={`w-2.5 h-2.5 rounded-full border ${
                                res.underMaintenance
                                  ? "bg-warn border-warn/35"
                                  : res.status === "AVAILABLE"
                                  ? "bg-go border-go/35"
                                  : "bg-signal border-signal/35"
                              }`}
                              title={res.underMaintenance ? "Under Maintenance" : res.status}
                            ></span>
                          </div>
                          <span className="text-[9px] font-bold text-ink3 block mt-2 font-mono">
                            Bookings this week: {res.bookingCount}
                          </span>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Main Timeline Grid */}
              <div className="lg:col-span-3 border-2 border-ink bg-surface p-5 space-y-4 rounded-lg">
                <div className="flex items-center justify-between border-b border-ink/10 pb-3">
                  <div>
                    <span className="text-[9px] font-bold uppercase tracking-widest text-ink3 block">
                      Daily Schedule
                    </span>
                    <div className="flex items-center gap-2 mt-1">
                      <select
                        value={format(selectedDayDate, "yyyy-MM-dd")}
                        onChange={(e) => setSelectedDayDate(new Date(e.target.value))}
                        className="af-input text-xs font-bold font-mono py-1 px-2.5"
                      >
                        {weekDays.map((d) => (
                          <option key={d.toISOString()} value={format(d, "yyyy-MM-dd")}>
                            {format(d, "EEEE, dd MMM yyyy")}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  {selectedResourceId && (
                    <button
                      onClick={() => {
                        setBookAssetId(selectedResourceId);
                        setShowBookModal(true);
                      }}
                      className="af-btn-primary text-xs gap-1.5 px-4 py-2"
                    >
                      <Plus size={13} /> Book Slot
                    </button>
                  )}
                </div>

                {/* Vertical Timeline container */}
                {selectedResourceId ? (
                  <div className="flex gap-4">
                    {/* Hour values column */}
                    <div className="flex flex-col justify-between py-2 text-[10px] font-bold text-ink3 font-mono h-[550px] w-12 select-none">
                      {renderedHours.map((h) => (
                        <span key={h}>{h}</span>
                      ))}
                    </div>

                    {/* Timeline grid timeline */}
                    <div className="relative flex-1 border border-ink/20 bg-canvas h-[550px] rounded overflow-hidden select-none">
                      {/* Grid line marks */}
                      {renderedHours.map((h, idx) => {
                        const topPercent = (idx / (renderedHours.length - 1)) * 100;
                        return (
                          <div
                            key={h}
                            style={{ top: `${topPercent}%` }}
                            className="absolute left-0 right-0 border-t border-ink/10 pointer-events-none"
                          ></div>
                        );
                      })}

                      {/* Display events */}
                      {displayedEvents
                        .filter(
                          (ev) =>
                            ev.assetId === selectedResourceId &&
                            isSameDay(parseISO(ev.start), selectedDayDate)
                        )
                        .map((ev) => (
                          <div
                            key={ev.id}
                            style={{
                              top: `${ev.topPercent}%`,
                              height: `${ev.heightPercent}%`,
                            }}
                            onClick={() => setSelectedEvent(ev)}
                            onMouseEnter={(e) => {
                              setHoveredEvent(ev);
                              setHoverPosition({ x: e.clientX, y: e.clientY });
                            }}
                            onMouseLeave={() => {
                              setHoveredEvent(null);
                              setHoverPosition(null);
                            }}
                            className={`absolute left-[5%] right-[5%] border-2 rounded p-3 flex flex-col justify-between overflow-hidden shadow-md cursor-pointer transition-all hover:scale-[1.005] hover:brightness-95 hover:shadow-lg ${
                              ev.type === "BOOKING"
                                ? "bg-signal/15 border-signal text-signal"
                                : "bg-warn_bg border-warn text-warn"
                            }`}
                          >
                            <div className="flex items-start justify-between min-w-0">
                              <span className="font-bold text-xs truncate leading-tight">{ev.title}</span>
                              <span className="text-[8px] font-bold uppercase tracking-wider">
                                {ev.type}
                              </span>
                            </div>
                            <span className="font-mono text-[10px] mt-1 leading-none block">
                              {format(parseISO(ev.start), "HH:mm")} – {format(parseISO(ev.end), "HH:mm")}
                            </span>
                          </div>
                        ))}

                      {/* Conflict red dashed client block */}
                      {conflictPreview &&
                        conflictPreview.assetId === selectedResourceId &&
                        isSameDay(parseISO(conflictPreview.startTime), selectedDayDate) &&
                        conflictLayout && (
                          <div
                            style={{
                              top: `${conflictLayout.top}%`,
                              height: `${conflictLayout.height}%`,
                            }}
                            className="absolute left-[8%] right-[8%] border-2 border-dashed border-danger bg-danger_bg/30 text-danger rounded p-3 flex flex-col justify-center items-center text-center animate-pulse z-10"
                          >
                            <AlertTriangle size={16} className="mb-1" />
                            <span className="font-bold text-xs">Conflict - Slot unavailable</span>
                            <span className="text-[9px] mt-0.5 opacity-80 leading-none">
                              Requested {format(parseISO(conflictPreview.startTime), "HH:mm")} –{" "}
                              {format(parseISO(conflictPreview.endTime), "HH:mm")}
                            </span>
                          </div>
                        )}

                      {/* Today Google Calendar style line marker */}
                      {isToday(selectedDayDate) && currentTimeOffset !== null && (
                        <div
                          style={{ top: `${currentTimeOffset}%` }}
                          className="absolute left-0 right-0 flex items-center pointer-events-none z-20"
                        >
                          <div className="w-2.5 h-2.5 rounded-full bg-danger -ml-1"></div>
                          <div className="flex-1 border-t border-danger"></div>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="py-24 text-center text-xs font-bold text-ink3 uppercase">
                    Select a resource on the left to see details
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* DIALOG: CREATE BOOKING MODAL */}
      {/* ======================================================== */}
      {showBookModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="border-2 border-ink bg-surface max-w-sm w-full p-6 space-y-4 rounded-xl shadow-2xl">
            <div className="flex justify-between items-center border-b border-ink/10 pb-3">
              <h3 className="text-xs font-bold uppercase tracking-widest text-ink flex items-center gap-1.5">
                <Bookmark className="text-signal" size={14} /> Schedule Reservation
              </h3>
              <button
                onClick={() => {
                  setShowBookModal(false);
                  setConflictPreview(null);
                }}
                className="text-ink3 hover:text-ink transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreateBooking} className="space-y-4">
              <div>
                <label className="block text-[9px] font-bold uppercase tracking-wider text-ink3 mb-1">
                  Target Resource
                </label>
                <select
                  value={bookAssetId}
                  onChange={(e) => setBookAssetId(Number(e.target.value))}
                  className="af-input text-xs w-full font-semibold"
                  required
                >
                  <option value="">-- Select Resource --</option>
                  {resources.map((res) => (
                    <option key={res.id} value={res.id}>
                      {res.tag} – {res.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[9px] font-bold uppercase tracking-wider text-ink3 mb-1">
                  Scheduled Date
                </label>
                <input
                  type="text"
                  disabled
                  value={
                    view === "day"
                      ? format(selectedDayDate, "MMMM dd, yyyy")
                      : format(weekDays[0], "MMMM dd, yyyy")
                  }
                  className="af-input w-full bg-canvas text-ink3 text-xs border-dashed"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[9px] font-bold uppercase tracking-wider text-ink3 mb-1.5">
                    Start Time
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
                    End Time
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
                  Reserve
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* OVERLAY: HOVER POPOVER CARD */}
      {/* ======================================================== */}
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
              {format(parseISO(hoveredEvent.start), "HH:mm")} – {format(parseISO(hoveredEvent.end), "HH:mm")}
            </p>
            <p>
              <span className="text-gray-400">Duration:</span> {hoveredEvent.durationMinutes} minutes
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

      {/* ======================================================== */}
      {/* DRAWER: DETAILS SLIDE OUT PANEL (Drawer) */}
      {/* ======================================================== */}
      {selectedEvent && (
        <div className="fixed inset-0 z-40 flex justify-end bg-black/50">
          {/* Backdrop cancel click */}
          <div className="flex-1" onClick={() => setSelectedEvent(null)}></div>

          {/* Drawer container */}
          <div className="w-full max-w-sm bg-surface border-l-2 border-ink p-6 space-y-6 flex flex-col justify-between shadow-2xl h-full overflow-y-auto">
            <div className="space-y-6">
              {/* Header drawer */}
              <div className="flex justify-between items-center border-b border-ink/10 pb-3">
                <h3 className="text-sm font-bold uppercase tracking-widest text-ink flex items-center gap-1.5">
                  {selectedEvent.type === "BOOKING" ? (
                    <Bookmark size={15} className="text-signal" />
                  ) : (
                    <Wrench size={15} className="text-warn" />
                  )}
                  {selectedEvent.type === "BOOKING" ? "Booking Details" : "Maintenance Ticket"}
                </h3>
                <button
                  onClick={() => setSelectedEvent(null)}
                  className="text-ink3 hover:text-ink transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Resource specifications */}
              <div className="space-y-3.5 text-xs">
                <div>
                  <span className="text-ink3 block font-bold text-[9px] uppercase tracking-wider">
                    Resource Name
                  </span>
                  <span className="font-semibold text-ink text-sm block mt-0.5">
                    {selectedEvent.assetName}
                  </span>
                </div>

                <div>
                  <span className="text-ink3 block font-bold text-[9px] uppercase tracking-wider">
                    Asset Identifier
                  </span>
                  <div className="mt-1">
                    <AssetTag tag={selectedEvent.assetTag} />
                  </div>
                </div>

                <div>
                  <span className="text-ink3 block font-bold text-[9px] uppercase tracking-wider">
                    Time Window
                  </span>
                  <div className="flex items-center gap-1.5 font-semibold text-ink mt-0.5">
                    <Clock size={13} className="text-ink3" />
                    <span>
                      {format(parseISO(selectedEvent.start), "MMM dd, HH:mm")} –{" "}
                      {format(parseISO(selectedEvent.end), "HH:mm")}
                    </span>
                  </div>
                </div>

                <div>
                  <span className="text-ink3 block font-bold text-[9px] uppercase tracking-wider">
                    Total Duration
                  </span>
                  <span className="font-semibold text-ink block mt-0.5">
                    {selectedEvent.durationMinutes} minutes
                  </span>
                </div>

                {selectedEvent.type === "BOOKING" ? (
                  <>
                    <div className="border-t border-ink/10 pt-3">
                      <span className="text-ink3 block font-bold text-[9px] uppercase tracking-wider">
                        Reserved By
                      </span>
                      <span className="font-semibold text-ink block mt-0.5">
                        {selectedEvent.metadata.bookedBy}
                      </span>
                    </div>

                    <div>
                      <span className="text-ink3 block font-bold text-[9px] uppercase tracking-wider">
                        Department / Role
                      </span>
                      <span className="font-semibold text-ink block mt-0.5">
                        {selectedEvent.metadata.role}
                      </span>
                    </div>

                    <div>
                      <span className="text-ink3 block font-bold text-[9px] uppercase tracking-wider">
                        Status Code
                      </span>
                      <div className="mt-1">
                        <StatusChip status={selectedEvent.status} />
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="border-t border-ink/10 pt-3">
                      <span className="text-ink3 block font-bold text-[9px] uppercase tracking-wider">
                        Assigned Technician
                      </span>
                      <span className="font-semibold text-ink block mt-0.5">
                        {selectedEvent.metadata.technicianName}
                      </span>
                    </div>

                    <div>
                      <span className="text-ink3 block font-bold text-[9px] uppercase tracking-wider">
                        Issue Description
                      </span>
                      <p className="text-ink font-medium leading-relaxed bg-canvas p-2.5 rounded border border-ink/5 mt-0.5">
                        {selectedEvent.metadata.issueDescription}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="text-ink3 block font-bold text-[9px] uppercase tracking-wider">
                          Ticket Priority
                        </span>
                        <span className="font-bold text-ink block mt-0.5">
                          {selectedEvent.metadata.priority}
                        </span>
                      </div>
                      <div>
                        <span className="text-ink3 block font-bold text-[9px] uppercase tracking-wider">
                          Workflow Status
                        </span>
                        <div className="mt-1">
                          <StatusChip status={selectedEvent.status} />
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Cancel booking action block */}
            {selectedEvent.type === "BOOKING" && selectedEvent.status === "UPCOMING" && (
              <div className="border-t border-ink/10 pt-4 mt-6">
                <button
                  onClick={() => handleCancelBooking(selectedEvent.id)}
                  disabled={actionLoading}
                  className="w-full flex items-center justify-center gap-1.5 border-2 border-danger text-danger hover:bg-danger_bg/20 font-bold text-xs py-2.5 transition-colors"
                >
                  <Trash2 size={13} />
                  Cancel Reservation
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
