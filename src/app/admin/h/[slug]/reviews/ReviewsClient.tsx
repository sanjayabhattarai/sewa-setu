"use client";

import { useEffect, useState, useCallback } from "react";
import { Star, Eye, EyeOff, ChevronLeft, ChevronRight, AlertCircle, RefreshCw } from "lucide-react";

type Review = {
  id: string;
  rating: number;
  comment: string | null;
  hidden: boolean;
  hiddenAt: string | null;
  createdAt: string;
  user: { fullName: string; email: string };
};

type ReviewsData = {
  reviews: Review[];
  total: number;
  page: number;
  hasMore: boolean;
};

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          size={13}
          className={s <= rating ? "text-amber-400" : "text-gray-200"}
          fill={s <= rating ? "currentColor" : "none"}
        />
      ))}
    </div>
  );
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export default function ReviewsClient({ slug }: { slug: string }) {
  const [data, setData] = useState<ReviewsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showHidden, setShowHidden] = useState(true);
  const [page, setPage] = useState(1);
  const [toggling, setToggling] = useState<string | null>(null);
  const [error, setError] = useState("");

  const fetchReviews = useCallback(async (p = page, sh = showHidden) => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({ page: String(p), hidden: String(sh) });
      const res = await fetch(`/api/admin/h/${slug}/reviews?${params}`);
      if (!res.ok) throw new Error("Failed");
      setData(await res.json());
    } catch {
      setError("Failed to load reviews.");
    } finally {
      setLoading(false);
    }
  }, [slug, page, showHidden]); // eslint-disable-line

  useEffect(() => { fetchReviews(page, showHidden); }, [page, showHidden]); // eslint-disable-line

  const handleToggleHidden = async (review: Review) => {
    setToggling(review.id);
    try {
      const res = await fetch(`/api/admin/h/${slug}/reviews`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reviewId: review.id, hidden: !review.hidden }),
      });
      if (!res.ok) throw new Error("Failed");
      await fetchReviews(page, showHidden);
    } catch {
      setError("Failed to update review.");
    } finally {
      setToggling(null);
    }
  };

  const avgRating = data?.reviews.length
    ? (data.reviews.reduce((s, r) => s + r.rating, 0) / data.reviews.length).toFixed(1)
    : null;

  return (
    <div className="space-y-5 max-w-4xl">

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-extrabold text-[#0f1e38]">Reviews</h1>
          <p className="text-sm text-gray-400 mt-0.5">
            {data ? `${data.total} review${data.total !== 1 ? "s" : ""}` : "Loading..."}
            {avgRating ? ` · ${avgRating} avg rating` : ""}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => fetchReviews(page, showHidden)}
            className="flex items-center gap-2 px-3 h-9 rounded-xl text-xs font-semibold transition-all"
            style={{ background: "#fff", border: "1.5px solid rgba(15,30,56,.1)", color: "#6b7a96" }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#c8a96e"; e.currentTarget.style.color = "#c8a96e"; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = "rgba(15,30,56,.1)"; e.currentTarget.style.color = "#6b7a96"; }}
          >
            <RefreshCw size={13} />
          </button>
          <button
            onClick={() => { setShowHidden(!showHidden); setPage(1); }}
            className="flex items-center gap-2 px-3 h-9 rounded-xl text-xs font-semibold transition-all"
            style={{
              background: showHidden ? "#0f1e38" : "#fff",
              color: showHidden ? "#c8a96e" : "#6b7a96",
              border: showHidden ? "none" : "1.5px solid rgba(15,30,56,.1)",
            }}
          >
            {showHidden ? <Eye size={13} /> : <EyeOff size={13} />}
            {showHidden ? "Showing all" : "Visible only"}
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
      ) : !data || data.reviews.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-gray-100">
          <Star size={28} className="text-gray-200 mx-auto mb-3" />
          <p className="text-sm font-semibold text-gray-400">No reviews found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {data.reviews.map((review) => (
            <div key={review.id} className="bg-white rounded-2xl border p-4"
              style={{
                borderColor: review.hidden ? "rgba(156,163,175,.25)" : "rgba(15,30,56,.07)",
                opacity: review.hidden ? 0.65 : 1,
              }}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5">
                    <StarRating rating={review.rating} />
                    {review.hidden && (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                        style={{ background: "rgba(156,163,175,.15)", color: "#6b7280" }}>
                        Hidden
                      </span>
                    )}
                  </div>
                  {review.comment ? (
                    <p className="text-sm text-[#0f1e38]">{review.comment}</p>
                  ) : (
                    <p className="text-sm text-gray-300 italic">No comment</p>
                  )}
                  <div className="flex items-center gap-3 mt-2">
                    <p className="text-xs font-semibold text-gray-500">{review.user.fullName}</p>
                    <p className="text-xs text-gray-300">·</p>
                    <p className="text-xs text-gray-400">{formatDate(review.createdAt)}</p>
                  </div>
                </div>
                <button
                  onClick={() => handleToggleHidden(review)}
                  disabled={toggling === review.id}
                  className="flex items-center gap-1.5 h-8 px-3 rounded-xl text-xs font-semibold flex-shrink-0 transition-all disabled:opacity-50"
                  style={{
                    background: review.hidden ? "rgba(16,185,129,.08)" : "rgba(156,163,175,.1)",
                    color: review.hidden ? "#059669" : "#6b7280",
                    border: "none",
                  }}
                >
                  {toggling === review.id ? (
                    "..."
                  ) : review.hidden ? (
                    <><Eye size={12} /> Show</>
                  ) : (
                    <><EyeOff size={12} /> Hide</>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {data && data.total > 20 && (
        <div className="flex items-center justify-between py-2">
          <p className="text-xs text-gray-400">
            Showing {(page - 1) * 20 + 1}–{Math.min(page * 20, data.total)} of {data.total}
          </p>
          <div className="flex gap-2">
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
              className="h-8 w-8 rounded-xl flex items-center justify-center disabled:opacity-30"
              style={{ background: "#fff", border: "1.5px solid rgba(15,30,56,.1)" }}>
              <ChevronLeft size={14} className="text-[#0f1e38]" />
            </button>
            <span className="h-8 px-3 flex items-center text-xs font-semibold text-[#0f1e38]"
              style={{ background: "#fff", border: "1.5px solid rgba(15,30,56,.1)", borderRadius: 12 }}>
              {page}
            </span>
            <button onClick={() => setPage((p) => p + 1)} disabled={!data.hasMore}
              className="h-8 w-8 rounded-xl flex items-center justify-center disabled:opacity-30"
              style={{ background: "#fff", border: "1.5px solid rgba(15,30,56,.1)" }}>
              <ChevronRight size={14} className="text-[#0f1e38]" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
