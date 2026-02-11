import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

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
    },
  });

  if (!hospital) {
    return NextResponse.json({ error: "Hospital not found" }, { status: 404 });
  }

  const payload = {
    id: hospital.id,
    slug: hospital.slug,
    name: hospital.name,
    type: hospital.type,
    city: hospital.location.city,
    district: hospital.location.district,
    area: hospital.location.area,
    image:
      hospital.media.find((m) => m.isPrimary)?.url ??
      hospital.media[0]?.url ??
      null,
    rating: 4.8,
    reviewCount: 120,
    specialty: hospital.servicesSummary || "General",
    tags: hospital.tags.map((t) => t.tag.name),
    services: hospital.services.map((s) => ({
      id: s.id,
      name: s.title,
      price: s.price,
      currency: s.currency,
      description: s.description ?? "",
      features: s.description ? [s.description] : [],
    })),
  };

  return NextResponse.json(payload);
}