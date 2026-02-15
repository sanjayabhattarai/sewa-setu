// src/components/availability-schedule.tsx
"use client";

import type { ApiAvailabilitySlot, ApiDoctor } from "@/types/hospital";
import { Badge } from "@/components/ui/badge";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

type Props = {
  slots: ApiAvailabilitySlot[];
  doctors: ApiDoctor[];
};

export function AvailabilitySchedule({ slots, doctors }: Props) {
  const doctorNameById = new Map(doctors.map((d) => [d.id, d.fullName]));

  const byMode = {
    PHYSICAL: slots.filter((s) => s.mode === "PHYSICAL"),
    ONLINE: slots.filter((s) => s.mode === "ONLINE"),
  };

  const renderMode = (mode: "PHYSICAL" | "ONLINE") => {
    const modeSlots = byMode[mode];

    if (!modeSlots.length) {
      return (
        <div className="bg-white rounded-2xl border border-dashed border-slate-200 p-6 text-slate-500">
          No {mode.toLowerCase()} slots added yet.
        </div>
      );
    }

    // Group by day
    const byDay = new Map<number, ApiAvailabilitySlot[]>();
    for (const s of modeSlots) {
      const arr = byDay.get(s.dayOfWeek) ?? [];
      arr.push(s);
      byDay.set(s.dayOfWeek, arr);
    }

    return (
      <div className="space-y-3">
        {Array.from(byDay.entries())
          .sort((a, b) => a[0] - b[0])
          .map(([day, daySlots]) => (
            <div
              key={`${mode}-${day}`}
              className="bg-white rounded-2xl border border-slate-100 p-5"
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-slate-900">{DAYS[day] ?? `Day ${day}`}</h3>
                <Badge className={mode === "ONLINE" ? "bg-blue-50 text-blue-700 hover:bg-blue-50" : "bg-slate-100 text-slate-900 hover:bg-slate-100"}>
                  {mode}
                </Badge>
              </div>

              <div className="space-y-2">
                {daySlots
                  .sort((a, b) => a.startTime.localeCompare(b.startTime))
                  .map((s) => (
                    <div
                      key={s.id}
                      className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 rounded-xl border border-slate-100 p-3"
                    >
                      <div className="text-slate-900 font-medium">
                        {s.startTime} – {s.endTime}
                        <span className="text-slate-500 font-normal">
                          {" "}
                          • {s.slotDurationMinutes} min slots
                        </span>
                      </div>
                      <div className="text-sm text-slate-600">
                        {doctorNameById.get(s.doctorId) ?? "Doctor"}
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          ))}
      </div>
    );
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-lg font-bold text-slate-900 mb-3">Physical</h2>
        {renderMode("PHYSICAL")}
      </div>

      <div>
        <h2 className="text-lg font-bold text-slate-900 mb-3">Online</h2>
        {renderMode("ONLINE")}
      </div>
    </div>
  );
}