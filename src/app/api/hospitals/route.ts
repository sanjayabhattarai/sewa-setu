import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);

  const q = (searchParams.get("q") || "").trim();
  const city = (searchParams.get("city") || "").trim();
  const district = (searchParams.get("district") || "").trim();
  const country = (searchParams.get("country") || "").trim();
  const type = (searchParams.get("type") || "").trim();
  const emergency = searchParams.get("emergency");
  const minPrice = searchParams.get("minPrice");
  const maxPrice = searchParams.get("maxPrice");
  const sortBy = searchParams.get("sortBy") || "recent";

  // Build where conditions
  const whereConditions: any[] = [];

  // Search query
  if (q) {
    whereConditions.push({
      OR: [
        { name: { contains: q, mode: "insensitive" } },
        { servicesSummary: { contains: q, mode: "insensitive" } },
      ],
    });
  }

  // Location filters
  if (city) whereConditions.push({ location: { city: { equals: city, mode: "insensitive" } } });
  if (district) whereConditions.push({ location: { district: { equals: district, mode: "insensitive" } } });
  if (country) whereConditions.push({ location: { country: { equals: country, mode: "insensitive" } } });

  // Type filter (HOSPITAL, CLINIC, LAB)
  if (type && ["HOSPITAL", "CLINIC", "LAB"].includes(type.toUpperCase())) {
    whereConditions.push({ type: type.toUpperCase() as any });
  }

  // Emergency filter
  if (emergency === "true") {
    whereConditions.push({ emergencyAvailable: true });
  }

  // Price range filter (applied to services)
  const serviceFilters: any[] = [{ isActive: true }];
  if (minPrice) serviceFilters.push({ price: { gte: parseInt(minPrice) } });
  if (maxPrice) serviceFilters.push({ price: { lte: parseInt(maxPrice) } });

  // Build orderBy
  let orderBy: any = { createdAt: "desc" };
  switch (sortBy) {
    case "name":
      orderBy = { name: "asc" };
      break;
    case "price-low":
      // We'll sort the results after fetching since price is in services
      orderBy = { createdAt: "desc" };
      break;
    case "price-high":
      orderBy = { createdAt: "desc" };
      break;
    case "recent":
    default:
      orderBy = { createdAt: "desc" };
      break;
  }

  const hospitals = await db.hospital.findMany({
    where: {
      AND: whereConditions.length > 0 ? whereConditions : undefined,
    },
    include: {
      location: true,
      media: { where: { isPrimary: true }, take: 1 },
      services: { 
        where: { AND: serviceFilters },
        orderBy: { price: "asc" },
        take: 1 
      },
    },
    orderBy,
  });

  // Map to API response format
  let payload = hospitals.map((h) => ({
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
    emergencyAvailable: h.emergencyAvailable,
  }));

  // Apply price-based sorting if requested
  if (sortBy === "price-low") {
    payload = payload.sort((a, b) => {
      if (a.fromPrice === null) return 1;
      if (b.fromPrice === null) return -1;
      return a.fromPrice - b.fromPrice;
    });
  } else if (sortBy === "price-high") {
    payload = payload.sort((a, b) => {
      if (a.fromPrice === null) return 1;
      if (b.fromPrice === null) return -1;
      return b.fromPrice - a.fromPrice;
    });
  }

  return NextResponse.json({ hospitals: payload });
}