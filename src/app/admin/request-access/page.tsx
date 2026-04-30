import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import RequestAccessClient from "./RequestAccessClient";
import { isPlatformStaff } from "@/lib/admin-roles";
import { ensureClerkUserInDb } from "@/lib/clerk-user-sync";

export default async function RequestAccessPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { userId: clerkId } = await auth();
  if (!clerkId) redirect("/sign-in");

  await ensureClerkUserInDb(clerkId);

  const params = await searchParams;

  const user = await db.user.findUnique({
    where: { clerkId },
    select: {
      id: true,
      fullName: true,
      email: true,
      role: true,
      memberships: {
        include: { hospital: { select: { id: true, name: true, slug: true } } },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!user) redirect("/sign-in");

  if (isPlatformStaff(user.role)) {
    redirect("/admin/platform/dashboard");
  }

  // Fetch all active hospitals for the dropdown
  const hospitals = await db.hospital.findMany({
    where: { isActive: true },
    select: { id: true, name: true, slug: true },
    orderBy: { name: "asc" },
  });

  return (
    <RequestAccessClient
      user={{ fullName: user.fullName, email: user.email }}
      hospitals={hospitals}
      existingMemberships={user.memberships.map((m) => ({
        id: m.id,
        hospitalId: m.hospitalId,
        hospitalName: m.hospital.name,
        hospitalSlug: m.hospital.slug,
        role: m.role,
        status: m.status,
      }))}
      pendingStatus={params.status === "pending"}
    />
  );
}
