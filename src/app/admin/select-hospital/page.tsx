import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import Link from "next/link";
import { Building2, ChevronRight } from "lucide-react";

export default async function SelectHospitalPage() {
  const { userId: clerkId } = await auth();
  if (!clerkId) redirect("/sign-in");

  const user = await db.user.findUnique({
    where: { clerkId },
    select: {
      role: true,
      memberships: {
        where: { status: "APPROVED" },
        include: { hospital: { select: { id: true, name: true, slug: true, type: true, verified: true } } },
        orderBy: { hospital: { name: "asc" } },
      },
    },
  });

  if (!user) redirect("/sign-in");
  if (user.role === "PLATFORM_ADMIN" || user.role === "ADMIN") redirect("/admin/platform/dashboard");
  if (user.memberships.length === 0) redirect("/admin/request-access");
  if (user.memberships.length === 1) redirect(`/admin/h/${user.memberships[0].hospital.slug}/dashboard`);

  const ROLE_LABELS: Record<string, string> = {
    HOSPITAL_OWNER:   "Owner",
    HOSPITAL_MANAGER: "Manager",
    RECEPTION:        "Receptionist",
    CONTENT_EDITOR:   "Content Editor",
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: "#f0ece4" }}>
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center h-14 w-14 rounded-2xl mb-4"
            style={{ background: "linear-gradient(135deg,#0f1e38,#1a3059)" }}>
            <Building2 size={24} className="text-[#c8a96e]" />
          </div>
          <h1 className="text-2xl font-extrabold text-[#0f1e38]">Select Hospital</h1>
          <p className="text-sm text-gray-500 mt-1">You have access to multiple hospitals</p>
        </div>

        <div className="space-y-2">
          {user.memberships.map((m) => (
            <Link
              key={m.id}
              href={`/admin/h/${m.hospital.slug}/dashboard`}
              className="flex items-center gap-4 p-4 bg-white rounded-2xl border border-gray-100 group transition-all hover:border-[#c8a96e] hover:shadow-sm"
            >
              <div className="h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: "rgba(200,169,110,.12)" }}>
                <Building2 size={18} className="text-[#c8a96e]" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-bold text-[#0f1e38] text-sm">{m.hospital.name}</p>
                  {m.hospital.verified && (
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                      style={{ background: "rgba(16,185,129,.1)", color: "#059669" }}>
                      Verified
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-400">
                  {ROLE_LABELS[m.role] ?? m.role} · {m.hospital.type.toLowerCase()}
                </p>
              </div>
              <ChevronRight size={16} className="text-gray-300 group-hover:text-[#c8a96e] transition-colors flex-shrink-0" />
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
