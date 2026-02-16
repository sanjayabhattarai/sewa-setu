// src/app/api/hospitals/[slug]/route.ts

import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

function safeStringArray(v: unknown): string[] {
  if (Array.isArray(v)) return v.map((x) => String(x));
  return [];
}

function safeModeArray(v: unknown): ("ONLINE" | "PHYSICAL")[] {
  if (!Array.isArray(v)) return [];
  return v
    .map((x) => String(x).toUpperCase())
    .filter((x): x is "ONLINE" | "PHYSICAL" => x === "ONLINE" || x === "PHYSICAL");
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  const hospital = await db.hospital.findUnique({
    where: { slug },
    include: {
      location: true,
      media: { orderBy: { isPrimary: "desc" } },
      services: { where: { isActive: true }, orderBy: { price: "asc" } },
      tags: { include: { tag: true } },

      doctors: {
        include: {
          doctor: {
            include: {
              media: { orderBy: { isPrimary: "desc" } },
              specialties: {
                include: { specialty: true },
              },
              availability: {
                where: { isActive: true },
                orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
              },
            },
          },
        },
      },
    },
  });

  if (!hospital) {
    return NextResponse.json({ error: "Hospital not found" }, { status: 404 });
  }

  // Flatten doctors from DoctorHospital join
  const doctors = hospital.doctors.map((dh) => {
    const d = dh.doctor;

    const specialties = d.specialties.map((ds) => ({
      id: ds.specialty.id,
      name: ds.specialty.name,
      slug: ds.specialty.slug,
      isPrimary: ds.isPrimary,
    }));

    const image =
      d.media.find((m) => m.isPrimary)?.url ?? d.media[0]?.url ?? null;

    return {
      id: d.id,
      fullName: d.fullName,
      gender: d.gender ?? null,
      experienceYears: d.experienceYears,
      education: d.education ?? null,
      bio: d.bio ?? null,
      languages: safeStringArray(d.languages),
      consultationModes: safeModeArray(d.consultationModes),
      licenseNumber: d.licenseNumber ?? null,
      feeMin: d.feeMin,
      feeMax: d.feeMax,
      currency: d.currency,
      verified: d.verified,
      image,
      specialties,
    };
  });

  // Availability: keep only slots relevant to this hospital (hospitalId matches OR null)
  // (online slots may have hospitalId null, depending on how you seed)
  const availability = hospital.doctors
    .flatMap((dh) => dh.doctor.availability)
    .filter((s) => s.isActive)
    .filter((s) => s.hospitalId === hospital.id || s.hospitalId == null)
    .map((s) => ({
      id: s.id,
      doctorId: s.doctorId,
      hospitalId: s.hospitalId ?? null,
      mode: s.mode,
      dayOfWeek: s.dayOfWeek,
      startTime: s.startTime,
      endTime: s.endTime,
      slotDurationMinutes: s.slotDurationMinutes,
      isActive: s.isActive,
    }));

  const payload = {
    id: hospital.id,
    slug: hospital.slug,
    name: hospital.name,
    type: hospital.type,

    verified: hospital.verified,
    emergencyAvailable: hospital.emergencyAvailable,
    openingHours: hospital.openingHours ?? null,

    phone: hospital.phone ?? null,
    email: hospital.email ?? null,
    website: hospital.website ?? null,

    servicesSummary: hospital.servicesSummary ?? null,

    location: {
      country: hospital.location.country,
      district: hospital.location.district,
      city: hospital.location.city,
      area: hospital.location.area ?? null,
      addressLine: hospital.location.addressLine ?? null,
      postalCode: hospital.location.postalCode ?? null,
      lat: hospital.location.lat ?? null,
      lng: hospital.location.lng ?? null,
    },

    image:
      hospital.media.find((m) => m.isPrimary)?.url ?? hospital.media[0]?.url ?? null,
    media: hospital.media.map((m) => ({
      url: m.url,
      altText: m.altText ?? null,
      isPrimary: m.isPrimary,
    })),

    rating: 4.8, // TODO later
    reviewCount: 120, // TODO later

    tags: hospital.tags.map((t) => t.tag.name),

    services: hospital.services.map((s) => ({
      id: s.id,
      name: s.title,
      price: s.price,
      currency: s.currency,
      description: s.description ?? "",
      features: s.description ? [s.description] : [],
    })),

    doctors,
    availability,
  };

  return NextResponse.json(payload);
}