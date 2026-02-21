// src/app/hospital/[slug]/page.tsx

import { ArrowLeft, MapPin, Star, Building2, Stethoscope, Beaker } from "lucide-react";
import Link from "next/link";
import { ApiHospitalDetails } from "@/types/hospital-details";
import { HospitalDetailClient } from "./HospitalDetailClient";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function HospitalDetails({ params }: PageProps) {
  const { slug } = await params;

  const baseUrl =
    process.env.NEXT_PUBLIC_BASE_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");

  const res = await fetch(`${baseUrl}/api/hospitals/${slug}`, { cache: "no-store" });

  if (!res.ok) {
    return <div className="p-6">Hospital not found</div>;
  }

  const hospital = (await res.json()) as ApiHospitalDetails;

  // Map DB services -> UI packages (used by PackageAccordion)
  const packages = hospital.services.map((s) => ({
    id: s.id,
    name: s.name,
    price: s.price,
    discount: undefined as string | undefined,
    features: s.features?.length ? s.features : s.description ? [s.description] : [],
  }));

  return (
    <main className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        {/* Back Button */}
        <Link
          href="/search"
          className="inline-flex items-center text-sm text-slate-500 hover:text-slate-800 mb-6 transition-colors"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to hospitals
        </Link>

        {/* Main Card Container */}
        <div className="bg-white rounded-[2rem] overflow-hidden shadow-xl shadow-slate-200/50 border border-slate-100">
          {/* Hero */}
          <div className="relative h-80 sm:h-96 lg:h-[450px] w-full">
            <img
              src={hospital.image ?? "https://picsum.photos/seed/hospital-fallback/1200/800"}
              alt={hospital.name}
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />

            <div className="absolute bottom-0 left-0 w-full p-6 sm:p-8 text-white">
              {/* Type Badge */}
              <div className="mb-3 flex items-center gap-2">
                {hospital.type === "HOSPITAL" && <Building2 className="h-5 w-5" />}
                {hospital.type === "CLINIC" && <Stethoscope className="h-5 w-5" />}
                {hospital.type === "LAB" && <Beaker className="h-5 w-5" />}
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-white/30 backdrop-blur">
                  {hospital.type}
                </span>
              </div>

              {/* Tags */}
              <div className="flex flex-wrap gap-2 mb-4">
                {hospital.tags?.slice(0, 4).map((tag, i) => (
                  <span
                    key={tag}
                    className={`px-3 py-1 rounded-full text-xs font-semibold text-[#0f1e38] ${
                      i === 0 ? "bg-[#c8a96e]" : "bg-[#c8a96e]/70"
                    }`}
                  >
                    {tag}
                  </span>
                ))}
              </div>

              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-3 tracking-tight text-white drop-shadow-lg" style={{ textShadow: '0 4px 6px rgba(0, 0, 0, 0.7)' }}>
                {hospital.name}
              </h1>

              <div className="flex flex-wrap items-center gap-4 text-sm sm:text-base font-medium text-slate-200">
                <div className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  <span>{hospital.location.area}, {hospital.location.city}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4 text-orange-400 fill-orange-400" />
                  <span className="text-white">{hospital.rating.toFixed(1)}</span>
                  <span className="text-slate-300 font-normal">
                    ({hospital.reviewCount}+ reviews)
                  </span>
                </div>
              </div>
            </div>
          </div>

          <HospitalDetailClient hospital={hospital} packages={packages} />
        </div>
      </div>
    </main>
  );
}