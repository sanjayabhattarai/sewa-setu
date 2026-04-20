"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import Link from "next/link";
import { useState, useEffect } from "react";
import { SignedIn, SignedOut, useUser } from "@clerk/nextjs";
import { Menu, X, LayoutDashboard } from "lucide-react";

// ── Tokens (matches globals.css) ─────────────────────────────────────────────
// text-gold = #c8a96e  |  text-navy = #0f1e38  |  bg-navy-dark = #07111e
// gradient CTA: linear-gradient(135deg, #e8d5b0, #c8a96e, #a88b50)

const GOLD_GRADIENT = "linear-gradient(135deg, #e8d5b0, #c8a96e, #a88b50)";

// ── Hooks ─────────────────────────────────────────────────────────────────────

function useAdminHref() {
  const { isSignedIn } = useUser();
  const [href, setHref] = useState<string | null>(null);

  useEffect(() => {
    if (!isSignedIn) { setHref(null); return; }
    fetch("/api/admin/check")
      .then((r) => r.json())
      .then((d) => setHref(d.href ?? null))
      .catch(() => null);
  }, [isSignedIn]);

  return href;
}

// ── Sub-components ────────────────────────────────────────────────────────────

function NavAvatar() {
  const { user } = useUser();
  const initials = user?.fullName?.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2) ?? "U";
  return (
    <Link href="/profile">
      <div className="h-8 w-8 rounded-full overflow-hidden flex items-center justify-center cursor-pointer ring-2 ring-gold/40 hover:ring-gold transition-all bg-gold/15">
        {user?.imageUrl
          ? <img src={user.imageUrl} alt={user.fullName ?? ""} className="h-full w-full object-cover" />
          : <span className="text-[11px] font-black text-gold">{initials}</span>
        }
      </div>
    </Link>
  );
}

// Filled gold CTA button
function GoldButton({ children }: { children: React.ReactNode }) {
  return (
    <button
      className="text-sm font-bold text-navy px-5 py-2.5 rounded-xl transition-all duration-300 hover:shadow-lg hover:shadow-gold/30 hover:-translate-y-0.5 hover:scale-[1.02]"
      style={{ background: GOLD_GRADIENT }}
    >
      {children}
    </button>
  );
}

// Ghost button (border only) — for secondary actions
function GhostButton({ children }: { children: React.ReactNode }) {
  return (
    <button className="text-sm font-medium text-slate-300 hover:text-gold px-4 py-2 rounded-xl border border-white/20 hover:border-gold/50 hover:bg-gold/8 transition-all duration-200">
      {children}
    </button>
  );
}

// ── Nav links ─────────────────────────────────────────────────────────────────

const NAV_LINKS = [
  { label: "Find Hospitals", href: "/search" },
  { label: "How It Works",   href: "/#how-it-works" },
  { label: "Contact",        href: "/#contact" },
];

// ── Navbar ────────────────────────────────────────────────────────────────────

