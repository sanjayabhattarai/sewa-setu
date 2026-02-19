"use client";

import { Phone } from "lucide-react";

type Props = {
  hospitalPhone: string;
  onBook: () => void;
};

export function HospitalCTA({ hospitalPhone, onBook }: Props) {
  return (
    <div className="bg-gradient-to-r from-blue-50 to-sky-50 border-b border-blue-100 px-6 sm:px-8 py-4 flex items-center justify-between gap-4 flex-wrap sm:flex-nowrap">
      <div className="flex items-center gap-2 text-slate-700">
        <Phone className="h-5 w-5 text-blue-600" />
        <div>
          <p className="text-xs text-slate-600">Call the hospital</p>
          <p className="font-semibold text-slate-900">{hospitalPhone}</p>
        </div>
      </div>

      <div className="flex gap-2 w-full sm:w-auto">
        <a
          href={`tel:${hospitalPhone}`}
          className="flex-1 sm:flex-none px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors shadow-md text-center"
        >
          Call Now
        </a>

        <button
          type="button"
          onClick={onBook}
          className="flex-1 sm:flex-none px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl transition-colors shadow-md"
        >
          Book Appointment
        </button>
      </div>
    </div>
  );
}