"use client";

import { useMemo, useState } from "react";
import type { ApiHospitalDetails } from "@/types/hospital-details";
import { HospitalCTA } from "./hospital-cta";
import { HospitalTabs } from "./HospitalTabs";
import { HospitalBookingModal } from "./hospital-booking-modal";

type UiPackage = {
  id: string;
  name: string;
  price: number;
  discount?: string;
  features: string[];
};

type Props = {
  hospital: ApiHospitalDetails;
  packages: UiPackage[];
};

export function HospitalDetailClient({ hospital, packages }: Props) {
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [preselectedDoctorId, setPreselectedDoctorId] = useState<string | null>(null);

  const openBooking = (doctorId?: string) => {
    setPreselectedDoctorId(doctorId ?? null);
    setIsBookingOpen(true);
  };

  const closeBooking = () => {
    setIsBookingOpen(false);
    setPreselectedDoctorId(null);
  };

  const preselectedDoctor = useMemo(() => {
    if (!preselectedDoctorId) return null;
    return hospital.doctors.find((d) => d.id === preselectedDoctorId) ?? null;
  }, [hospital.doctors, preselectedDoctorId]);

  return (
    <>
      {/*
        ─────────────────────────────────────────────────────
        DESIGN TOKENS  (injected once at the root wrapper)
        ─────────────────────────────────────────────────────
        Palette:  deep navy + warm off-white + gold accent
        Feel:     clinical-luxury — precise, calm, trustworthy
        Font:     "Playfair Display" (headings) + "DM Sans" (body)
      */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;1,9..40,300&display=swap');

        .hdc-root {
          --hdc-navy:      #0f1e38;
          --hdc-navy-mid:  #1a3059;
          --hdc-navy-soft: #243f6b;
          --hdc-gold:      #c8a96e;
          --hdc-gold-dim:  #a88b50;
          --hdc-cream:     #f8f5f0;
          --hdc-white:     #ffffff;
          --hdc-muted:     #6b7a96;
          --hdc-border:    rgba(15,30,56,.10);
          --hdc-shadow-sm: 0 2px 12px rgba(15,30,56,.07);
          --hdc-shadow-md: 0 8px 32px rgba(15,30,56,.11);
          --hdc-shadow-lg: 0 20px 60px rgba(15,30,56,.14);
          --hdc-radius:    16px;
          --hdc-radius-sm: 10px;

          font-family: 'DM Sans', sans-serif;
          color: var(--hdc-navy);
          background: var(--hdc-cream);
        }

        /* ── CTA strip ──────────────────────────────────── */
        .hdc-cta-wrapper {
          position: relative;
          overflow: hidden;
          background: linear-gradient(110deg, var(--hdc-navy) 0%, var(--hdc-navy-mid) 55%, var(--hdc-navy-soft) 100%);
          border-radius: var(--hdc-radius) var(--hdc-radius) 0 0;
          padding: 1.5rem 2rem;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 1.25rem;
          flex-wrap: wrap;
          box-shadow: var(--hdc-shadow-md);
        }

        /* Decorative geometry behind CTA */
        .hdc-cta-wrapper::before,
        .hdc-cta-wrapper::after {
          content: '';
          position: absolute;
          border-radius: 50%;
          pointer-events: none;
        }
        .hdc-cta-wrapper::before {
          width: 260px; height: 260px;
          top: -90px; right: 120px;
          background: radial-gradient(circle, rgba(200,169,110,.18) 0%, transparent 70%);
        }
        .hdc-cta-wrapper::after {
          width: 160px; height: 160px;
          bottom: -70px; right: 30px;
          background: radial-gradient(circle, rgba(200,169,110,.13) 0%, transparent 70%);
        }

        /* Gold rule accent on top of CTA */
        .hdc-cta-accent-line {
          position: absolute;
          top: 0; left: 2rem; right: 2rem;
          height: 2px;
          background: linear-gradient(90deg, transparent, var(--hdc-gold), transparent);
          opacity: 0.7;
        }

        /* ── Body / tab area ────────────────────────────── */
        .hdc-body {
          position: relative;
          background: var(--hdc-white);
          border-radius: 0 0 var(--hdc-radius) var(--hdc-radius);
          box-shadow: var(--hdc-shadow-lg);
          overflow: hidden;
        }

        /* Thin gold left-border accent inside body */
        .hdc-body::before {
          content: '';
          position: absolute;
          top: 0; left: 0; bottom: 0;
          width: 3px;
          background: linear-gradient(180deg, var(--hdc-gold) 0%, transparent 100%);
          opacity: 0.45;
          pointer-events: none;
        }

        /* Inner padding area */
        .hdc-body-inner {
          padding: 2.5rem 2.5rem 3rem;
        }

        @media (max-width: 640px) {
          .hdc-cta-wrapper { padding: 1.25rem 1.25rem; border-radius: var(--hdc-radius-sm) var(--hdc-radius-sm) 0 0; }
          .hdc-body-inner  { padding: 1.5rem 1.25rem 2rem; }
        }

        /* ── Outer page chrome ──────────────────────────── */
        .hdc-page-shell {
          max-width: 960px;
          margin: 0 auto;
          padding: 2rem 1rem 4rem;
        }

        /* Subtle noise texture overlay on cream bg */
        .hdc-page-shell::before {
          content: '';
          position: fixed;
          inset: 0;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='300' height='300' filter='url(%23noise)' opacity='0.035'/%3E%3C/svg%3E");
          pointer-events: none;
          z-index: 0;
        }

        .hdc-card {
          position: relative;
          z-index: 1;
          border: 1px solid var(--hdc-border);
          border-radius: var(--hdc-radius);
          overflow: hidden;

          /* Entrance animation */
          animation: hdc-rise 0.55s cubic-bezier(0.22,1,0.36,1) both;
        }

        @keyframes hdc-rise {
          from { opacity: 0; transform: translateY(18px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        /* ── Section divider ────────────────────────────── */
        .hdc-section-divider {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          margin-bottom: 1.75rem;
        }
        .hdc-section-divider-line {
          flex: 1;
          height: 1px;
          background: linear-gradient(90deg, var(--hdc-gold) 0%, transparent 100%);
          opacity: 0.3;
        }
        .hdc-section-label {
          font-family: 'DM Sans', sans-serif;
          font-size: 0.65rem;
          font-weight: 500;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: var(--hdc-gold-dim);
        }
      `}</style>

      <div className="hdc-root">
        <div className="hdc-page-shell">
          <div className="hdc-card">

            {/* ── CTA strip ───────────────────────────────── */}
            {hospital.phone && (
              <div className="hdc-cta-wrapper">
                <span className="hdc-cta-accent-line" aria-hidden />
                <HospitalCTA
                  hospitalPhone={hospital.phone}
                  onBook={() => openBooking()}
                />
              </div>
            )}

            {/* ── Body with tabs ───────────────────────────── */}
            <div className="hdc-body">
              <div className="hdc-body-inner" id="services-section">

                {/* Decorative header above tabs */}
                <div className="hdc-section-divider" aria-hidden>
                  <div className="hdc-section-divider-line" />
                  <span className="hdc-section-label">Services &amp; Information</span>
                  <div
                    className="hdc-section-divider-line"
                    style={{ background: "linear-gradient(90deg, transparent 0%, var(--hdc-gold) 100%)" }}
                  />
                </div>

                <HospitalTabs
                  hospital={hospital}
                  packages={packages}
                  onBookDoctor={(doctorId) => openBooking(doctorId)}
                />
              </div>
            </div>

          </div>{/* /hdc-card */}
        </div>{/* /hdc-page-shell */}
      </div>{/* /hdc-root */}

      {/* ONE modal only — unchanged */}
      <HospitalBookingModal
        hospital={hospital}
        isOpen={isBookingOpen}
        onClose={closeBooking}
        preselectedDoctor={preselectedDoctor}
      />
    </>
  );
}