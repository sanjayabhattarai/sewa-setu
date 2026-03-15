"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Heart, Shield, Zap, Globe, Search, ArrowRight, CalendarCheck } from "lucide-react";
import Link from "next/link";
import { LogoIntro } from "@/components/logo-intro";

const trustItems = [
  { icon: Heart, text: "Verified Hospitals" },
  { icon: Shield, text: "Secure Payments" },
  { icon: Zap, text: "Instant Appointment" },
  { icon: Globe, text: "Nationwide Access" },
];

export function HeroSection() {
  const [showIntro, setShowIntro] = useState(false);

  useEffect(() => {
    const seen = sessionStorage.getItem("ss-intro");
    if (!seen) setShowIntro(true);
  }, []);

  const handleIntroDone = () => {
    sessionStorage.setItem("ss-intro", "1");
    setShowIntro(false);
  };

  return (
    <>
      {showIntro && <LogoIntro onDoneAction={handleIntroDone} />}

      <section className="relative min-h-[92vh] overflow-hidden bg-[#0a1628] pt-5 sm:pt-6">

        {/* ─── LAYER 1 — Hero illustration, anchored right with feathered edges ─── */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/herosectionmain.svg"
          alt=""
          className="absolute right-0 top-1 h-full w-auto max-w-[75%] object-cover object-right"
          style={{
            maskImage:
              "linear-gradient(to right, transparent 0%, rgba(0,0,0,0.3) 15%, black 40%), linear-gradient(to bottom, transparent 0%, black 15%, black 85%, transparent 100%)",
            maskComposite: "intersect",
            WebkitMaskImage:
              "linear-gradient(to right, transparent 0%, rgba(0,0,0,0.3) 15%, black 40%), linear-gradient(to bottom, transparent 0%, black 15%, black 85%, transparent 100%)",
            WebkitMaskComposite: "source-in",
          }}
        />

        {/* ─── LAYER 2 — Gradient overlays for text readability ─── */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(to right, #0a1628 0%, #0a1628 25%, rgba(10,22,40,0.6) 50%, transparent 70%)",
          }}
        />
        {/* Top vignette for nav blending */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(to bottom, #0a1628 0%, transparent 25%)",
          }}
        />
        {/* Bottom vignette into flag wave */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(to top, #0a1628 0%, transparent 30%)",
          }}
        />

        {/* ─── Soft ambient glow ─── */}
        <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at 70% 40%, rgba(200,169,110,0.06) 0%, transparent 60%)" }} />

        {/* ─── LAYER 3 — Content overlay (left side) ─── */}
        <div className="relative z-10 flex min-h-[92vh] max-w-7xl items-center px-8 pt-28 pb-40 sm:px-10 md:pt-32 lg:px-12">
          <motion.div
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
            className="max-w-xl lg:max-w-2xl"
          >
            {/* Headline */}
            <h1 className="mb-5 text-4xl font-extrabold leading-[1.1] tracking-tight text-white sm:text-5xl md:text-6xl lg:text-7xl">
              Connecting Nepal
              <br />
              <span className="text-white">
                to Better Healthcare.
              </span>
            </h1>

            {/* Paragraph */}
            <p className="mb-8 max-w-lg text-base leading-relaxed text-slate-300 sm:text-lg">
              Sewa-Setu connects patients with trusted hospitals
              and doctors across Nepal. Search, compare and
              book appointments instantly from anywhere.
            </p>

            {/* CTA Buttons */}
            <div className="mb-8 flex flex-col items-start gap-4 sm:flex-row">
              <Link
                href="/search"
                className="inline-flex items-center gap-2.5 rounded-xl bg-[#dc2626] px-8 py-4 text-base font-bold text-white shadow-lg shadow-red-900/30 transition-all hover:scale-105 hover:bg-[#b91c1c] hover:shadow-xl hover:shadow-red-900/40"
              >
                <Search className="h-5 w-5" />
                Search Doctors
              </Link>

              <Link
                href="/book"
                className="inline-flex items-center gap-2.5 rounded-xl border-2 border-white/80 bg-white/90 px-8 py-4 text-base font-semibold text-[#0a1628] transition-all hover:bg-white"
              >
                <CalendarCheck className="h-5 w-5" />
                Book Appointment
              </Link>
            </div>

            {/* Trust items — 2×2 grid */}
            <div className="grid grid-cols-2 gap-x-6 gap-y-3">
              {trustItems.map((item, i) => (
                <motion.div
                  key={item.text}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.3 + i * 0.1 }}
                  className="flex items-center gap-2 text-sm text-white/90 sm:text-base"
                >
                  <item.icon className="h-5 w-5 shrink-0 text-[#dc2626]" />
                  <span className="font-medium">{item.text}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>
    </>
  );
}