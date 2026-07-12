"use client";

import { useState } from "react";
import { StatusChip } from "@/components/status-chip";
import { AssetTag } from "@/components/asset-tag";
import { Plus, CalendarDays, ChevronLeft, ChevronRight, Clock, X } from "lucide-react";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const HOURS = ["08:00", "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00", "18:00"];

type Booking = {
  id: number; tag: string; asset: string; bookedBy: string;
  date: string; start: string; end: string; status: string; purpose: string;
};

const initialBookings: Booking[] = [
  { id: 1, tag: "AF-0005", asset: "Projector EB-L510U",   bookedBy: "Priya Shah",   date: "Mon", start: "09:00", end: "11:00", status: "UPCOMING",  purpose: "Quarterly review" },
  { id: 2, tag: "AF-0010", asset: 'Sony Bravia 65" TV',   bookedBy: "Liam Patel",   date: "Mon", start: "14:00", end: "16:00", status: "UPCOMING",  purpose: "Client presentation" },
  { id: 3, tag: "AF-0007", asset: "Whiteboard 240x120",   bookedBy: "Mia Chen",     date: "Tue", start: "10:00", end: "12:00", status: "UPCOMING",  purpose: "Design workshop" },
  { id: 4, tag: "AF-0005", asset: "Projector EB-L510U",   bookedBy: "Ethan Brown",  date: "Wed", start: "09:00", end: "10:00", status: "CANCELLED", purpose: "Training (cancelled)" },
  { id: 5, tag: "AF-0010", asset: 'Sony Bravia 65" TV',   bookedBy: "Noah Williams",date: "Thu", start: "11:00", end: "13:00", status: "UPCOMING",  purpose: "All-hands meeting" },
  { id: 6, tag: "AF-0008", asset: "Toyota HiAce Van",     bookedBy: "Priya Shah",   date: "Fri", start: "08:00", end: "17:00", status: "UPCOMING",  purpose: "Site visit" },
];

const statusColor: Record<string, string> = {
  UPCOMING:  "bg-signal text-white",
  ONGOING:   "bg-go text-white",
  CANCELLED: "bg-ink3 text-white",
  COMPLETED: "bg-canvas text-ink3 border border-ink/20",
};

export default function BookingsPage() {
  const [view, setView] = useState<"grid" | "list">("grid");
  const [bookings] = useState(initialBookings);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b-2 border-ink pb-4">
        <div>
          <h1 className="text-lg font-bold uppercase tracking-widest text-ink">Resource Booking</h1>
          <p className="text-xs text-ink3 mt-0.5">Weekly schedule — {bookings.filter(b => b.status === "UPCOMING").length} upcoming</p>
        </div>
        <div className="flex items-center gap-2">
          {/* View toggle */}
          <div className="flex border-2 border-ink">
            <button
              onClick={() => setView("grid")}
              className={`px-3 py-1.5 text-[10px] font-bold uppercase transition-colors ${view === "grid" ? "bg-ink text-white" : "bg-surface text-ink hover:bg-canvas"}`}
            >
              Grid
            </button>
            <button
              onClick={() => setView("list")}
              className={`px-3 py-1.5 text-[10px] font-bold uppercase border-l-2 border-ink transition-colors ${view === "list" ? "bg-ink text-white" : "bg-surface text-ink hover:bg-canvas"}`}
            >
              List
            </button>
          </div>
          <button className="af-btn-primary gap-1.5">
            <Plus size={13} />
            New Booking
          </button>
        </div>
      </div>

      {view === "grid" ? (
        /* Weekly Grid View */
        <div className="border-2 border-ink bg-surface overflow-hidden">
          {/* Week nav */}
          <div className="flex items-center justify-between border-b-2 border-ink px-4 py-3 bg-canvas">
            <button className="flex items-center gap-1 text-[10px] font-bold uppercase text-ink2 hover:text-ink transition-colors">
              <ChevronLeft size={13} /> Prev
            </button>
            <p className="text-xs font-bold uppercase tracking-widest text-ink">Week of Dec 16–22, 2025</p>
            <button className="flex items-center gap-1 text-[10px] font-bold uppercase text-ink2 hover:text-ink transition-colors">
              Next <ChevronRight size={13} />
            </button>
          </div>

          {/* Grid */}
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px]">
              <thead>
                <tr className="bg-canvas">
                  <th className="af-th w-16 text-center">Time</th>
                  {DAYS.map((d) => <th key={d} className="af-th text-center">{d}</th>)}
                </tr>
              </thead>
              <tbody>
                {HOURS.map((hour) => (
                  <tr key={hour} className="border-b border-ink/10 hover:bg-canvas/50">
                    <td className="py-2 px-3 text-center font-mono text-[10px] text-ink3 border-r border-ink/10">{hour}</td>
                    {DAYS.map((day) => {
                      const booking = bookings.find(
                        (b) => b.date === day && b.start === hour
                      );
                      return (
                        <td key={day} className="py-1.5 px-2 border-r border-ink/10 min-w-[100px]">
                          {booking && (
                            <div className={`text-[9px] font-bold px-2 py-1.5 leading-tight ${statusColor[booking.status]}`}>
                              <p className="truncate">{booking.asset}</p>
                              <p className="font-normal opacity-80 truncate">{booking.start}–{booking.end}</p>
                              <p className="font-normal opacity-70 truncate">{booking.bookedBy}</p>
                            </div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* List View */
        <div className="border-2 border-ink bg-surface overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-canvas">
                  <th className="af-th">Asset</th>
                  <th className="af-th">Name</th>
                  <th className="af-th">Booked By</th>
                  <th className="af-th">Day</th>
                  <th className="af-th">Time</th>
                  <th className="af-th">Purpose</th>
                  <th className="af-th">Status</th>
                  <th className="af-th w-8"></th>
                </tr>
              </thead>
              <tbody>
                {bookings.map((b) => (
                  <tr key={b.id} className="hover:bg-canvas transition-colors">
                    <td className="af-td"><AssetTag tag={b.tag} /></td>
                    <td className="af-td font-medium text-ink">{b.asset}</td>
                    <td className="af-td text-ink2">{b.bookedBy}</td>
                    <td className="af-td">
                      <span className="border border-ink/30 bg-canvas px-2 py-0.5 text-[10px] font-bold uppercase">{b.date}</span>
                    </td>
                    <td className="af-td font-mono text-xs text-ink3">
                      <span className="flex items-center gap-1"><Clock size={10} />{b.start}–{b.end}</span>
                    </td>
                    <td className="af-td text-xs text-ink3 max-w-[160px] truncate">{b.purpose}</td>
                    <td className="af-td"><StatusChip status={b.status} size="sm" /></td>
                    <td className="af-td">
                      {b.status === "UPCOMING" && (
                        <button className="text-ink3 hover:text-danger transition-colors"><X size={13} /></button>
                      )}
                    </td>
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
