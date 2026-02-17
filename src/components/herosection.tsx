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
    <section className="bg-gradient-to-b from-blue-50 via-indigo-50 to-white pt-32 pb-20 px-4 md:pt-40 md:pb-24 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-20 right-10 w-72 h-72 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
      <div className="absolute bottom-0 left-10 w-72 h-72 bg-indigo-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>

      <div className="container max-w-5xl mx-auto text-center relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-100 text-blue-700 text-sm font-medium mb-6">
            <Heart className="w-4 h-4 fill-blue-700" />
            For Nepalese families abroad
          </span>

          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-slate-900 leading-tight mb-6">
            Care for your family in Nepal,
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
              from miles away.
            </span>
          </h1>

          <p className="text-lg md:text-xl text-slate-600 max-w-2xl mx-auto mb-12 leading-relaxed">
            Book prepaid whole-body checkups and lab tests for your parents at
            Nepal&apos;s top hospitals. Priority service guaranteed.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
            <Link
              href="/search"
              className="inline-flex items-center gap-2 px-8 py-4 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-all transform hover:scale-105 shadow-lg"
            >
              <Search className="w-5 h-5" />
              Find Hospitals
              <ArrowRight className="w-4 h-4" />
            </Link>
            <motion.a
              href="#how-it-works"
              className="inline-flex items-center gap-2 px-8 py-4 bg-white text-blue-600 font-semibold rounded-xl border-2 border-blue-200 hover:border-blue-600 hover:bg-blue-50 transition-all"
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
                className="flex items-center gap-2 text-slate-600 bg-white px-4 py-2 rounded-full shadow-md border border-slate-200 hover:border-blue-300 hover:shadow-lg transition-all"
              >
                <feature.icon className="w-5 h-5 text-blue-600" />
                <span className="text-sm font-medium">{feature.text}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
