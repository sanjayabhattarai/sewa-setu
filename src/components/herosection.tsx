"use client";

import { motion } from "framer-motion";
import { Heart, Shield, Clock } from "lucide-react";

const features = [
  { icon: Heart, text: "Trusted Hospitals" },
  { icon: Shield, text: "Secure Payments" },
  { icon: Clock, text: "Priority Service" },
];

export function HeroSection() {
  return (
    <section className="bg-gradient-to-b from-blue-50 to-white pt-32 pb-12 px-4 md:pt-40 md:pb-20">
      <div className="container max-w-5xl mx-auto text-center">
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

          <p className="text-lg md:text-xl text-slate-600 max-w-2xl mx-auto mb-10 leading-relaxed">
            Book prepaid whole-body checkups and lab tests for your parents at
            Nepal&apos;s top hospitals. Priority service guaranteed.
          </p>

          <div className="flex flex-wrap justify-center gap-6 mb-8">
            {features.map((feature, index) => (
              <motion.div
                key={feature.text}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.2 + index * 0.1 }}
                className="flex items-center gap-2 text-slate-600 bg-white px-4 py-2 rounded-full shadow-sm border border-slate-100"
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