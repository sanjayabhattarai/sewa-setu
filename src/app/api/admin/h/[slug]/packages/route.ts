import { NextResponse } from "next/server";
import { requireHospitalAccess, writeAuditLog } from "@/lib/admin-auth";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

// GET /api/admin/h/[slug]/packages
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  let ctx;
  try { ctx = await requireHospitalAccess(slug, "MANAGE_PACKAGES", { apiMode: true }); }
  catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "UNAUTHORIZED";
    return NextResponse.json({ error: msg }, { status: msg === "FORBIDDEN" ? 403 : 401 });
  }

  const packages = await db.hospitalPackage.findMany({
    where: { hospitalId: ctx.membership.hospitalId },
    orderBy: [{ isActive: "desc" }, { createdAt: "desc" }],
    select: {
      id: true, title: true, description: true, price: true,
      currency: true, isActive: true, createdAt: true,
      _count: { select: { bookings: true } },
    },
  });

  return NextResponse.json({ packages });
}

// POST /api/admin/h/[slug]/packages
export async function POST(
  req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  let ctx;
  try { ctx = await requireHospitalAccess(slug, "MANAGE_PACKAGES", { apiMode: true }); }
  catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "UNAUTHORIZED";
    return NextResponse.json({ error: msg }, { status: msg === "FORBIDDEN" ? 403 : 401 });
  }

  let body: { title?: string; description?: string; price?: number; currency?: string };
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { title, description, price, currency } = body;

  if (!title?.trim()) {
    return NextResponse.json({ error: "Title is required" }, { status: 400 });
  }

  if (price !== undefined && (typeof price !== "number" || price < 0)) {
    return NextResponse.json({ error: "Price must be a positive number" }, { status: 400 });
  }

  const pkg = await db.hospitalPackage.create({
    data: {
      hospitalId: ctx.membership.hospitalId,
      title: title.trim(),
      description: description?.trim() ?? null,
      price: price ?? null,
      currency: currency?.trim() || "EUR",
      isActive: true,
    },
  });

  await writeAuditLog({
    actorUserId: ctx.user.id,
    hospitalId: ctx.membership.hospitalId,
    action: "PACKAGE_CREATED",
    entity: "HospitalPackage",
    entityId: pkg.id,
    after: { title: pkg.title, price: pkg.price },
  });

  return NextResponse.json({ package: pkg }, { status: 201 });
}

// PATCH /api/admin/h/[slug]/packages
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  let ctx;
  try { ctx = await requireHospitalAccess(slug, "MANAGE_PACKAGES", { apiMode: true }); }
  catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "UNAUTHORIZED";
    return NextResponse.json({ error: msg }, { status: msg === "FORBIDDEN" ? 403 : 401 });
  }

  let body: { id?: string; title?: string; description?: string; price?: number; currency?: string; isActive?: boolean };
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { id, ...rest } = body;
  if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });

  const existing = await db.hospitalPackage.findFirst({
    where: { id, hospitalId: ctx.membership.hospitalId },
  });
  if (!existing) return NextResponse.json({ error: "Package not found" }, { status: 404 });

  const updateData: Record<string, unknown> = {};
  if (rest.title !== undefined) {
    const title = rest.title.trim();
    if (!title) return NextResponse.json({ error: "Title is required" }, { status: 400 });
    updateData.title = title;
  }
  if (rest.description !== undefined) updateData.description = rest.description?.trim() ?? null;
  if (rest.price !== undefined) {
    if (rest.price !== null && (typeof rest.price !== "number" || rest.price < 0)) {
      return NextResponse.json({ error: "Price must be a positive number" }, { status: 400 });
    }
    updateData.price = rest.price;
  }
  if (rest.currency !== undefined) updateData.currency = rest.currency.trim() || "EUR";
  if (rest.isActive !== undefined) updateData.isActive = rest.isActive;

  const updated = await db.hospitalPackage.update({
    where: { id },
    data: updateData as never,
  });

  await writeAuditLog({
    actorUserId: ctx.user.id,
    hospitalId: ctx.membership.hospitalId,
    action: rest.isActive === false ? "PACKAGE_DEACTIVATED" : "PACKAGE_UPDATED",
    entity: "HospitalPackage",
    entityId: id,
    before: { title: existing.title, isActive: existing.isActive, price: existing.price },
    after: { title: updated.title, isActive: updated.isActive, price: updated.price },
  });

  return NextResponse.json({ package: updated });
}
