"use client";

import { motion } from "framer-motion";
import { Heart, Shield, Clock, ArrowRight, Search } from "lucide-react";
import Link from "next/link";

const features = [
  { icon: Heart, text: "Trusted Hospitals" },
  { icon: Shield, text: "Secure Payments" },
  { icon: Clock, text: "Priority Service" },
];

export function HeroSection() {
  return (
    <section className="bg-[#0f1e38] pt-32 pb-20 px-4 md:pt-40 md:pb-24 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-20 right-10 w-96 h-96 rounded-full blur-3xl opacity-10" style={{background:'radial-gradient(circle, #c8a96e, transparent)'}}></div>
      <div className="absolute bottom-0 left-10 w-72 h-72 rounded-full blur-3xl opacity-8" style={{background:'radial-gradient(circle, #c8a96e, transparent)'}}></div>
      {/* Mesh grid */}
      <div className="absolute inset-0 opacity-5" style={{backgroundImage:'linear-gradient(rgba(255,255,255,.08) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.08) 1px, transparent 1px)', backgroundSize:'48px 48px'}}></div>

      <div className="container max-w-5xl mx-auto text-center relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[rgba(200,169,110,0.15)] text-[#c8a96e] border border-[rgba(200,169,110,0.3)] text-sm font-medium mb-6">
            <Heart className="w-4 h-4 fill-[#c8a96e]" />
            For Nepalese families abroad
          </span>

          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-white leading-tight mb-6">
            Care for your family in Nepal,
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#c8a96e] to-[#dfc08a]">
              from miles away.
            </span>
          </h1>

          <p className="text-lg md:text-xl text-slate-300 max-w-2xl mx-auto mb-12 leading-relaxed">
            Book prepaid whole-body checkups and lab tests for your parents at
            Nepal&apos;s top hospitals. Priority service guaranteed.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
            <Link
              href="/search"
              className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-[#c8a96e] to-[#a88b50] text-[#0f1e38] font-bold rounded-xl hover:shadow-xl hover:shadow-[rgba(200,169,110,0.4)] transition-all transform hover:scale-105"
            >
              <Search className="w-5 h-5" />
              Find Hospitals
              <ArrowRight className="w-4 h-4" />
            </Link>
            <motion.a
              href="#how-it-works"
              className="inline-flex items-center gap-2 px-8 py-4 bg-transparent text-[#c8a96e] font-semibold rounded-xl border-2 border-[rgba(200,169,110,0.4)] hover:border-[#c8a96e] hover:bg-[rgba(200,169,110,0.08)] transition-all"
              whileHover={{ scale: 1.05 }}
            >
              Learn More
              <ArrowRight className="w-4 h-4" />
            </motion.a>
          </div>

          {/* Features */}
          <div className="flex flex-wrap justify-center gap-4 md:gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={feature.text}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.2 + index * 0.1 }}
                className="flex items-center gap-2 text-slate-300 bg-[rgba(255,255,255,0.06)] px-4 py-2 rounded-full border border-[rgba(200,169,110,0.2)] hover:border-[rgba(200,169,110,0.5)] hover:text-[#c8a96e] transition-all"
              >
                <feature.icon className="w-5 h-5 text-[#c8a96e]" />
                <span className="text-sm font-medium">{feature.text}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
