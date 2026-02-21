// src/components/package-card.tsx
"use client";

import { useMemo, useState } from "react";
import { Check, Sparkles, Heart } from "lucide-react";
import type { UiPackage } from "@/types/package";
import { BookingModal } from "@/components/booking-modal";
import { formatMoneyCents } from "@/lib/money";

interface PackageCardProps {
  pkg: UiPackage;
  hospitalName: string;
  featured?: boolean;
}

export function PackageCard({ pkg, hospitalName, featured = false }: PackageCardProps) {
  const [showModal, setShowModal] = useState(false);

  const priceText = useMemo(() => {
    return formatMoneyCents(pkg.price, pkg.currency);
  }, [pkg.price, pkg.currency]);

  return (
    <>
      <div
        className={`group relative bg-white rounded-2xl border transition-all duration-300 hover:shadow-xl hover:-translate-y-1 overflow-hidden ${
          featured
            ? "border-[#c8a96e] shadow-lg shadow-[#c8a96e]/20"
            : "border-[#0f1e38]/10 hover:border-[#c8a96e]"
        }`}
      >
        {/* Featured Badge */}
        {featured && (
          <div className="absolute top-0 right-0 z-10">
            <div className="bg-gradient-to-br from-[#c8a96e] to-[#a88b50] text-[#0f1e38] px-4 py-1.5 rounded-bl-2xl flex items-center gap-1 shadow-lg">
              <Sparkles className="h-4 w-4" />
              <span className="text-xs font-bold">POPULAR</span>
            </div>
          </div>
        )}

        {/* Gradient Background Decoration */}
        <div
          className={`absolute top-0 left-0 right-0 h-32 bg-gradient-to-br opacity-5 ${
            featured
              ? "from-[#c8a96e] via-[#a88b50] to-[#c8a96e]/40"
              : "from-[#0f1e38] to-[#c8a96e]/30"
          }`}
        />

        {/* Card Content */}
        <div className="relative p-6">
          {/* Package Name */}
          <div className="mb-4">
            <h3 className="text-xl font-bold text-slate-900 mb-1">{pkg.name}</h3>
            <div className="h-1 w-12 rounded-full bg-gradient-to-r from-[#c8a96e] to-[#a88b50]" />
          </div>

          {/* Price Section */}
          <div className="mb-6">
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-bold text-[#c8a96e]">
                {priceText}
              </span>
              {pkg.discount && (
                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-green-50 text-green-700 border border-green-200">
                  {pkg.discount}
                </span>
              )}
            </div>
            <p className="text-sm text-slate-500 mt-1">One-time payment</p>
          </div>

          {/* Features List */}
          <div className="space-y-3 mb-6 min-h-[200px]">
            {pkg.features.map((feature, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-0.5">
                  <div className="h-5 w-5 rounded-full bg-[#c8a96e]/15 flex items-center justify-center">
                    <Check className="h-3 w-3 text-[#a88b50]" />
                  </div>
                </div>
                <span className="text-sm text-slate-700 leading-relaxed">{feature}</span>
              </div>
            ))}
          </div>

          {/* Book Button */}
          <button
            onClick={() => setShowModal(true)}
            className={`w-full rounded-xl py-3.5 text-sm font-semibold transition-all duration-300 shadow-md ${
              featured
                ? "bg-[#c8a96e] text-[#0f1e38] hover:bg-[#a88b50] hover:shadow-lg hover:shadow-[#c8a96e]/30 hover:scale-105"
                : "bg-[#0f1e38] text-[#c8a96e] hover:bg-[#1a3059] hover:shadow-lg"
            }`}
          >
            Book Now — {priceText}
          </button>
        </div>

        {/* Hover Effect Border */}
        <div className="absolute inset-0 rounded-2xl border-2 border-[#c8a96e] opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
      </div>

      <BookingModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        hospitalName={hospitalName}
        selectedPackage={pkg}
        packageId={pkg.id}
      />
    </>
  );
}
