"use client";

import { useEffect, useState, useCallback } from "react";
import { BarChart2, TrendingUp, RefreshCw, AlertCircle, Stethoscope, Package } from "lucide-react";

type ReportsData = {
  range: number;
  overview: { totalBookings: number; totalRevenue: number; rangeBookings: number; rangeRevenue: number };
  statusBreakdown: { status: string; count: number }[];
  dailyChart: { date: string; bookings: number; revenue: number }[];
  topDoctors: { doctorId: string; name: string; completedBookings: number }[];
  topPackages: { packageId: string; title: string; bookings: number }[];
};

const RANGES = [
  { label: "7 days",  value: "7" },
  { label: "30 days", value: "30" },
  { label: "90 days", value: "90" },
];

const STATUS_COLORS: Record<string, string> = {
  REQUESTED:  "#f59e0b",
  CONFIRMED:  "#3b82f6",
  COMPLETED:  "#10b981",
  CANCELLED:  "#ef4444",
  DRAFT:      "#9ca3af",
};

function formatMoney(cents: number) {
  return `€${Math.round(cents / 100).toLocaleString()}`;
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

export default function ReportsClient({ slug }: { slug: string }) {
  const [data, setData] = useState<ReportsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState("30");
  const [error, setError] = useState("");

  const fetchReports = useCallback(async (r = range) => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/admin/h/${slug}/reports?range=${r}`);
      if (!res.ok) throw new Error("Failed");
      setData(await res.json());
    } catch {
      setError("Failed to load reports.");
    } finally {
      setLoading(false);
    }
  }, [slug, range]); // eslint-disable-line

  useEffect(() => { fetchReports(range); }, [range]); // eslint-disable-line

  const maxBookings = data ? Math.max(...data.dailyChart.map((d) => d.bookings), 1) : 1;

  return (
    <div className="space-y-6 max-w-5xl">

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-extrabold text-[#0f1e38]">Reports</h1>
          <p className="text-sm text-gray-400 mt-0.5">Business intelligence overview</p>
        </div>
        <div className="flex gap-2">
          {RANGES.map((r) => (
            <button key={r.value} onClick={() => setRange(r.value)}
              className="h-8 px-3 rounded-xl text-xs font-semibold transition-all"
              style={{
                background: range === r.value ? "#0f1e38" : "#fff",
                color: range === r.value ? "#c8a96e" : "#6b7a96",
                border: range === r.value ? "none" : "1.5px solid rgba(15,30,56,.1)",
              }}>
              {r.label}
            </button>
          ))}
          <button onClick={() => fetchReports(range)}
            className="flex items-center gap-2 px-3 h-8 rounded-xl text-xs font-semibold transition-all"
            style={{ background: "#fff", border: "1.5px solid rgba(15,30,56,.1)", color: "#6b7a96" }}>
            <RefreshCw size={12} />
          </button>
        </div>
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
      ) : !data ? null : (
        <div className="space-y-5">

          {/* Overview cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { label: "All-time Bookings",  value: data.overview.totalBookings.toLocaleString(),   icon: <BarChart2 size={16} className="text-[#c8a96e]" /> },
              { label: "All-time Revenue",   value: formatMoney(data.overview.totalRevenue),         icon: <TrendingUp size={16} className="text-[#c8a96e]" /> },
              { label: `Bookings (${range}d)`, value: data.overview.rangeBookings.toLocaleString(), icon: <BarChart2 size={16} className="text-blue-400" /> },
              { label: `Revenue (${range}d)`,  value: formatMoney(data.overview.rangeRevenue),       icon: <TrendingUp size={16} className="text-emerald-400" /> },
            ].map((card) => (
              <div key={card.label} className="bg-white rounded-2xl p-4 border border-gray-100">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">{card.label}</p>
                  <div className="h-7 w-7 rounded-xl flex items-center justify-center" style={{ background: "#f7f4ef" }}>
                    {card.icon}
                  </div>
                </div>
                <p className="text-xl font-extrabold text-[#0f1e38]">{card.value}</p>
              </div>
            ))}
          </div>

          {/* Status breakdown + top doctors/packages */}
          <div className="grid lg:grid-cols-3 gap-4">

            {/* Status breakdown */}
            <div className="bg-white rounded-2xl border border-gray-100 p-4">
              <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-4">By Status</p>
              <div className="space-y-3">
                {data.statusBreakdown.map((s) => {
                  const total = data.statusBreakdown.reduce((sum, x) => sum + x.count, 0) || 1;
                  const pct = Math.round((s.count / total) * 100);
                  return (
                    <div key={s.status}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="font-semibold text-[#0f1e38] capitalize">{s.status.toLowerCase()}</span>
                        <span className="text-gray-400">{s.count} ({pct}%)</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
                        <div className="h-full rounded-full transition-all"
                          style={{ width: `${pct}%`, background: STATUS_COLORS[s.status] ?? "#9ca3af" }} />
                      </div>
                    </div>
                  );
                })}
                {data.statusBreakdown.length === 0 && (
                  <p className="text-xs text-gray-300">No bookings in this period</p>
                )}
              </div>
            </div>

            {/* Top doctors */}
            <div className="bg-white rounded-2xl border border-gray-100 p-4">
              <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-4">Top Doctors</p>
              <div className="space-y-3">
                {data.topDoctors.map((d, i) => (
                  <div key={d.doctorId} className="flex items-center gap-3">
                    <span className="text-xs font-bold text-gray-300 w-4">{i + 1}</span>
                    <div className="h-7 w-7 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ background: "rgba(200,169,110,.1)" }}>
                      <Stethoscope size={12} className="text-[#c8a96e]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-[#0f1e38] truncate">{d.name}</p>
                    </div>
                    <span className="text-xs font-bold text-gray-400">{d.completedBookings}</span>
                  </div>
                ))}
                {data.topDoctors.length === 0 && (
                  <p className="text-xs text-gray-300">No completed bookings yet</p>
                )}
              </div>
            </div>

            {/* Top packages */}
            <div className="bg-white rounded-2xl border border-gray-100 p-4">
              <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-4">Top Packages</p>
              <div className="space-y-3">
                {data.topPackages.map((p, i) => (
                  <div key={p.packageId} className="flex items-center gap-3">
                    <span className="text-xs font-bold text-gray-300 w-4">{i + 1}</span>
                    <div className="h-7 w-7 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ background: "rgba(16,185,129,.08)" }}>
                      <Package size={12} className="text-emerald-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-[#0f1e38] truncate">{p.title}</p>
                    </div>
                    <span className="text-xs font-bold text-gray-400">{p.bookings}</span>
                  </div>
                ))}
                {data.topPackages.length === 0 && (
                  <p className="text-xs text-gray-300">No package bookings yet</p>
                )}
              </div>
            </div>
          </div>

          {/* Daily bookings chart */}
          {data.dailyChart.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 p-4">
              <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-4">
                Daily Bookings — Last {range} days
              </p>
              <div className="flex items-end gap-1 h-28 pb-1 overflow-hidden">
                {data.dailyChart.map((d) => (
                  <div key={d.date} className="flex flex-col items-center gap-1 flex-1 min-w-0 group">
                    <div className="relative">
                      <div
                        className="w-full max-w-[10px] mx-auto rounded-t-sm transition-all group-hover:opacity-80"
                        style={{
                          height: Math.max(4, Math.round((d.bookings / maxBookings) * 96)),
                          background: "linear-gradient(180deg,#c8a96e,#a88b50)",
                        }}
                      />
                      <div className="absolute -top-6 left-1/2 -translate-x-1/2 hidden group-hover:block bg-[#0f1e38] text-[#c8a96e] text-[10px] font-bold px-1.5 py-0.5 rounded whitespace-nowrap z-10">
                        {d.bookings} · {formatDate(d.date)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      )}
    </div>
  );
}
