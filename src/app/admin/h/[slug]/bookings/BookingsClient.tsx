"use client";

import { useEffect, useState, useCallback, useRef, Fragment } from "react";
import {
  CalendarDays,
  Search,
  ChevronLeft,
  ChevronRight,
  Stethoscope,
  Package,
  Phone,
  User,
  AlertCircle,
  Filter,
  RefreshCw,
  Clock,
  CheckCircle2,
  XCircle,
  Circle,
  ChevronDown,
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

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
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
  const [expandedId, setExpandedId] = useState<string | null>(null);
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
    <div className="space-y-5 max-w-6xl">
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

      <div className="bg-white rounded-2xl p-4 border border-gray-100 space-y-3">
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

      {error && (
        <div className="p-3 rounded-2xl text-sm font-semibold text-red-600 flex items-center gap-2"
          style={{ background: "#fef2f2", border: "1px solid rgba(220,38,38,.2)" }}>
          <AlertCircle size={14} /> {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center h-56">
          <div className="h-9 w-9 animate-spin rounded-full border-2 border-solid border-[#c8a96e] border-r-transparent" />
        </div>
      ) : !data || data.bookings.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-gray-100">
          <CalendarDays size={28} className="text-gray-200 mx-auto mb-3" />
          <p className="text-sm font-semibold text-gray-400">No bookings found</p>
          <p className="text-xs text-gray-300 mt-1">Try adjusting your filters</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="w-full">
            <table className="w-full table-fixed text-sm">
              <thead style={{ background: "#f7f4ef" }}>
                <tr>
                  <th className="text-left px-4 py-3 text-[11px] font-bold uppercase tracking-widest text-gray-400">Patient</th>
                  <th className="text-left px-4 py-3 text-[11px] font-bold uppercase tracking-widest text-gray-400">Appointment</th>
                  <th className="text-left px-4 py-3 text-[11px] font-bold uppercase tracking-widest text-gray-400">Care Item</th>
                  <th className="text-left px-4 py-3 text-[11px] font-bold uppercase tracking-widest text-gray-400">Status</th>
                  <th className="text-right px-4 py-3 text-[11px] font-bold uppercase tracking-widest text-gray-400">Payment</th>
                  <th className="text-left px-4 py-3 text-[11px] font-bold uppercase tracking-widest text-gray-400">Timeline</th>
                  <th className="text-left px-4 py-3 text-[11px] font-bold uppercase tracking-widest text-gray-400">Actions</th>
                  <th className="text-right px-4 py-3 text-[11px] font-bold uppercase tracking-widest text-gray-400">Details</th>
                </tr>
              </thead>
              <tbody>
                {data.bookings.map((booking) => {
                  const st = STATUS_CONFIG[booking.status] ?? STATUS_CONFIG.CONFIRMED;
                  const isActioning = !!actionLoading?.startsWith(booking.id);
                  const isExpanded = expandedId === booking.id;
                  const isCancelTarget = cancelTarget === booking.id;

                  return (
                    <Fragment key={booking.id}>
                      <tr className="border-t border-gray-100 hover:bg-[#fcfbf8]">
                        <td className="px-4 py-3.5 align-top break-words">
                          <p className="text-xs font-bold text-[#0f1e38]">
                            {booking.patient?.fullName ?? "Unknown Patient"}
                          </p>
                          {booking.patient?.phone && (
                            <a
                              href={`tel:${booking.patient.phone}`}
                              className="text-[11px] text-[#c8a96e] inline-flex items-center gap-1 mt-0.5"
                            >
                              <Phone size={10} /> {booking.patient.phone}
                            </a>
                          )}
                          {booking.patient?.gender && (
                            <p className="text-[11px] text-gray-400 inline-flex items-center gap-1 mt-0.5">
                              <User size={10} /> {booking.patient.gender}
                            </p>
                          )}
                        </td>

                        <td className="px-4 py-3.5 align-top break-words">
                          <p className="text-xs font-semibold text-[#0f1e38]">{formatDate(booking.scheduledAt)}</p>
                          <p className="text-[11px] text-gray-400 mt-0.5">
                            {booking.slotTime ? formatSlotTime(booking.slotTime) : "No slot"}
                          </p>
                          <span
                            className="inline-block mt-1 text-[10px] font-semibold px-2 py-0.5 rounded-full"
                            style={{
                              background:
                                booking.mode === "ONLINE"
                                  ? "rgba(200,169,110,.12)"
                                  : "rgba(16,185,129,.12)",
                              color: booking.mode === "ONLINE" ? "#a88b50" : "#059669",
                            }}
                          >
                            {booking.mode === "ONLINE" ? "Online" : "In-person"}
                          </span>
                        </td>

                        <td className="px-4 py-3.5 align-top break-words">
                          {booking.doctor ? (
                            <p className="text-xs text-[#0f1e38] inline-flex items-center gap-1">
                              <Stethoscope size={11} className="text-gray-400" /> {booking.doctor.fullName}
                            </p>
                          ) : (
                            <p className="text-xs text-gray-400">No doctor</p>
                          )}
                          {booking.package ? (
                            <p className="text-[11px] text-gray-400 inline-flex items-center gap-1 mt-0.5">
                              <Package size={10} /> {booking.package.title}
                            </p>
                          ) : (
                            <p className="text-[11px] text-gray-300 mt-0.5">No package</p>
                          )}
                        </td>

                        <td className="px-4 py-3.5 align-top break-words">
                          <span
                            className="inline-flex items-center gap-1.5 text-[10px] font-semibold px-2.5 py-1 rounded-full"
                            style={{ background: st.bg, color: st.color }}
                          >
                            <span className="h-1.5 w-1.5 rounded-full" style={{ background: st.dot }} />
                            {st.label}
                          </span>
                          {booking.checkedInAt && (
                            <p className="text-[11px] text-emerald-700 mt-1">Checked in</p>
                          )}
                        </td>

                        <td className="px-4 py-3.5 align-top text-right break-words">
                          <p className="text-xs font-bold text-[#0f1e38]">
                            {booking.amountPaid != null
                              ? formatMoney(booking.amountPaid, booking.currency)
                              : "-"}
                          </p>
                          {booking.refundedAt && (
                            <p className="text-[11px] text-indigo-600 mt-0.5">Refunded</p>
                          )}
                        </td>

                        <td className="px-4 py-3.5 align-top break-words">
                          <p className="text-[11px] text-gray-400">Created {formatDateTime(booking.scheduledAt)}</p>
                          {booking.confirmedAt && (
                            <p className="text-[11px] text-gray-400">Confirmed {formatDateTime(booking.confirmedAt)}</p>
                          )}
                          {booking.completedAt && (
                            <p className="text-[11px] text-gray-400">Completed {formatDateTime(booking.completedAt)}</p>
                          )}
                        </td>

                        <td className="px-4 py-3.5 align-top break-words">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {booking.status === "REQUESTED" && (
                              <button
                                onClick={() => handleAction(booking.id, "CONFIRM")}
                                disabled={isActioning}
                                className="h-7 px-2.5 rounded-lg text-[11px] font-semibold disabled:opacity-50"
                                style={{
                                  background: "linear-gradient(135deg,#0f1e38,#1a3059)",
                                  color: "#c8a96e",
                                }}
                              >
                                {actionLoading === booking.id + "CONFIRM" ? "..." : "Confirm"}
                              </button>
                            )}

                            {booking.status === "CONFIRMED" && (
                              <button
                                onClick={() => handleAction(booking.id, "CHECKIN")}
                                disabled={isActioning || !!booking.checkedInAt}
                                className="h-7 px-2.5 rounded-lg text-[11px] font-semibold disabled:opacity-50"
                                style={{
                                  background: "rgba(16,185,129,.12)",
                                  color: "#065f46",
                                  border: "1px solid rgba(16,185,129,.3)",
                                }}
                              >
                                {booking.checkedInAt ? "Checked in" : "Check in"}
                              </button>
                            )}

                            {booking.status === "CONFIRMED" && (
                              <button
                                onClick={() => handleAction(booking.id, "COMPLETE")}
                                disabled={isActioning}
                                className="h-7 px-2.5 rounded-lg text-[11px] font-semibold disabled:opacity-50"
                                style={{
                                  background: "rgba(16,185,129,.12)",
                                  color: "#065f46",
                                  border: "1px solid rgba(16,185,129,.3)",
                                }}
                              >
                                {actionLoading === booking.id + "COMPLETE" ? "..." : "Complete"}
                              </button>
                            )}

                            {(booking.status === "REQUESTED" || booking.status === "CONFIRMED") && (
                              <button
                                onClick={() => {
                                  setCancelTarget(booking.id);
                                  setExpandedId(booking.id);
                                }}
                                className="h-7 px-2.5 rounded-lg text-[11px] font-semibold"
                                style={{
                                  background: "rgba(239,68,68,.08)",
                                  color: "#dc2626",
                                  border: "1px solid rgba(239,68,68,.2)",
                                }}
                              >
                                Cancel
                              </button>
                            )}
                          </div>
                        </td>

                        <td className="px-4 py-3.5 align-top text-right break-words">
                          <button
                            onClick={() => {
                              setExpandedId((prev) => (prev === booking.id ? null : booking.id));
                              if (expandedId === booking.id) {
                                setCancelTarget(null);
                                setCancelReason("");
                              }
                            }}
                            className="h-8 px-3 rounded-xl text-xs font-semibold border"
                            style={{
                              borderColor: "rgba(15,30,56,.12)",
                              color: "#0f1e38",
                              background: "#fff",
                            }}
                          >
                            View
                            <ChevronDown
                              size={12}
                              className={`inline ml-1 transition-transform ${isExpanded ? "rotate-180" : ""}`}
                            />
                          </button>
                        </td>
                      </tr>

                      {isExpanded && (
                        <tr className="border-t border-gray-100 bg-[#fcfbf8]">
                          <td colSpan={8} className="px-4 py-4">
                            <div className="grid lg:grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Booking Notes</p>
                                <p className="text-xs text-[#0f1e38] leading-relaxed">
                                  {booking.notes || "No internal or patient notes for this booking."}
                                </p>

                                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 pt-2">System Metadata</p>
                                <div className="space-y-1">
                                  <p className="text-[11px] text-gray-500 break-all">Booking ID: {booking.id}</p>
                                  {booking.cancellationReason && (
                                    <p className="text-[11px] text-red-600">
                                      Cancellation reason: {booking.cancellationReason}
                                    </p>
                                  )}
                                  {booking.cancelledAt && (
                                    <p className="text-[11px] text-gray-500">Cancelled at {formatDateTime(booking.cancelledAt)}</p>
                                  )}
                                  {booking.refundedAt && (
                                    <p className="text-[11px] text-indigo-600 break-words">Refunded at {formatDateTime(booking.refundedAt)}</p>
                                  )}
                                  {booking.stripeRefundId && (
                                    <p className="text-[11px] text-gray-500 break-all">Stripe refund ID: {booking.stripeRefundId}</p>
                                  )}
                                </div>
                              </div>

                              <div className="space-y-2">
                                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Cancellation Panel</p>
                                {isCancelTarget ? (
                                  <>
                                    <textarea
                                      value={cancelReason}
                                      onChange={(e) => setCancelReason(e.target.value)}
                                      placeholder="Reason for cancellation (required)..."
                                      rows={3}
                                      className="w-full rounded-xl px-3 py-2 text-sm outline-none resize-none"
                                      style={{
                                        border: "1.5px solid rgba(239,68,68,.3)",
                                        background: "#fff9f9",
                                      }}
                                    />
                                    <div className="flex gap-2">
                                      <button
                                        onClick={() => handleAction(booking.id, "CANCEL", cancelReason)}
                                        disabled={!cancelReason.trim() || isActioning}
                                        className="h-8 px-3 rounded-xl text-xs font-bold disabled:opacity-50"
                                        style={{ background: "#dc2626", color: "#fff" }}
                                      >
                                        {isActioning ? "..." : "Confirm cancellation"}
                                      </button>
                                      <button
                                        onClick={() => {
                                          setCancelTarget(null);
                                          setCancelReason("");
                                        }}
                                        className="h-8 px-3 rounded-xl text-xs font-semibold"
                                        style={{ background: "#f7f4ef", color: "#6b7a96" }}
                                      >
                                        Cancel panel
                                      </button>
                                    </div>
                                  </>
                                ) : (
                                  <p className="text-xs text-gray-500">
                                    Open cancel panel from Actions to cancel this booking.
                                  </p>
                                )}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {data && data.total > 20 && (
        <div className="flex items-center justify-between py-2">
          <p className="text-xs text-gray-400">
            Showing {(page - 1) * 20 + 1}–{Math.min(page * 20, data.total)} of {data.total}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="h-9 w-9 rounded-xl flex items-center justify-center transition-all disabled:opacity-30"
              style={{ background: "#fff", border: "1.5px solid rgba(15,30,56,.1)" }}
            >
              <ChevronLeft size={14} className="text-[#0f1e38]" />
            </button>
            <span className="h-9 px-3 flex items-center text-xs font-semibold text-[#0f1e38]"
              style={{ background: "#fff", border: "1.5px solid rgba(15,30,56,.1)", borderRadius: 12 }}>
              {page}
            </span>
            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={!data.hasMore}
              className="h-9 w-9 rounded-xl flex items-center justify-center transition-all disabled:opacity-30"
              style={{ background: "#fff", border: "1.5px solid rgba(15,30,56,.1)" }}
            >
              <ChevronRight size={14} className="text-[#0f1e38]" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
