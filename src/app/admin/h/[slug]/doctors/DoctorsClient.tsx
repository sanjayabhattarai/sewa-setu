"use client";

import { useEffect, useState, useCallback } from "react";
import { Stethoscope, Search, BadgeCheck, Clock, RefreshCw, AlertCircle } from "lucide-react";
import Image from "next/image";

type Doctor = {
  id: string;
  fullName: string;
  gender: string | null;
  experienceYears: number | null;
  licenseNumber: string | null;
  verified: boolean;
  positionTitle: string | null;
  primarySpecialty: string | null;
  photoUrl: string | null;
  activeSlots: number;
  bookingCount: number;
  feeMin: number | null;
  feeMax: number | null;
  currency: string;
  consultationModes: unknown;
};

function formatMoney(cents: number, currency: string) {
  const sym = (currency ?? "EUR").toLowerCase() === "eur" ? "€" : currency.toUpperCase();
  return `${sym}${Math.round(cents / 100)}`;
}

export default function DoctorsClient({ slug }: { slug: string }) {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  const fetchDoctors = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/admin/h/${slug}/doctors`);
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      setDoctors(data.doctors);
    } catch {
      setError("Failed to load doctors.");
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => { fetchDoctors(); }, [fetchDoctors]);

  const filtered = search
    ? doctors.filter(
        (d) =>
          d.fullName.toLowerCase().includes(search.toLowerCase()) ||
          (d.primarySpecialty?.toLowerCase().includes(search.toLowerCase()) ?? false)
      )
    : doctors;

  const verified = doctors.filter((d) => d.verified).length;
  const withSlots = doctors.filter((d) => d.activeSlots > 0).length;

  return (
    <div className="space-y-5 max-w-5xl">

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-extrabold text-[#0f1e38]">Doctors</h1>
          <p className="text-sm text-gray-400 mt-0.5">
            {doctors.length} doctor{doctors.length !== 1 ? "s" : ""} · {verified} verified · {withSlots} with active slots
          </p>
        </div>
        <button
          onClick={fetchDoctors}
          className="flex items-center gap-2 px-3 h-9 rounded-xl text-xs font-semibold transition-all"
          style={{ background: "#fff", border: "1.5px solid rgba(15,30,56,.1)", color: "#6b7a96" }}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#c8a96e"; e.currentTarget.style.color = "#c8a96e"; }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = "rgba(15,30,56,.1)"; e.currentTarget.style.color = "#6b7a96"; }}
        >
          <RefreshCw size={13} /> Refresh
        </button>
      </div>

      {/* Search */}
      <div className="flex items-center gap-2 h-10 rounded-xl px-3 bg-white border border-gray-100 max-w-sm">
        <Search size={13} className="text-gray-400 flex-shrink-0" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name or specialty..."
          className="flex-1 text-sm outline-none bg-transparent text-[#0f1e38] placeholder-gray-400"
        />
      </div>

      {error && (
        <div className="p-3 rounded-xl text-sm font-semibold text-red-600 flex items-center gap-2"
          style={{ background: "#fef2f2", border: "1px solid rgba(220,38,38,.2)" }}>
          <AlertCircle size={14} /> {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-solid border-[#c8a96e] border-r-transparent" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-gray-100">
          <Stethoscope size={28} className="text-gray-200 mx-auto mb-3" />
          <p className="text-sm font-semibold text-gray-400">
            {search ? "No doctors match your search" : "No doctors found"}
          </p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((doc) => {
            const modes = Array.isArray(doc.consultationModes) ? doc.consultationModes as string[] : [];
            return (
              <div key={doc.id} className="bg-white rounded-2xl border border-gray-100 p-4 flex flex-col gap-3">
                <div className="flex items-start gap-3">
                  {/* Avatar */}
                  <div className="h-12 w-12 rounded-xl overflow-hidden flex-shrink-0 bg-gray-100 flex items-center justify-center">
                    {doc.photoUrl ? (
                      <Image
                        src={doc.photoUrl}
                        alt={doc.fullName}
                        width={48}
                        height={48}
                        className="object-cover w-full h-full"
                      />
                    ) : (
                      <Stethoscope size={18} className="text-gray-300" />
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="font-bold text-[#0f1e38] text-sm truncate">{doc.fullName}</p>
                      {doc.verified && <BadgeCheck size={14} className="text-[#c8a96e] flex-shrink-0" />}
                    </div>
                    {doc.primarySpecialty && (
                      <p className="text-xs text-gray-400 truncate">{doc.primarySpecialty}</p>
                    )}
                    {doc.positionTitle && (
                      <p className="text-[10px] text-gray-300 truncate">{doc.positionTitle}</p>
                    )}
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-2 pt-1 border-t border-gray-50">
                  <div className="text-center">
                    <p className="text-base font-extrabold text-[#0f1e38]">{doc.bookingCount}</p>
                    <p className="text-[10px] text-gray-400">bookings</p>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-0.5">
                      <Clock size={10} className={doc.activeSlots > 0 ? "text-emerald-500" : "text-gray-300"} />
                      <p className="text-base font-extrabold text-[#0f1e38]">{doc.activeSlots}</p>
                    </div>
                    <p className="text-[10px] text-gray-400">slots</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-bold text-[#0f1e38]">
                      {doc.feeMin != null ? formatMoney(doc.feeMin, doc.currency) : "—"}
                    </p>
                    <p className="text-[10px] text-gray-400">fee from</p>
                  </div>
                </div>

                {/* Modes */}
                {modes.length > 0 && (
                  <div className="flex gap-1.5 flex-wrap">
                    {modes.map((m: string) => (
                      <span key={m} className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                        style={{
                          background: m === "ONLINE" ? "rgba(200,169,110,.1)" : "rgba(16,185,129,.1)",
                          color: m === "ONLINE" ? "#a88b50" : "#059669",
                        }}>
                        {m === "ONLINE" ? "Online" : "In-Person"}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
