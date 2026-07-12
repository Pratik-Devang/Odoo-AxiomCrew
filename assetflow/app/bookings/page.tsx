"use client";

import { useState } from "react";
import { PageHeader } from "@/components/page-header";
import { SectionHeader } from "@/components/section-header";
import { StatusChip } from "@/components/status-chip";
import { AssetTag } from "@/components/asset-tag";
import { Calendar, Plus, AlertCircle, CheckCircle2 } from "lucide-react";

// Mock resources
const resources = [
  { id: "room-a", name: "Conference Room A (Floor 1)", type: "Room", tag: "AF-R01" },
  { id: "room-b", name: "Meeting Room B (Floor 2)", type: "Room", tag: "AF-R02" },
  { id: "van-1", name: "Toyota HiAce Van", type: "Vehicle", tag: "AF-V01" },
  { id: "projector-1", name: "Epson Projector EB-L510U", type: "Equipment", tag: "AF-E01" },
];

// Mock bookings for Conference Room A
const initialBookings = [
  { id: 1, resourceId: "room-a", title: "All-Hands Weekly", user: "Avery Admin", day: "Monday", time: "09:00 - 10:30", startHour: 9, duration: 1.5, status: "COMPLETED" },
  { id: 2, resourceId: "room-a", title: "Product Sync", user: "Priya Shah", day: "Wednesday", time: "11:00 - 12:30", startHour: 11, duration: 1.5, status: "ONGOING" },
  { id: 3, resourceId: "room-a", title: "Interview Panel", user: "Liam Patel", day: "Wednesday", time: "14:00 - 15:30", startHour: 14, duration: 1.5, status: "UPCOMING" },
  { id: 4, resourceId: "room-a", title: "Design Critique", user: "Noah Williams", day: "Friday", time: "15:00 - 16:30", startHour: 15, duration: 1.5, status: "UPCOMING" },
];

const weekDays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
const hours = [9, 10, 11, 12, 13, 14, 15, 16, 17];

