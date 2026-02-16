import { Navbar } from "@/components/navbar";
import { HeroSection } from "@/components/herosection";
import { HowItWorks } from "@/components/howitworks";
import { Footer } from "@/components/footer";
import { HospitalCard } from "@/components/hospital-card";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { RecentBooking } from "@/components/recent-booking";
import { FloatingAI } from "@/components/floating-ai";
import type { ApiHospital } from "@/types/hospital";

export default async function Home() {
  const baseUrl =
    process.env.NEXT_PUBLIC_BASE_URL ||
    (process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : "http://localhost:3000");

  const res = await fetch(`${baseUrl}/api/hospitals`, {
    cache: "no-store",
  });

  const data = await res.json();
  const hospitals: ApiHospital[] = data?.hospitals ?? [];

  const featuredHospitals = hospitals.slice(0, 3);

  return (
    <main className="min-h-screen bg-white">
      <Navbar />
      <FloatingAI />

      <div className="pt-20">
        <RecentBooking />
      </div>

      <HeroSection />
      <HowItWorks />

      <section className="py-24 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between mb-12">
            <div>
              <h2 className="text-3xl font-bold text-slate-900">
                Top Rated Hospitals
              </h2>
              <p className="mt-2 text-slate-600">
                Trusted by hundreds of families this month.
              </p>
            </div>
            <Link
              href="/search"
              className="hidden sm:flex items-center text-blue-600 font-semibold hover:gap-2 transition-all"
            >
              View All Hospitals <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </div>

          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {featuredHospitals.map((hospital, index) => (
              <HospitalCard
                key={hospital.id}
                hospital={hospital}
                index={index}
              />
            ))}
          </div>

          <div className="mt-12 text-center sm:hidden">
            <Link
              href="/search"
              className="inline-flex items-center text-blue-600 font-semibold"
            >
              View All Hospitals <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}