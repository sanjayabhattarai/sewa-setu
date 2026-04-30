import { redirect } from "next/navigation";
import { requirePlatformStaff } from "@/lib/admin-auth";
import PlatformShell from "./PlatformShell";

export default async function PlatformLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let user;
  try {
    const ctx = await requirePlatformStaff();
    user = ctx.user;
  } catch {
    redirect("/");
  }

  return <PlatformShell user={user}>{children}</PlatformShell>;
}
