// src/app/hospital/[slug]/HospitalAvailability.tsx
"use client";

import { useMemo, useState } from "react";
import type { ApiHospitalDetails } from "@/types/hospital-details";
import type { ApiDoctor, ApiAvailabilitySlot } from "@/types/hospital";
import { DoctorCard } from "@/components/doctor-card";
import { Button } from "@/components/ui/button";
import * as lucideReact from "lucide-react";

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
      <div className="bg-gradient-to-br from-[#0f1e38] to-[#1a3059] rounded-2xl border border-[#0f1e38] p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-3">
          <div className="h-10 w-10 rounded-xl bg-[#c8a96e]/20 border border-[#c8a96e]/30 flex items-center justify-center shadow-lg">
            <lucideReact.Calendar className="h-5 w-5 text-[#c8a96e]" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white">Availability by Department</h3>
            <p className="text-sm text-white/70">Choose a department to view available time slots</p>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          {(hospital.departments ?? []).map((dep) => (
            <Button
              key={dep.id}
              variant={selectedDeptSlug === dep.slug ? "default" : "outline"}
              className={selectedDeptSlug === dep.slug 
                ? "rounded-full bg-[#c8a96e] hover:bg-[#a88b50] text-[#0f1e38] font-semibold shadow-lg"
                : "rounded-full border-white/30 text-white hover:bg-white/10 hover:border-white/50"
              }
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
        <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center">
          <lucideReact.CalendarClock className="h-16 w-16 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-600 text-lg font-medium">Select a department to continue</p>
          <p className="text-slate-500 text-sm mt-2">View available time slots for specialist doctors</p>
        </div>
      ) : deptDoctors.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center">
          <lucideReact.UserX className="h-16 w-16 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-600 text-lg font-medium">No doctors available</p>
          <p className="text-slate-500 text-sm mt-2">
            in <span className="font-semibold">{selectedDept?.name ?? "this department"}</span>
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="bg-[#c8a96e]/15 border border-[#c8a96e]/25 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <lucideReact.Stethoscope className="h-5 w-5 text-[#c8a96e]" />
              <div>
                <p className="text-sm font-medium text-[#0f1e38]/70">
                  Department: <span className="font-bold text-[#0f1e38]">{selectedDept?.name}</span>
                </p>
                <p className="text-xs text-[#0f1e38]/60">
                  {deptDoctors.length} specialist {deptDoctors.length === 1 ? 'doctor' : 'doctors'} available
                </p>
              </div>
            </div>
          </div>

          <div className="grid gap-4">
            {deptDoctors.map((doc) => (
              <DoctorCard
                key={doc.id}
                doctor={doc}
                slots={slots}
                onSelectSlotAction={(occ) => {
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