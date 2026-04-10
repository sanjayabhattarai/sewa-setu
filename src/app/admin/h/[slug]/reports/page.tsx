import { requireHospitalAccess } from "@/lib/admin-auth";
import { redirect } from "next/navigation";
import ReportsClient from "./ReportsClient";

export default async function ReportsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  try {
    await requireHospitalAccess(slug, "VIEW_REPORTS");
  } catch {
    redirect("/admin/request-access");
  }

  return <ReportsClient slug={slug} />;
}
