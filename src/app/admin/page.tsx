import { redirect } from "next/navigation";
import { resolveAdminRedirect } from "@/lib/admin-auth";

// Auto-resolver: sends each user to the right workspace
export default async function AdminRootPage() {
  const destination = await resolveAdminRedirect();
  redirect(destination);
}
