import { redirect } from "next/navigation";
import { requireHospitalAccess } from "@/lib/admin-auth";
import { db } from "@/lib/db";
import HospitalAdminShell from "./HospitalAdminShell";
import { isPlatformAdmin } from "@/lib/admin-roles";

export default async function HospitalAdminLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  let ctx;
  try {
    ctx = await requireHospitalAccess(slug);
  } catch {
    redirect("/admin/request-access");
  }

  const hospital = await db.hospital.findUnique({
    where: { slug },
    select: { id: true, name: true, slug: true, type: true, verified: true },
  });

  if (!hospital) redirect("/admin");

  // Pending confirmation count for sidebar badge
  const pendingCount = await db.booking.count({
    where: { hospitalId: hospital.id, status: "REQUESTED" },
  });

  // Back link — platform admins go to platform dashboard
  // Staff with multiple hospitals go to select-hospital
  // Staff with one hospital have no back link
  let backLink: { href: string; label: string } | null = null;

  if (isPlatformAdmin(ctx.user.role)) {
    backLink = { href: "/admin/platform/dashboard", label: "Platform Admin" };
  } else {
    const membershipCount = await db.hospitalMembership.count({
      where: { userId: ctx.user.id, status: "APPROVED" },
    });
    if (membershipCount > 1) {
      backLink = { href: "/admin/select-hospital", label: "Switch Hospital" };
    }
  }

  return (
    <HospitalAdminShell
      hospital={hospital}
      user={ctx.user}
      role={ctx.membership.role}
      pendingCount={pendingCount}
      backLink={backLink}
    >
      {children}
    </HospitalAdminShell>
  );
}