export default function BookingsPage() {
  const [selectedResource, setSelectedResource] = useState(resources[0]);
  const [bookings, setBookings] = useState(initialBookings);
  
  // Form states
  const [title, setTitle] = useState("");
  const [day, setDay] = useState("Monday");
  const [startHour, setStartHour] = useState(9);
  const [duration, setDuration] = useState(1);
  const [purpose, setPurpose] = useState("");

  // Check for overlaps
  const checkOverlap = () => {
    if (!title) return { ok: true };
    const end = startHour + duration;
    
    // Find if any booking for same resource, same day, overlaps
    const conflicting = bookings.find(b => 
      b.resourceId === selectedResource.id && 
      b.day === day &&
      ((startHour >= b.startHour && startHour < (b.startHour + b.duration)) ||
       (end > b.startHour && end <= (b.startHour + b.duration)) ||
       (startHour <= b.startHour && end >= (b.startHour + b.duration)))
    );

    if (conflicting) {
      return { ok: false, msg: `✗ Overlaps with "${conflicting.title}" (${conflicting.time})` };
    }
    return { ok: true, msg: "✓ Available" };
  };

  const overlapResult = checkOverlap();

  const handleCreateBooking = (e: React.FormEvent) => {
    e.preventDefault();
    if (!overlapResult.ok || !title) return;

    const formattedTime = `${String(startHour).padStart(2, '0')}:00 - ${String(startHour + duration).padStart(2, '0')}:00`;
    const newBooking = {
      id: Date.now(),
      resourceId: selectedResource.id,
      title,
      user: "Avery Admin",
      day,
      time: formattedTime,
      startHour,
      duration,
      status: "UPCOMING",
    };

    setBookings([...bookings, newBooking]);
    setTitle("");
    setPurpose("");
  };

  const getBookingForSlot = (dayName: string, hour: number) => {
    return bookings.filter(b => 
      b.resourceId === selectedResource.id && 
      b.day === dayName && 
      hour >= b.startHour && 
      hour < (b.startHour + b.duration)
    );
  };

  return (
    <div>
      <PageHeader 
        title="Resource Booking" 
        action={
          <div className="flex items-center gap-2">
            <Calendar size={16} className="text-ink3" />
            <select 
              value={selectedResource.id}
              onChange={(e) => setSelectedResource(resources.find(r => r.id === e.target.value) || resources[0])}
              className="rounded-md border border-border bg-surface px-3 py-1.5 text-xs font-medium text-ink focus:outline-none"
            >
              {resources.map(r => (
                <option key={r.id} value={r.id}>{r.name}</option>
              ))}
            </select>
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Weekly Calendar Grid (Left 3 cols) */}
        <div className="lg:col-span-3 space-y-4">
          <div className="flex items-center justify-between">
            <SectionHeader title={`Schedule for ${selectedResource.name}`} className="mb-0" />
            <AssetTag tag={selectedResource.tag} />
          </div>

          <div className="af-card overflow-hidden">
            {/* Header row */}
            <div className="grid grid-cols-6 border-b border-border bg-gray_bg">
              <div className="px-4 py-3 text-xs font-semibold text-ink3 border-r border-border">Time</div>
              {weekDays.map(dayName => (
                <div key={dayName} className="px-4 py-3 text-xs font-semibold text-ink text-center border-r border-border last:border-r-0">
                  {dayName}
                </div>
              ))}
            </div>

            {/* Grid rows */}
            <div className="divide-y divide-border">
              {hours.map(hour => (
                <div key={hour} className="grid grid-cols-6 min-h-[70px]">
                  {/* Hour label */}
                  <div className="px-4 py-3 text-xs font-mono text-ink3 border-r border-border flex items-center">
                    {String(hour).padStart(2, '0')}:00
                  </div>

                  {/* Day columns */}
                  {weekDays.map(dayName => {
                    const cellBookings = getBookingForSlot(dayName, hour);
                    const isStart = cellBookings.some(b => b.startHour === hour);

                    return (
                      <div key={dayName} className="relative border-r border-border last:border-r-0 p-1 bg-surface group hover:bg-sunken/40 transition-colors">
                        {cellBookings.map(b => {
                          // Only display title/details at the start slot
                          if (b.startHour !== hour) return null;
                          const isConflicting = cellBookings.length > 1;

                          return (
                            <div 
                              key={b.id} 
                              className={`absolute inset-x-1 z-10 p-2 rounded text-xs select-none ${
                                isConflicting 
                                  ? "bg-danger/10 border border-danger/30 text-danger" 
                                  : "bg-signal/10 border border-signal/30 text-signal"
                              }`}
                              style={{ 
                                height: `calc(${b.duration} * 70px - 8px)`,
                                top: "4px" 
                              }}
                            >
                              <div className="font-semibold truncate">{b.title}</div>
                              <div className="text-[10px] opacity-80 truncate">{b.user}</div>
                              <div className="text-[10px] mt-1 font-mono">{b.time}</div>
                              <div className="mt-1">
                                <StatusChip status={b.status} size="sm" />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Booking Form (Right 1 col) */}
        <div>
          <div className="af-card p-5 sticky top-20">
            <SectionHeader title="New Booking" />
            <form onSubmit={handleCreateBooking} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-ink2 mb-1.5">Booking Title</label>
                <input 
                  type="text" 
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Scrum Sync"
                  required
                  className="af-input"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-ink2 mb-1.5">Day</label>
                <select 
                  value={day}
                  onChange={(e) => setDay(e.target.value)}
                  className="af-input"
                >
                  {weekDays.map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-ink2 mb-1.5">Start Time</label>
                  <select 
                    value={startHour}
                    onChange={(e) => setStartHour(Number(e.target.value))}
                    className="af-input"
                  >
                    {hours.map(h => (
                      <option key={h} value={h}>{String(h).padStart(2, '0')}:00</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-ink2 mb-1.5">Duration</label>
                  <select 
                    value={duration}
                    onChange={(e) => setDuration(Number(e.target.value))}
                    className="af-input"
                  >
                    <option value={1}>1 hour</option>
                    <option value={1.5}>1.5 hours</option>
                    <option value={2}>2 hours</option>
                    <option value={3}>3 hours</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-ink2 mb-1.5">Purpose / Notes</label>
                <textarea 
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                  placeholder="Details about booking..."
                  rows={2}
                  className="af-input"
                />
              </div>

              {/* Overlap Status Banner */}
              {title && (
                <div className={`p-3 rounded border text-xs flex items-center gap-2 ${
                  overlapResult.ok 
                    ? "bg-go_bg border-go/20 text-go" 
                    : "bg-danger_bg border-danger/20 text-danger"
                }`}>
                  {overlapResult.ok ? (
                    <CheckCircle2 size={14} className="shrink-0" />
                  ) : (
                    <AlertCircle size={14} className="shrink-0" />
                  )}
                  <span>{overlapResult.msg}</span>
                </div>
              )}

              <button 
                type="submit" 
                disabled={!overlapResult.ok || !title}
                className="w-full af-btn-primary"
              >
                <Plus size={14} />
                Reserve Slot
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
