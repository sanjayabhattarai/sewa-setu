"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useUser } from "@clerk/nextjs";
import { Input } from "@/components/ui/input";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import type { UiPackage } from "@/types/package";
import { formatMoneyCents } from "@/lib/money";

/* ─────────────────────────────────────────────────────
   FULL REWRITE — matches availability-modal design system
───────────────────────────────────────────────────── */

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  hospitalName: string;
  hospitalId?: string;
  selectedPackage: UiPackage;
  packageId?: string;
}

const TIME_SLOTS = ["09:00","10:00","11:00","13:00","14:00","15:00","16:00","17:00"];
const DAYS = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

function pad2(n: number) { return String(n).padStart(2,"0"); }
function toDateKey(d: Date) { return `${d.getFullYear()}-${pad2(d.getMonth()+1)}-${pad2(d.getDate())}`; }
function to12h(t: string) {
  const [h] = t.split(":").map(Number);
  const ampm = h < 12 ? "AM" : "PM";
  const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return { h12, ampm };
}

export function BookingModal({ isOpen, onClose, hospitalName, hospitalId, selectedPackage, packageId }: BookingModalProps) {
  const { isSignedIn, user } = useUser();
  const [isMounted, setIsMounted] = useState(false);
  const [step, setStep] = useState<"schedule" | "details">("schedule");
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    patientName: "",
    patientAge: "",
    patientPhone: "",
    buyerEmail: "",
  });
  const [pageStart, setPageStart] = useState<Date>(() => {
    const d = new Date();
    d.setHours(0,0,0,0);
    return d;
  });

  useEffect(() => { setIsMounted(true); }, []);

  // Auto-fill email from Clerk when modal opens
  useEffect(() => {
    if (!isOpen) return;
    const email = user?.primaryEmailAddress?.emailAddress;
    if (email) setFormData(p => ({ ...p, buyerEmail: email }));
  }, [isOpen, user?.primaryEmailAddress?.emailAddress]);

  // Escape key closes
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") handleClose(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  // 7 dates starting from pageStart
  const weekDates = useMemo(() => {
    const days: Date[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(pageStart);
      d.setDate(pageStart.getDate() + i);
      days.push(d);
    }
    return days;
  }, [pageStart]);

  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0,0,0,0);
    return d;
  }, []);

  const canPrev = pageStart.getTime() > today.getTime();
  const canProceed = !!selectedDate && !!selectedTime;

  const handleClose = () => {
    setStep("schedule");
    setSelectedDate("");
    setSelectedTime("");
    setFormData({ patientName: "", patientAge: "", patientPhone: "", buyerEmail: "" });
    setIsLoading(false);
    setPageStart(() => { const d = new Date(); d.setHours(0,0,0,0); return d; });
    onClose();
  };

  const goPrev = () => setPageStart(d => new Date(d.getTime() - 7 * 86400000));
  const goNext = () => setPageStart(d => new Date(d.getTime() + 7 * 86400000));

  const weekLabel = (() => {
    const s = weekDates[0]; const e = weekDates[6];
    const fmt = (d: Date) => `${d.getDate()} ${MONTHS[d.getMonth()]}`;
    return `${fmt(s)} – ${fmt(e)}, ${e.getFullYear()}`;
  })();

  const formFilled = !!(formData.patientName && formData.patientAge && formData.patientPhone && formData.buyerEmail);

  const handlePay = async () => {
    if (!formFilled) return;
    if (!isSignedIn) {
      window.location.href = `/sign-in?redirect_url=${encodeURIComponent(window.location.href)}`;
      return;
    }
    setIsLoading(true);
    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          packageId,
          hospitalId,
          patientName: formData.patientName,
          patientAge: formData.patientAge,
          patientPhone: formData.patientPhone,
          buyerEmail: formData.buyerEmail,
          bookingDate: new Date(selectedDate).toISOString(),
          slotTime: selectedTime,
        }),
      });
      const data = await response.json();
      if (data.url) { window.location.href = data.url; }
      else { alert("Payment failed to initialize."); setIsLoading(false); }
    } catch (err) {
      console.error(err);
      alert("Something went wrong.");
      setIsLoading(false);
    }
  };

  if (!isOpen || !isMounted) return null;

  /* ── format selected date for display ── */
  const selDateObj = selectedDate ? new Date(selectedDate + "T00:00:00") : null;
  const selDateDisplay = selDateObj
    ? `${DAYS[selDateObj.getDay()]}, ${selDateObj.getDate()} ${MONTHS[selDateObj.getMonth()]}`
    : "";
  const selTimeDisplay = selectedTime ? (() => {
    const { h12, ampm } = to12h(selectedTime);
    return `${h12}:00 ${ampm}`;
  })() : "";

  const modalContent = (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4"
      style={{ background: "rgba(10,18,35,0.72)", backdropFilter: "blur(6px)" }}
      onClick={(e) => { if (e.target === e.currentTarget) handleClose(); }}
    >
      <div
        className="w-full flex flex-col overflow-hidden"
        style={{
          maxWidth: 980,
          maxHeight: "95vh",
          background: "#fff",
          borderRadius: 20,
          boxShadow: "0 32px 80px rgba(10,18,35,.45)",
        }}
        onClick={(e) => e.stopPropagation()}
      >

        {/* ── HEADER ── */}
        <div
          className="flex-shrink-0 flex items-center gap-3 px-6 py-4"
          style={{
            background: "linear-gradient(135deg,#0f1e38 0%,#1a3059 100%)",
            borderBottom: "1px solid rgba(200,169,110,.18)",
          }}
        >
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-bold text-white truncate">
              {step === "schedule" ? "Choose Date & Time" : "Confirm Your Booking"}
            </h2>
          </div>

          {/* week nav — only on schedule step */}
          {step === "schedule" && (
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={goPrev}
                disabled={!canPrev}
                className="flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg transition-all disabled:opacity-30"
                style={{ background: "rgba(255,255,255,.1)", color: "#c8a96e", border: "1px solid rgba(200,169,110,.25)" }}
              >
                <ChevronLeft className="h-3.5 w-3.5" /> Prev
              </button>
              <span
                className="text-xs font-medium px-3 py-1.5 rounded-lg hidden sm:block"
                style={{ background: "rgba(200,169,110,.12)", color: "#c8a96e", border: "1px solid rgba(200,169,110,.2)" }}
              >
                {weekLabel}
              </span>
              <button
                onClick={goNext}
                className="flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg transition-all"
                style={{ background: "rgba(255,255,255,.1)", color: "#c8a96e", border: "1px solid rgba(200,169,110,.25)" }}
              >
                Next <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          )}

          {/* close */}
          <button
            onClick={handleClose}
            aria-label="Close"
            className="flex-shrink-0 h-9 w-9 rounded-full flex items-center justify-center transition-all"
            style={{ background: "rgba(255,255,255,.08)", border: "1px solid rgba(255,255,255,.15)", color: "rgba(255,255,255,.7)" }}
            onMouseEnter={(e) => { const b = e.currentTarget as HTMLButtonElement; b.style.background = "#e53e3e"; b.style.color = "#fff"; }}
            onMouseLeave={(e) => { const b = e.currentTarget as HTMLButtonElement; b.style.background = "rgba(255,255,255,.08)"; b.style.color = "rgba(255,255,255,.7)"; }}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* ── BODY ── */}
        <div className="flex-1 overflow-y-auto" style={{ background: "#f5f3ef" }}>

          {step === "schedule" ? (
            /* ── STEP 1: Date left + Time right ── */
            <div style={{ display: "flex", minHeight: 420 }}>

              {/* LEFT: Date grid */}
              <div style={{
                width: "55%",
                flexShrink: 0,
                background: "#fff",
                padding: "28px 28px 24px",
                borderRight: "1px solid rgba(15,30,56,.07)",
              }}>
                <p style={{ fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: "#c8a96e", marginBottom: 16 }}>
                  Select a Date
                </p>

                {/* Day-of-week headers */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 4, marginBottom: 4 }}>
                  {DAYS.map(d => (
                    <div key={d} style={{ textAlign: "center", fontSize: "0.62rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "#9aa3b0", padding: "4px 0" }}>
                      {d}
                    </div>
                  ))}
                </div>

                {/* Date cells */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 4 }}>
                  {weekDates.map((d) => {
                    const key = toDateKey(d);
                    const isToday = d.getTime() === today.getTime();
                    const isPast = d.getTime() < today.getTime();
                    const isSel = selectedDate === key;
                    return (
                      <button
                        key={key}
                        type="button"
                        disabled={isPast}
                        onClick={() => setSelectedDate(key)}
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          justifyContent: "center",
                          padding: 0,
                          borderRadius: 10,
                          border: isSel
                            ? "2px solid #c8a96e"
                            : isToday
                            ? "2px solid rgba(200,169,110,.4)"
                            : "2px solid rgba(15,30,56,.08)",
                          background: isSel
                            ? "linear-gradient(135deg,#c8a96e 0%,#a88b50 100%)"
                            : isToday
                            ? "rgba(200,169,110,.08)"
                            : "#fff",
                          cursor: isPast ? "not-allowed" : "pointer",
                          opacity: isPast ? 0.35 : 1,
                          transition: "all .14s ease",
                          height: 72,
                          width: "100%",
                        }}
                      >
                        <span style={{ fontSize: "0.58rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: isSel ? "rgba(255,255,255,.75)" : "#9aa3b0", marginBottom: 2 }}>
                          {MONTHS[d.getMonth()]}
                        </span>
                        <span style={{ fontSize: "1.45rem", fontWeight: 800, lineHeight: 1, color: isSel ? "#fff" : isToday ? "#c8a96e" : "#0f1e38" }}>
                          {d.getDate()}
                        </span>
                        <span style={{ fontSize: "0.52rem", fontWeight: 700, marginTop: 3, textTransform: "uppercase", letterSpacing: "0.06em", color: isSel ? "rgba(255,255,255,.8)" : "#c8a96e", visibility: isToday ? "visible" : "hidden" }}>
                          Today
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Mini summary card below date grid */}
                <div style={{
                  marginTop: 20,
                  padding: "16px",
                  borderRadius: 12,
                  background: "#f5f3ef",
                  border: "1.5px solid rgba(15,30,56,.08)",
                }}>
                  <p style={{ fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "#c8a96e", marginBottom: 10 }}>
                    Your Selection
                  </p>
                  <p style={{ fontSize: "0.88rem", fontWeight: 700, color: "#0f1e38", marginBottom: 2, lineHeight: 1.3 }}>
                    {selectedPackage.name}
                  </p>
                  <p style={{ fontSize: "0.72rem", color: "#6b7a96", marginBottom: 12 }}>
                    {hospitalName}
                  </p>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontSize: "0.72rem", color: "#9aa3b0" }}>Date</span>
                      <span style={{ fontSize: "0.78rem", fontWeight: 700, color: selectedDate ? "#0f1e38" : "#c8c8c8" }}>
                        {selDateDisplay || "—"}
                      </span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontSize: "0.72rem", color: "#9aa3b0" }}>Time</span>
                      <span style={{ fontSize: "0.78rem", fontWeight: 700, color: selectedTime ? "#a88b50" : "#c8c8c8" }}>
                        {selTimeDisplay || "—"}
                      </span>
                    </div>
                    <div style={{ borderTop: "1px solid rgba(15,30,56,.07)", paddingTop: 8, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontSize: "0.72rem", color: "#9aa3b0" }}>Fee</span>
                      <span style={{ fontSize: "0.88rem", fontWeight: 800, color: "#c8a96e" }}>{formatMoneyCents(selectedPackage.price, selectedPackage.currency)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* RIGHT: Time slots */}
              <div style={{ flex: 1, padding: "28px 24px 24px", background: "#f5f3ef" }}>
                <p style={{ fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: "#c8a96e", marginBottom: 16 }}>
                  Select a Time
                </p>

                {!selectedDate ? (
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "calc(100% - 32px)", gap: 10 }}>
                    <span style={{ fontSize: "2rem" }}>📅</span>
                    <p style={{ fontSize: "0.8rem", color: "#9aa3b0", fontWeight: 500, textAlign: "center" }}>Pick a date first</p>
                  </div>
                ) : (
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                    {TIME_SLOTS.map((t) => {
                      const { h12, ampm } = to12h(t);
                      const isSel = selectedTime === t;
                      return (
                        <button
                          key={t}
                          type="button"
                          onClick={() => setSelectedTime(t)}
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            justifyContent: "center",
                            padding: "12px 8px",
                            borderRadius: 10,
                            border: isSel ? "2px solid #c8a96e" : "2px solid rgba(15,30,56,.1)",
                            background: isSel ? "linear-gradient(135deg,#c8a96e 0%,#a88b50 100%)" : "#fff",
                            cursor: "pointer",
                            transition: "all .14s ease",
                            boxShadow: isSel ? "0 4px 14px rgba(200,169,110,.3)" : "none",
                          }}
                        >
                          <span style={{ fontSize: "1rem", fontWeight: 800, color: isSel ? "#fff" : "#0f1e38", lineHeight: 1 }}>
                            {h12}:00
                          </span>
                          <span style={{ fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: isSel ? "rgba(255,255,255,.7)" : "#9aa3b0", marginTop: 3 }}>
                            {ampm}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

          ) : (
            /* ── STEP 2: Summary left + Form right ── */
            <div style={{ display: "flex", minHeight: "100%", height: "100%" }}>

              {/* LEFT: Booking summary */}
              <div style={{
                width: "38%",
                flexShrink: 0,
                background: "linear-gradient(160deg,#0f1e38 0%,#1a3059 100%)",
                padding: "40px 36px",
                display: "flex",
                flexDirection: "column",
                gap: 0,
                borderRight: "1px solid rgba(200,169,110,.15)",
              }}>
                <div style={{
                  width: 56, height: 56, borderRadius: 14,
                  background: "rgba(200,169,110,.15)",
                  border: "1.5px solid rgba(200,169,110,.3)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: "1.5rem", marginBottom: 20,
                }}>
                  📦
                </div>
                <p style={{ fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: "rgba(200,169,110,.65)", marginBottom: 6 }}>
                  Booking Summary
                </p>
                <p style={{ fontSize: "1.2rem", fontWeight: 800, color: "#fff", lineHeight: 1.3 }}>
                  {selectedPackage.name}
                </p>
                <p style={{ fontSize: "0.82rem", fontWeight: 600, color: "#c8a96e", marginTop: 6, marginBottom: 28 }}>
                  {hospitalName}
                </p>

                {[
                  { label: "Date",  value: selDateDisplay },
                  { label: "Time",  value: selTimeDisplay },
                  { label: "Type",  value: "🏥  In-Person" },
                ].map(({ label, value }) => (
                  <div key={label} style={{
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                    padding: "13px 0",
                    borderBottom: "1px solid rgba(255,255,255,.07)",
                  }}>
                    <span style={{ fontSize: "0.78rem", color: "rgba(255,255,255,.45)" }}>{label}</span>
                    <span style={{ fontSize: "0.82rem", fontWeight: 600, color: "#fff" }}>{value}</span>
                  </div>
                ))}

                {/* Price highlight */}
                <div style={{
                  marginTop: 28,
                  background: "rgba(200,169,110,.12)",
                  border: "1.5px solid rgba(200,169,110,.35)",
                  borderRadius: 14,
                  padding: "18px 20px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}>
                  <div>
                    <p style={{ fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#c8a96e", marginBottom: 4 }}>
                      Package Fee
                    </p>
                    <p style={{ fontSize: "0.75rem", color: "rgba(255,255,255,.35)" }}>One-time payment</p>
                  </div>
                  <span style={{ fontSize: "2rem", fontWeight: 800, color: "#c8a96e", lineHeight: 1 }}>
                    {formatMoneyCents(selectedPackage.price, selectedPackage.currency)}
                  </span>
                </div>

                <div style={{ marginTop: "auto", paddingTop: 32, display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: "0.9rem" }}>🔒</span>
                  <span style={{ fontSize: "0.72rem", color: "rgba(255,255,255,.3)", lineHeight: 1.5 }}>
                    Payments are processed securely via Stripe. Your card details are never stored.
                  </span>
                </div>
              </div>

              {/* RIGHT: Form */}
              <div style={{
                flex: 1,
                padding: "40px 44px",
                display: "flex",
                flexDirection: "column",
                background: "#f5f3ef",
              }}>
                <p style={{ fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: "#c8a96e", marginBottom: 6 }}>
                  Step 2 of 2
                </p>
                <h3 style={{ fontSize: "1.4rem", fontWeight: 800, color: "#0f1e38", marginBottom: 28, lineHeight: 1.3 }}>
                  Your Details
                </h3>

                <div style={{ display: "flex", flexDirection: "column", gap: 20, maxWidth: 520 }}>
                  <div>
                    <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: "#4a5568", marginBottom: 6 }}>Full Name</label>
                    <Input
                      value={formData.patientName}
                      onChange={(e) => setFormData(p => ({ ...p, patientName: e.target.value }))}
                      placeholder="Your full name"
                      required
                      style={{ background: "#fff", border: "1.5px solid rgba(15,30,56,.14)", borderRadius: 10, height: 44 }}
                    />
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                    <div>
                      <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: "#4a5568", marginBottom: 6 }}>Age</label>
                      <Input
                        type="number"
                        value={formData.patientAge}
                        onChange={(e) => setFormData(p => ({ ...p, patientAge: e.target.value }))}
                        placeholder="30"
                        required
                        style={{ background: "#fff", border: "1.5px solid rgba(15,30,56,.14)", borderRadius: 10, height: 44 }}
                      />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: "#4a5568", marginBottom: 6 }}>Phone</label>
                      <Input
                        value={formData.patientPhone}
                        onChange={(e) => setFormData(p => ({ ...p, patientPhone: e.target.value }))}
                        placeholder="98XXXXXXXX"
                        required
                        style={{ background: "#fff", border: "1.5px solid rgba(15,30,56,.14)", borderRadius: 10, height: 44 }}
                      />
                    </div>
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: "#4a5568", marginBottom: 6 }}>Email Address</label>
                    <Input
                      type="email"
                      value={formData.buyerEmail}
                      onChange={(e) => setFormData(p => ({ ...p, buyerEmail: e.target.value }))}
                      placeholder="you@example.com"
                      required
                      style={{ background: "#fff", border: "1.5px solid rgba(15,30,56,.14)", borderRadius: 10, height: 44 }}
                    />
                  </div>

                  {/* Pay button */}
                  <button
                    type="button"
                    onClick={handlePay}
                    disabled={isLoading || !formFilled}
                    style={{
                      marginTop: 8,
                      width: "100%",
                      height: 52,
                      borderRadius: 12,
                      border: "none",
                      cursor: isLoading || !formFilled ? "not-allowed" : "pointer",
                      background: isLoading || !formFilled
                        ? "#e8e4de"
                        : "linear-gradient(135deg,#c8a96e 0%,#a88b50 100%)",
                      color: isLoading || !formFilled ? "#a0a8b4" : "#0f1e38",
                      fontSize: "0.95rem",
                      fontWeight: 700,
                      letterSpacing: "0.02em",
                      boxShadow: isLoading || !formFilled ? "none" : "0 4px 18px rgba(200,169,110,.35)",
                      transition: "all .16s ease",
                    }}
                  >
                    {isLoading ? "Processing…" : "🔒  Pay Securely"}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── FOOTER ── */}
        <div
          className="flex-shrink-0 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 px-5 py-4"
          style={{ borderTop: "1px solid rgba(15,30,56,.09)", background: "#fff" }}
        >
          {step === "schedule" ? (
            <>
              <div className="text-sm" style={{ color: "#6b7a96" }}>
                {canProceed ? (
                  <div
                    className="flex items-center gap-2 flex-wrap"
                    style={{
                      background: "rgba(200,169,110,.08)",
                      border: "1px solid rgba(200,169,110,.25)",
                      borderRadius: 10,
                      padding: "6px 12px",
                    }}
                  >
                    <span style={{ fontSize: "0.65rem", fontWeight: 700, padding: "2px 8px", borderRadius: 20, background: "rgba(200,169,110,.2)", color: "#a88b50", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                      Selected
                    </span>
                    <span className="font-semibold" style={{ color: "#0f1e38" }}>{selDateDisplay}</span>
                    <span style={{ color: "#9aa3b0" }}>·</span>
                    <span className="font-bold" style={{ color: "#a88b50" }}>{selTimeDisplay}</span>
                  </div>
                ) : (
                  <span className="text-slate-400 text-xs">Select a date and time to continue</span>
                )}
              </div>

              <div className="flex gap-2 flex-shrink-0">
                <button
                  type="button"
                  onClick={handleClose}
                  style={{
                    padding: "7px 18px", borderRadius: 8, border: "1.5px solid rgba(15,30,56,.18)",
                    background: "#fff", color: "#0f1e38", fontSize: "0.85rem", fontWeight: 600, cursor: "pointer",
                  }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => { if (canProceed) setStep("details"); }}
                  disabled={!canProceed}
                  style={{
                    padding: "7px 18px", borderRadius: 8, border: "none",
                    background: canProceed ? "#0f1e38" : "#d1d5db",
                    color: canProceed ? "#c8a96e" : "#9ca3af",
                    fontSize: "0.85rem", fontWeight: 700, cursor: canProceed ? "pointer" : "not-allowed",
                    transition: "all .14s ease",
                  }}
                >
                  {canProceed ? "Continue →" : "Select Date & Time"}
                </button>
              </div>
            </>
          ) : (
            <div style={{ width: "100%", display: "flex", justifyContent: "center" }}>
              <button
                type="button"
                onClick={() => setStep("schedule")}
                style={{
                  display: "flex", alignItems: "center", gap: 8,
                  padding: "10px 28px", borderRadius: 10,
                  border: "1.5px solid rgba(15,30,56,.18)",
                  background: "#fff", color: "#0f1e38",
                  fontSize: "0.9rem", fontWeight: 700, cursor: "pointer",
                  boxShadow: "0 2px 8px rgba(15,30,56,.08)",
                  transition: "all .15s ease",
                }}
                onMouseEnter={(e) => { const b = e.currentTarget as HTMLButtonElement; b.style.background = "#0f1e38"; b.style.color = "#c8a96e"; b.style.borderColor = "#0f1e38"; }}
                onMouseLeave={(e) => { const b = e.currentTarget as HTMLButtonElement; b.style.background = "#fff"; b.style.color = "#0f1e38"; b.style.borderColor = "rgba(15,30,56,.18)"; }}
              >
                <ChevronLeft className="h-4 w-4" />
                Back to Schedule
              </button>
            </div>
          )}
        </div>

      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}