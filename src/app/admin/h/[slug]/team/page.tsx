import { requireHospitalAccess } from "@/lib/admin-auth";
import { redirect } from "next/navigation";
import TeamClient from "./TeamClient";

export default async function TeamPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  let ctx;
  try {
    ctx = await requireHospitalAccess(slug, "VIEW_TEAM");
  } catch {
    redirect("/admin/request-access");
  }

  return <TeamClient slug={slug} actorRole={ctx.membership.role} actorUserId={ctx.user.id} />;
}
