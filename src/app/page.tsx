import { Navbar } from "@/components/navbar";
import { HeroSection } from "@/components/herosection";
import { HowItWorks } from "@/components/howitworks";
import { Footer } from "@/components/footer";
import { HospitalCard } from "@/components/hospital-card";
import { hospitals } from "@/data/hospital";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { RecentBooking } from "@/components/recent-booking";
import { FloatingAI } from "@/components/floating-ai";

export default function Home() {
  const featuredHospitals = hospitals.slice(0, 3);

  return (
    <main className="min-h-screen bg-white">
      <Navbar />
      <FloatingAI />

      {/* --- SPACER FOR FIXED NAVBAR --- */}
      {/* Since Navbar is usually h-16 (64px) or h-20 (80px), we add pt-20 here */}
      <div className="pt-20"> 
        <RecentBooking />
      </div>

    
      {/* 1. Hero Section */}
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