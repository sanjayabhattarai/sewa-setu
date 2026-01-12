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
    <section id="how-it-works" className="py-24 bg-slate-50 scroll-mt-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8"></div>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-slate-900">How Sewa-Setu Works</h2>
          <p className="mt-4 text-lg text-slate-600">
            Three simple steps to ensure your parents' health.
          </p>
        </div>

        <div className="grid gap-12 md:grid-cols-3 relative">
          {/* Connector Line (Hidden on mobile) */}
          <div className="hidden md:block absolute top-12 left-[16%] right-[16%] h-0.5 bg-slate-200 -z-10" />

          {steps.map((step, index) => (
            <div key={index} className="relative flex flex-col items-center text-center group">
              <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-white border-4 border-slate-100 shadow-sm group-hover:border-blue-100 group-hover:scale-110 transition-all duration-300">
                <step.icon className="h-10 w-10 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-900">{step.title}</h3>
              <p className="mt-2 text-slate-600 max-w-xs">{step.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}