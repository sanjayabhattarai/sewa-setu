import { requireHospitalAccess } from "@/lib/admin-auth";
import { redirect } from "next/navigation";
import PackagesClient from "./PackagesClient";

export default async function PackagesPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  try {
    await requireHospitalAccess(slug, "MANAGE_PACKAGES");
  } catch {
    redirect("/admin/request-access");
  }

  return <PackagesClient slug={slug} />;
}
