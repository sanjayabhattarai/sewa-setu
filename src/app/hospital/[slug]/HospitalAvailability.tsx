// src/app/hospital/[slug]/HospitalAvailability.tsx
"use client";

import { useMemo, useState } from "react";
import type { ApiHospitalDetails } from "@/types/hospital-details";
import type { ApiDoctor, ApiAvailabilitySlot } from "@/types/hospital";
import { DoctorCard } from "@/components/doctor-card";
import { Button } from "@/components/ui/button";

type Props = {
  hospital: ApiHospitalDetails;
};

export function HospitalAvailability({ hospital }: Props) {
  const [selectedDeptSlug, setSelectedDeptSlug] = useState<string | null>(null);

  const doctors = hospital.doctors as ApiDoctor[];
  const slots = hospital.availability as ApiAvailabilitySlot[];

  const deptDoctorIdsBySlug = useMemo(() => {
    const map = new Map<string, string[]>();
    for (const d of hospital.departments ?? []) {
      map.set(d.slug, (d.doctors ?? []).map((x) => x.doctorId));
    }
    return map;
  }, [hospital.departments]);

  const selectedDept = useMemo(() => {
    if (!selectedDeptSlug) return null;
    return (hospital.departments ?? []).find((d) => d.slug === selectedDeptSlug) ?? null;
  }, [hospital.departments, selectedDeptSlug]);

  const deptDoctors = useMemo(() => {
    if (!selectedDeptSlug) return [];
    const ids = new Set(deptDoctorIdsBySlug.get(selectedDeptSlug) ?? []);
    return doctors.filter((d) => ids.has(d.id));
  }, [doctors, selectedDeptSlug, deptDoctorIdsBySlug]);

  return (
    <div className="space-y-5">
      {/* Department selector */}
      <div className="bg-white rounded-2xl border border-slate-100 p-5">
        <h3 className="text-lg font-bold text-slate-900">Availability by Department</h3>
        <p className="mt-1 text-sm text-slate-600">
          Choose a department to view doctors and their available time slots.
        </p>

        <div className="mt-4 flex flex-wrap gap-2">
          {(hospital.departments ?? []).map((dep) => (
            <Button
              key={dep.id}
              variant={selectedDeptSlug === dep.slug ? "default" : "outline"}
              className="rounded-full"
              onClick={() => setSelectedDeptSlug(dep.slug)}
            >
              {dep.name}
            </Button>
          ))}

          {!hospital.departments?.length && (
            <div className="text-sm text-slate-500">No departments found.</div>
          )}
        </div>
      </div>

      {/* Results */}
      {!selectedDeptSlug ? (
        <div className="text-sm text-slate-500">
          Select a department to view doctors and their availability.
        </div>
      ) : deptDoctors.length === 0 ? (
        <div className="text-sm text-slate-500">
          No doctors found in{" "}
          <span className="font-semibold text-slate-900">{selectedDept?.name ?? "this department"}</span>.
        </div>
      ) : (
        <div className="space-y-3">
          <div className="text-sm text-slate-600">
            Department:{" "}
            <span className="font-semibold text-slate-900">{selectedDept?.name}</span>{" "}
            <span className="text-slate-400">({deptDoctors.length} doctors)</span>
          </div>

          <div className="grid gap-3">
            {deptDoctors.map((doc) => (
              <DoctorCard
                key={doc.id}
                doctor={doc}
                slots={slots}
                onSelectSlot={(occ) => {
                  console.log("Selected occurrence:", occ);
                }}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}