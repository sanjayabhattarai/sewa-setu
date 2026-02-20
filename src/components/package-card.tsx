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
            ? "border-blue-500 shadow-lg shadow-blue-100/50"
            : "border-slate-200 hover:border-blue-300"
        }`}
      >
        {/* Featured Badge */}
        {featured && (
          <div className="absolute top-0 right-0 z-10">
            <div className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white px-4 py-1.5 rounded-bl-2xl flex items-center gap-1 shadow-lg">
              <Sparkles className="h-4 w-4" />
              <span className="text-xs font-bold">POPULAR</span>
            </div>
          </div>
        )}

        {/* Gradient Background Decoration */}
        <div
          className={`absolute top-0 left-0 right-0 h-32 bg-gradient-to-br opacity-5 ${
            featured
              ? "from-blue-500 via-indigo-500 to-purple-500"
              : "from-blue-400 to-cyan-400"
          }`}
        />

        {/* Card Content */}
        <div className="relative p-6">
          {/* Package Name */}
          <div className="mb-4">
            <h3 className="text-xl font-bold text-slate-900 mb-1">{pkg.name}</h3>
            <div className="h-1 w-12 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500" />
          </div>

          {/* Price Section */}
          <div className="mb-6">
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
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
                  <div className="h-5 w-5 rounded-full bg-blue-50 flex items-center justify-center">
                    <Check className="h-3 w-3 text-blue-600" />
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
                ? "bg-gradient-to-r from-blue-500 to-indigo-600 text-white hover:shadow-lg hover:shadow-blue-500/50 hover:scale-105"
                : "bg-slate-900 text-white hover:bg-slate-800 hover:shadow-lg"
            }`}
          >
            Book Now — {priceText}
          </button>
        </div>

        {/* Hover Effect Border */}
        <div className="absolute inset-0 rounded-2xl border-2 border-blue-500 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
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
