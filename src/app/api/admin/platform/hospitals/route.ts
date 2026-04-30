import { NextResponse } from "next/server";
import { requirePlatformAdmin, requirePlatformStaff, writeAuditLog } from "@/lib/admin-auth";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  let ctx;
  try { ctx = await requirePlatformStaff({ apiMode: true }); }
  catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "UNAUTHORIZED";
    return NextResponse.json({ error: msg }, { status: msg === "FORBIDDEN" ? 403 : 401 });
  }

  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search") ?? "";
  const page   = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
  const pageSize = 20;

  const where = {
    ...(ctx.isAdmin ? {} : { id: { in: ctx.assignedHospitalIds } }),
    ...(search
      ? { OR: [{ name: { contains: search, mode: "insensitive" as const } }, { slug: { contains: search, mode: "insensitive" as const } }] }
      : {}),
  };

  const [total, hospitals] = await Promise.all([
    db.hospital.count({ where }),
    db.hospital.findMany({
      where,
      include: {
        location: { select: { city: true, district: true } },
        _count: { select: { bookings: true, doctors: true, memberships: true } },
        supportAssignments: {
          where: { isActive: true },
          select: {
            id: true,
            supportUser: { select: { id: true, fullName: true, email: true } },
          },
          orderBy: { createdAt: "asc" },
        },
      },
      orderBy: { name: "asc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
  ]);

  return NextResponse.json({
    hospitals: hospitals.map((h) => ({
      id: h.id,
      name: h.name,
      slug: h.slug,
      type: h.type,
      verified: h.verified,
      verifiedAt: h.verifiedAt?.toISOString() ?? null,
      isActive: h.isActive,
      suspendedAt: h.suspendedAt?.toISOString() ?? null,
      suspensionReason: h.suspensionReason,
      location: h.location ? `${h.location.city}, ${h.location.district}` : null,
      bookingCount: h._count.bookings,
      doctorCount: h._count.doctors,
      staffCount: h._count.memberships,
      supportAssignments: h.supportAssignments.map((assignment) => ({
        id: assignment.id,
        userId: assignment.supportUser.id,
        fullName: assignment.supportUser.fullName,
        email: assignment.supportUser.email,
      })),
    })),
    total,
    page,
    hasMore: page * pageSize < total,
    canManage: ctx.isAdmin,
    scope: ctx.isAdmin ? "platform" : "assigned",
  });
}

// PATCH - verify, suspend, or reactivate hospital.
export async function PATCH(req: Request) {
  let actor;
  try { actor = await requirePlatformAdmin({ apiMode: true }); }
  catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "UNAUTHORIZED";
    return NextResponse.json({ error: msg }, { status: 401 });
  }

  let body: { hospitalId?: string; verified?: boolean; isActive?: boolean; suspensionReason?: string };
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { hospitalId, verified, isActive, suspensionReason } = body;
  if (!hospitalId) return NextResponse.json({ error: "hospitalId required" }, { status: 400 });
  if (verified === undefined && isActive === undefined) {
    return NextResponse.json({ error: "verified or isActive required" }, { status: 400 });
  }

  const existing = await db.hospital.findUnique({ where: { id: hospitalId } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const updateData: Record<string, unknown> = {};
  const now = new Date();

  if (verified !== undefined) {
    updateData.verified = verified;
    updateData.verifiedAt = verified ? now : null;
    updateData.verifiedById = verified ? actor.id : null;
  }

  if (isActive !== undefined) {
    updateData.isActive = isActive;
    if (isActive) {
      updateData.suspendedAt = null;
      updateData.suspendedById = null;
      updateData.suspensionReason = null;
    } else {
      const reason = suspensionReason?.trim();
      if (!reason) {
        return NextResponse.json({ error: "Suspension reason required" }, { status: 400 });
      }
      updateData.suspendedAt = now;
      updateData.suspendedById = actor.id;
      updateData.suspensionReason = reason;
    }
  }

  const updated = await db.hospital.update({ where: { id: hospitalId }, data: updateData as never });

  const action = isActive !== undefined
    ? (isActive ? "HOSPITAL_REACTIVATED" : "HOSPITAL_SUSPENDED")
    : (verified ? "HOSPITAL_VERIFIED" : "HOSPITAL_UNVERIFIED");

  await writeAuditLog({
    actorUserId: actor.id,
    hospitalId,
    action,
    entity: "Hospital",
    entityId: hospitalId,
    before: {
      verified: existing.verified,
      verifiedAt: existing.verifiedAt,
      verifiedById: existing.verifiedById,
      isActive: existing.isActive,
      suspendedAt: existing.suspendedAt,
      suspendedById: existing.suspendedById,
      suspensionReason: existing.suspensionReason,
    },
    after: {
      verified: updated.verified,
      verifiedAt: updated.verifiedAt,
      verifiedById: updated.verifiedById,
      isActive: updated.isActive,
      suspendedAt: updated.suspendedAt,
      suspendedById: updated.suspendedById,
      suspensionReason: updated.suspensionReason,
    },
  });

  return NextResponse.json({
    success: true,
    hospital: {
      id: updated.id,
      verified: updated.verified,
      verifiedAt: updated.verifiedAt?.toISOString() ?? null,
      isActive: updated.isActive,
      suspendedAt: updated.suspendedAt?.toISOString() ?? null,
      suspensionReason: updated.suspensionReason,
    },
  });
}
