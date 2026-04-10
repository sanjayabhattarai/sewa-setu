import { requireHospitalAccess } from "@/lib/admin-auth";
import { redirect } from "next/navigation";
import TeamClient from "./TeamClient";

export default async function TeamPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  try {
    await requireHospitalAccess(slug, "MANAGE_TEAM");
  } catch {
    redirect("/admin/request-access");
  }

  return <TeamClient slug={slug} />;
}
