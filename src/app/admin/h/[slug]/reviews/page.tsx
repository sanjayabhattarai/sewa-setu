import { requireHospitalAccess } from "@/lib/admin-auth";
import { redirect } from "next/navigation";
import ReviewsClient from "./ReviewsClient";

export default async function ReviewsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  try {
    await requireHospitalAccess(slug, "MODERATE_REVIEWS");
  } catch {
    redirect("/admin/request-access");
  }

  return <ReviewsClient slug={slug} />;
}
