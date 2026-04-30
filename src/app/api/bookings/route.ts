import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { ensureClerkUserInDb } from "@/lib/clerk-user-sync";

export const dynamic = "force-dynamic";

function getAppointmentDateTime(scheduledAt: Date, slotTime: string | null): Date {
  if (!slotTime) return scheduledAt;
  const start = slotTime.split("-")[0].trim();
  const [h, m = 0] = start.split(":").map(Number);
  const dt = new Date(scheduledAt);
  dt.setHours(h, m, 0, 0);
  return dt;
}

export async function GET(req: Request) {
  const { userId: clerkId } = await auth();
  if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const filter = searchParams.get("filter") || "all"; // all | upcoming | past
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
  const pageSize = Math.min(20, Math.max(5, parseInt(searchParams.get("pageSize") || "10", 10)));

  const dbUser = await ensureClerkUserInDb(clerkId);
  if (!dbUser) return NextResponse.json({ bookings: [], total: 0, hasMore: false });

  const include = {
    hospital: {
      select: {
        name: true, slug: true, phone: true, email: true,
        location: { select: { city: true, district: true, area: true, addressLine: true } },
      },
    },
    doctor: { select: { fullName: true } },
    package: { select: { title: true, price: true, currency: true } },
    patient: { select: { fullName: true } },
  };

  const totalAll = await db.booking.count({ where: { userId: dbUser.id } });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let raw: any[] = [];
  let total = 0;

  if (filter === "upcoming" || filter === "past") {
    // Limit to a safe cap — filter is JS-side because appointment time combines
    // scheduledAt (date) + slotTime (string). 500 is generous for any real user.
    const allForUser = await db.booking.findMany({
      where: { userId: dbUser.id },
      include,
      orderBy: { createdAt: "desc" },
      take: 500,
    });

    const now = Date.now();
    const filtered = allForUser.filter((b) => {
      const apptMs = getAppointmentDateTime(b.scheduledAt, b.slotTime).getTime();
      return filter === "upcoming" ? apptMs >= now : apptMs < now;
    });

    total = filtered.length;
    raw = filtered.slice((page - 1) * pageSize, page * pageSize);
  } else {
    const where = { userId: dbUser.id };
    [total, raw] = await Promise.all([
      db.booking.count({ where }),
      db.booking.findMany({
        where,
        include,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);
  }

  const bookings = raw.map((b) => ({
    id: b.id,
    status: b.status,
    scheduledAt: b.scheduledAt.toISOString(),
    createdAt: b.createdAt.toISOString(),
    confirmedAt: b.confirmedAt?.toISOString() ?? null,
    rescheduleCount: b.rescheduleCount,
    slotTime: b.slotTime ?? null,
    amountPaid: b.amountPaid ?? null,
    currency: b.currency ?? null,
    mode: b.mode,
    hospitalId: b.hospitalId ?? null,
    doctorId: b.doctorId ?? null,
    hospital: b.hospital
      ? { name: b.hospital.name, slug: b.hospital.slug, phone: b.hospital.phone ?? null, email: b.hospital.email ?? null, location: b.hospital.location ?? null }
      : null,
    doctor: b.doctor ? { fullName: b.doctor.fullName } : null,
    package: b.package ? { title: b.package.title, price: b.package.price ?? null, currency: b.package.currency ?? null } : null,
    patient: b.patient ? { fullName: b.patient.fullName } : null,
  }));

  return NextResponse.json({ bookings, total, totalAll, page, pageSize, hasMore: page * pageSize < total });
}
