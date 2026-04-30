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
      isActive: h.isActive,
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

// PATCH — verify or toggle active
export async function PATCH(req: Request) {
  let actor;
  try { actor = await requirePlatformAdmin({ apiMode: true }); }
  catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "UNAUTHORIZED";
    return NextResponse.json({ error: msg }, { status: 401 });
  }

  let body: { hospitalId?: string; verified?: boolean; isActive?: boolean };
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { hospitalId, verified, isActive } = body;
  if (!hospitalId) return NextResponse.json({ error: "hospitalId required" }, { status: 400 });

  const existing = await db.hospital.findUnique({ where: { id: hospitalId } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const updateData: Record<string, unknown> = {};
  if (verified !== undefined) updateData.verified = verified;
  if (isActive !== undefined) updateData.isActive = isActive;

  const updated = await db.hospital.update({ where: { id: hospitalId }, data: updateData as never });

  await writeAuditLog({
    actorUserId: actor.id,
    action: verified !== undefined ? (verified ? "HOSPITAL_VERIFIED" : "HOSPITAL_UNVERIFIED") : (isActive ? "HOSPITAL_ACTIVATED" : "HOSPITAL_DEACTIVATED"),
    entity: "Hospital",
    entityId: hospitalId,
    before: { verified: existing.verified, isActive: existing.isActive },
    after: { verified: updated.verified, isActive: updated.isActive },
  });

  return NextResponse.json({ success: true });
}
