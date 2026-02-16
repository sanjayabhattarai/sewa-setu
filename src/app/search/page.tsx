"use client";

import { useEffect, useMemo, useState } from "react";
import { Navbar } from "@/components/navbar";
import { HospitalCard } from "@/components/hospital-card";
import { Input } from "@/components/ui/input";
import { Search, MapPin } from "lucide-react";
import type { ApiHospital } from "@/types/hospital";

export default function SearchPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [selectedCity, setSelectedCity] = useState("All Cities");

  const [loading, setLoading] = useState(true);
  const [hospitals, setHospitals] = useState<ApiHospital[]>([]);
  const [error, setError] = useState<string | null>(null);

  // ✅ Debounce: wait 400ms after user stops typing
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(searchQuery.trim()), 400);
    return () => clearTimeout(t);
  }, [searchQuery]);

  // Build cities list from current DB results
  const cities = useMemo(() => {
    const set = new Set<string>();
    hospitals.forEach((h) => h.city && set.add(h.city));
    return Array.from(set).sort();
  }, [hospitals]);

  // ✅ Only fetch when debouncedQuery OR city changes
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams();
        if (debouncedQuery) params.set("q", debouncedQuery);
        if (selectedCity !== "All Cities") params.set("city", selectedCity);

        const res = await fetch(`/api/hospitals?${params.toString()}`, {
          cache: "no-store",
        });

        if (!res.ok) {
          throw new Error(`Failed to load hospitals (${res.status})`);
        }

        const data = await res.json();
        setHospitals(data?.hospitals ?? []);
      } catch (e: any) {
        setError(e?.message ?? "Something went wrong while loading hospitals.");
        setHospitals([]);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [debouncedQuery, selectedCity]);

  return (
    <main className="min-h-screen bg-slate-50">
      <Navbar />

      {/* Header & Search Section */}
      <div className="bg-white pt-24 pb-8 border-b border-slate-200 sticky top-0 z-10 shadow-sm">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-slate-900 text-center mb-6">
            Find the Best Care
          </h1>

          <div className="max-w-3xl mx-auto flex flex-col sm:flex-row gap-4">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search by hospital name..."
                className="pl-10 h-12 text-base rounded-xl border-slate-200 bg-slate-50 focus:bg-white transition-all"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* City Dropdown */}
            <div className="relative sm:w-48">
              <MapPin className="absolute left-3 top-3 h-4 w-4 text-slate-400 z-10" />
              <select
                className="h-12 w-full appearance-none rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-8 text-sm outline-none focus:border-blue-600 focus:bg-white transition-all cursor-pointer"
                value={selectedCity}
                onChange={(e) => setSelectedCity(e.target.value)}
                aria-label="Filter hospitals by city"
              >
                <option value="All Cities">All Cities</option>
                {cities.map((city) => (
                  <option key={city} value={city}>
                    {city}
                  </option>
                ))}
              </select>

              <div className="absolute right-3 top-4 pointer-events-none">
                <svg
                  className="h-4 w-4 text-slate-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        {loading ? (
          <p className="text-slate-500 font-medium">Loading hospitals...</p>
        ) : error ? (
          <div className="text-red-600 font-medium">{error}</div>
        ) : (
          <>
            <p className="text-slate-500 mb-6 font-medium">
              Showing {hospitals.length} hospitals
              {selectedCity !== "All Cities" && ` in ${selectedCity}`}
            </p>

            {hospitals.length > 0 ? (
              <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
                {hospitals.map((hospital, index) => (
                  <HospitalCard key={hospital.id} hospital={hospital} index={index} />
                ))}
              </div>
            ) : (
              <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-slate-200">
                <div className="bg-slate-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Search className="h-8 w-8 text-slate-400" />
                </div>
                <h3 className="text-lg font-medium text-slate-900">No hospitals found</h3>
                <p className="text-slate-500">Try adjusting your search or filter.</p>
                <button
                  onClick={() => {
                    setSearchQuery("");
                    setSelectedCity("All Cities");
                  }}
                  className="mt-4 text-blue-600 font-medium hover:underline"
                >
                  Clear all filters
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}