import { Navbar } from "@/components/navbar";
import { Check, ShieldCheck, MapPin } from "lucide-react";
import Link from "next/link";

// Mock Data (In a real app, this comes from a database)
const PACKAGES = [
  { name: "Full Body Checkup", price: "Rs. 4,500", features: ["Blood Count", "Sugar Fasting", "Liver Function", "Kidney Function"] },
  { name: "Comprehensive Senior Care", price: "Rs. 12,000", features: ["All Basic tests", "Echocardiography", "Thyroid Test", "Vitamin D & B12"] },
];

export default function HospitalDetails({ params }: { params: { id: string } }) {
  // In a real app, we would use params.id to fetch data from database
  // For now, we just hardcode the hospital name to show it works
  const hospitalId = params.id; 

  return (
    <main className="min-h-screen bg-gray-50">
      <Navbar />
      
      {/* Hospital Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Norvic International Hospital</h1>
              <div className="mt-2 flex items-center text-gray-500">
                <MapPin className="mr-2 h-5 w-5" />
                Thapathali, Kathmandu
              </div>
            </div>
            <div className="flex items-center gap-2 rounded-full bg-green-50 px-4 py-1 text-green-700">
              <ShieldCheck className="h-5 w-5" />
              <span className="text-sm font-medium">Verified Partner</span>
            </div>
          </div>
        </div>
      </div>

      {/* Packages Section */}
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-8">Available Checkup Packages</h2>
        
        <div className="grid gap-8 lg:grid-cols-2">
          {PACKAGES.map((pkg, index) => (
            <div key={index} className="rounded-xl bg-white p-8 shadow-sm border border-gray-100 hover:border-blue-500 transition-colors">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-gray-900">{pkg.name}</h3>
                <span className="text-xl font-bold text-blue-600">{pkg.price}</span>
              </div>
              
              <div className="mt-6 space-y-4">
                {pkg.features.map((feature, i) => (
                  <div key={i} className="flex items-center text-gray-600">
                    <Check className="mr-3 h-5 w-5 text-green-500" />
                    {feature}
                  </div>
                ))}
              </div>
<Link href="/book" className="block w-full mt-8">
              <button className="mt-8 w-full rounded-md bg-blue-600 py-3 text-white font-semibold hover:bg-blue-700">
                Book This Package
              </button>
                </Link>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}