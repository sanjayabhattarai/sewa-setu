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
  const [selectedSlot, setSelectedSlot] = useState<ApiAvailabilitySlot | null>(null);
  const [showBooking, setShowBooking] = useState(false);

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

  // If a slot is selected and booking is confirmed, show booking form
  if (showBooking && selectedSlot) {
    return (
      <DoctorBookingForm
        doctor={doctor}
        slot={selectedSlot}
        onClose={() => {
          setShowBooking(false);
          setSelectedSlot(null);
          onClose();
        }}
        onBack={() => setShowBooking(false)}
      />
    );
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
                            const isSelected = selectedSlot?.id === slot.id;
                            return (
                              <button
                                key={slot.id}
                                onClick={() => setSelectedSlot(slot)}
                                className={`rounded-lg border-2 p-2 text-xs space-y-0.5 cursor-pointer hover:shadow-md transition-all w-full text-left ${
                                  isSelected
                                    ? isOnline
                                      ? "border-blue-500 bg-blue-100 ring-2 ring-blue-300"
                                      : "border-emerald-500 bg-emerald-100 ring-2 ring-emerald-300"
                                    : isOnline
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
                              </button>
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
          <Button 
            onClick={() => setShowBooking(true)} 
            size="sm" 
            className="rounded-full"
            disabled={!selectedSlot}
          >
            Book Appointment
          </Button>
        </div>
      </div>
    </div>
  );
}

function DoctorBookingForm({
  doctor,
  slot,
  onClose,
  onBack,
}: {
  doctor: ApiDoctor;
  slot: ApiAvailabilitySlot;
  onClose: () => void;
  onBack: () => void;
}) {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    patientName: "",
    patientAge: "",
    patientPhone: "",
    buyerEmail: "",
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Call checkout API adapted for doctor booking
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          doctorId: doctor.id,
          patientName: formData.patientName,
          patientAge: formData.patientAge,
          patientPhone: formData.patientPhone,
          buyerEmail: formData.buyerEmail,
          consultationMode: slot.mode,
          slotTime: `${slot.startTime}-${slot.endTime}`,
          bookingDate: new Date().toISOString(),
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
  };

  const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const dayName = DAYS[slot.dayOfWeek];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Confirm Booking</h2>
            <p className="text-sm text-slate-500 mt-1">
              Consultation with {doctor.fullName}
            </p>
          </div>
          <button onClick={onClose} className="rounded-full p-2 hover:bg-slate-100 transition-colors">
            <X className="h-5 w-5 text-slate-500" />
          </button>
        </div>

        {/* Booking Summary */}
        <div className="mb-6 rounded-xl bg-blue-50 p-4 border border-blue-100 space-y-2">
          <div className="flex justify-between items-start">
            <span className="text-slate-700 font-medium">Doctor</span>
            <span className="text-slate-900 font-semibold">{doctor.fullName}</span>
          </div>
          <div className="flex justify-between items-start">
            <span className="text-slate-700 font-medium">Mode</span>
            <span className="text-slate-900 font-semibold">{slot.mode === "ONLINE" ? "Online" : "Physical"}</span>
          </div>
          <div className="flex justify-between items-start">
            <span className="text-slate-700 font-medium">Time</span>
            <span className="text-slate-900 font-semibold">{dayName}, {slot.startTime}–{slot.endTime}</span>
          </div>
          <div className="h-px bg-blue-200 my-2" />
          <div className="flex justify-between items-center">
            <span className="text-blue-700 font-medium">Total to pay</span>
            <span className="text-2xl font-bold text-blue-700">${doctor.feeMin}</span>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Patient Name</label>
            <input 
              name="patientName" 
              required 
              placeholder="Full Name" 
              className="w-full h-10 rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-blue-500"
              onChange={handleInputChange} 
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Age</label>
              <input 
                name="patientAge" 
                required 
                type="number" 
                placeholder="30" 
                className="w-full h-10 rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-blue-500"
                onChange={handleInputChange}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Phone</label>
              <input 
                name="patientPhone" 
                required 
                placeholder="98XXXXXXXX" 
                className="w-full h-10 rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-blue-500"
                onChange={handleInputChange}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Your Email (For Receipt)</label>
            <input 
              name="buyerEmail" 
              required 
              type="email" 
              placeholder="you@example.com" 
              className="w-full h-10 rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-blue-500"
              onChange={handleInputChange}
            />
          </div>

          <div className="flex gap-3 mt-6">
            <Button 
              type="button"
              onClick={onBack}
              size="sm" 
              variant="outline" 
              className="flex-1 rounded-lg"
            >
              Back
            </Button>
            <Button 
              type="submit" 
              className="flex-1 h-10 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
              disabled={isLoading}
            >
              {isLoading ? "Processing..." : "Pay Securely"}
            </Button>
          </div>
          
          <p className="text-xs text-center text-slate-400">
            Payments are processed securely by Stripe.
          </p>
        </form>
      </div>
    </div>
  );
}
