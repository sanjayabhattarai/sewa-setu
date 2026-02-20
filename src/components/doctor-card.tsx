// src/components/doctor-card.tsx
"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { AvailabilityModal } from "@/components/availability-modal";
import { CheckCircle2, GraduationCap } from "lucide-react";
import type { ApiDoctor, ApiAvailabilitySlot } from "@/types/hospital";
import type { Occurrence } from "@/lib/availability";

type Props = {
  doctor: ApiDoctor;
  slots?: ApiAvailabilitySlot[];
  onSelectSlot?: (occ: Occurrence) => void;
};

/**
 * Remove council / registration noise.
 * Works for:
 * - Council Number: 10978
 * - Council No 390
 * - Nepal Medical Council: 1528
 * - NMC 12345
 * - Registration No: 12345
 */
function cleanEducation(raw?: string | null) {
  if (!raw) return null;

  let s = raw.replace(/\s+/g, " ").trim();
  if (!s) return null;

  s = s
    .replace(
      /\b(nepal\s*medical\s*council|medical\s*council|council|nmc|registration)\b\s*(number|no\.?)?\s*[:\-]?\s*\d+\b/gi,
      ""
    )
    .replace(/\b(nepal\s*medical\s*council|medical\s*council|council|nmc|registration)\b\s*(number|no\.?)?\b/gi, "")
    .replace(/\s{2,}/g, " ")
    .replace(/\s+,/g, ",")
    .replace(/,\s+/g, ", ")
    .replace(/[,\-|:]\s*(?=,|$)/g, "")
    .trim();

  if (!s || s.length < 2) return null;
  return s;
}

function withDrPrefix(name: string) {
  const n = (name ?? "").trim();
  if (!n) return "Dr.";
  if (/^(dr\.?|prof\.?|asst\.?|assoc\.?)\s/i.test(n)) return n;
  return `Dr. ${n}`;
}

/**
 * We store cents (Stripe-friendly) but we display whole euros only.
 * Since seed uses 500/600/.../1000, this becomes €5..€10.
 */
function formatFeeWholeEUR(amountCents?: number | null, currency?: string | null) {
  if (amountCents == null) return "—";

  const cur = (currency ?? "eur").toLowerCase();
  const symbol = cur === "eur" ? "€" : cur === "usd" ? "$" : `${cur.toUpperCase()} `;

  const whole = Math.round(amountCents / 100); // safe for 500..1000
  return `${symbol}${whole}`;
}

export function DoctorCard({ doctor, slots = [], onSelectSlot }: Props) {
  const [showAvailability, setShowAvailability] = useState(false);

  const doctorSlots = useMemo(() => {
    return slots.filter((s) => s.isActive && s.doctorId === doctor.id);
  }, [slots, doctor.id]);

  const primarySpecialty =
    doctor.specialties.find((s) => s.isPrimary)?.name ??
    doctor.specialties[0]?.name ??
    "Doctor";

  const hasExperience = doctor.experienceYears != null;

  const educationText = useMemo(() => {
    // Your API already uses `doctor.education` based on your schema.
    return cleanEducation((doctor as any).education ?? null);
  }, [doctor]);

  const feeText = formatFeeWholeEUR(doctor.feeMin ?? null, doctor.currency ?? "eur");

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all overflow-hidden">
      <div className="p-5 flex gap-4">
        {/* Photo */}
        <img
          src={doctor.image ?? "https://picsum.photos/seed/doctor/200/200"}
          alt={doctor.fullName}
          className="h-16 w-16 rounded-2xl object-cover border border-slate-100"
        />

        <div className="flex-1 min-w-0">
          {/* Top row */}
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              {/* Name */}
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-slate-900 truncate">
                  {withDrPrefix(doctor.fullName)}
                </h3>
                {doctor.verified && (
                  <span title="Verified">
                    <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />
                  </span>
                )}
              </div>

              {/* Specialty (+ experience only if present) */}
              <p className="text-sm text-slate-600 mt-1">
                {primarySpecialty}
                {hasExperience ? ` · ${doctor.experienceYears} yrs exp` : ""}
              </p>

              {/* Education */}
              {educationText && (
                <div className="mt-2 flex items-start gap-2 text-sm text-slate-500">
                  <GraduationCap className="h-4 w-4 mt-0.5 shrink-0 text-slate-400" />
                  <div className="min-w-0">
                    <span className="font-semibold text-slate-600">Education: </span>
                    <span className="text-slate-500">{educationText}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Fee */}
            <div className="text-right shrink-0">
              <p className="text-xs text-slate-500">Fee</p>
              <p className="font-semibold text-slate-900">{feeText}</p>
            </div>
          </div>

          {/* Action */}
          <div className="mt-4 flex justify-end">
            <Button
              onClick={() => setShowAvailability(true)}
              size="sm"
              variant="outline"
              className="rounded-full"
              disabled={doctorSlots.length === 0}
              title={doctorSlots.length === 0 ? "No availability available" : "Check Availability"}
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
        daysToShow={7}
        onBook={(occ) => {
          onSelectSlot?.(occ);
          setShowAvailability(false);
        }}
      />
    </div>
  );
}