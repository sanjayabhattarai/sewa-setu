import {
  Shield,
  Zap,
  Users,
  Award,
  Lock,
  Headphones,
} from "lucide-react";

const benefits = [
  {
    icon: Shield,
    title: "Trusted Network",
    description: "50+ verified hospitals and healthcare facilities",
  },
  {
    icon: Zap,
    title: "Quick Booking",
    description: "Book appointments in minutes, not days",
  },
  {
    icon: Lock,
    title: "Secure Payments",
    description: "International-grade encryption for your safety",
  },
  {
    icon: Award,
    title: "Top Quality",
    description: "Only partner with rated hospitals and clinics",
  },
  {
    icon: Users,
    title: "24/7 Support",
    description: "Our team is always here to help you",
  },
  {
    icon: Headphones,
    title: "Instant Reports",
    description: "Digital reports delivered within hours",
  },
];

export function WhyChooseUsSection() {
  return (
    <section className="py-24 bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-slate-900 mb-4">
            Why Choose Sewa-Setu?
          </h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            We simplify healthcare management for families abroad, making it easy to
            ensure your loved ones get the best care back home.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {benefits.map((benefit, index) => (
            <div
              key={index}
              className="group p-8 rounded-xl border border-slate-200 bg-gradient-to-br from-white to-slate-50 hover:border-blue-300 hover:shadow-lg transition-all duration-300"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100 mb-4 group-hover:bg-blue-600 group-hover:text-white transition-all">
                <benefit.icon className="h-6 w-6 text-blue-600 group-hover:text-white" />
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-2">
                {benefit.title}
              </h3>
              <p className="text-slate-600 leading-relaxed">
                {benefit.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
