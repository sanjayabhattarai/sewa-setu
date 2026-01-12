"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { MapPin, Star, ArrowRight } from "lucide-react";
import { Hospital } from "@/data/hospital";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

interface HospitalCardProps {
  hospital: Hospital;
  index: number;
}

export function HospitalCard({ hospital, index }: HospitalCardProps) {
  const [formattedPrice, setFormattedPrice] = useState<string>("...");

  useEffect(() => {
    const minPrice = Math.min(...hospital.packages.map((p) => p.price));
    
    const detectAndFormat = async () => {
      try {
        // 1. Fetch physical country from your server-side API
        const res = await fetch('/api/location');
        const { country } = await res.json();
        
        // 2. Map Country to Currency
        let currency = "EUR";
        if (country === "NP") currency = "NPR";
        if (country === "AU") currency = "AUD";
        if (country === "US") currency = "USD";

        // 3. Professional Formatting using Intl
        // Use 'en-US' or 'en-GB' for formatting style regardless of country code
        const formatter = new Intl.NumberFormat('en-US', {
          style: "currency",
          currency: currency,
          maximumFractionDigits: 0, 
        });

        setFormattedPrice(formatter.format(minPrice));
      } catch (err) {
        setFormattedPrice(`€${minPrice}`); // Simple fallback
      }
    };

    detectAndFormat();
  }, [hospital.packages]);

  const location = hospital.area 
    ? `${hospital.area}, ${hospital.city}` 
    : hospital.city;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4, delay: index * 0.1 }}
      className="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-slate-100"
    >
      {/* Hospital Image Section */}
      <div className="relative h-48 overflow-hidden">
        <img
          src={hospital.image}
          alt={hospital.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <div className="absolute bottom-3 left-3 flex gap-2 flex-wrap">
          {hospital.badges?.map((badge) => (
            <Badge
              key={badge}
              variant="secondary"
              className="bg-white/90 backdrop-blur-sm text-xs font-medium text-slate-900"
            >
              {badge}
            </Badge>
          ))}
        </div>
      </div>

      {/* Hospital Details Section */}
      <div className="p-5">
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className="font-semibold text-lg text-slate-900 line-clamp-1">
            {hospital.name}
          </h3>
          <div className="flex items-center gap-1 text-yellow-500 shrink-0">
            <Star className="w-4 h-4 fill-current" />
            <span className="text-sm font-medium text-slate-700">{hospital.rating}</span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-slate-500 mb-2">
          <MapPin className="w-4 h-4" />
          <span className="text-sm">{location}</span>
        </div>

        <p className="text-sm text-slate-500 mb-4 line-clamp-1">
          {hospital.specialty}
        </p>

        {/* Localized Price and Action Button */}
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-100">
          <span className="text-sm text-slate-500">
            From <span className="text-blue-600 font-bold text-lg">{formattedPrice}</span>
          </span>
          
          <Link href={`/hospital/${hospital.id}`}>
            <Button size="sm" className="gap-2 rounded-full">
              View Packages
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </div>
    </motion.div>
  );
}