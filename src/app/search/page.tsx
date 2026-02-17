"use client";

import { useEffect, useMemo, useState } from "react";
import { Navbar } from "@/components/navbar";
import { HospitalCard } from "@/components/hospital-card";
import { Input } from "@/components/ui/input";
import { Search, MapPin, Filter, X, Building2, Siren, ChevronDown } from "lucide-react";
import type { ApiHospital } from "@/types/hospital";

type HospitalType = "ALL" | "HOSPITAL" | "CLINIC" | "LAB";
type SortOption = "recent" | "name" | "price-low" | "price-high";

export default function SearchPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [selectedCity, setSelectedCity] = useState("All Cities");
  const [selectedType, setSelectedType] = useState<HospitalType>("ALL");
  const [emergencyOnly, setEmergencyOnly] = useState(false);
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("recent");
  const [showAdvanced, setShowAdvanced] = useState(false);

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

  // Count active filters
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (selectedCity !== "All Cities") count++;
    if (selectedType !== "ALL") count++;
    if (emergencyOnly) count++;
    if (minPrice) count++;
    if (maxPrice) count++;
    return count;
  }, [selectedCity, selectedType, emergencyOnly, minPrice, maxPrice]);

  // ✅ Fetch when filters change
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams();
        if (debouncedQuery) params.set("q", debouncedQuery);
        if (selectedCity !== "All Cities") params.set("city", selectedCity);
        if (selectedType !== "ALL") params.set("type", selectedType);
        if (emergencyOnly) params.set("emergency", "true");
        if (minPrice) params.set("minPrice", minPrice);
        if (maxPrice) params.set("maxPrice", maxPrice);
        if (sortBy) params.set("sortBy", sortBy);

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
  }, [debouncedQuery, selectedCity, selectedType, emergencyOnly, minPrice, maxPrice, sortBy]);

  const clearAllFilters = () => {
    setSearchQuery("");
    setSelectedCity("All Cities");
    setSelectedType("ALL");
    setEmergencyOnly(false);
    setMinPrice("");
    setMaxPrice("");
    setSortBy("recent");
  };

  return (
    <main className="min-h-screen bg-slate-50">
      <Navbar />

      {/* Header & Search Section */}
      <div className="bg-white pt-24 pb-6 border-b border-slate-200 sticky top-0 z-10 shadow-sm">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-slate-900 text-center mb-6">
            Find the Best Care
          </h1>

          {/* Main Search Bar */}
          <div className="max-w-3xl mx-auto flex flex-col sm:flex-row gap-4 mb-4">
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
                <ChevronDown className="h-4 w-4 text-slate-400" />
              </div>
            </div>
          </div>

          {/* Filter & Sort Row */}
          <div className="max-w-3xl mx-auto flex flex-wrap items-center gap-3">
            {/* Advanced Filters Toggle */}
            <button
              onClick={() => setShowAdvanced(!showAdvanced)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium transition-all ${
                showAdvanced || activeFilterCount > 0
                  ? "border-blue-600 bg-blue-50 text-blue-700"
                  : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
              }`}
            >
              <Filter className="h-4 w-4" />
              Filters
              {activeFilterCount > 0 && (
                <span className="bg-blue-600 text-white text-xs px-2 py-0.5 rounded-full">
                  {activeFilterCount}
                </span>
              )}
            </button>

            {/* Sort Dropdown */}
            <div className="relative">
              <select
                className="h-9 appearance-none rounded-lg border border-slate-200 bg-white pl-3 pr-8 text-sm outline-none focus:border-blue-600 transition-all cursor-pointer"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
              >
                <option value="recent">Most Recent</option>
                <option value="name">Name (A-Z)</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
              </select>
              <div className="absolute right-2 top-2.5 pointer-events-none">
                <ChevronDown className="h-4 w-4 text-slate-400" />
              </div>
            </div>

            {/* Clear All */}
            {activeFilterCount > 0 && (
              <button
                onClick={clearAllFilters}
                className="text-sm text-slate-600 hover:text-slate-900 font-medium"
              >
                Clear all
              </button>
            )}
          </div>

          {/* Advanced Filters Panel */}
          {showAdvanced && (
            <div className="max-w-3xl mx-auto mt-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Hospital Type */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Type
                  </label>
                  <div className="flex gap-2">
                    {(["ALL", "HOSPITAL", "CLINIC", "LAB"] as HospitalType[]).map((type) => (
                      <button
                        key={type}
                        onClick={() => setSelectedType(type)}
                        className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                          selectedType === type
                            ? "bg-blue-600 text-white"
                            : "bg-white text-slate-700 border border-slate-200 hover:border-slate-300"
                        }`}
                      >
                        {type === "ALL" ? "All" : type.charAt(0) + type.slice(1).toLowerCase()}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Price Range */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Price Range (NPR)
                  </label>
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      placeholder="Min"
                      className="h-9 text-sm"
                      value={minPrice}
                      onChange={(e) => setMinPrice(e.target.value)}
                    />
                    <Input
                      type="number"
                      placeholder="Max"
                      className="h-9 text-sm"
                      value={maxPrice}
                      onChange={(e) => setMaxPrice(e.target.value)}
                    />
                  </div>
                </div>

                {/* Emergency Services */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Services
                  </label>
                  <button
                    onClick={() => setEmergencyOnly(!emergencyOnly)}
                    className={`w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                      emergencyOnly
                        ? "bg-red-600 text-white"
                        : "bg-white text-slate-700 border border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <Siren className="h-4 w-4" />
                    Emergency Available
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Results */}
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
              <p className="mt-4 text-slate-500 font-medium">Loading hospitals...</p>
            </div>
          </div>
        ) : error ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-red-200">
            <div className="bg-red-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <X className="h-8 w-8 text-red-600" />
            </div>
            <h3 className="text-lg font-medium text-red-900">{error}</h3>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 text-red-600 font-medium hover:underline"
            >
              Try again
            </button>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-6">
              <p className="text-slate-600 font-medium">
                Showing <span className="text-slate-900 font-bold">{hospitals.length}</span> {hospitals.length === 1 ? 'hospital' : 'hospitals'}
                {selectedCity !== "All Cities" && ` in ${selectedCity}`}
                {selectedType !== "ALL" && ` (${selectedType.charAt(0) + selectedType.slice(1).toLowerCase()})`}
              </p>
            </div>

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
                <p className="text-slate-500 mt-2">
                  {searchQuery || activeFilterCount > 0 
                    ? "Try adjusting your search or filters."
                    : "Start searching to find hospitals near you."}
                </p>
                {(searchQuery || activeFilterCount > 0) && (
                  <button
                    onClick={clearAllFilters}
                    className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
                  >
                    Clear all filters
                  </button>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}