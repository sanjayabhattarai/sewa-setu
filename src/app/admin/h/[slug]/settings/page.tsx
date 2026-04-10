import { requireHospitalAccess } from "@/lib/admin-auth";
import { redirect } from "next/navigation";
import SettingsClient from "./SettingsClient";

export default async function SettingsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  try {
    await requireHospitalAccess(slug, "MANAGE_SETTINGS");
  } catch {
    redirect("/admin/request-access");
  }

  return <SettingsClient slug={slug} />;
}
