import { NextRequest, NextResponse } from "next/server";
import { requirePlatformStaff, writeAuditLog } from "@/lib/admin-auth";
import { db } from "@/lib/db";
import { PartnerInquiryStatus } from "@prisma/client";

export const dynamic = "force-dynamic";

// GET /api/admin/platform/inquiries?page=1&search=&status=
export async function GET(req: NextRequest) {
  let ctx;
  try { ctx = await requirePlatformStaff({ apiMode: true }); }
  catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "UNAUTHORIZED";
    return NextResponse.json({ error: msg }, { status: msg === "FORBIDDEN" ? 403 : 401 });
  }

  const { searchParams } = new URL(req.url);
  const page   = Math.max(1, Number(searchParams.get("page") ?? 1));
  const search = searchParams.get("search")?.trim() ?? "";
  const status = searchParams.get("status") ?? "all";
  const PAGE_SIZE = 20;

  const where = {
    ...(ctx.isAdmin ? {} : { hospitalId: { in: ctx.assignedHospitalIds } }),
    ...(search ? {
      OR: [
        { hospitalName: { contains: search, mode: "insensitive" as const } },
        { contactName:  { contains: search, mode: "insensitive" as const } },
        { email:        { contains: search, mode: "insensitive" as const } },
        { city:         { contains: search, mode: "insensitive" as const } },
      ],
    } : {}),
    ...(status !== "all" ? { status: status as PartnerInquiryStatus } : {}),
  };

  const [total, inquiries] = await Promise.all([
    db.partnerInquiry.count({ where }),
    db.partnerInquiry.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
  ]);

  return NextResponse.json({
    inquiries,
    total,
    hasMore: page * PAGE_SIZE < total,
    canFinalize: ctx.isAdmin,
    scope: ctx.isAdmin ? "platform" : "assigned",
  });
}

// PATCH /api/admin/platform/inquiries  { id, status, reviewNotes? }
export async function PATCH(req: NextRequest) {
  let ctx;
  try { ctx = await requirePlatformStaff({ apiMode: true }); }
  catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "UNAUTHORIZED";
    return NextResponse.json({ error: msg }, { status: msg === "FORBIDDEN" ? 403 : 401 });
  }

  const body = await req.json();
  const { id, status, reviewNotes } = body;

  if (!id || !status) {
    return NextResponse.json({ error: "Missing id or status" }, { status: 400 });
  }

  if (!Object.values(PartnerInquiryStatus).includes(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const existing = await db.partnerInquiry.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Inquiry not found" }, { status: 404 });
  }

  if (!ctx.isAdmin) {
    if (!existing.hospitalId || !ctx.assignedHospitalIds.includes(existing.hospitalId)) {
      return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
    }

    const isStatusChange = existing.status !== status;
    const supportAllowedStatuses: PartnerInquiryStatus[] = ["REVIEWED", "CONTACTED"];
    if (isStatusChange && !supportAllowedStatuses.includes(status)) {
      return NextResponse.json({ error: "Support can only mark inquiries reviewed or contacted" }, { status: 403 });
    }
  }

  const updated = await db.partnerInquiry.update({
    where: { id },
    data: {
      status,
      reviewNotes: reviewNotes ?? undefined,
      reviewedAt: new Date(),
    },
  });

  await writeAuditLog({
    actorUserId: ctx.user.id,
    hospitalId: updated.hospitalId ?? undefined,
    action: existing.status === status ? "INQUIRY_NOTES_UPDATED" : "INQUIRY_TRIAGED",
    entity: "PartnerInquiry",
    entityId: updated.id,
    before: { status: existing.status, reviewNotes: existing.reviewNotes },
    after: { status: updated.status, reviewNotes: updated.reviewNotes },
  });

  return NextResponse.json(updated);
}
