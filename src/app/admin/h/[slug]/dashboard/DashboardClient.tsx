"use client";

import { useEffect, useState, useCallback } from "react";
import {
  CalendarDays, Clock, CheckCircle2,
  Phone, User, Stethoscope, Package, RefreshCw,
  AlertCircle, ChevronRight, TrendingUp,
} from "lucide-react";

type Appointment = {
  id: string;
  status: string;
  scheduledAt: string;
  slotTime: string | null;
  mode: string;
  amountPaid: number | null;
  currency: string;
  notes: string | null;
  cancellationReason: string | null;
  checkedInAt: string | null;
  patient: { fullName: string; phone: string | null; gender: string | null; disability: string | null } | null;
  doctor:  { fullName: string } | null;
  package: { title: string }   | null;
};

type Stats = {
  today: { total: number; pending: number; completed: number; cancelled: number; revenue: number };
  month: { revenue: number };
  totalBookings: number;
  pendingConfirmations: number;
  todayAppointments: Appointment[];
};

const STATUS_CONFIG: Record<string, { label: string; bg: string; color: string; dot: string }> = {
  REQUESTED:  { label: "Pending",   bg: "rgba(245,158,11,.12)",  color: "#b45309", dot: "#f59e0b" },
  CONFIRMED:  { label: "Confirmed", bg: "rgba(59,130,246,.12)",  color: "#1d4ed8", dot: "#3b82f6" },
  COMPLETED:  { label: "Completed", bg: "rgba(16,185,129,.12)",  color: "#065f46", dot: "#10b981" },
  CANCELLED:  { label: "Cancelled", bg: "rgba(239,68,68,.1)",    color: "#991b1b", dot: "#ef4444" },
};

