import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);

  const q = (searchParams.get("q") || "").trim();
  const city = (searchParams.get("city") || "").trim();
  const district = (searchParams.get("district") || "").trim();
  const country = (searchParams.get("country") || "").trim();

  const hospitals = await db.hospital.findMany({
    where: {
      AND: [
        q
          ? {
              OR: [
                { name: { contains: q, mode: "insensitive" } },
                { servicesSummary: { contains: q, mode: "insensitive" } },
              ],
            }
          : {},
        city ? { location: { city: { equals: city, mode: "insensitive" } } } : {},
        district
          ? { location: { district: { equals: district, mode: "insensitive" } } }
          : {},
        country
          ? { location: { country: { equals: country, mode: "insensitive" } } }
          : {},
      ],
    },
    include: {
      location: true,
      media: { where: { isPrimary: true }, take: 1 },
      services: { where: { isActive: true }, orderBy: { price: "asc" }, take: 1 },
    },
    orderBy: { createdAt: "desc" },
  });

  const payload = hospitals.map((h) => ({
    id: h.id,
    slug: h.slug,
    name: h.name,
    type: h.type,
    rating: 4.8, // TODO: real rating
    reviewCount: 120, // TODO: real reviews
    specialty: h.servicesSummary || "General",
    city: h.location.city,
    district: h.location.district,
    area: h.location.area,
    image: h.media[0]?.url || null,
    fromPrice: h.services[0]?.price ?? null,
    currency: h.services[0]?.currency ?? "NPR",
  }));

  return NextResponse.json({ hospitals: payload });
}