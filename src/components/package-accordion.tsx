"use client";

import { useState } from "react";
import { Check, ChevronDown, ChevronUp } from "lucide-react";
import { Package } from "@/data/hospital";

interface PackageAccordionProps {
  pkg: Package;
  index: number;
}

export function PackageAccordion({ pkg, index }: PackageAccordionProps) {
  // Default the second item to open (like in your screenshot), others closed
  const [isOpen, setIsOpen] = useState(index === 1);

  return (
    <div className="border border-slate-100 rounded-2xl bg-white overflow-hidden shadow-sm transition-all duration-300 mb-4">
      {/* Header (Always Visible) */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-6 text-left"
      >
        <div className="flex items-center gap-4">
          {/* Number Badge */}
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600 font-bold text-lg">
            {index + 1}
          </div>
          
          <div>
            <h3 className="font-semibold text-slate-900">{pkg.name}</h3>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-xl font-bold text-blue-500">€{pkg.price}</span>
              {pkg.discount && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-700 border border-green-100">
                  {pkg.discount}
                </span>
              )}
            </div>
          </div>
        </div>
        
        {isOpen ? <ChevronUp className="h-5 w-5 text-slate-400" /> : <ChevronDown className="h-5 w-5 text-slate-400" />}
      </button>

      {/* Expanded Content */}
      {isOpen && (
        <div className="px-6 pb-6 pt-0 animate-in slide-in-from-top-2">
          <div className="h-px w-full bg-slate-50 mb-4" />
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
            {pkg.features.map((feature, i) => (
              <div key={i} className="flex items-center gap-2 text-sm text-slate-600">
                <Check className="h-4 w-4 text-green-500 shrink-0" />
                {feature}
              </div>
            ))}
          </div>

          <button className="w-full sm:w-auto rounded-lg bg-blue-500 px-6 py-2.5 text-sm font-semibold text-white hover:bg-blue-600 transition-colors">
            Book Now - €{pkg.price}
          </button>
        </div>
      )}
    </div>
  );
}