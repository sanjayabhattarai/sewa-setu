"use client";

import { useState, useEffect } from "react";
import type { ApiHospitalDetails, ApiAvailabilitySlot, ApiDoctor } from "@/types/hospital";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { X, ChevronRight, ChevronLeft } from "lucide-react";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

type Step = "details" | "doctor" | "availability" | "review";

type Props = {
  hospital: ApiHospitalDetails;
  isOpen: boolean;
  onClose: () => void;
};

export function HospitalBookingModal({ hospital, isOpen, onClose }: Props) {
  const [step, setStep] = useState<Step>("details");
  const [formData, setFormData] = useState({
    patientName: "",
    patientAge: "",
    patientPhone: "",
    buyerEmail: "",
  });
  const [selectedDoctor, setSelectedDoctor] = useState<ApiDoctor | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<ApiAvailabilitySlot | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setStep("details");
      setFormData({
        patientName: "",
        patientAge: "",
        patientPhone: "",
        buyerEmail: "",
      });
      setSelectedDoctor(null);
      setSelectedSlot(null);
      setIsLoading(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleNextStep = () => {
    if (step === "details" && formData.patientName && formData.patientAge && formData.patientPhone && formData.buyerEmail) {
      setStep("doctor");
    } else if (step === "doctor" && selectedDoctor) {
      setStep("availability");
    } else if (step === "availability" && selectedSlot) {
      setStep("review");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          doctorId: selectedDoctor?.id,
          patientName: formData.patientName,
          patientAge: formData.patientAge,
          patientPhone: formData.patientPhone,
          buyerEmail: formData.buyerEmail,
          consultationMode: selectedSlot?.mode,
          slotTime: `${selectedSlot?.startTime}-${selectedSlot?.endTime}`,
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

  const doctorSlots = selectedDoctor
    ? hospital.availability.filter((s) => s.doctorId === selectedDoctor.id)
    : [];

  const byDay = new Map<number, ApiAvailabilitySlot[]>();
  for (const s of doctorSlots) {
    const arr = byDay.get(s.dayOfWeek) ?? [];
    arr.push(s);
    byDay.set(s.dayOfWeek, arr);
  }

  const allTimes = new Set<string>();
  for (const s of doctorSlots) {
    allTimes.add(s.startTime);
  }
  const sortedTimes = Array.from(allTimes).sort();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Book Appointment</h2>
            <p className="text-sm text-slate-500 mt-1">{hospital.name}</p>
          </div>
          <button onClick={onClose} className="rounded-full p-2 hover:bg-slate-100 transition-colors">
            <X className="h-5 w-5 text-slate-500" />
          </button>
        </div>

        {/* Step Indicator */}
        <div className="flex gap-2 mb-6">
          {["details", "doctor", "availability", "review"].map((s, i) => (
            <div
              key={s}
              className={`flex-1 h-2 rounded-full transition-colors ${
                step === s ? "bg-blue-600" : ["details", "doctor", "availability", "review"].indexOf(step) > i ? "bg-green-500" : "bg-slate-200"
              }`}
            />
          ))}
        </div>

        {/* Step 1: Patient Details */}
        {step === "details" && (
          <div className="space-y-4">
            <h3 className="font-semibold text-slate-900">Your Details</h3>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-slate-700">Full Name</label>
                <input
                  name="patientName"
                  value={formData.patientName}
                  onChange={handleInputChange}
                  placeholder="Your name"
                  className="w-full h-10 rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-blue-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium text-slate-700">Age</label>
                  <input
                    name="patientAge"
                    type="number"
                    value={formData.patientAge}
                    onChange={handleInputChange}
                    placeholder="30"
                    className="w-full h-10 rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700">Phone</label>
                  <input
                    name="patientPhone"
                    value={formData.patientPhone}
                    onChange={handleInputChange}
                    placeholder="98XXXXXXXX"
                    className="w-full h-10 rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-blue-500"
                  />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">Email</label>
                <input
                  name="buyerEmail"
                  type="email"
                  value={formData.buyerEmail}
                  onChange={handleInputChange}
                  placeholder="you@example.com"
                  className="w-full h-10 rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-blue-500"
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Doctor Selection */}
        {step === "doctor" && (
          <div className="space-y-4">
            <h3 className="font-semibold text-slate-900">Choose a Doctor</h3>
            <div className="space-y-2 max-h-[300px] overflow-y-auto">
              {hospital.doctors.map((doctor) => (
                <button
                  key={doctor.id}
                  onClick={() => setSelectedDoctor(doctor)}
                  className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                    selectedDoctor?.id === doctor.id
                      ? "border-blue-500 bg-blue-50"
                      : "border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-slate-900">{doctor.fullName}</p>
                      <p className="text-xs text-slate-600">
                        {doctor.specialties[0]?.name} • {doctor.experienceYears} yrs exp
                      </p>
                    </div>
                    <p className="font-semibold text-slate-900">${doctor.feeMin}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 3: Availability Selection */}
        {step === "availability" && selectedDoctor && (
          <div className="space-y-4">
            <h3 className="font-semibold text-slate-900">Select Time Slot</h3>
            {doctorSlots.length === 0 ? (
              <p className="text-slate-600">No available slots for this doctor.</p>
            ) : (
              <div className="overflow-x-auto">
                <div className="min-w-max">
                  {/* Day Headers */}
                  <div className="grid gap-1 mb-4" style={{ gridTemplateColumns: "100px repeat(7, 1fr)" }}>
                    <div className="px-3 py-2 text-xs font-semibold text-slate-600">Time</div>
                    {Array.from({ length: 7 }).map((_, i) => {
                      const dayHasSlots = byDay.get(i) && byDay.get(i)!.length > 0;
                      return (
                        <div
                          key={i}
                          className={`px-3 py-2 text-center rounded-t-lg text-xs font-semibold ${
                            dayHasSlots ? "bg-blue-50 text-blue-700" : "bg-slate-50 text-slate-600"
                          }`}
                        >
                          {DAYS[i]}
                        </div>
                      );
                    })}
                  </div>

                  {/* Slots */}
                  {sortedTimes.map((time) => (
                    <div key={time} className="grid gap-1 mb-2" style={{ gridTemplateColumns: "100px repeat(7, 1fr)" }}>
                      <div className="px-3 py-2 text-xs font-mono text-slate-600">{time}</div>
                      {Array.from({ length: 7 }).map((_, dayOfWeek) => {
                        const slotsAtTime = (byDay.get(dayOfWeek) ?? []).filter((s) => s.startTime === time);

                        if (slotsAtTime.length === 0) {
                          return (
                            <div key={`${dayOfWeek}-${time}`} className="px-2 py-2 bg-slate-50 rounded-lg" />
                          );
                        }

                        return (
                          <div key={`${dayOfWeek}-${time}`} className="px-2 py-2 space-y-1">
                            {slotsAtTime.map((slot) => (
                              <button
                                key={slot.id}
                                onClick={() => setSelectedSlot(slot)}
                                className={`w-full text-xs p-1.5 rounded-lg border-2 transition-all ${
                                  selectedSlot?.id === slot.id
                                    ? slot.mode === "ONLINE"
                                      ? "border-blue-500 bg-blue-100"
                                      : "border-emerald-500 bg-emerald-100"
                                    : slot.mode === "ONLINE"
                                      ? "border-blue-200 bg-blue-50 hover:bg-blue-100"
                                      : "border-emerald-200 bg-emerald-50 hover:bg-emerald-100"
                                }`}
                              >
                                <div className="font-semibold">{slot.startTime}–{slot.endTime}</div>
                                <div className="text-xs opacity-75">{slot.mode}</div>
                              </button>
                            ))}
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Step 4: Review & Pay */}
        {step === "review" && selectedDoctor && selectedSlot && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="rounded-xl bg-blue-50 p-4 border border-blue-100 space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-700">Doctor:</span>
                <span className="font-semibold text-slate-900">{selectedDoctor.fullName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-700">Mode:</span>
                <span className="font-semibold text-slate-900">{selectedSlot.mode}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-700">Time:</span>
                <span className="font-semibold text-slate-900">{DAYS[selectedSlot.dayOfWeek]}, {selectedSlot.startTime}–{selectedSlot.endTime}</span>
              </div>
              <div className="h-px bg-blue-200 my-2" />
              <div className="flex justify-between">
                <span className="text-blue-700 font-medium">Total to pay:</span>
                <span className="text-2xl font-bold text-blue-700">${selectedDoctor.feeMin}</span>
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                type="button"
                onClick={() => setStep("availability")}
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
          </form>
        )}

        {/* Navigation Buttons */}
        {(step === "details" || step === "doctor" || step === "availability") && (
          <div className="flex gap-3 mt-6">
            {step !== "details" && (
              <Button
                onClick={() => {
                  if (step === "doctor") setStep("details");
                  else if (step === "availability") setStep("doctor");
                }}
                variant="outline"
                className="flex-1 rounded-lg"
              >
                <ChevronLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
            )}
            {(step === "details" || step === "doctor" || step === "availability") && (
              <Button
                onClick={handleNextStep}
                disabled={
                  (step === "details" &&
                    (!formData.patientName ||
                      !formData.patientAge ||
                      !formData.patientPhone ||
                      !formData.buyerEmail)) ||
                  (step === "doctor" && !selectedDoctor) ||
                  (step === "availability" && !selectedSlot)
                }
                className="flex-1 rounded-lg"
              >
                Next
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
