import { Navbar } from "@/components/navbar";
import { HeroSection } from "@/components/herosection";
import { HowItWorks } from "@/components/howitworks";
import { Footer } from "@/components/footer";
import { HospitalCard } from "@/components/hospital-card";
import { hospitals } from "@/data/hospital"; // Import our data
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export default function Home() {
  // Take only the first 3 hospitals for the homepage preview
  const featuredHospitals = hospitals.slice(0, 3);

  return (
    <main className="min-h-screen bg-white">
      <Navbar />
      
      {/* 1. Hero Section (Already built) */}
      <HeroSection />

      {/* 2. How It Works Section */}
      <HowItWorks />

      {/* 3. Featured Hospitals Section */}
      <section className="py-24 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between mb-12">
            <div>
              <h2 className="text-3xl font-bold text-slate-900">Top Rated Hospitals</h2>
              <p className="mt-2 text-slate-600">Trusted by hundreds of families this month.</p>
            </div>
            <Link href="/search" className="hidden sm:flex items-center text-blue-600 font-semibold hover:gap-2 transition-all">
              View All Hospitals <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </div>

          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {featuredHospitals.map((hospital, index) => (
              <HospitalCard key={hospital.id} hospital={hospital} index={index} />
            ))}
          </div>
          
          <div className="mt-12 text-center sm:hidden">
            <Link href="/search" className="inline-flex items-center text-blue-600 font-semibold">
              View All Hospitals <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* 4. Footer */}
      <Footer />
    </main>
  );
}