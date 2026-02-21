// src/components/package-accordion.tsx
"use client";

import { useMemo, useState } from "react";
import { Check, ChevronDown, ChevronUp } from "lucide-react";
import type { UiPackage } from "@/types/package";
import { BookingModal } from "@/components/booking-modal";
import { formatMoneyCents } from "@/lib/money";

interface PackageAccordionProps {
  pkg: UiPackage;
  index: number;
  hospitalName: string;
}

export function PackageAccordion({ pkg, index, hospitalName }: PackageAccordionProps) {
  const [isOpen, setIsOpen] = useState(index === 1);
  const [showModal, setShowModal] = useState(false);

  // ✅ price formatter for cents + currency
  const priceText = useMemo(() => {
    return formatMoneyCents(pkg.price, pkg.currency);
  }, [pkg.price, pkg.currency]);

  return (
    <>
      <div className="border border-[#0f1e38]/10 rounded-2xl bg-white overflow-hidden shadow-sm transition-all duration-300 mb-4 hover:border-[#c8a96e] hover:shadow-md">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-full flex items-center justify-between p-6 text-left"
        >
          <div className="flex items-center gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#c8a96e]/15 text-[#a88b50] font-bold text-lg">
              {index + 1}
            </div>

            <div>
              <h3 className="font-semibold text-[#0f1e38]">{pkg.name}</h3>

              <div className="flex items-center gap-2 mt-0.5">
                {/* ✅ EURO display */}
                <span className="text-xl font-bold text-[#c8a96e]">{priceText}</span>

                {pkg.discount && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-700 border border-green-100">
                    {pkg.discount}
                  </span>
                )}
              </div>
            </div>
          </div>

          {isOpen ? (
            <ChevronUp className="h-5 w-5 text-[#c8a96e]" />
          ) : (
            <ChevronDown className="h-5 w-5 text-[#c8a96e]" />
          )}
        </button>

        {isOpen && (
          <div className="px-6 pb-6 pt-0 animate-in slide-in-from-top-2">
            <div className="h-px w-full bg-[#0f1e38]/5 mb-4" />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
              {pkg.features.map((feature, i) => (
                <div key={i} className="flex items-center gap-2 text-sm text-[#0f1e38]/70">
                  <Check className="h-4 w-4 text-green-500 shrink-0" />
                  {feature}
                </div>
              ))}
            </div>

            <button
              onClick={() => setShowModal(true)}
              className="w-full sm:w-auto rounded-lg bg-[#0f1e38] px-6 py-2.5 text-sm font-semibold text-[#c8a96e] hover:bg-[#1a3059] transition-colors shadow-md"
            >
              {/* ✅ EURO display */}
              Book Now — {priceText}
            </button>
          </div>
        )}
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