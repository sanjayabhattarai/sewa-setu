import { NextRequest, NextResponse } from "next/server";
import { requirePlatformStaff, writeAuditLog } from "@/lib/admin-auth";
import { db } from "@/lib/db";
import { PartnerInquiryStatus } from "@prisma/client";

export const dynamic = "force-dynamic";

function slugifyHospitalName(name: string) {
  const slug = name
    .toLowerCase()
    .trim()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return slug || `hospital-${Date.now()}`;
}

async function createUniqueHospitalSlug(name: string) {
  const base = slugifyHospitalName(name);
  let slug = base;
  let suffix = 2;

  while (await db.hospital.findUnique({ where: { slug }, select: { id: true } })) {
    slug = `${base}-${suffix}`;
    suffix += 1;
  }

  return slug;
}

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

  if (status === "ONBOARDED") {
    if (!ctx.isAdmin) {
      return NextResponse.json({ error: "Only platform admins can approve onboarding" }, { status: 403 });
    }
    if (existing.status === "REJECTED") {
      return NextResponse.json({ error: "Rejected inquiries must be reopened before onboarding" }, { status: 400 });
    }

    const slug = existing.hospitalId ? null : await createUniqueHospitalSlug(existing.hospitalName);
    const now = new Date();

    const result = await db.$transaction(async (tx) => {
      const hospital = existing.hospitalId
        ? await tx.hospital.findUnique({ where: { id: existing.hospitalId } })
        : await tx.hospital.create({
            data: {
              slug: slug!,
              name: existing.hospitalName,
              type: existing.type,
              phone: existing.phone,
              email: existing.email,
              verified: true,
              verifiedAt: now,
              verifiedById: ctx.user.id,
              isActive: true,
              location: {
                create: {
                  country: "NP",
                  district: existing.city,
                  city: existing.city,
                },
              },
            },
          });

      if (!hospital) {
        throw new Error("Linked hospital not found");
      }

      const owner = await tx.user.upsert({
        where: { email: existing.email },
        update: {
          fullName: existing.contactName,
          phone: existing.phone,
        },
        create: {
          clerkId: `pending_owner_${existing.id}`,
          fullName: existing.contactName,
          email: existing.email,
          phone: existing.phone,
          country: "NP",
        },
      });

      const membership = await tx.hospitalMembership.upsert({
        where: { userId_hospitalId: { userId: owner.id, hospitalId: hospital.id } },
        update: {
          role: "OWNER",
          status: "APPROVED",
          approvedAt: now,
          approvedById: ctx.user.id,
          rejectedAt: null,
          rejectedById: null,
          rejectedReason: null,
        },
        create: {
          userId: owner.id,
          hospitalId: hospital.id,
          role: "OWNER",
          status: "APPROVED",
          invitedBy: ctx.user.id,
          approvedAt: now,
          approvedById: ctx.user.id,
        },
      });

      const inquiry = await tx.partnerInquiry.update({
        where: { id },
        data: {
          hospitalId: hospital.id,
          status: "ONBOARDED",
          reviewNotes: reviewNotes ?? undefined,
          reviewedAt: now,
        },
      });

      return {
        hospital,
        owner,
        membership,
        inquiry,
        createdHospital: !existing.hospitalId,
      };
    });

    await writeAuditLog({
      actorUserId: ctx.user.id,
      hospitalId: result.hospital.id,
      action: result.createdHospital ? "HOSPITAL_CREATED_FROM_INQUIRY" : "HOSPITAL_LINKED_FROM_INQUIRY",
      entity: "Hospital",
      entityId: result.hospital.id,
      after: { inquiryId: existing.id, name: result.hospital.name, slug: result.hospital.slug },
    });

    await writeAuditLog({
      actorUserId: ctx.user.id,
      hospitalId: result.hospital.id,
      action: "INITIAL_OWNER_ASSIGNED",
      entity: "HospitalMembership",
      entityId: result.membership.id,
      after: { userId: result.owner.id, role: result.membership.role, status: result.membership.status },
    });

    await writeAuditLog({
      actorUserId: ctx.user.id,
      hospitalId: result.hospital.id,
      action: "INQUIRY_ONBOARDED",
      entity: "PartnerInquiry",
      entityId: result.inquiry.id,
      before: { status: existing.status, hospitalId: existing.hospitalId, reviewNotes: existing.reviewNotes },
      after: { status: result.inquiry.status, hospitalId: result.inquiry.hospitalId, reviewNotes: result.inquiry.reviewNotes },
    });

    return NextResponse.json(result.inquiry);
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