function formatSlotTime(t: string) {
  const start = t.split("-")[0].trim();
  const [h, m = 0] = start.split(":").map(Number);
  const ampm = h < 12 ? "AM" : "PM";
  const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${h12}:${String(m).padStart(2, "0")} ${ampm}`;
}

function formatMoney(cents: number, currency: string) {
  const sym = currency.toLowerCase() === "eur" ? "€" : currency.toUpperCase();
  return `${sym}${Math.round(cents / 100)}`;
}

function todayLabel() {
  return new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
}

export default function DashboardClient({ slug }: { slug: string }) {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [cancelTarget, setCancelTarget] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState("");
  const [error, setError] = useState("");

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/h/${slug}/stats`);
      if (!res.ok) throw new Error("Failed to load");
      setStats(await res.json());
    } catch {
      setError("Failed to load dashboard data.");
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void fetchStats();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [fetchStats]);

  const handleAction = async (bookingId: string, action: string, reason?: string) => {
    setActionLoading(bookingId + action);
    setError("");
    try {
      const res = await fetch(`/api/admin/h/${slug}/bookings`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId, action, reason }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Action failed"); return; }
      if (action === "CANCEL" && data.refundError) {
        setError(`Booking cancelled but refund failed: ${data.refundError}`);
      }
      setCancelTarget(null);
      setCancelReason("");
      await fetchStats(); // Refresh
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-solid border-[#c8a96e] border-r-transparent" />
    </div>
  );

  if (!stats) return (
    <div className="flex items-center justify-center h-64 gap-3 text-gray-400">
      <AlertCircle size={20} /> <span>{error || "No data available"}</span>
    </div>
  );

  const { today, month, pendingConfirmations, todayAppointments } = stats;

  // Sort: REQUESTED first, then CONFIRMED, then rest
  const sortedAppointments = [...todayAppointments].sort((a, b) => {
    const order: Record<string, number> = { REQUESTED: 0, CONFIRMED: 1, COMPLETED: 2, CANCELLED: 3 };
    return (order[a.status] ?? 9) - (order[b.status] ?? 9);
  });

  return (
    <div className="space-y-6 max-w-5xl">

      {/* Date header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-extrabold text-[#0f1e38]">Today&apos;s Operations</h1>
          <p className="text-sm text-gray-400 mt-0.5">{todayLabel()}</p>
        </div>
        <button
          onClick={fetchStats}
          className="flex items-center gap-2 px-3 h-9 rounded-xl text-xs font-semibold transition-all"
          style={{ background: "#fff", border: "1.5px solid rgba(15,30,56,.1)", color: "#6b7a96" }}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#c8a96e"; e.currentTarget.style.color = "#c8a96e"; }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = "rgba(15,30,56,.1)"; e.currentTarget.style.color = "#6b7a96"; }}
        >
          <RefreshCw size={13} /> Refresh
        </button>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Scheduled Today",  value: today.total,     icon: <CalendarDays size={18} className="text-[#c8a96e]" />, sub: "appointments" },
          { label: "Pending",          value: today.pending,   icon: <Clock size={18} className="text-amber-500" />,        sub: "need confirmation", alert: today.pending > 0 },
          { label: "Completed",        value: today.completed, icon: <CheckCircle2 size={18} className="text-emerald-500" />, sub: "seen today" },
          { label: "Today's Revenue",  value: formatMoney(today.revenue, "eur"), icon: <TrendingUp size={18} className="text-[#c8a96e]" />, sub: `€${Math.round(month.revenue / 100)} this month`, isText: true },
        ].map((card) => (
          <div key={card.label} className="bg-white rounded-2xl p-4 border"
            style={{ borderColor: card.alert ? "rgba(245,158,11,.3)" : "rgba(15,30,56,.07)", boxShadow: "0 1px 4px rgba(15,30,56,.04)" }}>
            <div className="flex items-start justify-between mb-3">
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">{card.label}</p>
              <div className="h-8 w-8 rounded-xl flex items-center justify-center"
                style={{ background: card.alert ? "rgba(245,158,11,.1)" : "#f7f4ef" }}>
                {card.icon}
              </div>
            </div>
            <p className="text-2xl font-extrabold text-[#0f1e38]">{card.value}</p>
            <p className="text-xs text-gray-400 mt-0.5">{card.sub}</p>
          </div>
        ))}
      </div>

      {/* Global pending banner */}
      {pendingConfirmations > 0 && (
        <div className="flex items-center justify-between p-4 rounded-2xl"
          style={{ background: "rgba(245,158,11,.08)", border: "1.5px solid rgba(245,158,11,.25)" }}>
          <div className="flex items-center gap-3">
            <Clock size={16} className="text-amber-500 flex-shrink-0" />
            <p className="text-sm font-semibold text-[#0f1e38]">
              {pendingConfirmations} booking{pendingConfirmations > 1 ? "s" : ""} waiting for confirmation
            </p>
          </div>
          <a href={`/admin/h/${slug}/bookings?status=requested`}
            className="flex items-center gap-1 text-xs font-bold text-amber-600 hover:text-amber-700">
            View all <ChevronRight size={13} />
          </a>
        </div>
      )}

      {error && (
        <div className="p-3 rounded-xl text-sm font-semibold text-red-600"
          style={{ background: "#fef2f2", border: "1px solid rgba(220,38,38,.2)" }}>
          {error}
        </div>
      )}

      {/* Appointment queue */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold text-[#0f1e38]">Appointment Queue</h2>
          <a href={`/admin/h/${slug}/bookings`}
            className="text-xs font-semibold text-[#c8a96e] hover:text-[#a88b50] flex items-center gap-1">
            View all bookings <ChevronRight size={12} />
          </a>
        </div>

        {sortedAppointments.length === 0 ? (
          <div className="bg-white rounded-2xl p-10 text-center border border-gray-100">
            <CalendarDays size={28} className="text-gray-200 mx-auto mb-3" />
            <p className="text-sm font-semibold text-gray-400">No appointments scheduled for today</p>
          </div>
        ) : (
          <div className="space-y-2">
            {sortedAppointments.map((appt) => {
              const st = STATUS_CONFIG[appt.status] ?? STATUS_CONFIG.CONFIRMED;
              const isActioning = actionLoading?.startsWith(appt.id);
              const isCancelTarget = cancelTarget === appt.id;

              return (
                <div key={appt.id} className="bg-white rounded-2xl border overflow-hidden"
                  style={{ borderColor: appt.status === "REQUESTED" ? "rgba(245,158,11,.3)" : "rgba(15,30,56,.07)" }}>

                  {/* Main row */}
                  <div className="flex items-center gap-4 p-4">
                    {/* Time */}
                    <div className="flex-shrink-0 text-center w-16">
                      <p className="text-base font-extrabold text-[#0f1e38] leading-tight">
                        {appt.slotTime ? formatSlotTime(appt.slotTime) : "—"}
                      </p>
                      <p className="text-[10px] font-semibold uppercase tracking-wider mt-0.5"
                        style={{ color: appt.mode === "ONLINE" ? "#c8a96e" : "#10b981" }}>
                        {appt.mode === "ONLINE" ? "Online" : "In-Person"}
                      </p>
                    </div>

                    {/* Divider */}
                    <div className="w-px h-10 bg-gray-100 flex-shrink-0" />

                    {/* Patient info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-bold text-[#0f1e38] text-sm truncate">
                          {appt.patient?.fullName ?? "Unknown Patient"}
                        </p>
                        {appt.patient?.disability && appt.patient.disability !== "none" && (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0"
                            style={{ background: "rgba(99,102,241,.1)", color: "#6366f1" }}>
                            {appt.patient.disability}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-0.5">
                        {appt.doctor && (
                          <span className="flex items-center gap-1 text-xs text-gray-400">
                            <Stethoscope size={10} /> {appt.doctor.fullName}
                          </span>
                        )}
                        {appt.package && (
                          <span className="flex items-center gap-1 text-xs text-gray-400">
                            <Package size={10} /> {appt.package.title}
                          </span>
                        )}
                        {appt.patient?.phone && (
                          <a href={`tel:${appt.patient.phone}`}
                            className="flex items-center gap-1 text-xs text-[#c8a96e] hover:text-[#a88b50]">
                            <Phone size={10} /> {appt.patient.phone}
                          </a>
                        )}
                      </div>
                      {appt.cancellationReason && (
                        <p className="text-xs text-red-500 mt-1">Reason: {appt.cancellationReason}</p>
                      )}
                    </div>

                    {/* Status + amount */}
                    <div className="flex-shrink-0 flex flex-col items-end gap-1.5">
                      <span className="flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full"
                        style={{ background: st.bg, color: st.color }}>
                        <span className="h-1.5 w-1.5 rounded-full flex-shrink-0" style={{ background: st.dot }} />
                        {st.label}
                      </span>
                      {appt.amountPaid != null && (
                        <p className="text-xs font-bold text-[#0f1e38]">
                          {formatMoney(appt.amountPaid, appt.currency)}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Action bar */}
                  {(appt.status === "REQUESTED" || appt.status === "CONFIRMED") && !isCancelTarget && (
                    <div className="flex items-center gap-2 px-4 pb-3">
                      {appt.status === "REQUESTED" && (
                        <button
                          onClick={() => handleAction(appt.id, "CONFIRM")}
                          disabled={!!isActioning}
                          className="flex-1 h-8 rounded-xl text-xs font-bold transition-all disabled:opacity-50"
                          style={{ background: "linear-gradient(135deg,#0f1e38,#1a3059)", color: "#c8a96e" }}
                        >
                          {isActioning ? "..." : "✓ Confirm"}
                        </button>
                      )}
                      {appt.status === "CONFIRMED" && (
                        <button
                          onClick={() => handleAction(appt.id, "CHECKIN")}
                          disabled={!!isActioning || !!appt.checkedInAt}
                          className="flex-1 h-8 rounded-xl text-xs font-bold transition-all disabled:opacity-50"
                          style={{ background: "rgba(16,185,129,.12)", color: "#065f46", border: "1px solid rgba(16,185,129,.3)" }}
                        >
                          <User size={11} className="inline mr-1" />
                          {appt.checkedInAt ? "Checked In" : "Check In"}
                        </button>
                      )}
                      {appt.status === "CONFIRMED" && (
                        <button
                          onClick={() => handleAction(appt.id, "COMPLETE")}
                          disabled={!!isActioning}
                          className="flex-1 h-8 rounded-xl text-xs font-bold transition-all disabled:opacity-50"
                          style={{ background: "rgba(16,185,129,.12)", color: "#065f46", border: "1px solid rgba(16,185,129,.3)" }}
                        >
                          {isActioning ? "..." : "✓ Complete"}
                        </button>
                      )}
                      <button
                        onClick={() => setCancelTarget(appt.id)}
                        className="h-8 px-3 rounded-xl text-xs font-bold transition-all"
                        style={{ background: "rgba(239,68,68,.08)", color: "#dc2626", border: "1px solid rgba(239,68,68,.2)" }}
                      >
                        Cancel
                      </button>
                    </div>
                  )}

                  {/* Cancel reason input */}
                  {isCancelTarget && (
                    <div className="px-4 pb-4 space-y-2">
                      <textarea
                        value={cancelReason}
                        onChange={(e) => setCancelReason(e.target.value)}
                        placeholder="Reason for cancellation (required)..."
                        rows={2}
                        className="w-full rounded-xl px-3 py-2 text-sm outline-none resize-none"
                        style={{ border: "1.5px solid rgba(239,68,68,.3)", background: "#fff9f9" }}
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleAction(appt.id, "CANCEL", cancelReason)}
                          disabled={!cancelReason.trim() || !!isActioning}
                          className="flex-1 h-8 rounded-xl text-xs font-bold disabled:opacity-50"
                          style={{ background: "#dc2626", color: "#fff" }}
                        >
                          {isActioning ? "..." : "Confirm Cancellation"}
                        </button>
                        <button
                          onClick={() => { setCancelTarget(null); setCancelReason(""); }}
                          className="h-8 px-4 rounded-xl text-xs font-semibold"
                          style={{ background: "#f7f4ef", color: "#6b7a96" }}
                        >
                          Back
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
