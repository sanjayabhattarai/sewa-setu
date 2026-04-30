"use client";

import { useEffect, useState, useCallback } from "react";
import { Clock, RefreshCw, AlertCircle, ChevronDown, ChevronUp } from "lucide-react";

type Slot = {
  id: string;
  dayOfWeek: number;
  dayLabel: string;
  mode: string;
  startTime: string;
  endTime: string;
  slotDurationMinutes: number;
  isActive: boolean;
};

type DoctorGroup = {
  doctorId: string;
  doctorName: string;
  specialty: string | null;
  slots: Slot[];
};

export default function AvailabilityClient({ slug }: { slug: string }) {
  const [doctors, setDoctors] = useState<DoctorGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [toggling, setToggling] = useState<string | null>(null);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/admin/h/${slug}/availability`);
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      setDoctors(data.doctors);
    } catch {
      setError("Failed to load availability.");
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void fetchData();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [fetchData]);

  const handleToggle = async (slot: Slot) => {
    setToggling(slot.id);
    try {
      const res = await fetch(`/api/admin/h/${slug}/availability`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slotId: slot.id, isActive: !slot.isActive }),
      });
      if (!res.ok) throw new Error("Failed");
      // Optimistic update
      setDoctors((prev) =>
        prev.map((d) => ({
          ...d,
          slots: d.slots.map((s) =>
            s.id === slot.id ? { ...s, isActive: !s.isActive } : s
          ),
        }))
      );
    } catch {
      setError("Failed to update slot.");
    } finally {
      setToggling(null);
    }
  };

  const toggleCollapse = (doctorId: string) =>
    setCollapsed((prev) => ({ ...prev, [doctorId]: !prev[doctorId] }));

  const totalActive = doctors.reduce(
    (sum, d) => sum + d.slots.filter((s) => s.isActive).length,
    0
  );
  const totalSlots = doctors.reduce((sum, d) => sum + d.slots.length, 0);

  return (
    <div className="space-y-5 max-w-4xl">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-extrabold text-[#0f1e38]">Availability</h1>
          <p className="text-sm text-gray-400 mt-0.5">
            {totalActive} of {totalSlots} slots active across {doctors.length} doctors
          </p>
        </div>
        <button
          onClick={fetchData}
          className="flex items-center gap-2 px-3 h-9 rounded-xl text-xs font-semibold transition-all"
          style={{ background: "#fff", border: "1.5px solid rgba(15,30,56,.1)", color: "#6b7a96" }}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#c8a96e"; e.currentTarget.style.color = "#c8a96e"; }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = "rgba(15,30,56,.1)"; e.currentTarget.style.color = "#6b7a96"; }}
        >
          <RefreshCw size={13} /> Refresh
        </button>
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
      ) : doctors.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-gray-100">
          <Clock size={28} className="text-gray-200 mx-auto mb-3" />
          <p className="text-sm font-semibold text-gray-400">No availability slots configured</p>
        </div>
      ) : (
        <div className="space-y-3">
          {doctors.map((doc) => {
            const isOpen = !collapsed[doc.doctorId];
            const activeCount = doc.slots.filter((s) => s.isActive).length;

            return (
              <div key={doc.doctorId} className="bg-white rounded-2xl border border-gray-100 overflow-hidden">

                {/* Doctor header — clickable to expand/collapse */}
                <button
                  onClick={() => toggleCollapse(doc.doctorId)}
                  className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ background: "rgba(200,169,110,.12)" }}>
                      <Clock size={14} className="text-[#c8a96e]" />
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-bold text-[#0f1e38]">{doc.doctorName}</p>
                      {doc.specialty && (
                        <p className="text-xs text-gray-400">{doc.specialty}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-semibold px-2 py-1 rounded-full"
                      style={{
                        background: activeCount > 0 ? "rgba(16,185,129,.1)" : "rgba(156,163,175,.1)",
                        color: activeCount > 0 ? "#059669" : "#6b7280",
                      }}>
                      {activeCount}/{doc.slots.length} active
                    </span>
                    {isOpen ? <ChevronUp size={14} className="text-gray-400" /> : <ChevronDown size={14} className="text-gray-400" />}
                  </div>
                </button>

                {/* Slots grid */}
                {isOpen && (
                  <div className="px-4 pb-4 border-t border-gray-50">
                    <div className="grid gap-2 mt-3 sm:grid-cols-2">
                      {doc.slots.map((slot) => (
                        <div key={slot.id}
                          className="flex items-center justify-between p-3 rounded-xl"
                          style={{
                            background: slot.isActive ? "#f7f4ef" : "rgba(156,163,175,.06)",
                            border: `1.5px solid ${slot.isActive ? "rgba(200,169,110,.2)" : "rgba(156,163,175,.2)"}`,
                            opacity: slot.isActive ? 1 : 0.6,
                          }}>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="text-xs font-bold text-[#0f1e38]">{slot.dayLabel}</p>
                              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                                style={{
                                  background: slot.mode === "ONLINE" ? "rgba(200,169,110,.15)" : "rgba(16,185,129,.12)",
                                  color: slot.mode === "ONLINE" ? "#a88b50" : "#059669",
                                }}>
                                {slot.mode === "ONLINE" ? "Online" : "In-Person"}
                              </span>
                            </div>
                            <p className="text-xs text-gray-500 mt-0.5">
                              {slot.startTime} – {slot.endTime}
                              <span className="text-gray-400 ml-1">({slot.slotDurationMinutes}min slots)</span>
                            </p>
                          </div>
                          <button
                            onClick={() => handleToggle(slot)}
                            disabled={toggling === slot.id}
                            className="h-7 px-2.5 rounded-lg text-[10px] font-bold flex-shrink-0 transition-all disabled:opacity-50"
                            style={{
                              background: slot.isActive ? "rgba(239,68,68,.08)" : "rgba(16,185,129,.1)",
                              color: slot.isActive ? "#dc2626" : "#059669",
                              border: "none",
                            }}
                          >
                            {toggling === slot.id ? "..." : slot.isActive ? "Disable" : "Enable"}
                          </button>
                        </div>
                      ))}
                    </div>
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
