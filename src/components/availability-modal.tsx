"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import type { ApiDoctor, ApiAvailabilitySlot } from "@/types/hospital";
import {
  buildRollingOccurrences,
  formatDate,
  type WindowSlot,
  type Occurrence,
} from "@/lib/availability";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

type BookingStep = "slots" | "details";

type Props = {
  doctor: ApiDoctor;
  slots: ApiAvailabilitySlot[]; // windows from DB
  isOpen: boolean;
  onCloseAction: () => void;

  // Not doing booking yet, but keep hook for future:
  onBookAction?: (occ: Occurrence) => void;
  daysToShow?: 3 | 4 | 7;
};

export function AvailabilityModal({
  doctor,
  slots,
  isOpen,
  onCloseAction,
  onBookAction,
  daysToShow = 7,
}: Props) {
  // ✅ hooks must be unconditional
  const [isMounted, setIsMounted] = useState(false);
  const [selectedOcc, setSelectedOcc] = useState<Occurrence | null>(null);
  const [bookingStep, setBookingStep] = useState<BookingStep>("slots");
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    patientName: "",
    patientAge: "",
    patientPhone: "",
    buyerEmail: "",
  });
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
    setBookingStep("slots");
    setFormData({
      patientName: "",
      patientAge: "",
      patientPhone: "",
      buyerEmail: "",
    });
    onCloseAction();
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
        <div className="flex items-center justify-between border-b border-[#0f1e38] px-4 py-4 sm:px-6 sm:py-5 bg-gradient-to-r from-[#0f1e38] to-[#1a3059] flex-shrink-0">
          <div className="min-w-0 flex-1">
            <h2 className="text-xl sm:text-2xl font-bold text-white truncate">{doctor.fullName}</h2>
            <p className="text-sm text-white/70 mt-1">
              {bookingStep === "slots" 
                ? `Select your preferred time slot (${daysToShow} days view)`
                : "Enter your details to complete booking"
              }
            </p>
          </div>

          {bookingStep === "slots" && (
            <div className="flex items-center gap-2 ml-4 flex-shrink-0">
              <Button size="sm" variant="outline" className="rounded-full text-xs sm:text-sm" onClick={goPrev}>
                <ChevronLeft className="h-4 w-4 mr-1" /> Prev
              </Button>
              <Button size="sm" variant="outline" className="rounded-full text-xs sm:text-sm" onClick={goNext}>
                Next <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          )}

          <button
            onClick={close}
            className="h-10 w-10 rounded-full bg-white/10 hover:bg-red-500 border border-white/20 hover:border-red-400 flex items-center justify-center transition-all ml-2 group flex-shrink-0"
            aria-label="Close availability modal"
            title="Close (Esc)"
          >
            <X className="h-5 w-5 text-white/80 group-hover:text-white" />
          </button>
        </div>

        {/* Body - Scrollable */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {bookingStep === "details" && selectedOcc ? (
            <div className="max-w-2xl mx-auto space-y-6">
              {/* Selected Slot Summary */}
              <div className="rounded-xl bg-[#c8a96e]/10 p-4 border border-[#c8a96e]/20 space-y-2">
                <div className="flex justify-between">
                  <span className="text-[#0f1e38]/70">Doctor:</span>
                  <span className="font-semibold text-[#0f1e38]">{doctor.fullName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#0f1e38]/70">Mode:</span>
                  <span className="font-semibold text-[#0f1e38]">{selectedOcc.mode}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#0f1e38]/70">Date & Time:</span>
                  <span className="font-semibold text-[#0f1e38]">
                    {selectedOcc.date}, {selectedOcc.startTime}–{selectedOcc.endTime}
                  </span>
                </div>
                <div className="h-px bg-[#c8a96e]/30 my-2" />
                <div className="flex justify-between">
                  <span className="text-[#a88b50] font-medium">Consultation Fee:</span>
                  <span className="text-2xl font-bold text-[#a88b50]">
                    {doctor.feeMin != null ? `€${Math.round(doctor.feeMin / 100)}` : "—"}
                  </span>
                </div>
              </div>

              {/* Booking Form */}
              <div className="space-y-4">
                <h3 className="font-semibold text-slate-900">Your Details</h3>
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-slate-700">Full Name</label>
                    <Input
                      value={formData.patientName}
                      onChange={(e) => setFormData(prev => ({ ...prev, patientName: e.target.value }))}
                      placeholder="Your name"
                      required
                      className="mt-1"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-sm font-medium text-slate-700">Age</label>
                      <Input
                        type="number"
                        value={formData.patientAge}
                        onChange={(e) => setFormData(prev => ({ ...prev, patientAge: e.target.value }))}
                        placeholder="30"
                        required
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-slate-700">Phone</label>
                      <Input
                        value={formData.patientPhone}
                        onChange={(e) => setFormData(prev => ({ ...prev, patientPhone: e.target.value }))}
                        placeholder="98XXXXXXXX"
                        required
                        className="mt-1"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-700">Email</label>
                    <Input
                      type="email"
                      value={formData.buyerEmail}
                      onChange={(e) => setFormData(prev => ({ ...prev, buyerEmail: e.target.value }))}
                      placeholder="you@example.com"
                      required
                      className="mt-1"
                    />
                  </div>
                </div>
              </div>
            </div>
          ) : !hasAny ? (
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
                  <div key={key} className="rounded-2xl border-2 border-[#0f1e38]/10 bg-white overflow-hidden hover:border-[#c8a96e] transition-colors">
                    <div className="px-4 py-3 border-b border-[#0f1e38]/10 bg-gradient-to-r from-[#f7f4ef] to-[#c8a96e]/5">
                      <div className="flex items-center justify-between">
                        <div className="font-bold text-[#0f1e38]">
                          {DAYS[d.getDay()]}
                        </div>
                        <div className="text-xs font-medium text-[#0f1e38]/50 bg-white px-2 py-1 rounded-full">
                          {key}
                        </div>
                      </div>
                      <div className="text-xs text-[#0f1e38]/60 mt-1">{occ.length} available slot{occ.length !== 1 ? 's' : ''}</div>
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
                                    ? "border-[#c8a96e] bg-[#c8a96e]/10 shadow-lg shadow-[#c8a96e]/20"
                                    : "border-emerald-500 bg-emerald-50 shadow-lg shadow-emerald-500/20"
                                  : isOnline
                                  ? "border-[#c8a96e]/30 bg-white hover:bg-[#c8a96e]/10 hover:border-[#c8a96e]"
                                  : "border-emerald-200 bg-white hover:bg-emerald-50 hover:border-emerald-400"
                              }`}
                            >
                              <div className="flex items-center justify-between gap-2">
                                <Badge
                                  className={
                                    isOnline
                                      ? "bg-[#c8a96e]/20 text-[#a88b50] hover:bg-[#c8a96e]/20 border border-[#c8a96e]/40"
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
        <div className="border-t border-[#0f1e38]/10 px-4 py-4 sm:px-6 sm:py-5 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-[#f7f4ef] flex-shrink-0">
          {bookingStep === "slots" ? (
            <>
              <div className="text-sm text-[#0f1e38]/70">
                {selectedOcc ? (
                  <div className="bg-white border border-[#c8a96e]/30 rounded-xl px-3 sm:px-4 py-2 text-center sm:text-left">
                    <span className="font-semibold text-[#0f1e38]">Selected:</span>{" "}
                    <span className="text-[#a88b50] font-bold">{selectedOcc.date}</span>{" "}
                    <span className="hidden sm:inline">at</span>
                    <br className="sm:hidden" />
                    <span className="text-[#a88b50] font-bold">{selectedOcc.startTime}</span>
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
                    if (selectedOcc) {
                      setBookingStep("details");
                    }
                  }}
                  size="sm"
                  className="rounded-full bg-[#0f1e38] hover:bg-[#1a3059] text-[#c8a96e] font-semibold flex-1 sm:flex-none"
                  disabled={!selectedOcc}
                  title={!selectedOcc ? "Select a time first" : "Continue"}
                >
                  {selectedOcc ? "Continue" : "Select Slot"}
                </Button>
              </div>
            </>
          ) : (
            <div className="flex gap-2 w-full">
              <Button 
                type="button"
                onClick={() => setBookingStep("slots")} 
                size="sm" 
                variant="outline" 
                className="rounded-full flex-1 sm:flex-none"
              >
                Back
              </Button>

              <Button
                type="button"
                onClick={async () => {
                  if (!selectedOcc || !formData.patientName || !formData.patientAge || !formData.patientPhone || !formData.buyerEmail) return;
                  
                  // Find the slot from windowId
                  const slot = slots.find(s => s.id === selectedOcc.windowId);
                  if (!slot) {
                    alert("Slot not found.");
                    return;
                  }
                  
                  setIsLoading(true);
                  try {
                    const response = await fetch("/api/checkout", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        doctorId: doctor.id,
                        patientName: formData.patientName,
                        patientAge: formData.patientAge,
                        patientPhone: formData.patientPhone,
                        buyerEmail: formData.buyerEmail,
                        consultationMode: selectedOcc.mode,
                        slotId: slot.id,
                        slotTime: `${selectedOcc.startTime}-${selectedOcc.endTime}`,
                        bookingDate: new Date(selectedOcc.date).toISOString(),
                        hospitalId: slot.hospitalId,
                      }),
                    });

                    const data = await response.json();
                    
                    if (data.url) {
                      window.location.href = data.url;
                    } else {
                      alert("Booking failed to initialize.");
                      setIsLoading(false);
                    }
                  } catch (error) {
                    console.error(error);
                    alert("Something went wrong.");
                    setIsLoading(false);
                  }
                }}
                size="sm"
                className="rounded-full bg-[#0f1e38] hover:bg-[#1a3059] text-[#c8a96e] font-semibold flex-1 sm:flex-none"
                disabled={isLoading || !formData.patientName || !formData.patientAge || !formData.patientPhone || !formData.buyerEmail}
              >
                {isLoading ? "Processing..." : "Pay Securely"}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}