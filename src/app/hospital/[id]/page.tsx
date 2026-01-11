import { ArrowLeft, MapPin, Star, Stethoscope } from "lucide-react";
import Link from "next/link";
import { hospitals } from "@/data/hospital";
import { PackageAccordion } from "@/components/package-accordion";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function HospitalDetails({ params }: PageProps) {
  const { id } = await params;
  const hospital = hospitals.find((h) => h.id === id);

  if (!hospital) {
    return <div>Hospital not found</div>;
  }

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
          
          {/* Hero Image Section (Matches screenshot exactly) */}
          <div className="relative h-64 sm:h-80 w-full">
            <img 
              src={hospital.image} 
              alt={hospital.name} 
              className="h-full w-full object-cover"
            />
            {/* Gradient Overlay for text readability */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
            
            {/* Content Over Image */}
            <div className="absolute bottom-0 left-0 w-full p-6 sm:p-8 text-white">
              {/* Tags */}
              <div className="flex flex-wrap gap-2 mb-3">
                {hospital.tags?.map((tag, i) => (
                  <span 
                    key={i} 
                    // Alternate colors to match screenshot: Blue vs Darker Blue
                    className={`px-3 py-1 rounded-full text-xs font-bold ${i === 0 ? 'bg-blue-500' : 'bg-sky-600'}`}
                  >
                    {tag}
                  </span>
                ))}
              </div>

              {/* Title */}
              <h1 className="text-3xl sm:text-4xl font-bold mb-2 tracking-tight">
                {hospital.name}
              </h1>

              {/* Subtitle Info */}
              <div className="flex items-center gap-4 text-sm sm:text-base font-medium text-slate-200">
                <div className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  {hospital.city}
                </div>
                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4 text-orange-400 fill-orange-400" />
                  <span className="text-white">{hospital.rating}</span>
                  <span className="text-slate-300 font-normal">({hospital.reviewCount}+ reviews)</span>
                </div>
              </div>
            </div>
          </div>

          {/* Body Content */}
          <div className="p-6 sm:p-8">
            
            {/* Specialty */}
            <div className="flex items-center gap-2 text-slate-700 mb-8 font-medium">
              <Stethoscope className="h-5 w-5 text-blue-500" />
              <span>Specialty: {hospital.specialty}</span>
            </div>

            {/* Packages Section */}
            <h2 className="text-xl font-bold text-slate-900 mb-6">
              Available Health Packages
            </h2>

            <div className="space-y-4">
              {hospital.packages.map((pkg, index) => (
                <PackageAccordion key={index} pkg={pkg} index={index} />
              ))}
            </div>

          </div>
        </div>
      </div>
    </main>
  );
}