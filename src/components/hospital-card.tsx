"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { MapPin, Star, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import type { ApiHospital } from "@/types/hospital";

interface HospitalCardProps {
  hospital: ApiHospital;
  index: number;
}

export function HospitalCard({ hospital, index }: HospitalCardProps) {
  const [formattedPrice, setFormattedPrice] = useState<string>("...");

  useEffect(() => {
    try {
      const price = hospital.fromPrice;

      if (price == null) {
        setFormattedPrice("—");
        return;
      }

      const formatter = new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: hospital.currency || "NPR",
        maximumFractionDigits: 0,
      });

      setFormattedPrice(formatter.format(price));
    } catch {
      setFormattedPrice(
        hospital.fromPrice != null ? `${hospital.currency} ${hospital.fromPrice}` : "—"
      );
    }
  }, [hospital.fromPrice, hospital.currency]);

  const location = hospital.area ? `${hospital.area}, ${hospital.city}` : hospital.city;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4, delay: index * 0.1 }}
      className="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl hover:shadow-[rgba(15,30,56,0.1)] transition-all duration-300 border border-[rgba(15,30,56,0.07)] hover:border-[rgba(200,169,110,0.4)]"
    >
      <div className="relative h-48 overflow-hidden">
        <img
          src={hospital.image ?? "https://picsum.photos/seed/hospital-fallback/800/600"}
          alt={hospital.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />

        <div className="absolute bottom-3 left-3 flex gap-2 flex-wrap">
          <Badge
            variant="secondary"
            className="bg-white/90 backdrop-blur-sm text-xs font-medium text-slate-900"
          >
            {hospital.type}
          </Badge>
        </div>
      </div>

      <div className="p-5">
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className="font-semibold text-lg text-[#0f1e38] line-clamp-1">
            {hospital.name}
          </h3>
          <div className="flex items-center gap-1 text-yellow-500 shrink-0">
            <Star className="w-4 h-4 fill-current" />
            <span className="text-sm font-medium text-[#0f1e38]">{hospital.rating}</span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-[#6b7a96] mb-2">
          <MapPin className="w-4 h-4" />
          <span className="text-sm">{location}</span>
        </div>

        <p className="text-sm text-[#6b7a96] mb-4 line-clamp-1">
          {hospital.specialty}
        </p>

        <div className="flex items-center justify-between mt-4 pt-4 border-t border-[rgba(15,30,56,0.07)]">
          <span className="text-sm text-[#6b7a96]">
            From <span className="text-[#a88b50] font-bold text-lg">{formattedPrice}</span>
          </span>

          <Link href={`/hospital/${hospital.slug}`}>
            <Button size="sm" className="gap-2 rounded-full bg-[#0f1e38] text-[#c8a96e] hover:bg-[#1a3059] border-none">
              View Packages
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </div>
    </motion.div>
  );
}