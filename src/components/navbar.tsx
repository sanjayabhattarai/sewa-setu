"use client";

import { Heart } from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";
import { SignedIn, SignedOut, UserButton } from "@clerk/nextjs";

export function Navbar() {
  return (
    <motion.header
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200"
    >
      <div className="container max-w-6xl mx-auto px-4 h-20 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-blue-400 flex items-center justify-center shadow-lg shadow-blue-200 transition-transform group-hover:scale-105">
            <Heart className="w-5 h-5 text-white fill-white" />
          </div>
          <span className="text-xl font-bold text-slate-900">
            Sewa<span className="text-blue-600">-Setu</span>
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-8">
          <Link href="/search" className="text-sm font-medium text-slate-500 hover:text-blue-600 transition-colors">
            Find Hospitals
          </Link>
          <Link href="/#how-it-works" className="text-sm font-medium text-slate-500 hover:text-blue-600 transition-colors">
            How It Works
          </Link>
          <Link href="/#contact" className="text-sm font-medium text-slate-500 hover:text-blue-600 transition-colors">
            Contact
          </Link>
        </nav>

        <div className="flex items-center gap-4">
          <span className="text-lg grayscale opacity-70 hover:grayscale-0 hover:opacity-100 transition-all cursor-help" title="Serving Global Nepalese">
            🌍
          </span>

          <SignedOut>
            <Link href="/sign-in">
              <button className="text-sm font-medium text-slate-600 hover:text-blue-600 transition-colors px-3 py-1.5">
                Sign In
              </button>
            </Link>
          </SignedOut>

          <SignedIn>
            <Link href="/profile" className="text-sm font-medium text-slate-500 hover:text-blue-600 transition-colors">
              Profile
            </Link>
            <UserButton afterSignOutUrl="/" />
          </SignedIn>

          {/* Get Started button for mobile/unauthenticated */}
          <SignedOut>
            <Link href="/sign-up">
              <button className="bg-slate-900 text-white px-5 py-2.5 rounded-full text-sm font-medium hover:bg-slate-800 transition-all hover:shadow-lg hover:-translate-y-0.5 hidden md:block">
                Get Started
              </button>
            </Link>
          </SignedOut>
          <SignedIn>
            <Link href="/search">
              <button className="bg-slate-900 text-white px-5 py-2.5 rounded-full text-sm font-medium hover:bg-slate-800 transition-all hover:shadow-lg hover:-translate-y-0.5 hidden md:block">
                Get Started
              </button>
            </Link>
          </SignedIn>
        </div>
      </div>
    </motion.header>
  );
}