import { NextResponse } from "next/server";
import type { HospitalRole } from "@prisma/client";
import { requireHospitalAccess, writeAuditLog } from "@/lib/admin-auth";
import { hasPermission } from "@/lib/admin-permissions";
import { db } from "@/lib/db";
import {
  TEAM_ASSIGNABLE_ROLES,
  canManageHospitalMember,
  getAssignableHospitalRoles,
} from "@/lib/admin-roles";

export const dynamic = "force-dynamic";

const VALID_ROLES: HospitalRole[] = [...TEAM_ASSIGNABLE_ROLES];

async function ensureApprovedOwnerWillRemain(hospitalId: string, userId: string) {
  const approvedOwners = await db.hospitalMembership.count({
    where: { hospitalId, role: "OWNER", status: "APPROVED" },
  });

  const targetIsApprovedOwner = await db.hospitalMembership.findFirst({
    where: { hospitalId, userId, role: "OWNER", status: "APPROVED" },
    select: { id: true },
  });

  if (targetIsApprovedOwner && approvedOwners <= 1) {
    throw new Error("At least one approved owner must remain assigned to the hospital");
  }
}

function jsonError(error: unknown, fallback = "UNAUTHORIZED") {
  const message = error instanceof Error ? error.message : fallback;
  const status =
    message === "FORBIDDEN" ? 403 :
    message === "NOT_FOUND" ? 404 :
    message === "At least one approved owner must remain assigned to the hospital" ? 400 :
    401;

  return NextResponse.json({ error: message }, { status });
}

// GET /api/admin/h/[slug]/team
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;

  let ctx;
  try {
    ctx = await requireHospitalAccess(slug, "VIEW_TEAM", { apiMode: true });
  } catch (error: unknown) {
    return jsonError(error);
  }

  const members = await db.hospitalMembership.findMany({
    where: { hospitalId: ctx.membership.hospitalId },
    include: {
      user: { select: { fullName: true, email: true, createdAt: true } },
    },
    orderBy: [{ status: "asc" }, { createdAt: "asc" }],
  });

  return NextResponse.json({
    members: members.map((member) => ({
      id: member.id,
      userId: member.userId,
      role: member.role,
      status: member.status,
      invitedBy: member.invitedBy ?? null,
      rejectedReason: member.rejectedReason ?? null,
      createdAt: member.createdAt.toISOString(),
      user: {
        fullName: member.user.fullName,
        email: member.user.email,
        memberSince: member.user.createdAt.toISOString(),
      },
    })),
  });
}

// PATCH /api/admin/h/[slug]/team
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;

  let ctx;
  try {
    ctx = await requireHospitalAccess(slug, "VIEW_TEAM", { apiMode: true });
  } catch (error: unknown) {
    return jsonError(error);
  }

  let body: { memberId?: string; role?: string; status?: string; rejectedReason?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { memberId, role, status, rejectedReason } = body;
  if (!memberId) return NextResponse.json({ error: "memberId is required" }, { status: 400 });

  if (role && !VALID_ROLES.includes(role as HospitalRole)) {
    return NextResponse.json({ error: "Invalid role" }, { status: 400 });
  }

  const member = await db.hospitalMembership.findFirst({
    where: { id: memberId, hospitalId: ctx.membership.hospitalId },
  });
  if (!member) return NextResponse.json({ error: "Member not found" }, { status: 404 });

  if (role && !hasPermission(ctx.membership.role, "MANAGE_TEAM_ROLES")) {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  }

  if (status && !hasPermission(ctx.membership.role, "APPROVE_TEAM_MEMBERS")) {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  }

  if (!canManageHospitalMember(ctx.membership.role, member.role)) {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  }

  if (member.userId === ctx.user.id && role && role !== "OWNER") {
    return NextResponse.json({ error: "You cannot change your own role" }, { status: 400 });
  }

  if (member.userId === ctx.user.id && status === "REJECTED") {
    return NextResponse.json({ error: "You cannot reject your own membership" }, { status: 400 });
  }

  if (role) {
    const allowedRoles = getAssignableHospitalRoles(ctx.membership.role);
    if (!allowedRoles.includes(role as HospitalRole)) {
      return NextResponse.json({ error: "You cannot assign that role" }, { status: 403 });
    }
  }

  if (role && role !== "OWNER" && member.role === "OWNER" && member.status === "APPROVED") {
    try {
      await ensureApprovedOwnerWillRemain(ctx.membership.hospitalId, member.userId);
    } catch (error) {
      return jsonError(error);
    }
  }

  if (status === "REJECTED" && member.role === "OWNER" && member.status === "APPROVED") {
    try {
      await ensureApprovedOwnerWillRemain(ctx.membership.hospitalId, member.userId);
    } catch (error) {
      return jsonError(error);
    }
  }

  const updateData: Record<string, unknown> = {};

  if (role) updateData.role = role;

  if (status === "APPROVED") {
    updateData.status = "APPROVED";
    updateData.approvedAt = new Date();
    updateData.approvedById = ctx.user.id;
    updateData.rejectedAt = null;
    updateData.rejectedById = null;
    updateData.rejectedReason = null;
  }

  if (status === "REJECTED") {
    updateData.status = "REJECTED";
    updateData.rejectedAt = new Date();
    updateData.rejectedById = ctx.user.id;
    updateData.approvedAt = null;
    updateData.approvedById = null;
    updateData.rejectedReason = rejectedReason?.trim() ?? null;
  }

  const updated = await db.hospitalMembership.update({
    where: { id: memberId },
    data: updateData as never,
  });

  await writeAuditLog({
    actorUserId: ctx.user.id,
    hospitalId: ctx.membership.hospitalId,
    action:
      status === "REJECTED"
        ? "MEMBER_REJECTED"
        : status === "APPROVED"
          ? "MEMBER_APPROVED"
          : "MEMBER_ROLE_CHANGED",
    entity: "HospitalMembership",
    entityId: memberId,
    before: { role: member.role, status: member.status },
    after: { role: updated.role, status: updated.status },
  });

  return NextResponse.json({ success: true });
}

// DELETE /api/admin/h/[slug]/team
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;

  let ctx;
  try {
    ctx = await requireHospitalAccess(slug, "VIEW_TEAM", { apiMode: true });
  } catch (error: unknown) {
    return jsonError(error);
  }

  const { searchParams } = new URL(req.url);
  const memberId = searchParams.get("memberId");
  if (!memberId) return NextResponse.json({ error: "memberId is required" }, { status: 400 });

  const member = await db.hospitalMembership.findFirst({
    where: { id: memberId, hospitalId: ctx.membership.hospitalId },
  });
  if (!member) return NextResponse.json({ error: "Member not found" }, { status: 404 });

  if (!hasPermission(ctx.membership.role, "REMOVE_TEAM_MEMBERS")) {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  }

  if (member.userId === ctx.user.id) {
    return NextResponse.json({ error: "You cannot remove yourself" }, { status: 400 });
  }

  if (!canManageHospitalMember(ctx.membership.role, member.role)) {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  }

  if (member.role === "OWNER" && member.status === "APPROVED") {
    try {
      await ensureApprovedOwnerWillRemain(ctx.membership.hospitalId, member.userId);
    } catch (error) {
      return jsonError(error);
    }
  }

  await db.hospitalMembership.delete({ where: { id: memberId } });

  await writeAuditLog({
    actorUserId: ctx.user.id,
    hospitalId: ctx.membership.hospitalId,
    action: "MEMBER_REMOVED",
    entity: "HospitalMembership",
    entityId: memberId,
    before: { role: member.role, status: member.status },
  });

  return NextResponse.json({ success: true });
}
