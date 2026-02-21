import { Search, CalendarCheck, FileHeart } from "lucide-react";

const steps = [
  {
    icon: Search,
    title: "1. Find a Hospital",
    desc: "Browse top-rated hospitals in Kathmandu, Pokhara, or Lalitpur.",
  },
  {
    icon: CalendarCheck,
    title: "2. Book & Pay",
    desc: "Choose a checkup package and pay securely online from miles away.",
  },
  {
    icon: FileHeart,
    title: "3. Receive Report",
    desc: "Loves one visit the hospital. You get the digital report instantly.",
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="py-24 bg-[#0f1e38] scroll-mt-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-white">How Sewa-Setu Works</h2>
          <p className="mt-4 text-lg text-slate-300">
            Three simple steps to ensure your parents' health.
          </p>
        </div>

        <div className="grid gap-12 md:grid-cols-3 relative">
          {/* Connector Line */}
          <div className="hidden md:block absolute top-12 left-[16%] right-[16%] h-px bg-gradient-to-r from-transparent via-[rgba(200,169,110,0.4)] to-transparent -z-10" />

          {steps.map((step, index) => (
            <div key={index} className="relative flex flex-col items-center text-center group">
              <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-[rgba(200,169,110,0.1)] border-2 border-[rgba(200,169,110,0.25)] shadow-sm group-hover:border-[#c8a96e] group-hover:bg-[rgba(200,169,110,0.18)] group-hover:scale-110 transition-all duration-300">
                <step.icon className="h-10 w-10 text-[#c8a96e]" />
              </div>
              <h3 className="text-xl font-bold text-white">{step.title}</h3>
              <p className="mt-2 text-slate-300 max-w-xs">{step.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}