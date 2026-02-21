"use client";

import type { ApiHospitalDetails } from "@/types/hospital-details";
import { HospitalCTA } from "./hospital-cta";
import { HospitalTabs } from "./HospitalTabs";

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
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Plus+Jakarta+Sans:wght@500;600;700&display=swap');

        /* ── Design tokens ──────────────────────────────── */
        .hdc-root {
          --navy:         #0f1e38;
          --navy-mid:     #1a3059;
          --navy-soft:    #243f6b;
          --navy-ghost:   rgba(15,30,56,.06);
          --gold:         #c8a96e;
          --gold-lt:      #dfc08a;
          --gold-dim:     #a88b50;
          --gold-pale:    rgba(200,169,110,.10);
          --gold-border:  rgba(200,169,110,.28);
          --cream:        #f7f4ef;
          --white:        #ffffff;
          --ink:          #0f1e38;
          --ink-mid:      #3d506e;
          --ink-soft:     #6b7a96;
          --ink-ghost:    #9aaac0;
          --border:       rgba(15,30,56,.09);
          --sh-sm:        0 2px 10px rgba(15,30,56,.06);
          --sh-md:        0 6px 28px rgba(15,30,56,.10);
          --sh-lg:        0 20px 64px rgba(15,30,56,.16);
          --r:            20px;
          --r-sm:         12px;
          --r-xs:         8px;
          --page-max:     1280px;
          --page-pad:     clamp(1rem, 4vw, 3rem);

          font-family: 'Inter', sans-serif;
          color: var(--ink);
          background: var(--cream);
          -webkit-font-smoothing: antialiased;

          /* Fill the full page */
          min-height: 100vh;
          width: 100%;
          display: flex;
          flex-direction: column;
        }

        /* ── Ambient background ─────────────────────────── */
        .hdc-root::before {
          content: '';
          position: fixed; inset: 0;
          background:
            radial-gradient(ellipse 70% 45% at 15% 8%, rgba(200,169,110,.05) 0%, transparent 55%),
            radial-gradient(ellipse 55% 35% at 85% 92%, rgba(15,30,56,.04) 0%, transparent 55%);
          pointer-events: none; z-index: 0;
        }

        /* ── Page shell — full width, centered content ──── */
        .hdc-shell {
          flex: 1;
          width: 100%;
          position: relative;
          z-index: 1;
          display: flex;
          flex-direction: column;
        }

        /* ── Card — fills shell, no floating ───────────── */
        .hdc-card {
          flex: 1;
          display: flex;
          flex-direction: column;
          width: 100%;
          /* Subtle elevation so it reads as a surface */
          box-shadow: var(--sh-lg);
        }

        /* ── CTA bar ────────────────────────────────────── */
        .hdc-cta {
          position: relative; overflow: hidden;
          background: linear-gradient(118deg, var(--navy) 0%, var(--navy-mid) 48%, var(--navy-soft) 100%);
          padding: 1.75rem var(--page-pad);
          display: flex; align-items: center;
          justify-content: space-between;
          gap: 1.5rem; flex-wrap: wrap;
          /* Make inner content respect max-width */
        }
        .hdc-cta-inner {
          width: 100%;
          max-width: var(--page-max);
          margin: 0 auto;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 1.5rem;
          flex-wrap: wrap;
          position: relative;
          z-index: 1;
        }

        /* Mesh grid texture */
        .hdc-cta::before {
          content: ''; position: absolute; inset: 0;
          background-image:
            linear-gradient(rgba(255,255,255,.02) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,.02) 1px, transparent 1px);
          background-size: 36px 36px;
          pointer-events: none;
        }
        /* Glow orbs */
        .hdc-g1, .hdc-g2 {
          position: absolute; border-radius: 50%; pointer-events: none;
        }
        .hdc-g1 {
          width:320px; height:320px; top:-150px; right:80px;
          background: radial-gradient(circle, rgba(200,169,110,.17) 0%, transparent 65%);
        }
        .hdc-g2 {
          width:160px; height:160px; bottom:-90px; left:12%;
          background: radial-gradient(circle, rgba(200,169,110,.09) 0%, transparent 65%);
        }
        /* Top gold rule */
        .hdc-cta-rule {
          position: absolute; top:0; left:0; right:0; height:1px;
          background: linear-gradient(90deg,
            transparent 0%, rgba(200,169,110,.7) 35%,
            rgba(200,169,110,.7) 65%, transparent 100%);
        }
        /* Identity block */
        .hdc-cta-id {
          display:flex; flex-direction:column; gap:.3rem;
        }
        .hdc-eyebrow {
          display:flex; align-items:center; gap:.5rem;
          font-size:.6rem; font-weight:600;
          letter-spacing:.2em; text-transform:uppercase;
          color:var(--gold); opacity:.85;
        }
        .hdc-eyebrow::before {
          content:''; display:inline-block;
          width:18px; height:1px; background:var(--gold); opacity:.5;
        }
        .hdc-hospname {
          font-family:'Plus Jakarta Sans', sans-serif;
          font-size: clamp(1rem, 2.4vw, 1.3rem);
          font-weight:700; color:var(--white);
          line-height:1.25; letter-spacing:-.01em;
        }

        /* ─── CTA button overrides ──────────────────────── */
        .hdc-cta button,
        .hdc-cta a[role="button"] {
          font-family:'DM Sans', sans-serif !important;
          font-weight:500 !important;
          border-radius: var(--r-xs) !important;
          transition: all .2s cubic-bezier(.22,1,.36,1) !important;
          position: relative !important;
          z-index: 1 !important;
        }
        /* Primary – gold fill */
        .hdc-cta button:first-of-type {
          background: linear-gradient(135deg, var(--gold) 0%, var(--gold-dim) 100%) !important;
          color: var(--navy) !important;
          border: none !important;
          box-shadow: 0 4px 16px rgba(200,169,110,.40), 0 1px 2px rgba(0,0,0,.18) !important;
        }
        .hdc-cta button:first-of-type:hover {
          background: linear-gradient(135deg, var(--gold-lt) 0%, var(--gold) 100%) !important;
          box-shadow: 0 6px 24px rgba(200,169,110,.52) !important;
          transform: translateY(-1px) !important;
        }
        /* Secondary – ghost gold */
        .hdc-cta button:last-of-type {
          background: rgba(200,169,110,.08) !important;
          color: var(--gold-lt) !important;
          border: 1px solid var(--gold-border) !important;
          box-shadow: none !important;
        }
        .hdc-cta button:last-of-type:hover {
          background: rgba(200,169,110,.16) !important;
          border-color: rgba(200,169,110,.55) !important;
          transform: translateY(-1px) !important;
        }

        /* ── Body — fills remainder, white surface ──────── */
        .hdc-body {
          flex: 1;
          position: relative;
          background: var(--white);
        }
        /* Gold left accent bar */
        .hdc-body::before {
          content:''; position:absolute;
          top:0; left:0; bottom:0; width:3px;
          background: linear-gradient(180deg, var(--gold) 0%, rgba(200,169,110,.18) 55%, transparent 100%);
          pointer-events:none; z-index:1;
        }
        /* Subtle inner shadow from CTA */
        .hdc-body::after {
          content:''; position:absolute;
          top:0; left:0; right:0; height:52px;
          background: linear-gradient(180deg, rgba(15,30,56,.025) 0%, transparent 100%);
          pointer-events:none;
        }
        .hdc-body-inner {
          position: relative; z-index: 1;
          max-width: var(--page-max);
          margin: 0 auto;
          padding: 2.5rem var(--page-pad) 4rem;
          width: 100%;
        }

        /* ── Section divider ────────────────────────────── */
        .hdc-divider {
          display:flex; align-items:center; gap:1rem;
          margin-bottom:2rem;
        }
        .hdc-div-l {
          flex:1; height:1px;
          background:linear-gradient(90deg, rgba(200,169,110,.4) 0%, transparent 100%);
        }
        .hdc-div-r {
          flex:1; height:1px;
          background:linear-gradient(90deg, transparent 0%, rgba(200,169,110,.4) 100%);
        }
        .hdc-div-mid {
          display:flex; flex-direction:column; align-items:center; gap:.3rem;
        }
        .hdc-div-label {
          font-size:.58rem; font-weight:600;
          letter-spacing:.22em; text-transform:uppercase;
          color:var(--gold-dim);
        }
        .hdc-div-gem {
          width:5px; height:5px;
          background:var(--gold); transform:rotate(45deg); opacity:.5;
        }

        /* ── Responsive ─────────────────────────────────── */
        @media (max-width:660px) {
          .hdc-body-inner { padding: 1.75rem 1.25rem 3rem; }
        }
      `}</style>

      <div className="hdc-root">
        <div className="hdc-shell">
          <div className="hdc-card">

            {/* CTA bar */}
            {hospital.phone && (
              <div className="hdc-cta">
                <span className="hdc-cta-rule" aria-hidden />
                <span className="hdc-g1" aria-hidden />
                <span className="hdc-g2" aria-hidden />

                <div className="hdc-cta-inner">
                  <div className="hdc-cta-id">
                    <span className="hdc-eyebrow">Healthcare Facility</span>
                    <span className="hdc-hospname">{hospital.name}</span>
                  </div>

                  <HospitalCTA
                    hospitalPhone={hospital.phone}
                    onBookAction={() => {
                      document.getElementById("services-section")?.scrollIntoView({ behavior: "smooth" });
                    }}
                  />
                </div>
              </div>
            )}

            {/* Body */}
            <div className="hdc-body">
              <div className="hdc-body-inner" id="services-section">
                <HospitalTabs
                  hospital={hospital}
                  packages={packages}
                  onBookDoctorAction={() => {}}
                />
              </div>
            </div>

          </div>
        </div>
      </div>
    </>
  );
}