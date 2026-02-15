// src/app/hospital/[slug]/HospitalTabs.tsx
"use client";

import { useMemo, useState } from "react";
import type { ApiHospitalDetails, ApiDoctor } from "@/types/hospital";
import { PackageAccordion } from "@/components/package-accordion";
import { DoctorCard } from "@/components/doctor-card";
import { AvailabilitySchedule } from "@/components/availability-schedule";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Phone, Mail, Globe, Clock, Siren, Search } from "lucide-react";

type TabKey = "overview" | "services" | "doctors" | "availability" | "contact";

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
};

export function HospitalTabs({ hospital, packages }: Props) {
  const [tab, setTab] = useState<TabKey>("overview");

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

    if (sort === "EXP_DESC") {
      docs.sort((a, b) => b.experienceYears - a.experienceYears);
    } else {
      docs.sort((a, b) => a.feeMin - b.feeMin);
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
      onClick={() => setTab(k)}
      className={`px-4 py-2 rounded-full text-sm font-semibold border transition-all ${
        tab === k
          ? "bg-blue-600 text-white border-blue-600"
          : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
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
        <TabButton k="availability" label="Availability" />
        <TabButton k="contact" label="Contact" />
      </div>

      {/* Tab content */}
      <div className="mt-6">
        {tab === "overview" && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-slate-100 p-6">
              <div className="flex flex-wrap gap-2 mb-4">
                {hospital.verified && (
                  <Badge className="bg-green-50 text-green-700 hover:bg-green-50">
                    <CheckCircle2 className="h-4 w-4 mr-1" /> Verified
                  </Badge>
                )}
                {hospital.emergencyAvailable && (
                  <Badge className="bg-red-50 text-red-700 hover:bg-red-50">
                    <Siren className="h-4 w-4 mr-1" /> Emergency
                  </Badge>
                )}
                {hospital.openingHours && (
                  <Badge className="bg-slate-100 text-slate-900 hover:bg-slate-100">
                    <Clock className="h-4 w-4 mr-1" /> Hours available
                  </Badge>
                )}
                {hospital.tags?.slice(0, 8).map((t) => (
                  <Badge key={t} variant="secondary" className="bg-white border border-slate-200 text-slate-700">
                    {t}
                  </Badge>
                ))}
              </div>

              <h2 className="text-lg font-bold text-slate-900">Summary</h2>
              <p className="mt-2 text-slate-600">
                {hospital.servicesSummary || "More details will be added soon."}
              </p>

              <div className="mt-5 grid gap-4 sm:grid-cols-3">
                <div className="rounded-2xl border border-slate-100 p-4">
                  <p className="text-sm text-slate-500">Starting from</p>
                  <p className="text-xl font-bold text-slate-900">
                    {hospital.services?.[0]
                      ? `${hospital.services[0].currency} ${hospital.services[0].price}`
                      : "—"}
                  </p>
                </div>
                <div className="rounded-2xl border border-slate-100 p-4">
                  <p className="text-sm text-slate-500">Doctors</p>
                  <p className="text-xl font-bold text-slate-900">
                    {hospital.doctors.length}
                  </p>
                </div>
                <div className="rounded-2xl border border-slate-100 p-4">
                  <p className="text-sm text-slate-500">City</p>
                  <p className="text-xl font-bold text-slate-900">
                    {hospital.location.city}
                  </p>
                </div>
              </div>

              <div className="mt-6 flex flex-wrap gap-2">
                <Button className="rounded-full" onClick={() => setTab("services")}>
                  View Packages
                </Button>
                <Button variant="outline" className="rounded-full" onClick={() => setTab("doctors")}>
                  Browse Doctors
                </Button>
                <Button variant="outline" className="rounded-full" onClick={() => setTab("availability")}>
                  Check Availability
                </Button>
              </div>
            </div>

            {/* Preview doctors */}
            <div className="bg-white rounded-2xl border border-slate-100 p-6">
              <div className="flex items-center justify-between gap-4">
                <h2 className="text-lg font-bold text-slate-900">Top Doctors</h2>
                <button
                  className="text-blue-600 font-semibold hover:underline"
                  onClick={() => setTab("doctors")}
                >
                  View all
                </button>
              </div>

              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                {hospital.doctors.slice(0, 2).map((d) => (
                <DoctorCard key={d.id} doctor={d} />
                ))}
              </div>
            </div>
          </div>
        )}

        {tab === "services" && (
          <div className="space-y-4">
            {packages.length ? (
              packages.map((pkg, index) => (
                <PackageAccordion
                  key={pkg.id}
                  pkg={pkg as any}
                  index={index}
                  hospitalName={hospital.name}
                />
              ))
            ) : (
              <div className="bg-white rounded-2xl border border-dashed border-slate-200 p-6 text-slate-500">
                No packages added yet.
              </div>
            )}
          </div>
        )}

        {tab === "doctors" && (
          <div className="space-y-6">
            {/* Filters */}
            <div className="bg-white rounded-2xl border border-slate-100 p-5">
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  <Input
                    value={doctorQuery}
                    onChange={(e) => setDoctorQuery(e.target.value)}
                    placeholder="Search doctor name..."
                    className="pl-10"
                  />
                </div>

                <select
                  className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none"
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
                  className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none"
                  value={mode}
                  onChange={(e) => setMode(e.target.value as any)}
                >
                  <option value="ALL">All Modes</option>
                  <option value="PHYSICAL">Physical</option>
                  <option value="ONLINE">Online</option>
                </select>

                <select
                  className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none"
                  value={sort}
                  onChange={(e) => setSort(e.target.value as any)}
                >
                  <option value="EXP_DESC">Sort: Experience</option>
                  <option value="FEE_ASC">Sort: Fee (Low → High)</option>
                </select>
              </div>

              <div className="mt-3 flex items-center gap-3">
                <label className="text-sm text-slate-700 flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={verifiedOnly}
                    onChange={(e) => setVerifiedOnly(e.target.checked)}
                  />
                  Verified only
                </label>

                <span className="text-sm text-slate-500">
                  Showing <span className="font-semibold text-slate-900">{filteredDoctors.length}</span> doctors
                </span>
              </div>
            </div>

            {/* Grouped doctors */}
            {groupedDoctors.length ? (
              <div className="space-y-8">
                {groupedDoctors.map(([groupName, docs]) => (
                  <div key={groupName}>
                    <h3 className="text-lg font-bold text-slate-900 mb-3">
                      {groupName}
                      <span className="text-slate-500 font-medium"> ({docs.length})</span>
                    </h3>
                    <div className="grid gap-4 sm:grid-cols-2">
                      {docs.map((d) => (
                        <DoctorCard
                          key={d.id}
                          doctor={d}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-dashed border-slate-200 p-6 text-slate-500">
                No doctors match your filters.
              </div>
            )}
          </div>
        )}

        {tab === "availability" && (
  <div id="availability">
    <AvailabilitySchedule slots={hospital.availability} doctors={hospital.doctors} />
  </div>
)}


        {tab === "contact" && (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-slate-100 p-6">
              <h2 className="text-lg font-bold text-slate-900">Contact</h2>

              <div className="mt-4 grid gap-3">
                <div className="flex items-center gap-2 text-slate-700">
                  <Phone className="h-4 w-4 text-slate-400" />
                  <span className="font-medium">Phone:</span>
                  <span className="text-slate-600">{hospital.phone || "Will be added soon"}</span>
                </div>

                <div className="flex items-center gap-2 text-slate-700">
                  <Mail className="h-4 w-4 text-slate-400" />
                  <span className="font-medium">Email:</span>
                  <span className="text-slate-600">{hospital.email || "Will be added soon"}</span>
                </div>

                <div className="flex items-center gap-2 text-slate-700">
                  <Globe className="h-4 w-4 text-slate-400" />
                  <span className="font-medium">Website:</span>
                  <span className="text-slate-600">{hospital.website || "Will be added soon"}</span>
                </div>

                <div className="flex items-center gap-2 text-slate-700">
                  <Clock className="h-4 w-4 text-slate-400" />
                  <span className="font-medium">Opening hours:</span>
                  <span className="text-slate-600">{hospital.openingHours || "Will be added soon"}</span>
                </div>
              </div>

              <div className="mt-6 rounded-2xl bg-slate-50 border border-slate-100 p-5">
                <h3 className="font-semibold text-slate-900">Address</h3>
                <p className="mt-1 text-slate-600">
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

                <p className="mt-3 text-xs text-slate-400">
                  Map will be added soon.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}