// src/app/hospital/[slug]/HospitalTabs.tsx
"use client";

import { useMemo, useState } from "react";
import type { ApiDoctor } from "@/types/hospital";
import type { ApiHospitalDetails } from "@/types/hospital-details";
import { PackageAccordion } from "@/components/package-accordion";
import { PackageCard } from "@/components/package-card";
import { DoctorCard } from "@/components/doctor-card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import * as lucideReact from "lucide-react";
import { HospitalAvailability } from "./HospitalAvailability";

type TabKey = "overview" | "services" | "doctors" | "departments" | "availability" | "contact";

type UiPackage = {
  id: string;
  name: string;
  price: number;
  discount?: string;
  features: string[];
};

type Props = {
  hospital: ApiHospitalDetails;
  packages: UiPackage[];
  onBookDoctor: (doctorId: string) => void;
};

export function HospitalTabs({ hospital, packages, onBookDoctor }: Props) {
  const [tab, setTab] = useState<TabKey>("overview");

  // Departments UI state (list -> detail)
  const [selectedDeptId, setSelectedDeptId] = useState<string | null>(null);

  const selectedDept = useMemo(() => {
    if (!selectedDeptId) return null;
    return hospital.departments?.find((d) => d.id === selectedDeptId) ?? null;
  }, [hospital.departments, selectedDeptId]);

  const deptDoctorIdSet = useMemo(() => {
    if (!selectedDept) return new Set<string>();
    const ids = (selectedDept.doctors ?? []).map((x) => x.doctorId);
    return new Set(ids);
  }, [selectedDept]);

  const deptDoctors = useMemo(() => {
    if (!selectedDept) return [];
    return hospital.doctors.filter((d) => deptDoctorIdSet.has(d.id));
  }, [hospital.doctors, deptDoctorIdSet, selectedDept]);

  // Doctors filters
  const [doctorQuery, setDoctorQuery] = useState("");
  const [mode, setMode] = useState<"ALL" | "ONLINE" | "PHYSICAL">("ALL");
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [specialty, setSpecialty] = useState<string>("ALL");
  const [sort, setSort] = useState<"EXP_DESC" | "FEE_ASC">("EXP_DESC");

  const allSpecialties = useMemo(() => {
    const set = new Set<string>();
    hospital.doctors.forEach((d) => d.specialties.forEach((s) => set.add(s.name)));
    return Array.from(set).sort();
  }, [hospital.doctors]);

  const filteredDoctors = useMemo(() => {
    let docs = [...hospital.doctors];

    const q = doctorQuery.trim().toLowerCase();
    if (q) docs = docs.filter((d) => d.fullName.toLowerCase().includes(q));

    if (verifiedOnly) docs = docs.filter((d) => d.verified);

    if (mode !== "ALL") {
      docs = docs.filter((d) => d.consultationModes.includes(mode));
    }

    if (specialty !== "ALL") {
      docs = docs.filter((d) => d.specialties.some((s) => s.name === specialty));
    }

    const exp = (v: number | null | undefined) => v ?? 0;

    if (sort === "EXP_DESC") {
      docs.sort((a, b) => exp(b.experienceYears) - exp(a.experienceYears));
    } else {
      docs.sort((a, b) => (a.feeMin ?? 0) - (b.feeMin ?? 0));
    }

    return docs;
  }, [hospital.doctors, doctorQuery, verifiedOnly, mode, specialty, sort]);

  const groupedDoctors = useMemo(() => {
    const groups = new Map<string, ApiDoctor[]>();

    for (const d of filteredDoctors) {
      const primary = d.specialties.find((s) => s.isPrimary) ?? d.specialties[0];
      const key = primary?.name ?? "Other";
      const arr = groups.get(key) ?? [];
      arr.push(d);
      groups.set(key, arr);
    }

    return Array.from(groups.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [filteredDoctors]);

  const TabButton = ({ k, label }: { k: TabKey; label: string }) => (
    <button
      onClick={() => {
        setTab(k);
        if (k !== "departments") setSelectedDeptId(null);
      }}
      className={`px-5 py-2.5 rounded-full text-sm font-semibold transition-all duration-300 ${
        tab === k
          ? "bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-500/30 scale-105"
          : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 hover:border-slate-300 hover:shadow-sm"
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="mt-6">
      {/* Tabs header */}
      <div className="flex flex-wrap gap-2">
        <TabButton k="overview" label="Overview" />
        <TabButton k="services" label="Services & Packages" />
        <TabButton k="doctors" label="Doctors" />
        <TabButton k="departments" label="Departments" />
        <TabButton k="availability" label="Availability" />
        <TabButton k="contact" label="Contact" />
      </div>

      {/* Tab content */}
      <div className="mt-6">
        {tab === "overview" && (
          <div className="space-y-6">
            <div className="bg-gradient-to-br from-white via-blue-50/30 to-indigo-50/30 rounded-2xl border border-blue-100 p-6 shadow-sm">
              <div className="flex flex-wrap gap-2 mb-4">
                {hospital.verified && (
                  <Badge className="bg-green-50 text-green-700 hover:bg-green-50 border border-green-200">
                    <lucideReact.CheckCircle2 className="h-4 w-4 mr-1" /> Verified
                  </Badge>
                )}
                {hospital.emergencyAvailable && (
                  <Badge className="bg-red-50 text-red-700 hover:bg-red-50 border border-red-200">
                    <lucideReact.Siren className="h-4 w-4 mr-1" /> Emergency
                  </Badge>
                )}
                {hospital.openingHours && (
                  <Badge className="bg-slate-100 text-slate-900 hover:bg-slate-100 border border-slate-200">
                    <lucideReact.Clock className="h-4 w-4 mr-1" /> Hours available
                  </Badge>
                )}
                {hospital.tags?.slice(0, 8).map((t) => (
                  <Badge
                    key={t}
                    variant="secondary"
                    className="bg-white border border-slate-200 text-slate-700 hover:border-slate-300"
                  >
                    {t}
                  </Badge>
                ))}
              </div>

              <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <lucideReact.Sparkles className="h-5 w-5 text-blue-600" />
                Hospital&apos;s Vision
              </h2>
              <p className="mt-3 text-slate-700 leading-relaxed">
                {hospital.servicesSummary || "More details will be added soon."}
              </p>

              <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 p-5 hover:shadow-lg transition-all duration-300">
                  <div className="absolute top-0 right-0 h-20 w-20 bg-blue-200 opacity-20 rounded-full blur-2xl"></div>
                  <lucideReact.DollarSign className="h-6 w-6 text-blue-600 mb-2" />
                  <p className="text-sm text-slate-600 font-medium">Starting from</p>
                  <p className="text-2xl font-bold text-slate-900 mt-1">
                    {hospital.services?.[0]
                      ? `${hospital.services[0].currency} ${hospital.services[0].price}`
                      : "—"}
                  </p>
                </div>
                <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-green-50 to-emerald-50 border border-green-100 p-5 hover:shadow-lg transition-all duration-300">
                  <div className="absolute top-0 right-0 h-20 w-20 bg-green-200 opacity-20 rounded-full blur-2xl"></div>
                  <lucideReact.Users className="h-6 w-6 text-green-600 mb-2" />
                  <p className="text-sm text-slate-600 font-medium">Doctors</p>
                  <p className="text-2xl font-bold text-slate-900 mt-1">{hospital.doctors.length}</p>
                </div>
                <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-purple-50 to-violet-50 border border-purple-100 p-5 hover:shadow-lg transition-all duration-300">
                  <div className="absolute top-0 right-0 h-20 w-20 bg-purple-200 opacity-20 rounded-full blur-2xl"></div>
                  <lucideReact.Building2 className="h-6 w-6 text-purple-600 mb-2" />
                  <p className="text-sm text-slate-600 font-medium">Departments</p>
                  <p className="text-2xl font-bold text-slate-900 mt-1">
                    {hospital.departments?.length ?? 0}
                  </p>
                </div>
                <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-orange-50 to-amber-50 border border-orange-100 p-5 hover:shadow-lg transition-all duration-300">
                  <div className="absolute top-0 right-0 h-20 w-20 bg-orange-200 opacity-20 rounded-full blur-2xl"></div>
                  <lucideReact.MapPin className="h-6 w-6 text-orange-600 mb-2" />
                  <p className="text-sm text-slate-600 font-medium">City</p>
                  <p className="text-2xl font-bold text-slate-900 mt-1">{hospital.location.city}</p>
                </div>
              </div>

              <div className="mt-6 flex flex-wrap gap-3">
                <Button 
                  className="rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 shadow-lg shadow-blue-500/30" 
                  onClick={() => setTab("services")}
                >
                  <lucideReact.Package className="h-4 w-4 mr-2" />
                  View Packages
                </Button>
                <Button
                  variant="outline"
                  className="rounded-full hover:bg-slate-50"
                  onClick={() => setTab("departments")}
                >
                  <lucideReact.Building2 className="h-4 w-4 mr-2" />
                  Browse Departments
                </Button>
                <Button
                  variant="outline"
                  className="rounded-full hover:bg-slate-50"
                  onClick={() => setTab("availability")}
                >
                  <lucideReact.Calendar className="h-4 w-4 mr-2" />
                  Check Availability
                </Button>
              </div>
            </div>

            {/* Preview doctors */}
            <div className="bg-gradient-to-br from-white via-green-50/30 to-emerald-50/30 rounded-2xl border border-green-100 p-6 shadow-sm">
              <div className="flex items-center justify-between gap-4 mb-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-green-500/30">
                    <lucideReact.Star className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-slate-900">Top Doctors</h2>
                    <p className="text-sm text-slate-600">Our most experienced specialists</p>
                  </div>
                </div>
                <button
                  className="flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-slate-200 text-blue-600 font-semibold hover:bg-slate-50 hover:border-slate-300 transition-all"
                  onClick={() => setTab("doctors")}
                >
                  View all
                  <lucideReact.ArrowRight className="h-4 w-4" />
                </button>
              </div>

              <div className="mt-4 grid gap-4 sm:grid-cols-2">{hospital.doctors.slice(0, 2).map((d) => (
                  <DoctorCard
                    key={d.id}
                    doctor={d}
                    slots={hospital.availability}
                    onSelectSlot={() => onBookDoctor(d.id)}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {tab === "services" && (
          <div>
            {/* Header Section */}
            <div className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 rounded-2xl border border-blue-100 p-8 mb-8 shadow-sm">
              <div className="flex items-center gap-3 mb-3">
                <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
                  <lucideReact.Package className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">Health Packages</h2>
                  <p className="text-sm text-slate-600">Choose the perfect plan for your health needs</p>
                </div>
              </div>
              <p className="text-slate-700 leading-relaxed mt-4">
                Our comprehensive health packages are designed to provide complete care at competitive prices. 
                All packages include consultations with experienced specialists and necessary diagnostic tests.
              </p>
            </div>

            {/* Packages Grid */}
            {packages.length ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {packages.map((pkg, index) => (
                  <PackageCard
                    key={pkg.id}
                    pkg={pkg as any}
                    hospitalName={hospital.name}
                    featured={index === 1} // Mark the 2nd package as featured
                  />
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-dashed border-slate-200 p-12 text-center">
                <lucideReact.Package className="h-16 w-16 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-500 text-lg">No packages available yet.</p>
                <p className="text-slate-400 text-sm mt-2">Check back soon for health packages.</p>
              </div>
            )}

            {/* Info Section */}
            <div className="mt-8 bg-blue-50 border border-blue-100 rounded-2xl p-6">
              <div className="flex items-start gap-4">
                <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                  <lucideReact.Info className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900 mb-2">Package Information</h3>
                  <ul className="space-y-1.5 text-sm text-slate-700">
                    <li className="flex items-start gap-2">
                      <lucideReact.Check className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                      <span>All packages are valid for 3 months from the date of booking</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <lucideReact.Check className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                      <span>Advance booking required for all consultations and tests</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <lucideReact.Check className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                      <span>Reports will be available within 24-48 hours</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <lucideReact.Check className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                      <span>Free follow-up consultation within 7 days</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        {tab === "departments" && (
          <div className="space-y-4">
            {!selectedDept ? (
              <>
                <div className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 rounded-2xl border border-blue-100 p-6 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
                      <lucideReact.Building2 className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-slate-900">Medical Departments</h2>
                      <p className="text-sm text-slate-600">Select a department to view its specialist doctors</p>
                    </div>
                  </div>
                </div>

                {hospital.departments?.length ? (
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {hospital.departments.map((d) => (
                      <button
                        key={d.id}
                        onClick={() => setSelectedDeptId(d.id)}
                        className="group text-left bg-white rounded-2xl border border-slate-200 p-6 hover:border-blue-300 hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
                      >
                        <div className="flex items-start justify-between gap-3 mb-3">
                          <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center border border-blue-200 group-hover:border-blue-300 transition-colors">
                            <lucideReact.Stethoscope className="h-6 w-6 text-blue-600" />
                          </div>
                          <div className="shrink-0 rounded-full bg-blue-50 text-blue-700 text-xs font-bold px-3 py-1.5 border border-blue-200 group-hover:bg-blue-100 transition-colors">
                            {d.doctorCount} doctors
                          </div>
                        </div>
                        <h3 className="font-bold text-slate-900 text-lg mb-2 group-hover:text-blue-600 transition-colors">{d.name}</h3>
                        <p className="text-sm text-slate-600 line-clamp-2">
                          {d.overview || "Department details will be added soon."}
                        </p>
                        <div className="mt-4 flex items-center gap-2 text-sm text-blue-600 font-semibold">
                          View Doctors
                          <lucideReact.ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                        </div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center">
                    <lucideReact.Building2 className="h-16 w-16 text-slate-300 mx-auto mb-4" />
                    <p className="text-slate-500 text-lg">No departments available yet</p>
                  </div>
                )}
              </>
            ) : (
              <>
                <div className="bg-gradient-to-br from-white via-blue-50 to-indigo-50 rounded-2xl border border-blue-100 p-6 shadow-sm">
                  <button
                    onClick={() => setSelectedDeptId(null)}
                    className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700 hover:text-blue-600 transition-colors mb-4"
                  >
                    <lucideReact.ChevronLeft className="h-4 w-4" />
                    Back to all departments
                  </button>

                  <div className="flex items-center gap-3 mb-3">
                    <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
                      <lucideReact.Stethoscope className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-slate-900">{selectedDept.name}</h2>
                      <p className="text-sm text-slate-600 flex items-center gap-2">
                        <lucideReact.Users className="h-4 w-4" />
                        {deptDoctors.length} specialist doctors available
                      </p>
                    </div>
                  </div>

                  <p className="mt-3 text-slate-700">
                    {selectedDept.overview || "Department details will be added soon."}
                  </p>
                </div>

                {deptDoctors.length ? (
                  <div className="grid gap-4 sm:grid-cols-2">
                    {deptDoctors.map((d) => (
                      <DoctorCard
                        key={d.id}
                        doctor={d}
                        slots={hospital.availability}
                        onSelectSlot={() => onBookDoctor(d.id)}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="bg-white rounded-2xl border border-dashed border-slate-200 p-6 text-slate-500">
                    No doctors found for this department.
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {tab === "doctors" && (
          <div className="space-y-6">
            {/* Filters */}
            <div className="bg-gradient-to-br from-white via-slate-50 to-blue-50/30 rounded-2xl border border-slate-200 p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
                  <lucideReact.Filter className="h-5 w-5 text-white" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">Find Your Doctor</h3>
              </div>
              
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <div className="relative">
                  <lucideReact.Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  <Input
                    value={doctorQuery}
                    onChange={(e) => setDoctorQuery(e.target.value)}
                    placeholder="Search doctor name..."
                    className="pl-10 h-10 rounded-xl border-slate-300 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>

                <select
                  className="h-10 rounded-xl border border-slate-300 bg-white px-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                  value={specialty}
                  onChange={(e) => setSpecialty(e.target.value)}
                >
                  <option value="ALL">All Specialties</option>
                  {allSpecialties.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>

                <select
                  className="h-10 rounded-xl border border-slate-300 bg-white px-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                  value={mode}
                  onChange={(e) => setMode(e.target.value as any)}
                >
                  <option value="ALL">All Modes</option>
                  <option value="PHYSICAL">Physical</option>
                  <option value="ONLINE">Online</option>
                </select>

                <select
                  className="h-10 rounded-xl border border-slate-300 bg-white px-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                  value={sort}
                  onChange={(e) => setSort(e.target.value as any)}
                >
                  <option value="EXP_DESC">Sort: Experience</option>
                  <option value="FEE_ASC">Sort: Fee (Low → High)</option>
                </select>
              </div>

              <div className="mt-4 flex items-center justify-between gap-3 pt-3 border-t border-slate-200">
                <label className="text-sm text-slate-700 flex items-center gap-2 cursor-pointer hover:text-slate-900 transition-colors">
                  <input
                    type="checkbox"
                    checked={verifiedOnly}
                    onChange={(e) => setVerifiedOnly(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                  <lucideReact.CheckCircle2 className="h-4 w-4 text-green-600" />
                  Verified only
                </label>

                <div className="flex items-center gap-2 text-sm">
                  <lucideReact.Users className="h-4 w-4 text-slate-400" />
                  <span className="text-slate-600">
                    Showing <span className="font-bold text-blue-600">{filteredDoctors.length}</span> doctors
                  </span>
                </div>
              </div>
            </div>

            {/* Grouped doctors */}
            {groupedDoctors.length ? (
              <div className="space-y-8">
                {groupedDoctors.map(([groupName, docs]) => (
                  <div key={groupName}>
                    <div className="flex items-center gap-3 mb-4">
                      <div className="h-8 w-1 rounded-full bg-gradient-to-b from-blue-500 to-indigo-600"></div>
                      <h3 className="text-xl font-bold text-slate-900">
                        {groupName}
                      </h3>
                      <span className="px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-sm font-semibold border border-blue-200">
                        {docs.length}
                      </span>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      {docs.map((d) => (
                        <DoctorCard
                          key={d.id}
                          doctor={d}
                          slots={hospital.availability}
                          onSelectSlot={() => onBookDoctor(d.id)}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center">
                <lucideReact.UserX className="h-16 w-16 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-600 text-lg font-medium">No doctors match your filters</p>
                <p className="text-slate-500 text-sm mt-2">Try adjusting your search criteria</p>
              </div>
            )}
          </div>
        )}

        {tab === "availability" && (
          <div id="availability">
            <HospitalAvailability hospital={hospital} />
          </div>
        )}

        {tab === "contact" && (
          <div className="space-y-4">
            <div className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 rounded-2xl border border-blue-100 p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
                  <lucideReact.Phone className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900">Contact Information</h2>
                  <p className="text-sm text-slate-600">Get in touch with us</p>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <a
                  href={hospital.phone ? `tel:${hospital.phone}` : undefined}
                  className={`bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-3 ${
                    hospital.phone ? "hover:border-blue-300 hover:shadow-md transition-all cursor-pointer" : ""
                  }`}
                >
                  <div className="h-10 w-10 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                    <lucideReact.Phone className="h-5 w-5 text-blue-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-slate-500">Phone</p>
                    <p className={`text-sm font-semibold truncate ${
                      hospital.phone ? "text-blue-600" : "text-slate-600"
                    }`}>
                      {hospital.phone || "Will be added soon"}
                    </p>
                  </div>
                </a>

                <div className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-green-50 flex items-center justify-center flex-shrink-0">
                    <lucideReact.Mail className="h-5 w-5 text-green-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-slate-500">Email</p>
                    <p className="text-sm font-semibold text-slate-700 truncate">{hospital.email || "Will be added soon"}</p>
                  </div>
                </div>

                <div className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-purple-50 flex items-center justify-center flex-shrink-0">
                    <lucideReact.Globe className="h-5 w-5 text-purple-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-slate-500">Website</p>
                    <p className="text-sm font-semibold text-slate-700 truncate">{hospital.website || "Will be added soon"}</p>
                  </div>
                </div>

                <div className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-orange-50 flex items-center justify-center flex-shrink-0">
                    <lucideReact.Clock className="h-5 w-5 text-orange-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-slate-500">Opening Hours</p>
                    <p className="text-sm font-semibold text-slate-700 truncate">{hospital.openingHours || "Will be added soon"}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-10 w-10 rounded-lg bg-red-50 flex items-center justify-center">
                  <lucideReact.MapPin className="h-5 w-5 text-red-600" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">Address & Location</h3>
              </div>
              <p className="text-slate-700 leading-relaxed">
                {[
                  hospital.location.addressLine,
                  hospital.location.area,
                  hospital.location.city,
                  hospital.location.district,
                  hospital.location.country,
                  hospital.location.postalCode,
                ]
                  .filter(Boolean)
                  .join(", ") || "Will be added soon"}
              </p>

              <div className="mt-4 rounded-xl bg-slate-50 border border-slate-200 p-4 flex items-center gap-3">
                <lucideReact.Map className="h-5 w-5 text-slate-400" />
                <p className="text-sm text-slate-600">Interactive map will be added soon.</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}