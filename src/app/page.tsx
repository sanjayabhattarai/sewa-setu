import { Navbar } from "@/components/navbar";
import { HeroSection } from "@/components/herosection";
import { HowItWorks } from "@/components/howitworks";
import { Footer } from "@/components/footer";
import { HospitalCard } from "@/components/hospital-card";
import { TrustSection } from "@/components/trust-section";
import { WhyChooseUsSection } from "@/components/why-choose-us";
import { TestimonialsSection } from "@/components/testimonials-section";
import { FAQSection } from "@/components/faq-section";
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
      
      {/* Trust Section with Stats */}
      <TrustSection />
      
      {/* How It Works */}
      <HowItWorks />

      {/* Why Choose Us */}
      <WhyChooseUsSection />

      {/* Top Rated Hospitals */}
      <section className="py-24 bg-slate-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between mb-12">
            <div>
              <h2 className="text-3xl font-bold text-slate-900">
                Top Rated Hospitals
              </h2>
              <p className="mt-2 text-slate-600">
                Trusted by thousands of families. Book your checkup today.
              </p>
            </div>
            <Link
              href="/search"
              className="hidden sm:flex items-center text-blue-600 font-semibold hover:gap-2 transition-all"
            >
              View All <ArrowRight className="ml-1 h-4 w-4" />
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

      {/* Testimonials */}
      <TestimonialsSection />

      {/* FAQ */}
      <FAQSection />

      {/* Final CTA Section */}
      <section className="py-24 bg-gradient-to-r from-blue-600 to-indigo-600">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Ready to Take Care of Your Family's Health?
          </h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Join thousands of families who trust Sewa-Setu for hassle-free healthcare management
          </p>
          <Link
            href="/search"
            className="inline-flex items-center gap-2 px-8 py-4 bg-white text-blue-600 font-semibold rounded-xl hover:bg-blue-50 transition-all transform hover:scale-105"
          >
            Start Booking Now
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      <Footer />
    </main>
  );
}
