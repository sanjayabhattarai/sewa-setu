"use client";

import { Phone } from "lucide-react";

type Props = {
  hospitalPhone: string;
  onBookAction: () => void;
};

export function HospitalCTA({ hospitalPhone, onBookAction }: Props) {
  return (
    <div className="bg-gradient-to-r from-[#0f1e38] to-[#1a3059] border-b border-[#0f1e38] px-6 sm:px-8 py-4 flex items-center justify-between gap-4 flex-wrap sm:flex-nowrap">
      <div className="flex items-center gap-2 text-white/80">
        <Phone className="h-5 w-5 text-[#c8a96e]" />
        <div>
          <p className="text-xs text-white/60">Call the hospital</p>
          <p className="font-semibold text-white">{hospitalPhone}</p>
        </div>
      </div>

      <div className="flex gap-2 w-full sm:w-auto">
        <a
          href={`tel:${hospitalPhone}`}
          className="flex-1 sm:flex-none px-6 py-2.5 bg-[#c8a96e] hover:bg-[#a88b50] text-[#0f1e38] font-semibold rounded-xl transition-colors shadow-md text-center"
        >
          Call Now
        </a>

        <button
          type="button"
          onClick={onBookAction}
          className="flex-1 sm:flex-none px-6 py-2.5 bg-white/10 hover:bg-white/20 text-white border border-white/30 font-semibold rounded-xl transition-colors shadow-md"
        >
          Book Appointment
        </button>
      </div>
    </div>
  );
}