// src/components/availability-schedule.tsx
"use client";

import type { ApiAvailabilitySlot, ApiDoctor } from "@/types/hospital";
import { Badge } from "@/components/ui/badge";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const DAY_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

type Props = {
  slots: ApiAvailabilitySlot[];
  doctors: ApiDoctor[];
};

export function AvailabilitySchedule({ slots, doctors }: Props) {
  const doctorNameById = new Map(doctors.map((d) => [d.id, d.fullName]));

  // Group slots by day of week
  const byDay = new Map<number, ApiAvailabilitySlot[]>();
  for (const s of slots) {
    const arr = byDay.get(s.dayOfWeek) ?? [];
    arr.push(s);
    byDay.set(s.dayOfWeek, arr);
  }

  // Get all unique time slots across all days
  const allTimes = new Set<string>();
  for (const daySlots of byDay.values()) {
    for (const s of daySlots) {
      allTimes.add(s.startTime);
    }
  }
  const sortedTimes = Array.from(allTimes).sort();

  // Empty state
  if (slots.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-dashed border-slate-200 p-6 text-slate-500 text-center">
        No availability slots added yet.
      </div>
    );
  }

  // Render week view calendar
  return (
    <div className="w-full overflow-x-auto">
      <div className="min-w-max">
        {/* Header: Days of week */}
        <div className="grid gap-1 mb-4" style={{ gridTemplateColumns: "120px repeat(7, 1fr)" }}>
          <div className="px-3 py-3 text-xs font-semibold text-slate-600 uppercase">Time</div>
          {Array.from({ length: 7 }).map((_, i) => {
            const daySlots = byDay.get(i) ?? [];
            const hasSlots = daySlots.length > 0;
            return (
              <div
                key={i}
                className={`px-3 py-3 text-center rounded-t-xl border-b-2 ${
                  hasSlots
                    ? "bg-[#c8a96e]/15 border-[#c8a96e]/30"
                    : "bg-[#0f1e38]/5 border-[#0f1e38]/10"
                }`}
              >
                <div className="text-sm font-semibold text-slate-900">{DAY_SHORT[i]}</div>
                <div className={`text-xs ${hasSlots ? "text-[#a88b50]" : "text-[#0f1e38]/40"}`}>
                  {daySlots.length} slot{daySlots.length !== 1 ? "s" : ""}
                </div>
              </div>
            );
          })}
        </div>

        {/* Content: Time slots */}
        {sortedTimes.map((time) => (
          <div key={time} className="grid gap-1 mb-2" style={{ gridTemplateColumns: "120px repeat(7, 1fr)" }}>
            {/* Time label */}
            <div className="px-3 py-2 text-xs font-mono text-slate-600 flex items-start">
              {time}
            </div>

            {/* Day cells */}
            {Array.from({ length: 7 }).map((_, dayOfWeek) => {
              const daySlots = byDay.get(dayOfWeek) ?? [];
              const slotsAtTime = daySlots.filter((s) => s.startTime === time);

              if (slotsAtTime.length === 0) {
                return (
                  <div
                    key={`${dayOfWeek}-${time}`}
                    className="px-2 py-2 bg-slate-50 border border-slate-100 rounded-lg min-h-[80px] flex items-center justify-center text-xs text-slate-400"
                  >
                    —
                  </div>
                );
              }

              return (
                <div
                  key={`${dayOfWeek}-${time}`}
                  className="px-2 py-2 space-y-2 min-h-[80px]"
                >
                  {slotsAtTime.map((slot) => {
                    const isOnline = slot.mode === "ONLINE";
                    return (
                      <div
                        key={slot.id}
                        className={`rounded-lg border-2 p-2 text-xs space-y-1 ${
                          isOnline
                            ? "border-[#c8a96e]/30 bg-[#c8a96e]/10"
                            : "border-emerald-200 bg-emerald-50"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-1">
                          <Badge
                            className={
                              isOnline
                                ? "bg-[#c8a96e]/20 text-[#a88b50] hover:bg-[#c8a96e]/20 text-xs py-0 px-1.5"
                                : "bg-emerald-100 text-emerald-700 hover:bg-emerald-100 text-xs py-0 px-1.5"
                            }
                          >
                            {slot.mode === "ONLINE" ? "Online" : "Physical"}
                          </Badge>
                        </div>
                        <div className={`font-semibold ${isOnline ? "text-[#0f1e38]" : "text-emerald-900"}`}>
                          {slot.startTime}–{slot.endTime}
                        </div>
                        <div className={`text-xs ${isOnline ? "text-[#a88b50]" : "text-emerald-700"}`}>
                          {doctorNameById.get(slot.doctorId) ?? "Doctor"}
                        </div>
                        <div className={`text-xs ${isOnline ? "text-[#a88b50]/80" : "text-emerald-600"}`}>
                          {slot.slotDurationMinutes}m
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
  );
}