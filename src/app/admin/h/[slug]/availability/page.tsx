import { requireHospitalAccess } from "@/lib/admin-auth";
import { redirect } from "next/navigation";
import AvailabilityClient from "./AvailabilityClient";

export default async function AvailabilityPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  try {
    await requireHospitalAccess(slug, "MANAGE_AVAILABILITY");
  } catch {
    redirect("/admin/request-access");
  }

  return <AvailabilityClient slug={slug} />;
}
