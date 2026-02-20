"use client";

import { useEffect, useMemo, useState } from "react";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import type { ApiDoctor, ApiAvailabilitySlot } from "@/types/hospital";
import {
  buildRollingOccurrences,
  formatDate,
  type WindowSlot,
  type Occurrence,
} from "@/lib/availability";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

type Props = {
  doctor: ApiDoctor;
  slots: ApiAvailabilitySlot[]; // windows from DB
  isOpen: boolean;
  onClose: () => void;

  // Not doing booking yet, but keep hook for future:
  onBook?: (occ: Occurrence) => void;
  daysToShow?: 3 | 4 | 7;
};

export function AvailabilityModal({
  doctor,
  slots,
  isOpen,
  onClose,
  onBook,
  daysToShow = 7,
}: Props) {
  // ✅ hooks must be unconditional
  const [selectedOcc, setSelectedOcc] = useState<Occurrence | null>(null);
  const [pageStart, setPageStart] = useState<Date>(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  });

  // Reset selection when closing or switching doctor
  useEffect(() => {
    if (!isOpen) setSelectedOcc(null);
  }, [isOpen]);

  useEffect(() => {
    setSelectedOcc(null);
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    setPageStart(d);
  }, [doctor.id]);

  // Convert API slot -> WindowSlot for availability.ts
  const windowSlots: WindowSlot[] = useMemo(() => {
    return slots.map((s) => ({
      id: s.id,
      doctorId: s.doctorId,
      hospitalId: s.hospitalId ?? null,
      mode: s.mode,
      dayOfWeek: s.dayOfWeek,
      startTime: s.startTime,
      endTime: s.endTime,
      slotDurationMinutes: s.slotDurationMinutes,
      isActive: s.isActive,
    }));
  }, [slots]);

  // Build rolling occurrences for doctor
  const rolling = useMemo(() => {
    return buildRollingOccurrences(windowSlots, pageStart, daysToShow, doctor.id);
  }, [windowSlots, pageStart, daysToShow, doctor.id]);

  const dateKeys = useMemo(() => rolling.dates.map((d) => formatDate(d)), [rolling.dates]);

  const hasAny = useMemo(() => {
    return dateKeys.some((k) => (rolling.occurrencesByDate[k]?.length ?? 0) > 0);
  }, [dateKeys, rolling.occurrencesByDate]);

  const close = () => {
    setSelectedOcc(null);
    onClose();
  };

  const goPrev = () => setPageStart((d) => new Date(d.getTime() - daysToShow * 24 * 60 * 60 * 1000));
  const goNext = () => setPageStart((d) => new Date(d.getTime() + daysToShow * 24 * 60 * 60 * 1000));

  // ✅ render conditional AFTER hooks
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl border border-slate-200 max-w-5xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 p-6 sticky top-0 bg-white">
          <div>
            <h2 className="text-xl font-bold text-slate-900">{doctor.fullName}</h2>
            <p className="text-sm text-slate-600 mt-1">
              Availability (rolling {daysToShow} days)
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" className="rounded-full" onClick={goPrev}>
              <ChevronLeft className="h-4 w-4 mr-1" /> Prev
            </Button>
            <Button size="sm" variant="outline" className="rounded-full" onClick={goNext}>
              Next <ChevronRight className="h-4 w-4 ml-1" />
            </Button>

            <button
              onClick={close}
              className="h-10 w-10 rounded-full hover:bg-slate-100 flex items-center justify-center"
              aria-label="Close availability modal"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-6">
          {!hasAny ? (
            <div className="bg-slate-50 rounded-2xl border border-dashed border-slate-200 p-8 text-center text-slate-500">
              No availability scheduled in this range.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {rolling.dates.map((d) => {
                const key = formatDate(d);
                const occ = rolling.occurrencesByDate[key] ?? [];

                return (
                  <div key={key} className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
                    <div className="px-4 py-3 border-b border-slate-100 bg-slate-50">
                      <div className="flex items-center justify-between">
                        <div className="font-semibold text-slate-900">
                          {DAYS[d.getDay()]}{" "}
                          <span className="text-slate-500 font-normal">({key})</span>
                        </div>
                        <div className="text-xs text-slate-500">{occ.length} slot(s)</div>
                      </div>
                    </div>

                    <div className="p-3 space-y-2">
                      {occ.length === 0 ? (
                        <div className="text-sm text-slate-400 text-center py-6">—</div>
                      ) : (
                        occ.map((o) => {
                          const isSelected = selectedOcc?.date === o.date && selectedOcc?.startTime === o.startTime && selectedOcc?.mode === o.mode;
                          const isOnline = o.mode === "ONLINE";

                          return (
                            <button
                              key={`${o.date}-${o.startTime}-${o.mode}`}
                              onClick={() => setSelectedOcc(o)}
                              className={`w-full text-left rounded-xl border-2 p-3 transition-all ${
                                isSelected
                                  ? isOnline
                                    ? "border-blue-500 bg-blue-50"
                                    : "border-emerald-500 bg-emerald-50"
                                  : isOnline
                                  ? "border-blue-200 bg-white hover:bg-blue-50"
                                  : "border-emerald-200 bg-white hover:bg-emerald-50"
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <Badge
                                  className={
                                    isOnline
                                      ? "bg-blue-100 text-blue-700 hover:bg-blue-100"
                                      : "bg-emerald-100 text-emerald-700 hover:bg-emerald-100"
                                  }
                                >
                                  {isOnline ? "Online" : "Physical"}
                                </Badge>
                                <div className="text-sm font-semibold text-slate-900">
                                  {o.startTime}–{o.endTime}
                                </div>
                              </div>
                            </button>
                          );
                        })
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-slate-100 p-6 flex justify-end gap-2 sticky bottom-0 bg-white">
          <Button onClick={close} size="sm" variant="outline" className="rounded-full">
            Close
          </Button>

          <Button
            onClick={() => {
              if (selectedOcc && onBook) onBook(selectedOcc);
              close();
            }}
            size="sm"
            className="rounded-full"
            disabled={!selectedOcc}
            title={!selectedOcc ? "Select a time first" : "Continue"}
          >
            Select Slot
          </Button>
        </div>
      </div>
    </div>
  );
}