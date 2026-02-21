import { CheckCircle, Heart, Users, Building2 } from "lucide-react";

const stats = [
  { icon: Users, label: "Families Served", value: "5000+" },
  { icon: Building2, label: "Hospitals", value: "50+" },
  { icon: Heart, label: "Checkups Completed", value: "12000+" },
  { icon: CheckCircle, label: "Satisfaction Rate", value: "98%" },
];

export function TrustSection() {
  return (
    <section className="py-20 bg-[#f7f4ef]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 sm:gap-12">
          {stats.map((stat, index) => (
            <div key={index} className="text-center group hover:scale-105 transition-transform duration-300">
              <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-white shadow-md mx-auto mb-4 group-hover:shadow-lg border border-[rgba(200,169,110,0.2)] group-hover:border-[rgba(200,169,110,0.5)] transition-all">
                <stat.icon className="h-7 w-7 text-[#a88b50]" />
              </div>
              <p className="text-3xl md:text-4xl font-bold text-[#0f1e38] mb-2">
                {stat.value}
              </p>
              <p className="text-[#6b7a96] font-medium text-sm md:text-base">
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
