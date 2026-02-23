"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { ApiHospitalDetails } from "@/types/hospital-details";
import { HospitalCTA } from "./hospital-cta";
import { HospitalTabs } from "./HospitalTabs";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { FloatingAI } from "@/components/floating-ai";
import { ArrowLeft, Home, ChevronRight, Sparkles } from "lucide-react";
import Link from "next/link";

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
  const router = useRouter();
  const searchParams = useSearchParams();
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<string | null>(null);
  const [showDepartmentAlert, setShowDepartmentAlert] = useState(false);
  const [showBackToAI, setShowBackToAI] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);

  // Handle deep linking from AI chatbot
  useEffect(() => {
    const deptId = searchParams.get("department");
    const deptName = searchParams.get("deptName");
    const fromAI = searchParams.get("from") === "ai";
    const convId = searchParams.get("conversationId");
    
    if (deptId) {
      setSelectedDepartmentId(deptId);
      setShowDepartmentAlert(true);
      setShowBackToAI(!!fromAI);
      
      if (convId) {
        setConversationId(convId);
        console.log("[HospitalDetail] Received conversation ID:", convId);
      }
      
      // Scroll to departments section
      setTimeout(() => {
        const deptSection = document.getElementById("departments-section");
        if (deptSection) {
          deptSection.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }, 500);
    }
  }, [searchParams]);

  const handleDepartmentAlertClose = () => {
    setShowDepartmentAlert(false);
  };

  const handleGoBack = () => {
    router.back();
  };

  const handleBackToAI = () => {
    // Build the return URL with conversation ID
    let returnUrl = "/";
    const params = new URLSearchParams();
    
    params.set("openAI", "true");
    
    if (conversationId) {
      params.set("conversationId", conversationId);
      console.log("[HospitalDetail] Returning with conversation ID:", conversationId);
    }
    
    returnUrl += `?${params.toString()}`;
    router.push(returnUrl);
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Plus+Jakarta+Sans:wght@500;600;700&display=swap');

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

          font-family: 'Inter', sans-serif;
          color: var(--ink);
          background: var(--cream);
          -webkit-font-smoothing: antialiased;
        }

        /* Navigation Bar */
        .hdc-nav-wrapper {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          z-index: 100;
        }

        .hdc-main-content {
          padding-top: 80px; /* Height of navbar */
        }

        /* Breadcrumb Navigation */
        .hdc-breadcrumb {
          max-width: 980px;
          margin: 1rem auto 0;
          padding: 0 1.25rem;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.85rem;
          color: var(--ink-mid);
        }

        .hdc-breadcrumb a {
          color: var(--ink-mid);
          text-decoration: none;
          display: flex;
          align-items: center;
          gap: 0.25rem;
          transition: color 0.2s;
        }

        .hdc-breadcrumb a:hover {
          color: var(--gold);
        }

        .hdc-breadcrumb .separator {
          color: var(--ink-ghost);
          font-size: 0.75rem;
        }

        .hdc-breadcrumb .current {
          color: var(--gold);
          font-weight: 500;
        }

        /* Navigation Buttons */
        .hdc-nav-buttons {
          max-width: 980px;
          margin: 1rem auto 0.5rem;
          padding: 0 1.25rem;
          display: flex;
          align-items: center;
          gap: 1rem;
          flex-wrap: wrap;
        }

        .hdc-back-btn {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 1rem;
          background: white;
          border: 1px solid var(--border);
          border-radius: 100px;
          color: var(--ink);
          font-size: 0.85rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
          box-shadow: var(--sh-sm);
        }

        .hdc-back-btn:hover {
          border-color: var(--gold);
          color: var(--gold);
          transform: translateX(-2px);
          box-shadow: var(--sh-md);
        }

        .hdc-home-btn {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 1rem;
          background: var(--navy);
          border: 1px solid var(--navy);
          border-radius: 100px;
          color: var(--gold);
          font-size: 0.85rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
          box-shadow: var(--sh-sm);
          text-decoration: none;
        }

        .hdc-home-btn:hover {
          background: var(--navy-mid);
          transform: translateY(-2px);
          box-shadow: var(--sh-md);
        }

        .hdc-ai-return-btn {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 1rem;
          background: linear-gradient(135deg, rgba(200,169,110,0.1), rgba(15,30,56,0.05));
          border: 1px solid var(--gold-border);
          border-radius: 100px;
          color: var(--gold-dim);
          font-size: 0.85rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
          margin-left: auto;
        }

        .hdc-ai-return-btn:hover {
          background: rgba(200,169,110,0.15);
          border-color: var(--gold);
          color: var(--gold);
          transform: translateY(-2px);
        }

        .hdc-shell {
          max-width: 980px;
          margin: 0 auto;
          padding: 1rem 1.25rem 5rem;
          position: relative;
        }
        
        .hdc-shell::before {
          content: '';
          position: fixed; inset: 0;
          background:
            radial-gradient(ellipse 70% 45% at 15% 8%, rgba(200,169,110,.05) 0%, transparent 55%),
            radial-gradient(ellipse 55% 35% at 85% 92%, rgba(15,30,56,.04) 0%, transparent 55%);
          pointer-events: none; z-index: 0;
        }

        .hdc-card {
          position: relative; z-index: 1;
          border-radius: var(--r);
          border: 1px solid var(--border);
          overflow: hidden;
          box-shadow: var(--sh-lg), 0 1px 0 rgba(200,169,110,.12) inset;
          animation: hdc-rise .6s cubic-bezier(.22,1,.36,1) both;
        }
        
        @keyframes hdc-rise {
          from { opacity:0; transform:translateY(20px) scale(.997); }
          to   { opacity:1; transform:translateY(0) scale(1); }
        }

        .hdc-cta {
          position: relative; overflow: hidden;
          background: linear-gradient(118deg, var(--navy) 0%, var(--navy-mid) 48%, var(--navy-soft) 100%);
          padding: 1.75rem 2.5rem;
          display: flex; align-items: center;
          justify-content: space-between;
          gap: 1.5rem; flex-wrap: wrap;
        }
        
        .hdc-cta::before {
          content: ''; position: absolute; inset: 0;
          background-image:
            linear-gradient(rgba(255,255,255,.02) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,.02) 1px, transparent 1px);
          background-size: 36px 36px;
          pointer-events: none;
        }
        
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
        
        .hdc-cta-rule {
          position: absolute; top:0; left:0; right:0; height:1px;
          background: linear-gradient(90deg,
            transparent 0%, rgba(200,169,110,.7) 35%,
            rgba(200,169,110,.7) 65%, transparent 100%);
        }
        
        .hdc-cta-id {
          position: relative; z-index:1;
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

        .hdc-cta button,
        .hdc-cta a[role="button"] {
          font-family:'DM Sans', sans-serif !important;
          font-weight:500 !important;
          border-radius: var(--r-xs) !important;
          transition: all .2s cubic-bezier(.22,1,.36,1) !important;
          position: relative !important;
          z-index: 1 !important;
        }
        
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

        .hdc-body {
          position: relative;
          background: var(--white);
        }
        
        .hdc-body::before {
          content:''; position:absolute;
          top:0; left:0; bottom:0; width:3px;
          background: linear-gradient(180deg, var(--gold) 0%, rgba(200,169,110,.18) 55%, transparent 100%);
          pointer-events:none; z-index:1;
        }
        
        .hdc-body::after {
          content:''; position:absolute;
          top:0; left:0; right:0; height:52px;
          background: linear-gradient(180deg, rgba(15,30,56,.025) 0%, transparent 100%);
          pointer-events:none;
        }
        
        .hdc-body-inner {
          position:relative; z-index:1;
          padding: 2.5rem 2.75rem 3.5rem;
        }

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

        .hdc-ai-alert {
          background: linear-gradient(135deg, rgba(200,169,110,0.1), rgba(15,30,56,0.05));
          border-left: 4px solid var(--gold);
          border-radius: 8px;
          padding: 1rem 1.5rem;
          margin-bottom: 1.5rem;
          display: flex;
          align-items: center;
          justify-content: space-between;
          animation: slideDown 0.5s ease-out;
        }

        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .hdc-ai-alert-content {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .hdc-ai-icon {
          width: 40px;
          height: 40px;
          background: var(--gold);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--navy);
        }

        .hdc-ai-text {
          color: var(--navy);
        }

        .hdc-ai-text h4 {
          font-weight: 600;
          margin-bottom: 0.25rem;
        }

        .hdc-ai-text p {
          font-size: 0.9rem;
          color: var(--ink-mid);
        }

        .hdc-ai-close {
          background: none;
          border: none;
          color: var(--ink-mid);
          cursor: pointer;
          padding: 0.5rem;
          border-radius: 50%;
          transition: all 0.2s;
        }

        .hdc-ai-close:hover {
          background: rgba(0,0,0,0.05);
          color: var(--navy);
        }

        @media (max-width:660px) {
          .hdc-cta       { padding:1.5rem 1.25rem; }
          .hdc-body-inner{ padding:1.75rem 1.25rem 2.5rem; }
          .hdc-shell     { padding:0.5rem .75rem 4rem; }
          .hdc-nav-buttons { flex-wrap: wrap; }
          .hdc-ai-return-btn { margin-left: 0; width: 100%; }
        }
      `}</style>

      <div className="hdc-root">
        {/* Navbar */}
        <div className="hdc-nav-wrapper">
          <Navbar />
        </div>

        {/* Floating AI */}
        <FloatingAI />

        <div className="hdc-main-content">
          {/* Breadcrumb Navigation */}
          <div className="hdc-breadcrumb">
            <Link href="/">
              <Home size={14} />
              <span>Home</span>
            </Link>
            <span className="separator"><ChevronRight size={12} /></span>
            <Link href="/search">
              <span>Hospitals</span>
            </Link>
            <span className="separator"><ChevronRight size={12} /></span>
            <span className="current">{hospital.name}</span>
          </div>

          {/* Navigation Buttons */}
          <div className="hdc-nav-buttons">
            <button onClick={handleGoBack} className="hdc-back-btn">
              <ArrowLeft size={14} />
              Back
            </button>
            
            <Link href="/" className="hdc-home-btn">
              <Home size={14} />
              Home
            </Link>

            {showBackToAI && (
              <button 
                onClick={handleBackToAI} 
                className="hdc-ai-return-btn"
              >
                <Sparkles size={14} />
                Back to AI Recommendations
              </button>
            )}
          </div>

          <div className="hdc-shell">
            <div className="hdc-card">

              {/* AI Recommendation Alert */}
              {showDepartmentAlert && selectedDepartmentId && (
                <div className="hdc-ai-alert">
                  <div className="hdc-ai-alert-content">
                    <div className="hdc-ai-icon">
                      <Sparkles size={20} />
                    </div>
                    <div className="hdc-ai-text">
                      <h4>🎯 Recommended by Sewa-Setu AI</h4>
                      <p>Based on your symptoms, we've highlighted the relevant department below.</p>
                    </div>
                  </div>
                  <button 
                    className="hdc-ai-close" 
                    onClick={handleDepartmentAlertClose}
                    aria-label="Close"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M18 6L6 18M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              )}

              {/* CTA bar */}
              {hospital.phone && (
                <div className="hdc-cta">
                  <span className="hdc-cta-rule" aria-hidden />
                  <span className="hdc-g1" aria-hidden />
                  <span className="hdc-g2" aria-hidden />

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
              )}

              {/* Body */}
              <div className="hdc-body">
                <div className="hdc-body-inner" id="services-section">

                  <div className="hdc-divider" aria-hidden>
                    <div className="hdc-div-l" />
                    <div className="hdc-div-mid">
                      <span className="hdc-div-label">Services &amp; Information</span>
                      <span className="hdc-div-gem" />
                    </div>
                    <div className="hdc-div-r" />
                  </div>

                  <HospitalTabs
                    hospital={hospital}
                    packages={packages}
                    onBookDoctorAction={() => {}}
                    initialDepartmentId={selectedDepartmentId}
                  />
                </div>
              </div>

            </div>
          </div>

          
        </div>
      </div>
    </>
  );
}