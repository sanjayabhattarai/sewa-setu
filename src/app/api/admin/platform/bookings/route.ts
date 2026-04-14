import { NextRequest, NextResponse } from "next/server";
import { requirePlatformAdmin } from "@/lib/admin-auth";
import { db } from "@/lib/db";
import { BookingStatus } from "@prisma/client";

export const dynamic = "force-dynamic";

// GET /api/admin/platform/bookings?page=&search=&status=&hospitalId=&from=&to=
export async function GET(req: NextRequest) {
  try { await requirePlatformAdmin({ apiMode: true }); }
  catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "UNAUTHORIZED";
    return NextResponse.json({ error: msg }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const page       = Math.max(1, Number(searchParams.get("page") ?? 1));
  const search     = searchParams.get("search")?.trim() ?? "";
  const status     = searchParams.get("status") ?? "all";
  const hospitalId = searchParams.get("hospitalId") ?? "";
  const from       = searchParams.get("from") ?? "";
  const to         = searchParams.get("to") ?? "";
  const PAGE_SIZE  = 20;

  const where: Record<string, unknown> = {};

  if (status !== "all") {
    where.status = status as BookingStatus;
  }

  if (hospitalId) {
    where.hospitalId = hospitalId;
  }

  if (from || to) {
    where.scheduledAt = {
      ...(from ? { gte: new Date(from) } : {}),
      ...(to   ? { lte: new Date(to + "T23:59:59.999Z") } : {}),
    };
  }

  if (search) {
    where.OR = [
      { patient:  { fullName: { contains: search, mode: "insensitive" } } },
      { hospital: { name:     { contains: search, mode: "insensitive" } } },
      { doctor:   { fullName: { contains: search, mode: "insensitive" } } },
    ];
  }

  const [total, bookings, hospitals] = await Promise.all([
    db.booking.count({ where }),
    db.booking.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select: {
        id: true,
        status: true,
        mode: true,
        scheduledAt: true,
        slotTime: true,
        amountPaid: true,
        currency: true,
        createdAt: true,
        cancelledAt: true,
        cancellationReason: true,
        stripeRefundId: true,
        notes: true,
        hospital: { select: { id: true, name: true, slug: true } },
        patient:  { select: { fullName: true } },
        doctor:   { select: { fullName: true } },
        package:  { select: { title: true } },
        user:     { select: { email: true } },
      },
    }),
    // For the hospital filter dropdown
    db.hospital.findMany({
      where: { isActive: true },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return NextResponse.json({
    bookings: bookings.map((b) => ({
      id: b.id,
      status: b.status,
      mode: b.mode,
      scheduledAt: b.scheduledAt.toISOString(),
      slotTime: b.slotTime ?? null,
      amountPaid: b.amountPaid ?? null,
      currency: b.currency ?? "eur",
      createdAt: b.createdAt.toISOString(),
      cancelledAt: b.cancelledAt?.toISOString() ?? null,
      cancellationReason: b.cancellationReason ?? null,
      refunded: !!b.stripeRefundId,
      notes: b.notes ?? null,
      hospital: b.hospital ? { id: b.hospital.id, name: b.hospital.name, slug: b.hospital.slug } : null,
      patient: b.patient?.fullName ?? null,
      doctor: b.doctor?.fullName ?? null,
      package: b.package?.title ?? null,
      userEmail: b.user?.email ?? null,
    })),
    total,
    hasMore: page * PAGE_SIZE < total,
    hospitals,
  });
}
