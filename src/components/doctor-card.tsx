"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AvailabilityModal } from "@/components/availability-modal";
import { CheckCircle2, Video, Hospital as HospitalIcon } from "lucide-react";
import type { ApiDoctor, ApiAvailabilitySlot } from "@/types/hospital";

type Props = {
  doctor: ApiDoctor;
  slots?: ApiAvailabilitySlot[];
};

export function DoctorCard({ doctor, slots = [] }: Props) {
  const [showAvailability, setShowAvailability] = useState(false);

  // Filter slots for this doctor
  const doctorSlots = slots.filter((s) => s.doctorId === doctor.id);
  const primary =
    doctor.specialties.find((s) => s.isPrimary) ?? doctor.specialties[0];

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all overflow-hidden">
      <div className="p-5 flex gap-4">
        <img
          src={doctor.image ?? "https://picsum.photos/seed/doctor-fallback/200/200"}
          alt={doctor.fullName}
          className="h-16 w-16 rounded-2xl object-cover border border-slate-100"
        />

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-slate-900 truncate">
                  {doctor.fullName}
                </h3>
                {doctor.verified && (
                  <span title="Verified">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                  </span>
                )}
              </div>

              <p className="text-sm text-slate-500 mt-0.5">
                {primary ? primary.name : "Doctor"} • {doctor.experienceYears} yrs exp
              </p>
            </div>

            <div className="text-right shrink-0">
              <p className="text-sm text-slate-500">Fee</p>
              <p className="font-semibold text-slate-900">
                {doctor.currency} {doctor.feeMin}–{doctor.feeMax}
              </p>
            </div>
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            {doctor.consultationModes.includes("PHYSICAL") && (
              <Badge className="bg-slate-100 text-slate-900 hover:bg-slate-100">
                <HospitalIcon className="h-3.5 w-3.5 mr-1" /> Physical
              </Badge>
            )}
            {doctor.consultationModes.includes("ONLINE") && (
              <Badge className="bg-blue-50 text-blue-700 hover:bg-blue-50">
                <Video className="h-3.5 w-3.5 mr-1" /> Online
              </Badge>
            )}

            {doctor.languages?.slice(0, 3).map((l) => (
              <Badge
                key={l}
                variant="secondary"
                className="bg-white border border-slate-200 text-slate-700"
              >
                {l}
              </Badge>
            ))}
          </div>

          {doctor.bio && (
            <p className="text-sm text-slate-600 mt-3 line-clamp-2">
              {doctor.bio}
            </p>
          )}

          <div className="mt-4 flex items-center justify-end gap-2">
            <Button 
              onClick={() => setShowAvailability(true)} 
              size="sm" 
              variant="outline" 
              className="rounded-full"
            >
              Check Availability
            </Button>
          </div>
        </div>
      </div>

      <AvailabilityModal
        doctor={doctor}
        slots={doctorSlots}
        isOpen={showAvailability}
        onClose={() => setShowAvailability(false)}
      />
    </div>
  );
}