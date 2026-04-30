import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { isPlatformAdmin } from "@/lib/admin-roles";

// Returns the admin destination href for the signed-in user, or null if no access.
// Used by the navbar to conditionally show an Admin Panel link.
export async function GET() {
  const { userId: clerkId } = await auth();
  if (!clerkId) return NextResponse.json({ href: null });

  const user = await db.user.findUnique({
    where: { clerkId },
    select: {
      id: true,
      role: true,
      bannedAt: true,
      memberships: {
        where: { status: "APPROVED" },
        include: { hospital: { select: { slug: true } } },
      },
    },
  });

  if (!user || user.bannedAt) return NextResponse.json({ href: null });

  if (isPlatformAdmin(user.role)) {
    return NextResponse.json({ href: "/admin/platform/dashboard" });
  }

  const approved = user.memberships;

  if (approved.length === 1) {
    return NextResponse.json({ href: `/admin/h/${approved[0].hospital.slug}/dashboard` });
  }

  if (approved.length > 1) {
    return NextResponse.json({ href: "/admin/select-hospital" });
  }

  return NextResponse.json({ href: null });
}
