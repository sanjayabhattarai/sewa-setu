"use client";

import React, { useRef, useState, useEffect } from "react";
import Link from "next/link";
import { motion, useScroll, useTransform, useSpring, useInView } from "framer-motion";
import {
  Search, Stethoscope, Calendar, FileText, MapPin, Clock, CheckCircle2,
  Sparkles, ArrowRight, Activity, Heart, Shield, Download, Phone, Video, Brain
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { MotionValue } from "framer-motion";

type Step = {
  id: 1 | 2 | 3;
  kicker: string;
  title: string;
  subtitle: string;
  body: string;
  ctaLabel: string;
  icon: LucideIcon;
};

const steps: Step[] = [
  {
    id: 1,
    kicker: "01 — Discover",
    title: "Find the right care",
    subtitle: "Search doctors, packages & care centres across Nepal.",
    body: "Browse verified health service providers across Kathmandu, Pokhara, Biratnagar, Butwal and beyond. Search manually or use the AI assistant to describe symptoms and find a better match.",
    ctaLabel: "Learn more: try Smart Search",
    icon: Search,
  },
  {
    id: 2,
    kicker: "02 — Book",
    title: "Book online. Skip the queue.",
    subtitle: "Reserve your slot in minutes — no walk-ins, no waiting.",
    body: "Pick a time, confirm your appointment, and pay securely online. Whether you're across town or across the world, your slot is locked. Show up when it's your turn.",
    ctaLabel: "Learn more: compare slots",
    icon: Calendar,
  },
  {
    id: 3,
    kicker: "03 — Receive",
    title: "Reports arrive before you can ask",
    subtitle: "Digital results, prescriptions and follow-ups — instantly.",
    body: "After your visit, lab reports, prescriptions and doctor notes sync to your Sewa-Setu dashboard automatically. Consult your doctor again by video in one tap.",
    ctaLabel: "Learn more: start booking",
    icon: FileText,
  },
];

const CENTRES = [
  { name: "SewaPoint Central",  area: "Thamel, Kathmandu",  rating: 4.9, wait: "Today" },
  { name: "Setu Care Lalitpur", area: "Pulchowk, Lalitpur", rating: 4.8, wait: "Tomorrow" },
  { name: "SewaPlus Pokhara",   area: "Lakeside, Pokhara",  rating: 4.7, wait: "In 2 days" },
];

const Backdrop = () => (
  <>
    <div className="absolute inset-0" style={{
      background: "radial-gradient(1200px 600px at 20% 0%, rgba(200,169,110,0.08), transparent 60%), radial-gradient(900px 500px at 85% 100%, rgba(200,169,110,0.06), transparent 55%), linear-gradient(180deg, #0A1628 0%, #0B1A31 50%, #0A1628 100%)"
    }} />
    <div className="absolute inset-0 opacity-[0.04] pointer-events-none" style={{
      backgroundImage: "radial-gradient(rgba(200,169,110,0.9) 1px, transparent 1px)",
      backgroundSize: "28px 28px"
    }} />
    <div className="absolute inset-0 pointer-events-none" style={{
      background: "radial-gradient(ellipse at center, transparent 40%, rgba(5,12,24,0.6) 100%)"
    }} />
  </>
);

function ProgressRail({ scrollYProgress }: { scrollYProgress: MotionValue<number> }) {
  const height = useTransform(scrollYProgress, [0, 1], ["0%", "100%"]);
  const smooth = useSpring(height, { stiffness: 90, damping: 25, mass: 0.5 });
  return (
    <div className="pointer-events-none absolute left-1/2 -translate-x-1/2 top-0 bottom-0 hidden lg:block">
      <div className="absolute left-1/2 -translate-x-1/2 top-0 bottom-0 w-px"
           style={{ background: "linear-gradient(180deg, transparent 0%, rgba(200,169,110,0.18) 8%, rgba(200,169,110,0.18) 92%, transparent 100%)" }} />
      <motion.div style={{ height: smooth }} className="absolute left-1/2 -translate-x-1/2 top-0 w-[2px]">
        <div className="w-full h-full" style={{
          background: "linear-gradient(180deg, rgba(200,169,110,0) 0%, #c8a96e 10%, #e8c987 50%, #c8a96e 90%, rgba(200,169,110,0) 100%)",
          boxShadow: "0 0 24px rgba(200,169,110,0.6), 0 0 48px rgba(200,169,110,0.3)"
        }} />
        <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full"
             style={{
               background: "radial-gradient(circle, #fde68a 0%, #c8a96e 50%, transparent 70%)",
               boxShadow: "0 0 20px rgba(232,201,135,0.9), 0 0 40px rgba(200,169,110,0.5)"
             }} />
      </motion.div>
    </div>
  );
}

const SearchVisual = () => {
  const [q, setQ] = useState("");
  const [matchIdx, setMatchIdx] = useState(0);
  const target = "fever · general physician · Pokhara";
  useEffect(() => {
    if (q.length < target.length) {
      const t = setTimeout(() => setQ(target.slice(0, q.length + 1)), 70);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setQ(""), 3200);
    return () => clearTimeout(t);
  }, [q]);
  useEffect(() => {
    const t = setInterval(() => setMatchIdx(i => (i + 1) % CENTRES.length), 2200);
    return () => clearInterval(t);
  }, []);
  return (
    <div className="relative w-full max-w-md">
      <div className="relative rounded-2xl backdrop-blur-xl overflow-hidden"
           style={{
             background: "linear-gradient(135deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02))",
             border: "1px solid rgba(200,169,110,0.22)",
             boxShadow: "0 20px 60px -20px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.05)"
           }}>
        <div className="flex items-center gap-3 px-5 py-4">
          <Search className="h-4 w-4 text-amber-300/80 shrink-0" />
          <div className="flex-1 text-sm text-white/90 font-light tracking-wide min-h-[20px]">
            {q}<span className="inline-block w-[1px] h-4 bg-amber-300/70 ml-0.5 animate-pulse align-middle" />
          </div>
        </div>
        <div className="px-5 pb-4 flex gap-2 flex-wrap">
          {["Symptom", "Doctor", "City", "Package"].map(tag => (
            <span key={tag} className="text-[10px] uppercase tracking-widest px-2.5 py-1 rounded-full"
                  style={{ background: "rgba(200,169,110,0.1)", color: "#e8c987", border: "1px solid rgba(200,169,110,0.2)" }}>
              {tag}
            </span>
          ))}
        </div>
      </div>
      <div className="mt-4 space-y-2.5">
        {CENTRES.map((c, i) => {
          const active = i === matchIdx;
          return (
            <motion.div key={c.name}
              animate={{ scale: active ? 1 : 0.97, opacity: active ? 1 : 0.55, x: active ? 0 : -4 }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="relative rounded-xl px-4 py-3.5 flex items-center gap-3"
              style={{
                background: active ? "linear-gradient(135deg, rgba(200,169,110,0.14), rgba(200,169,110,0.04))" : "rgba(255,255,255,0.02)",
                border: active ? "1px solid rgba(200,169,110,0.4)" : "1px solid rgba(255,255,255,0.06)",
                boxShadow: active ? "0 12px 40px -12px rgba(200,169,110,0.3)" : "none"
              }}>
              <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                   style={{ background: "rgba(200,169,110,0.12)", border: "1px solid rgba(200,169,110,0.25)" }}>
                <Stethoscope className="h-4 w-4 text-amber-300" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-white truncate">{c.name}</span>
                  {active && <CheckCircle2 className="h-3.5 w-3.5 text-amber-300 shrink-0" />}
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <MapPin className="h-3 w-3 text-white/40" />
                  <span className="text-[11px] text-white/50">{c.area}</span>
                  <span className="text-[11px] text-white/30">•</span>
                  <span className="text-[11px] text-amber-300/80">★ {c.rating}</span>
                </div>
              </div>
              <div className="text-right shrink-0">
                <div className="text-[10px] uppercase tracking-wider text-white/40">Next slot</div>
                <div className="text-xs font-medium text-white/80">{c.wait}</div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

const BookingVisual = () => {
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const dates = [12, 13, 14, 15, 16, 17, 18];
  const [selected, setSelected] = useState(2);
  const [slot, setSlot] = useState(1);
  const slots = ["9:00 AM", "11:30 AM", "2:00 PM", "4:30 PM"];
  useEffect(() => {
    const t = setInterval(() => { setSelected(s => (s + 1) % 7); setSlot(s => (s + 1) % 4); }, 2600);
    return () => clearInterval(t);
  }, []);
  return (
    <div className="w-full max-w-md space-y-3">
      <div className="rounded-2xl p-4 backdrop-blur-xl"
           style={{ background: "linear-gradient(135deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02))", border: "1px solid rgba(200,169,110,0.2)" }}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-[10px] uppercase tracking-widest text-amber-300/80 mb-1">SewaPoint Central</div>
            <div className="text-sm font-semibold text-white">Comprehensive Health Package</div>
            <div className="mt-2 flex items-center gap-3 text-[11px] text-white/50">
              <span className="flex items-center gap-1"><Activity className="h-3 w-3" /> 42 tests</span>
              <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> 2 hrs</span>
            </div>
          </div>
          <div className="text-right">
            <div className="text-[10px] uppercase text-white/40 tracking-widest">Total</div>
            <div className="text-lg font-bold text-amber-300">Rs 8,500</div>
            <div className="text-[10px] text-white/40">≈ $64 USD</div>
          </div>
        </div>
      </div>
      <div className="rounded-2xl p-4 backdrop-blur-xl"
           style={{ background: "linear-gradient(135deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02))", border: "1px solid rgba(200,169,110,0.2)" }}>
        <div className="flex items-center justify-between mb-3">
          <div className="text-xs font-semibold text-white/90">November 2025</div>
          <div className="flex items-center gap-1">
            <div className="w-1.5 h-1.5 rounded-full bg-amber-300" />
            <span className="text-[10px] text-white/60">Slots available</span>
          </div>
        </div>
        <div className="grid grid-cols-7 gap-1.5 mb-2">
          {days.map(d => <div key={d} className="text-[10px] text-center text-white/40 font-medium">{d}</div>)}
        </div>
        <div className="grid grid-cols-7 gap-1.5">
          {dates.map((date, i) => {
            const isSel = i === selected;
            return (
              <motion.div key={date} animate={{ scale: isSel ? 1.05 : 1 }}
                className="aspect-square rounded-lg flex items-center justify-center text-xs font-medium"
                style={{
                  background: isSel ? "linear-gradient(135deg, #c8a96e, #e8c987)" : "rgba(255,255,255,0.04)",
                  color: isSel ? "#0A1628" : "rgba(255,255,255,0.8)",
                  boxShadow: isSel ? "0 8px 24px -8px rgba(200,169,110,0.6)" : "none",
                  border: isSel ? "none" : "1px solid rgba(255,255,255,0.05)"
                }}>{date}</motion.div>
            );
          })}
        </div>
        <div className="mt-3 pt-3 border-t border-white/5">
          <div className="text-[10px] uppercase tracking-widest text-white/50 mb-2">Pick a time</div>
          <div className="grid grid-cols-4 gap-1.5">
            {slots.map((s, i) => (
              <motion.div key={s}
                animate={{ background: i === slot ? "rgba(200,169,110,0.18)" : "rgba(255,255,255,0.03)", borderColor: i === slot ? "rgba(200,169,110,0.45)" : "rgba(255,255,255,0.06)" }}
                className="px-2 py-1.5 rounded-md text-[10px] text-center font-medium border"
                style={{ color: i === slot ? "#fde68a" : "rgba(255,255,255,0.6)" }}>{s}
              </motion.div>
            ))}
          </div>
        </div>
      </div>
      <motion.div animate={{ opacity: [0.7, 1, 0.7] }} transition={{ duration: 2.4, repeat: Infinity }}
        className="rounded-xl px-4 py-3 flex items-center gap-3"
        style={{ background: "linear-gradient(90deg, rgba(34,197,94,0.08), rgba(200,169,110,0.05))", border: "1px solid rgba(34,197,94,0.25)" }}>
        <div className="w-7 h-7 rounded-full flex items-center justify-center" style={{ background: "rgba(34,197,94,0.18)" }}>
          <CheckCircle2 className="h-4 w-4 text-emerald-400" />
        </div>
        <div className="flex-1">
          <div className="text-xs font-semibold text-white">Slot confirmed — no queue when you arrive</div>
          <div className="text-[10px] text-white/50">Receipt sent to your phone & email</div>
        </div>
        <Shield className="h-3.5 w-3.5 text-emerald-400/70" />
      </motion.div>
    </div>
  );
};

const ReportVisual = () => {
  const metrics = [
    { label: "Blood Pressure", value: "118/76",   status: "Normal",     color: "#22c55e" },
    { label: "Blood Sugar",    value: "94 mg/dL",  status: "Normal",     color: "#22c55e" },
    { label: "Cholesterol",    value: "212 mg/dL", status: "Borderline", color: "#f59e0b" },
    { label: "Hemoglobin",     value: "14.2 g/dL", status: "Normal",     color: "#22c55e" },
  ];
  return (
    <div className="w-full max-w-md space-y-3">
      <motion.div initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }}
        className="rounded-xl px-4 py-3 flex items-center gap-3"
        style={{ background: "linear-gradient(90deg, rgba(200,169,110,0.14), rgba(200,169,110,0.04))", border: "1px solid rgba(200,169,110,0.35)" }}>
        <div className="relative">
          <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: "rgba(200,169,110,0.18)" }}>
            <Heart className="h-4 w-4 text-amber-300" />
          </div>
          <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-amber-300 animate-pulse" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-xs font-semibold text-white">Your report is ready</div>
          <div className="text-[10px] text-white/50">SewaPoint Central · 2 hours ago</div>
        </div>
        <Sparkles className="h-3.5 w-3.5 text-amber-300" />
      </motion.div>
      <div className="rounded-2xl p-5 backdrop-blur-xl"
           style={{ background: "linear-gradient(135deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02))", border: "1px solid rgba(200,169,110,0.22)", boxShadow: "0 20px 60px -20px rgba(0,0,0,0.5)" }}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="text-[10px] uppercase tracking-widest text-amber-300/80">Sewa-Setu Report</div>
            <div className="text-sm font-semibold text-white mt-0.5">Wellness Summary</div>
          </div>
          <button className="w-7 h-7 rounded-lg flex items-center justify-center"
                  style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}>
            <Download className="h-3.5 w-3.5 text-white/70" />
          </button>
        </div>
        <div className="space-y-2">
          {metrics.map((m, i) => (
            <motion.div key={m.label} initial={{ opacity: 0, y: 8 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }} transition={{ delay: i * 0.1 }}
              className="flex items-center justify-between py-2 border-b border-white/[0.04] last:border-0">
              <div className="flex items-center gap-2.5">
                <div className="w-1 h-8 rounded-full" style={{ background: m.color }} />
                <div>
                  <div className="text-[11px] text-white/50">{m.label}</div>
                  <div className="text-sm font-semibold text-white">{m.value}</div>
                </div>
              </div>
              <span className="text-[10px] uppercase tracking-wider px-2 py-1 rounded-full font-medium"
                    style={{ background: `${m.color}15`, color: m.color, border: `1px solid ${m.color}30` }}>
                {m.status}
              </span>
            </motion.div>
          ))}
        </div>
      </div>
      <div className="flex gap-2">
        <div className="flex-1 rounded-xl px-4 py-3 flex items-center gap-2.5 cursor-pointer"
             style={{ background: "linear-gradient(135deg, rgba(200,169,110,0.15), rgba(200,169,110,0.05))", border: "1px solid rgba(200,169,110,0.3)" }}>
          <Video className="h-4 w-4 text-amber-300" />
          <span className="text-xs font-medium text-white">Video follow-up</span>
        </div>
        <div className="flex-1 rounded-xl px-4 py-3 flex items-center gap-2.5 cursor-pointer"
             style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
          <Phone className="h-4 w-4 text-white/70" />
          <span className="text-xs font-medium text-white/80">Call doctor</span>
        </div>
      </div>
    </div>
  );
};

const visualMap: Record<Step["id"], () => React.JSX.Element> = {
  1: SearchVisual,
  2: BookingVisual,
  3: ReportVisual,
};

/* =========================================================================
   ACT ROW
   =========================================================================*/
function Act({ step, index }: { step: Step; index: number }) {
  const ref    = useRef<HTMLDivElement | null>(null);
  const inView = useInView(ref, { margin: "-30% 0px -30% 0px", once: false });
  const reversed = index % 2 === 1;
  const Visual = visualMap[step.id];
  const Icon   = step.icon;

  const CopyBlock = (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
      className={`relative ${reversed ? "lg:pl-20" : "lg:pr-20"}`}>
      <div
        aria-hidden="true"
        className="absolute -top-12 -left-2 z-0 select-none pointer-events-none lg:-top-24 lg:-left-6"
           style={{
             fontSize: "clamp(120px, 18vw, 220px)",
             fontFamily: "'Playfair Display', 'Cormorant Garamond', serif",
             fontWeight: 500,
             lineHeight: 0.8,
             color: "rgba(200,169,110,0.025)",
             WebkitTextStroke: "1px rgba(200,169,110,0.14)",
             letterSpacing: "0.015em",
             textShadow: "0 0 34px rgba(200,169,110,0.08)",
           }}>
        {String(step.id).padStart(2, "0")}
      </div>
      <div className="relative z-10">
        <div className="flex items-center gap-2 mb-5">
          <div className="h-px w-8 bg-amber-300/50" />
          <span className="text-[11px] font-semibold tracking-[0.3em] uppercase text-amber-300/80"
                style={{ fontFamily: "'Inter', sans-serif" }}>
            {step.kicker}
          </span>
        </div>
        <h3 className="text-4xl md:text-5xl lg:text-6xl font-light text-white leading-[1.05] mb-5 tracking-tight"
            style={{ fontFamily: "'Cormorant Garamond', 'Playfair Display', serif" }}>
          {step.title}
        </h3>
        <p className="text-lg text-amber-100/70 font-light mb-6 tracking-wide"
           style={{ fontFamily: "'Inter', sans-serif" }}>
          {step.subtitle}
        </p>
        <p className="text-base text-slate-300/80 leading-relaxed max-w-lg font-light"
           style={{ fontFamily: "'Inter', sans-serif" }}>
          {step.body}
        </p>
        {step.id === 1 && (
          <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-amber-300/20 bg-amber-300/[0.06] px-3.5 py-2 text-xs font-medium text-amber-100/75"
               style={{ fontFamily: "'Inter', sans-serif" }}>
            <Brain className="h-3.5 w-3.5 text-amber-300/85" />
            AI Smart Search can suggest hospitals from symptoms.
          </div>
        )}
        <motion.div whileHover={{ x: 4 }} className="inline-flex mt-8">
          <Link href="/search" className="inline-flex items-center gap-2 text-sm text-amber-300/90 group">
            <span className="font-medium tracking-wide">{step.ctaLabel}</span>
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            <div className="h-px w-8 bg-amber-300/40 group-hover:w-16 transition-all" />
          </Link>
        </motion.div>
      </div>
    </motion.div>
  );

  const VisualBlock = (
    <motion.div
      initial={{ opacity: 0, y: 60, scale: 0.95 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1], delay: 0.15 }}
      className={`relative flex ${reversed ? "lg:justify-end" : "lg:justify-start"}`}>
      <div className="absolute inset-0 blur-3xl opacity-30 pointer-events-none"
           style={{ background: `radial-gradient(circle at center, ${step.id === 1 ? "#c8a96e" : step.id === 2 ? "#e8a56e" : "#a6d4a8"}, transparent 60%)` }} />
      <div className="relative w-full flex justify-center"><Visual /></div>
    </motion.div>
  );

  return (
    <div ref={ref} className="relative py-20 lg:py-32 first:pt-8 lg:first:pt-16">
      <div className="hidden lg:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-20 items-center justify-center">
        <motion.div
          animate={{ scale: inView ? 1 : 0.6, opacity: inView ? 1 : 0.3 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="relative w-16 h-16 rounded-full flex items-center justify-center"
          style={{
            background: "linear-gradient(135deg, #0A1628, #0B1A31)",
            border: "1px solid rgba(200,169,110,0.5)",
            boxShadow: inView ? "0 0 40px rgba(200,169,110,0.5), 0 0 80px rgba(200,169,110,0.2), inset 0 1px 0 rgba(200,169,110,0.2)" : "none"
          }}>
          <Icon className="h-6 w-6 text-amber-300" strokeWidth={1.5} />
          <motion.div animate={{ rotate: 360 }} transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            className="absolute inset-0 rounded-full pointer-events-none"
            style={{ background: "conic-gradient(from 0deg, transparent, rgba(200,169,110,0.3), transparent 30%)" }} />
        </motion.div>
      </div>
      <div className="grid lg:grid-cols-2 gap-10 lg:gap-24 items-center">
        {reversed ? <>{VisualBlock}{CopyBlock}</> : <>{CopyBlock}{VisualBlock}</>}
      </div>
    </div>
  );
}

export function HowItWorks() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start 30%", "end 70%"],
  });

  return (
    <section id="how-it-works" className="relative overflow-hidden scroll-mt-20" style={{ background: "#0A1628" }}>
      <Backdrop />

      <div ref={containerRef} className="relative mx-auto max-w-7xl px-6 lg:px-8 py-24 lg:py-36">

        {/* ── HEADER ── */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
          className="text-center mb-20 lg:mb-28 relative">

          <h2 className="text-5xl md:text-6xl lg:text-7xl font-light text-white leading-[1.02] tracking-tight mb-6"
              style={{ fontFamily: "'Cormorant Garamond', 'Playfair Display', serif" }}>
            How Sewa-Setu works
            <br />
            <span className="italic" style={{
              background: "linear-gradient(120deg, #e8c987 0%, #fde68a 50%, #c8a96e 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text"
            }}>from search to reports.</span>
          </h2>

          <p className="text-lg text-slate-400 max-w-2xl mx-auto font-light leading-relaxed"
             style={{ fontFamily: "'Inter', sans-serif" }}>
            See how patients find verified care, choose an available appointment, confirm their booking, and receive reports digitally - all through one simple flow.
          </p>
        </motion.div>

        {/* ── Rail + Acts ── */}
        <div className="relative">
          <ProgressRail scrollYProgress={scrollYProgress} />
          <div className="space-y-0">
            {steps.map((s, i) => <Act key={s.id} step={s} index={i} />)}
          </div>
        </div>

        {/* ── Closing band ── */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.9 }}
          className="mt-24 lg:mt-32 text-center relative">
          <div className="relative mx-auto max-w-3xl px-8 py-9 md:px-12 rounded-3xl backdrop-blur-xl"
               style={{ background: "linear-gradient(135deg, rgba(200,169,110,0.08), rgba(200,169,110,0.02))", border: "1px solid rgba(200,169,110,0.25)" }}>
            {["top-0 left-0 border-t border-l","top-0 right-0 border-t border-r","bottom-0 left-0 border-b border-l","bottom-0 right-0 border-b border-r"].map((pos, i) => (
              <div key={i} className={`absolute ${pos} w-5 h-5`} style={{ borderColor: "#c8a96e" }} />
            ))}
            <p className="text-xs md:text-sm tracking-[0.3em] uppercase text-amber-300/80 mb-4"
               style={{ fontFamily: "'Inter', sans-serif" }}>
              Ready to try the flow?
            </p>
            <p className="text-3xl md:text-4xl text-white font-light"
               style={{ fontFamily: "'Cormorant Garamond', serif" }}>
              Find a hospital, choose a slot, and book with confidence.
            </p>
            <p className="mt-4 mx-auto max-w-xl text-sm md:text-base text-slate-300/75 leading-relaxed"
               style={{ fontFamily: "'Inter', sans-serif" }}>
              Browse verified hospitals and care centres across Nepal, compare available services, or let Smart Search guide you from symptoms to the right place.
            </p>
            <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                href="/search"
                className="inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-semibold text-[#0A1628] transition-transform hover:-translate-y-0.5"
                style={{ background: "linear-gradient(135deg, #fde68a, #c8a96e)", boxShadow: "0 18px 40px -20px rgba(253,230,138,0.8)" }}>
                Search hospitals
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/search"
                className="inline-flex items-center justify-center gap-2 rounded-full border border-amber-300/25 bg-white/[0.03] px-6 py-3 text-sm font-semibold text-amber-100/85 transition-transform hover:-translate-y-0.5 hover:bg-white/[0.06]">
                <Brain className="h-4 w-4 text-amber-300" />
                Try Smart Search
              </Link>
            </div>
          </div>
        </motion.div>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;1,400&family=Inter:wght@300;400;500;600;700&family=Playfair+Display:wght@500&display=swap');
      `}</style>
    </section>
  );
}

export default HowItWorks;