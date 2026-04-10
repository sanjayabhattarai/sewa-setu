"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import {
  CalendarDays, Search, ChevronLeft, ChevronRight,
  Stethoscope, Package, Phone, User, AlertCircle,
  Filter, RefreshCw, Clock, CheckCircle2, XCircle, Circle,
} from "lucide-react";

type Booking = {
  id: string;
  status: string;
  scheduledAt: string;
  slotTime: string | null;
  mode: string;
  amountPaid: number | null;
  currency: string;
  notes: string | null;
  cancellationReason: string | null;
  confirmedAt: string | null;
  completedAt: string | null;
  checkedInAt: string | null;
  cancelledAt: string | null;
  refundedAt: string | null;
  stripeRefundId: string | null;
  patient: { fullName: string; phone: string | null; gender: string | null; disability: string | null } | null;
  doctor:  { fullName: string } | null;
  package: { title: string }   | null;
};

type BookingsResponse = {
  bookings: Booking[];
  total: number;
  page: number;
  hasMore: boolean;
};

const STATUS_TABS = [
  { value: "all",       label: "All",       icon: <Circle size={12} />,       color: "#6b7a96" },
  { value: "requested", label: "Pending",   icon: <Clock size={12} />,        color: "#b45309" },
  { value: "confirmed", label: "Confirmed", icon: <CheckCircle2 size={12} />, color: "#1d4ed8" },
  { value: "completed", label: "Completed", icon: <CheckCircle2 size={12} />, color: "#065f46" },
  { value: "cancelled", label: "Cancelled", icon: <XCircle size={12} />,      color: "#991b1b" },
];

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

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export default function BookingsClient({ slug }: { slug: string }) {
  const [data, setData] = useState<BookingsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("all");
  const [date, setDate] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [cancelTarget, setCancelTarget] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState("");
  const [error, setError] = useState("");
  const searchRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [searchInput, setSearchInput] = useState("");

  const fetchBookings = useCallback(async (
    s = status, d = date, q = search, p = page
  ) => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({ status: s, page: String(p) });
      if (d) params.set("date", d);
      if (q) params.set("search", q);
      const res = await fetch(`/api/admin/h/${slug}/bookings?${params}`);
      if (!res.ok) throw new Error("Failed");
      setData(await res.json());
    } catch {
      setError("Failed to load bookings.");
    } finally {
      setLoading(false);
    }
  }, [slug, status, date, search, page]);

  useEffect(() => { fetchBookings(); }, [status, date, search, page]); // eslint-disable-line

  const handleSearchInput = (val: string) => {
    setSearchInput(val);
    if (searchRef.current) clearTimeout(searchRef.current);
    searchRef.current = setTimeout(() => {
      setSearch(val);
      setPage(1);
    }, 350);
  };

  const handleStatusTab = (s: string) => {
    setStatus(s);
    setPage(1);
  };

  const handleDate = (d: string) => {
    setDate(d);
    setPage(1);
  };

  const handleAction = async (bookingId: string, action: string, reason?: string) => {
    setActionLoading(bookingId + action);
    setError("");
    try {
      const res = await fetch(`/api/admin/h/${slug}/bookings`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId, action, reason }),
      });
      const d = await res.json();
      if (!res.ok) { setError(d.error ?? "Action failed"); return; }
      if (action === "CANCEL" && d.refundError) {
        setError(`Booking cancelled but refund failed: ${d.refundError}`);
      }
      setCancelTarget(null);
      setCancelReason("");
      await fetchBookings();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="space-y-5 max-w-5xl">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-extrabold text-[#0f1e38]">Bookings</h1>
          <p className="text-sm text-gray-400 mt-0.5">
            {data ? `${data.total} booking${data.total !== 1 ? "s" : ""} found` : "Loading..."}
          </p>
        </div>
        <button
          onClick={() => fetchBookings()}
          className="flex items-center gap-2 px-3 h-9 rounded-xl text-xs font-semibold transition-all"
          style={{ background: "#fff", border: "1.5px solid rgba(15,30,56,.1)", color: "#6b7a96" }}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#c8a96e"; e.currentTarget.style.color = "#c8a96e"; }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = "rgba(15,30,56,.1)"; e.currentTarget.style.color = "#6b7a96"; }}
        >
          <RefreshCw size={13} /> Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl p-4 border border-gray-100 space-y-3">
        {/* Status tabs */}
        <div className="flex gap-1 flex-wrap">
          {STATUS_TABS.map((tab) => {
            const active = status === tab.value;
            return (
              <button
                key={tab.value}
                onClick={() => handleStatusTab(tab.value)}
                className="flex items-center gap-1.5 px-3 h-8 rounded-xl text-xs font-semibold transition-all"
                style={{
                  background: active ? "#0f1e38" : "transparent",
                  color: active ? "#c8a96e" : tab.color,
                  border: active ? "none" : "1.5px solid rgba(15,30,56,.1)",
                }}
              >
                {tab.icon} {tab.label}
              </button>
            );
          })}
        </div>

        {/* Search + Date */}
        <div className="flex gap-3 flex-wrap">
          <div className="flex items-center gap-2 flex-1 min-w-48 h-9 rounded-xl px-3"
            style={{ background: "#f7f4ef", border: "1.5px solid rgba(15,30,56,.08)" }}>
            <Search size={13} className="text-gray-400 flex-shrink-0" />
            <input
              value={searchInput}
              onChange={(e) => handleSearchInput(e.target.value)}
              placeholder="Search by patient name or booking ID..."
              className="flex-1 text-sm outline-none bg-transparent text-[#0f1e38] placeholder-gray-400"
            />
          </div>
          <div className="flex items-center gap-2 h-9 rounded-xl px-3"
            style={{ background: "#f7f4ef", border: "1.5px solid rgba(15,30,56,.08)" }}>
            <CalendarDays size={13} className="text-gray-400 flex-shrink-0" />
            <input
              type="date"
              value={date}
              onChange={(e) => handleDate(e.target.value)}
              className="text-sm outline-none bg-transparent text-[#0f1e38]"
            />
            {date && (
              <button onClick={() => handleDate("")} className="text-gray-400 hover:text-red-500 ml-1">
                <XCircle size={13} />
              </button>
            )}
          </div>
          {(date || search) && (
            <button
              onClick={() => { setDate(""); setSearch(""); setSearchInput(""); setPage(1); }}
              className="flex items-center gap-1.5 h-9 px-3 rounded-xl text-xs font-semibold"
              style={{ background: "rgba(239,68,68,.08)", color: "#dc2626", border: "1px solid rgba(239,68,68,.2)" }}
            >
              <Filter size={12} /> Clear filters
            </button>
          )}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="p-3 rounded-xl text-sm font-semibold text-red-600"
          style={{ background: "#fef2f2", border: "1px solid rgba(220,38,38,.2)" }}>
          {error}
        </div>
      )}

      {/* List */}
      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-solid border-[#c8a96e] border-r-transparent" />
        </div>
      ) : !data || data.bookings.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-gray-100">
          <CalendarDays size={28} className="text-gray-200 mx-auto mb-3" />
          <p className="text-sm font-semibold text-gray-400">No bookings found</p>
          <p className="text-xs text-gray-300 mt-1">Try adjusting your filters</p>
        </div>
      ) : (
        <div className="space-y-2">
          {data.bookings.map((booking) => {
            const st = STATUS_CONFIG[booking.status] ?? STATUS_CONFIG.CONFIRMED;
            const isActioning = actionLoading?.startsWith(booking.id);
            const isCancelTarget = cancelTarget === booking.id;

            return (
              <div key={booking.id} className="bg-white rounded-2xl border overflow-hidden"
                style={{ borderColor: booking.status === "REQUESTED" ? "rgba(245,158,11,.3)" : "rgba(15,30,56,.07)" }}>

                {/* Main row */}
                <div className="flex items-start gap-4 p-4">
                  {/* Date + time */}
                  <div className="flex-shrink-0 text-center w-16">
                    <p className="text-xs font-bold text-[#0f1e38]">{formatDate(booking.scheduledAt)}</p>
                    <p className="text-sm font-extrabold text-[#0f1e38] mt-0.5 leading-tight">
                      {booking.slotTime ? formatSlotTime(booking.slotTime) : "—"}
                    </p>
                    <p className="text-[10px] font-semibold uppercase tracking-wider mt-0.5"
                      style={{ color: booking.mode === "ONLINE" ? "#c8a96e" : "#10b981" }}>
                      {booking.mode === "ONLINE" ? "Online" : "In-Person"}
                    </p>
                  </div>

                  {/* Divider */}
                  <div className="w-px h-14 bg-gray-100 flex-shrink-0 mt-0.5" />

                  {/* Patient info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-bold text-[#0f1e38] text-sm truncate">
                        {booking.patient?.fullName ?? "Unknown Patient"}
                      </p>
                      {booking.patient?.disability && booking.patient.disability !== "none" && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0"
                          style={{ background: "rgba(99,102,241,.1)", color: "#6366f1" }}>
                          {booking.patient.disability}
                        </span>
                      )}
                      {booking.checkedInAt && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0"
                          style={{ background: "rgba(16,185,129,.1)", color: "#059669" }}>
                          Checked In
                        </span>
                      )}
                      {booking.refundedAt && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0"
                          style={{ background: "rgba(99,102,241,.1)", color: "#4f46e5" }}>
                          Refunded
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                      {booking.doctor && (
                        <span className="flex items-center gap-1 text-xs text-gray-400">
                          <Stethoscope size={10} /> {booking.doctor.fullName}
                        </span>
                      )}
                      {booking.package && (
                        <span className="flex items-center gap-1 text-xs text-gray-400">
                          <Package size={10} /> {booking.package.title}
                        </span>
                      )}
                      {booking.patient?.phone && (
                        <a href={`tel:${booking.patient.phone}`}
                          className="flex items-center gap-1 text-xs text-[#c8a96e] hover:text-[#a88b50]">
                          <Phone size={10} /> {booking.patient.phone}
                        </a>
                      )}
                      {booking.patient?.gender && (
                        <span className="flex items-center gap-1 text-xs text-gray-400">
                          <User size={10} /> {booking.patient.gender}
                        </span>
                      )}
                    </div>
                    {booking.notes && (
                      <p className="text-xs text-gray-400 mt-1 italic">Note: {booking.notes}</p>
                    )}
                    {booking.cancellationReason && (
                      <p className="text-xs text-red-500 mt-1">Cancelled: {booking.cancellationReason}</p>
                    )}
                    <p className="text-[10px] text-gray-300 mt-1 font-mono">{booking.id}</p>
                  </div>

                  {/* Status + amount */}
                  <div className="flex-shrink-0 flex flex-col items-end gap-1.5">
                    <span className="flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full"
                      style={{ background: st.bg, color: st.color }}>
                      <span className="h-1.5 w-1.5 rounded-full flex-shrink-0" style={{ background: st.dot }} />
                      {st.label}
                    </span>
                    {booking.amountPaid != null && (
                      <p className="text-xs font-bold text-[#0f1e38]">
                        {formatMoney(booking.amountPaid, booking.currency)}
                      </p>
                    )}
                  </div>
                </div>

                {/* Action bar */}
                {(booking.status === "REQUESTED" || booking.status === "CONFIRMED") && !isCancelTarget && (
                  <div className="flex items-center gap-2 px-4 pb-3">
                    {booking.status === "REQUESTED" && (
                      <button
                        onClick={() => handleAction(booking.id, "CONFIRM")}
                        disabled={!!isActioning}
                        className="flex-1 h-8 rounded-xl text-xs font-bold transition-all disabled:opacity-50"
                        style={{ background: "linear-gradient(135deg,#0f1e38,#1a3059)", color: "#c8a96e" }}
                      >
                        {actionLoading === booking.id + "CONFIRM" ? "..." : "✓ Confirm"}
                      </button>
                    )}
                    {booking.status === "CONFIRMED" && (
                      <button
                        onClick={() => handleAction(booking.id, "CHECKIN")}
                        disabled={!!isActioning || !!booking.checkedInAt}
                        className="flex-1 h-8 rounded-xl text-xs font-bold transition-all disabled:opacity-50"
                        style={{ background: "rgba(16,185,129,.12)", color: "#065f46", border: "1px solid rgba(16,185,129,.3)" }}
                      >
                        {booking.checkedInAt ? "Checked In" : "Check In"}
                      </button>
                    )}
                    {booking.status === "CONFIRMED" && (
                      <button
                        onClick={() => handleAction(booking.id, "COMPLETE")}
                        disabled={!!isActioning}
                        className="flex-1 h-8 rounded-xl text-xs font-bold transition-all disabled:opacity-50"
                        style={{ background: "rgba(16,185,129,.12)", color: "#065f46", border: "1px solid rgba(16,185,129,.3)" }}
                      >
                        {actionLoading === booking.id + "COMPLETE" ? "..." : "✓ Complete"}
                      </button>
                    )}
                    <button
                      onClick={() => setCancelTarget(booking.id)}
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
                        onClick={() => handleAction(booking.id, "CANCEL", cancelReason)}
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

      {/* Pagination */}
      {data && data.total > 20 && (
        <div className="flex items-center justify-between py-2">
          <p className="text-xs text-gray-400">
            Showing {(page - 1) * 20 + 1}–{Math.min(page * 20, data.total)} of {data.total}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="h-8 w-8 rounded-xl flex items-center justify-center transition-all disabled:opacity-30"
              style={{ background: "#fff", border: "1.5px solid rgba(15,30,56,.1)" }}
            >
              <ChevronLeft size={14} className="text-[#0f1e38]" />
            </button>
            <span className="h-8 px-3 flex items-center text-xs font-semibold text-[#0f1e38]"
              style={{ background: "#fff", border: "1.5px solid rgba(15,30,56,.1)", borderRadius: 12 }}>
              {page}
            </span>
            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={!data.hasMore}
              className="h-8 w-8 rounded-xl flex items-center justify-center transition-all disabled:opacity-30"
              style={{ background: "#fff", border: "1.5px solid rgba(15,30,56,.1)" }}
            >
              <ChevronRight size={14} className="text-[#0f1e38]" />
            </button>
          </div>
        </div>
      )}

      {/* Placeholder for empty state with filters active */}
      {!loading && data && data.bookings.length === 0 && (date || search || status !== "all") && (
        <div className="flex items-center gap-2 text-xs text-gray-400 justify-center py-2">
          <AlertCircle size={13} /> No bookings match your current filters
        </div>
      )}
    </div>
  );
}