export function Navbar() {
  const [scrolled, setScrolled]     = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const adminHref                   = useAdminHref();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const closeMobile = () => setMobileOpen(false);

  return (
    <>
      <motion.header
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="fixed top-0 left-0 right-0 z-50 transition-all duration-500 bg-navy-dark"
        style={{
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          borderBottom: scrolled ? "1px solid rgba(200,169,110,0.2)" : "1px solid rgba(200,169,110,0.08)",
          boxShadow: scrolled ? "0 8px 32px rgba(0,0,0,0.35)" : "none",
        }}
      >
        {/* Ambient top line */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gold/50 to-transparent" />

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-[72px] flex items-center justify-between">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group shrink-0">
            <div className="transition-all duration-300 group-hover:drop-shadow-[0_0_12px_rgba(200,169,110,0.5)]">
              <Image
                src="/SewaSetu-Logo.png"
                alt="Sewa-Setu"
                width={150}
                height={105}
                className="h-[52px] w-auto object-contain transition-transform duration-300 group-hover:scale-105"
                priority
              />
            </div>
            <div>
              <span className="text-lg font-bold text-white leading-none">
                Sewa<span className="text-gold">-Setu</span>
              </span>
              <div className="text-[9px] text-slate-500 tracking-[0.15em] uppercase leading-none mt-0.5">
                For the people
              </div>
            </div>
          </Link>

          {/* Desktop nav links */}
          <nav className="hidden md:flex items-center gap-1">
            {NAV_LINKS.map(({ label, href }) => (
              <Link
                key={label}
                href={href}
                className="relative px-4 py-2 text-sm font-medium text-slate-300 hover:text-white transition-colors duration-200 group"
              >
                {label}
                <span className="absolute bottom-0 left-4 right-4 h-px opacity-0 group-hover:opacity-100 transition-all duration-300 bg-gradient-to-r from-transparent via-gold to-transparent" />
              </Link>
            ))}
          </nav>

          {/* Right side */}
          <div className="flex items-center gap-2">
            <span className="hidden sm:block text-base grayscale opacity-40 hover:grayscale-0 hover:opacity-100 transition-all duration-300 cursor-help mr-1" title="Serving Global Nepalese">
              🌍
            </span>
            <div className="hidden sm:block h-5 w-px mx-1 bg-white/10" />

            {/* Signed out */}
            <SignedOut>
              <Link href="/sign-in" className="hidden md:block">
                <button className="text-sm font-medium text-slate-300 hover:text-gold transition-colors duration-200 px-3 py-1.5">
                  Sign In
                </button>
              </Link>
              <Link href="/sign-up">
                <GhostButton>Sign Up</GhostButton>
              </Link>
              <Link href="/partner" className="hidden md:block">
                <GoldButton>For Hospitals</GoldButton>
              </Link>
            </SignedOut>

            {/* Signed in */}
            <SignedIn>
              {adminHref && (
                <Link href={adminHref} className="hidden md:block">
                  <button className="flex items-center gap-1.5 text-sm font-medium text-slate-300 hover:text-gold transition-colors duration-200 px-3 py-1.5">
                    <LayoutDashboard className="w-4 h-4" />
                    Admin
                  </button>
                </Link>
              )}
              <Link href="/search" className="hidden md:block">
                <GoldButton>Book Now</GoldButton>
              </Link>
              <NavAvatar />
            </SignedIn>

            {/* Mobile toggle */}
            <button
              className="md:hidden w-9 h-9 flex items-center justify-center rounded-lg bg-gold/8 border border-gold/15 transition-all duration-200"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label="Toggle menu"
            >
              {mobileOpen ? <X className="w-4 h-4 text-gold" /> : <Menu className="w-4 h-4 text-gold" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        <div
          className="md:hidden overflow-hidden transition-all duration-300 ease-in-out"
          style={{
            maxHeight: mobileOpen ? "360px" : "0px",
            borderTop: mobileOpen ? "1px solid rgba(200,169,110,0.12)" : "none",
          }}
        >
          <div className="px-4 py-4 flex flex-col gap-1 bg-navy-dark/98">
            {NAV_LINKS.map(({ label, href }) => (
              <Link key={label} href={href} onClick={closeMobile}
                className="px-4 py-3 text-sm font-medium text-slate-300 hover:text-white hover:bg-gold/5 rounded-lg transition-all duration-200">
                {label}
              </Link>
            ))}

            <div className="h-px my-2 bg-gold/10" />

            <SignedOut>
              <Link href="/partner" onClick={closeMobile}>
                <button className="w-full text-left px-4 py-3 text-sm font-medium text-gold hover:text-white hover:bg-gold/5 rounded-lg transition-all duration-200">
                  For Hospitals
                </button>
              </Link>
              <Link href="/sign-in" onClick={closeMobile}>
                <button className="w-full text-left px-4 py-3 text-sm font-medium text-slate-300 hover:text-white hover:bg-gold/5 rounded-lg transition-all duration-200">
                  Sign In
                </button>
              </Link>
              <Link href="/sign-up" onClick={closeMobile}>
                <button className="w-full mt-1 py-3 rounded-xl text-sm font-bold text-navy transition-all duration-200"
                  style={{ background: GOLD_GRADIENT }}>
                  Sign Up
                </button>
              </Link>
            </SignedOut>

            <SignedIn>
              <Link href="/profile" onClick={closeMobile}>
                <button className="w-full text-left px-4 py-3 text-sm font-medium text-slate-300 hover:text-white hover:bg-gold/5 rounded-lg transition-all duration-200">
                  Profile
                </button>
              </Link>
              {adminHref && (
                <Link href={adminHref} onClick={closeMobile}>
                  <button className="w-full text-left px-4 py-3 text-sm font-medium text-gold hover:text-white hover:bg-gold/5 rounded-lg transition-all duration-200 flex items-center gap-2">
                    <LayoutDashboard className="w-4 h-4" />
                    Admin Panel
                  </button>
                </Link>
              )}
              <Link href="/search" onClick={closeMobile}>
                <button className="w-full mt-1 py-3 rounded-xl text-sm font-bold text-navy transition-all duration-200"
                  style={{ background: GOLD_GRADIENT }}>
                  Book Now
                </button>
              </Link>
            </SignedIn>
          </div>
        </div>
      </motion.header>
    </>
  );
}
