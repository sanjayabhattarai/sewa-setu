import { requireHospitalAccess } from "@/lib/admin-auth";
import { redirect } from "next/navigation";
import DoctorsClient from "./DoctorsClient";

export default async function DoctorsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  try {
    await requireHospitalAccess(slug, "VIEW_DOCTORS");
  } catch {
    redirect("/admin/request-access");
  }

  return <DoctorsClient slug={slug} />;
}
