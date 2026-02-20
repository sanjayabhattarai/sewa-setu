"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
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
  const [isMounted, setIsMounted] = useState(false);
  const [selectedOcc, setSelectedOcc] = useState<Occurrence | null>(null);
  const [pageStart, setPageStart] = useState<Date>(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  });

  // Ensure we only render on client
  useEffect(() => {
    setIsMounted(true);
  }, []);

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

  // Handle Escape key to close modal
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        close();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

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
  if (!isOpen || !isMounted) return null;

  const modalContent = (
    <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 z-[9999]"
      onClick={(e) => {
        // Close when clicking the overlay (backdrop)
        if (e.target === e.currentTarget) close();
      }}
    >
      <div 
        className="bg-white rounded-2xl border border-slate-200 w-full max-w-7xl max-h-[95vh] flex flex-col shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header - Fixed, never scrolls */}
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-4 sm:px-6 sm:py-5 bg-gradient-to-r from-blue-50 to-indigo-50 flex-shrink-0">
          <div className="min-w-0 flex-1">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 truncate">{doctor.fullName}</h2>
            <p className="text-sm text-slate-600 mt-1">
              Select your preferred time slot ({daysToShow} days view)
            </p>
          </div>

          <div className="flex items-center gap-2 ml-4 flex-shrink-0">
            <Button size="sm" variant="outline" className="rounded-full text-xs sm:text-sm" onClick={goPrev}>
              <ChevronLeft className="h-4 w-4 mr-1" /> Prev
            </Button>
            <Button size="sm" variant="outline" className="rounded-full text-xs sm:text-sm" onClick={goNext}>
              Next <ChevronRight className="h-4 w-4 ml-1" />
            </Button>

            <button
              onClick={close}
              className="h-10 w-10 rounded-full bg-white hover:bg-red-50 border border-slate-200 hover:border-red-300 flex items-center justify-center transition-all ml-2 group flex-shrink-0"
              aria-label="Close availability modal"
              title="Close (Esc)"
            >
              <X className="h-5 w-5 text-slate-600 group-hover:text-red-600" />
            </button>
          </div>
        </div>

        {/* Body - Scrollable */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {!hasAny ? (
            <div className="bg-slate-50 rounded-2xl border border-dashed border-slate-200 p-12 text-center">
              <div className="text-slate-400 text-6xl mb-4">📅</div>
              <p className="text-slate-600 text-lg font-medium">No availability scheduled</p>
              <p className="text-slate-500 text-sm mt-2">Try selecting a different date range</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {rolling.dates.map((d) => {
                const key = formatDate(d);
                const occ = rolling.occurrencesByDate[key] ?? [];

                return (
                  <div key={key} className="rounded-2xl border-2 border-slate-200 bg-white overflow-hidden hover:border-blue-300 transition-colors">
                    <div className="px-4 py-3 border-b border-slate-200 bg-gradient-to-r from-slate-50 to-blue-50/30">
                      <div className="flex items-center justify-between">
                        <div className="font-bold text-slate-900">
                          {DAYS[d.getDay()]}
                        </div>
                        <div className="text-xs font-medium text-slate-500 bg-white px-2 py-1 rounded-full">
                          {key}
                        </div>
                      </div>
                      <div className="text-xs text-slate-600 mt-1">{occ.length} available slot{occ.length !== 1 ? 's' : ''}</div>
                    </div>

                    <div className="p-3 space-y-2 min-h-[100px]">
                      {occ.length === 0 ? (
                        <div className="text-sm text-slate-400 text-center py-6 flex flex-col items-center gap-2">
                          <span className="text-2xl">—</span>
                          <span>No slots</span>
                        </div>
                      ) : (
                        occ.map((o) => {
                          const isSelected = selectedOcc?.date === o.date && selectedOcc?.startTime === o.startTime && selectedOcc?.mode === o.mode;
                          const isOnline = o.mode === "ONLINE";

                          return (
                            <button
                              key={`${o.date}-${o.startTime}-${o.mode}`}
                              onClick={() => setSelectedOcc(o)}
                              className={`w-full text-left rounded-xl border-2 p-3 transition-all hover:shadow-md ${
                                isSelected
                                  ? isOnline
                                    ? "border-blue-500 bg-blue-50 shadow-lg shadow-blue-500/20"
                                    : "border-emerald-500 bg-emerald-50 shadow-lg shadow-emerald-500/20"
                                  : isOnline
                                  ? "border-blue-200 bg-white hover:bg-blue-50 hover:border-blue-400"
                                  : "border-emerald-200 bg-white hover:bg-emerald-50 hover:border-emerald-400"
                              }`}
                            >
                              <div className="flex items-center justify-between gap-2">
                                <Badge
                                  className={
                                    isOnline
                                      ? "bg-blue-100 text-blue-700 hover:bg-blue-100 border border-blue-300"
                                      : "bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border border-emerald-300"
                                  }
                                >
                                  {isOnline ? "🌐 Online" : "🏥 Physical"}
                                </Badge>
                                <div className="text-sm font-bold text-slate-900">
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

        {/* Footer - Fixed, never scrolls */}
        <div className="border-t border-slate-200 px-4 py-4 sm:px-6 sm:py-5 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-50 flex-shrink-0">
          <div className="text-sm text-slate-600">
            {selectedOcc ? (
              <div className="bg-white border border-blue-200 rounded-xl px-3 sm:px-4 py-2 text-center sm:text-left">
                <span className="font-semibold text-slate-900">Selected:</span>{" "}
                <span className="text-blue-600 font-bold">{selectedOcc.date}</span>{" "}
                <span className="hidden sm:inline">at</span>
                <br className="sm:hidden" />
                <span className="text-blue-600 font-bold">{selectedOcc.startTime}</span>
                {" "}({selectedOcc.mode === "ONLINE" ? "🌐 Online" : "🏥 Physical"})
              </div>
            ) : (
              <span className="text-slate-500 text-center sm:text-left block">Select a time slot to continue</span>
            )}
          </div>
          
          <div className="flex gap-2 flex-shrink-0">
            <Button 
              onClick={close} 
              size="sm" 
              variant="outline" 
              className="rounded-full flex-1 sm:flex-none"
            >
              Cancel
            </Button>

            <Button
              onClick={() => {
                if (selectedOcc && onBook) onBook(selectedOcc);
                close();
              }}
              size="sm"
              className="rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-semibold flex-1 sm:flex-none"
              disabled={!selectedOcc}
              title={!selectedOcc ? "Select a time first" : "Continue"}
            >
              {selectedOcc ? "Confirm Slot" : "Select Slot"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}