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
    <section className="py-24 bg-[#f7f4ef]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-[#0f1e38] mb-4">
            Why Choose Sewa-Setu?
          </h2>
          <p className="text-lg text-[#6b7a96] max-w-2xl mx-auto">
            We simplify healthcare management for families abroad, making it easy to
            ensure your loved ones get the best care back home.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {benefits.map((benefit, index) => (
            <div
              key={index}
              className="group p-8 rounded-xl border border-[rgba(15,30,56,0.09)] bg-white hover:border-[rgba(200,169,110,0.45)] hover:shadow-lg hover:shadow-[rgba(15,30,56,0.07)] transition-all duration-300"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-[rgba(200,169,110,0.1)] border border-[rgba(200,169,110,0.2)] mb-4 group-hover:bg-[#0f1e38] transition-all">
                <benefit.icon className="h-6 w-6 text-[#a88b50] group-hover:text-[#c8a96e]" />
              </div>
              <h3 className="text-xl font-semibold text-[#0f1e38] mb-2">
                {benefit.title}
              </h3>
              <p className="text-[#6b7a96] leading-relaxed">
                {benefit.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
