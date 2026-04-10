import { requireHospitalAccess } from "@/lib/admin-auth";
import { redirect } from "next/navigation";
import BookingsClient from "./BookingsClient";

export default async function BookingsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  try {
    await requireHospitalAccess(slug, "VIEW_BOOKINGS");
  } catch {
    redirect("/admin/request-access");
  }

  return <BookingsClient slug={slug} />;
}
