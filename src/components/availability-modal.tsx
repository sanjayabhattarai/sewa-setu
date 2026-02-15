"use client";

import { useState } from "react";
import type { ApiAvailabilitySlot, ApiDoctor } from "@/types/hospital";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

type Props = {
  doctor: ApiDoctor;
  slots: ApiAvailabilitySlot[];
  isOpen: boolean;
  onClose: () => void;
};

export function AvailabilityModal({ doctor, slots, isOpen, onClose }: Props) {
  if (!isOpen) return null;

  // Get all unique time slots across all days
  const allTimes = new Set<string>();
  for (const s of slots) {
    allTimes.add(s.startTime);
  }
  const sortedTimes = Array.from(allTimes).sort();

  // Group slots by day of week
  const byDay = new Map<number, ApiAvailabilitySlot[]>();
  for (const s of slots) {
    const arr = byDay.get(s.dayOfWeek) ?? [];
    arr.push(s);
    byDay.set(s.dayOfWeek, arr);
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl border border-slate-200 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 p-6 sticky top-0 bg-white">
          <div>
            <h2 className="text-xl font-bold text-slate-900">{doctor.fullName}</h2>
            <p className="text-sm text-slate-600 mt-1">Weekly Availability Schedule</p>
          </div>
          <button
            onClick={onClose}
            className="h-10 w-10 rounded-full hover:bg-slate-100 flex items-center justify-center"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {slots.length === 0 ? (
            <div className="bg-slate-50 rounded-2xl border border-dashed border-slate-200 p-8 text-center text-slate-500">
              <p>No availability scheduled</p>
            </div>
          ) : (
            <div className="w-full overflow-x-auto">
              <div className="min-w-max">
                {/* Header: Days of week */}
                <div className="grid gap-1 mb-4" style={{ gridTemplateColumns: "100px repeat(7, 1fr)" }}>
                  <div className="px-3 py-3 text-xs font-semibold text-slate-600 uppercase">Time</div>
                  {Array.from({ length: 7 }).map((_, i) => {
                    const daySlots = byDay.get(i) ?? [];
                    const hasSlots = daySlots.length > 0;
                    return (
                      <div
                        key={i}
                        className={`px-3 py-3 text-center rounded-t-lg border-b-2 ${
                          hasSlots
                            ? "bg-blue-50 border-blue-200"
                            : "bg-slate-50 border-slate-200"
                        }`}
                      >
                        <div className="text-sm font-semibold text-slate-900">{DAYS[i]}</div>
                        <div className={`text-xs ${hasSlots ? "text-blue-600" : "text-slate-500"}`}>
                          {daySlots.length} slot{daySlots.length !== 1 ? "s" : ""}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Content: Time slots */}
                {sortedTimes.map((time) => (
                  <div key={time} className="grid gap-1 mb-2" style={{ gridTemplateColumns: "100px repeat(7, 1fr)" }}>
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
                            className="px-2 py-2 bg-slate-50 border border-slate-100 rounded-lg min-h-[70px] flex items-center justify-center text-xs text-slate-300"
                          >
                            —
                          </div>
                        );
                      }

                      return (
                        <div
                          key={`${dayOfWeek}-${time}`}
                          className="px-2 py-2 space-y-2 min-h-[70px]"
                        >
                          {slotsAtTime.map((slot) => {
                            const isOnline = slot.mode === "ONLINE";
                            return (
                              <div
                                key={slot.id}
                                className={`rounded-lg border-2 p-2 text-xs space-y-0.5 cursor-pointer hover:shadow-md transition-shadow ${
                                  isOnline
                                    ? "border-blue-200 bg-blue-50 hover:bg-blue-100"
                                    : "border-emerald-200 bg-emerald-50 hover:bg-emerald-100"
                                }`}
                              >
                                <Badge
                                  className={
                                    isOnline
                                      ? "bg-blue-100 text-blue-700 hover:bg-blue-100 text-xs py-0 px-1.5 h-5"
                                      : "bg-emerald-100 text-emerald-700 hover:bg-emerald-100 text-xs py-0 px-1.5 h-5"
                                  }
                                >
                                  {slot.mode === "ONLINE" ? "Online" : "Physical"}
                                </Badge>
                                <div className={`font-semibold text-xs ${isOnline ? "text-blue-900" : "text-emerald-900"}`}>
                                  {slot.startTime}–{slot.endTime}
                                </div>
                                <div className={`text-xs ${isOnline ? "text-blue-700" : "text-emerald-700"}`}>
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
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-slate-100 p-6 flex justify-end gap-2 sticky bottom-0 bg-white">
          <Button onClick={onClose} size="sm" variant="outline" className="rounded-full">
            Close
          </Button>
          <Button size="sm" className="rounded-full">
            Book Appointment
          </Button>
        </div>
      </div>
    </div>
  );
}
