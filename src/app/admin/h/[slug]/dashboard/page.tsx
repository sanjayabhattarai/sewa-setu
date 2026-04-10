import { requireHospitalAccess } from "@/lib/admin-auth";
import { redirect } from "next/navigation";
import DashboardClient from "./DashboardClient";

export default async function HospitalDashboardPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  try {
    await requireHospitalAccess(slug);
  } catch {
    redirect("/admin/request-access");
  }

  return <DashboardClient slug={slug} />;
}
