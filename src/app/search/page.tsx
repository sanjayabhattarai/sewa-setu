import { Navbar } from "@/components/navbar";
import { MapPin, Star, Phone } from "lucide-react";
import Link from "next/link";

// Mock Data: This acts like our database for now
const HOSPITALS = [
  {
    id: 1,
    name: "Norvic International Hospital",
    location: "Thapathali, Kathmandu",
    rating: 4.8,
    price: "Rs. 4,500",
    package: "Whole Body Checkup (Basic)",
    image: "https://images.unsplash.com/photo-1587351021759-3e566b9af9ef?auto=format&fit=crop&q=80&w=400",
  },
  {
    id: 2,
    name: "Grande International Hospital",
    location: "Tokha, Kathmandu",
    rating: 4.9,
    price: "Rs. 12,000",
    package: "Comprehensive Senior Care",
    image: "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&q=80&w=400",
  },
  {
    id: 3,
    name: "HAMS Hospital",
    location: "Dhumbarahi, Kathmandu",
    rating: 4.7,
    price: "Rs. 8,500",
    package: "Executive Health Package",
    image: "https://images.unsplash.com/photo-1516574187841-693018950317?auto=format&fit=crop&q=80&w=400",
  }
];

export default function SearchPage() {
  return (
    <main className="min-h-screen bg-gray-50">
      <Navbar />
      
      {/* Search Header */}
      <div className="bg-white border-b border-gray-200 py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-gray-900">Find a Hospital</h1>
          <p className="mt-2 text-gray-600">Compare prices and packages in Kathmandu</p>
          
          {/* Simple Search Bar */}
          <div className="mt-6 flex gap-2 max-w-xl">
            <input 
              type="text" 
              placeholder="Search by hospital name..." 
              className="flex-1 rounded-md border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none"
            />
            <button className="rounded-md bg-blue-600 px-6 py-2 font-medium text-white hover:bg-blue-700">
              Search
            </button>
          </div>
        </div>
      </div>

      {/* Hospital List */}
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {HOSPITALS.map((hospital) => (
            <div key={hospital.id} className="group relative overflow-hidden rounded-lg bg-white shadow-sm transition-all hover:shadow-md border border-gray-100">
              
              {/* Image Section */}
              <div className="h-48 w-full bg-gray-200 relative">
                {/* We use a standard img tag here for simplicity in the prototype */}
                <img 
                  src={hospital.image} 
                  alt={hospital.name}
                  className="h-full w-full object-cover"
                />
                <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-2 py-1 rounded text-xs font-bold flex items-center gap-1">
                  <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                  {hospital.rating}
                </div>
              </div>

              {/* Content Section */}
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600">
                  {hospital.name}
                </h3>
                
                <div className="mt-2 flex items-center text-sm text-gray-500">
                  <MapPin className="mr-1.5 h-4 w-4 text-gray-400" />
                  {hospital.location}
                </div>

                <div className="mt-4 rounded-md bg-blue-50 p-3">
                  <p className="text-xs font-medium text-blue-600 uppercase tracking-wide">
                    {hospital.package}
                  </p>
                  <p className="mt-1 text-lg font-bold text-gray-900">
                    {hospital.price}
                  </p>
                </div>

                <div className="mt-6">
                    <Link href={`/hospital/${hospital.id}`} className="block w-full">
                  <button className="w-full rounded-md bg-blue-600 py-2.5 text-center text-sm font-semibold text-white shadow-sm hover:bg-blue-500">
                    View Details
                  </button>
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}