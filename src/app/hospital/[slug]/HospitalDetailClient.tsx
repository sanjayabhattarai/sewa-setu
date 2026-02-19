"use client";

import { useMemo, useState } from "react";
import type { ApiHospitalDetails } from "@/types/hospital-details";
import { HospitalCTA } from "./hospital-cta";
import { HospitalTabs } from "./HospitalTabs";
import { HospitalBookingModal } from "./hospital-booking-modal";

type UiPackage = {
  id: string;
  name: string;
  price: number;
  discount?: string;
  features: string[];
};

type Props = {
  hospital: ApiHospitalDetails;
  packages: UiPackage[];
};

export function HospitalDetailClient({ hospital, packages }: Props) {
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [preselectedDoctorId, setPreselectedDoctorId] = useState<string | null>(null);

  const openBooking = (doctorId?: string) => {
    setPreselectedDoctorId(doctorId ?? null);
    setIsBookingOpen(true);
  };

  const closeBooking = () => {
    setIsBookingOpen(false);
    setPreselectedDoctorId(null);
  };

  const preselectedDoctor = useMemo(() => {
    if (!preselectedDoctorId) return null;
    return hospital.doctors.find((d) => d.id === preselectedDoctorId) ?? null;
  }, [hospital.doctors, preselectedDoctorId]);

  return (
    <>
      {/* Quick Contact CTA */}
      {hospital.phone && (
        <HospitalCTA
          hospitalPhone={hospital.phone}
          onBook={() => openBooking()}
        />
      )}

      {/* Body */}
      <div className="p-6 sm:p-8" id="services-section">
        <HospitalTabs
          hospital={hospital}
          packages={packages}
          onBookDoctor={(doctorId) => openBooking(doctorId)}
        />
      </div>

      {/* ONE modal only */}
      <HospitalBookingModal
        hospital={hospital}
        isOpen={isBookingOpen}
        onClose={closeBooking}
        preselectedDoctor={preselectedDoctor}
      />
    </>
  );
}