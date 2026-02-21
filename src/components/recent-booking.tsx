"use client";

import { useEffect, useState } from "react";
import { Ticket, CheckCircle } from "lucide-react";

export function RecentBooking() {
  const [booking, setBooking] = useState<any>(null);

  useEffect(() => {
    const saved = localStorage.getItem("sewa_last_booking");
    if (saved) {
      setBooking(JSON.parse(saved));
    }
  }, []);

  if (!booking) return null;

  // REMOVED: All the "mt-24" and "mb-[-40px]" hacks.
  // ADDED: "py-6" to give it some breathing room inside its own section.
  return (
    <div className="w-full bg-[#c8a96e]/10 border-b border-[#c8a96e]/20 py-6">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-sm border border-[#c8a96e]/25 p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          
          <div className="flex items-center gap-4 w-full">
            <div className="h-10 w-10 rounded-full bg-[#c8a96e]/15 flex items-center justify-center shrink-0">
              <Ticket className="h-5 w-5 text-[#a88b50]" />
            </div>
            <div>
              <p className="text-xs font-bold text-[#a88b50] uppercase tracking-wide">Upcoming Appointment</p>
              <div className="flex flex-col sm:flex-row sm:items-center sm:gap-2">
                <h3 className="font-semibold text-slate-900">{booking.hospital}</h3>
                <span className="hidden sm:block text-slate-300">|</span>
                <span className="text-sm text-slate-500">{booking.package}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs font-medium text-green-700 bg-green-100 px-3 py-1 rounded-full whitespace-nowrap">
            <CheckCircle className="h-3 w-3" /> Payment Verified
          </div>
          
        </div>
      </div>
    </div>
  );
}