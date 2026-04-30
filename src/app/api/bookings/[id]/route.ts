import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { ensureClerkUserInDb } from "@/lib/clerk-user-sync";

export const dynamic = "force-dynamic";

const THIRTY_MINS_MS = 30 * 60 * 1000;
const ONE_HOUR_MS = 60 * 60 * 1000;

/** Parse the actual appointment DateTime by combining the date with the slot start time. */
function getAppointmentDateTime(scheduledAt: Date, slotTime: string | null): Date {
  if (!slotTime) return scheduledAt;
  const start = slotTime.split("-")[0].trim(); // "09:30-10:00" → "09:30"
  const [h, m] = start.split(":").map(Number);
  const dt = new Date(scheduledAt);
  dt.setHours(h, m ?? 0, 0, 0);
  return dt;
}

// GET /api/bookings/:id — fetch single booking (used by reschedule modal for fresh doctorId)
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { userId: clerkId } = await auth();
  if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const dbUser = await ensureClerkUserInDb(clerkId);
  if (!dbUser) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const booking = await db.booking.findFirst({
    where: { id, userId: dbUser.id },
    select: { doctorId: true, hospitalId: true, packageId: true, createdAt: true },
  });

  if (!booking) return NextResponse.json({ error: "Booking not found" }, { status: 404 });

  return NextResponse.json({
    doctorId: booking.doctorId ?? null,
    hospitalId: booking.hospitalId ?? null,
    packageId: booking.packageId ?? null,
    createdAt: booking.createdAt.toISOString(),
  });
}

// PATCH /api/bookings/:id — reschedule a confirmed booking
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { userId: clerkId } = await auth();
  if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: { scheduledAt?: string; slotTime?: string; availabilitySlotId?: string | null };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { scheduledAt, slotTime, availabilitySlotId } = body;

  if (!scheduledAt || !slotTime) {
    return NextResponse.json({ error: "scheduledAt and slotTime are required" }, { status: 400 });
  }

  const dbUser = await ensureClerkUserInDb(clerkId);
  if (!dbUser) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const booking = await db.booking.findFirst({
    where: { id, userId: dbUser.id },
  });

  if (!booking) return NextResponse.json({ error: "Booking not found" }, { status: 404 });

  if (booking.status !== "CONFIRMED") {
    return NextResponse.json(
      { error: "Only confirmed bookings can be rescheduled" },
      { status: 400 }
    );
  }

  // Guard 0: only one reschedule is allowed per booking
  const currentRescheduleCount = (booking as { rescheduleCount?: number }).rescheduleCount ?? 0;
  if (currentRescheduleCount >= 1) {
    return NextResponse.json(
      { error: "You can reschedule this appointment only once." },
      { status: 400 }
    );
  }

  const currentApptTime = getAppointmentDateTime(booking.scheduledAt, booking.slotTime);
  const rescheduleWindowStart = (booking as { confirmedAt?: Date | null }).confirmedAt ?? booking.createdAt;

  // Guard new: if the booking was made within 1 hour of start time, it is final (no reschedule, no refund)
  if (currentApptTime.getTime() - rescheduleWindowStart.getTime() <= ONE_HOUR_MS) {
    return NextResponse.json(
      { error: "This appointment was booked within 1 hour of the start time. It cannot be rescheduled or refunded." },
      { status: 400 }
    );
  }

  // Guard 1: must be within 30 mins of payment confirmation
  if (Date.now() - rescheduleWindowStart.getTime() > THIRTY_MINS_MS) {
    return NextResponse.json(
      { error: "Reschedule window has expired. You can only reschedule within 30 minutes of payment confirmation." },
      { status: 400 }
    );
  }

  // Guard 2: if current appointment starts within 30 mins, block reschedule (no refund)
  if (currentApptTime.getTime() - Date.now() <= THIRTY_MINS_MS) {
    return NextResponse.json(
      { error: "Your appointment starts in less than 30 minutes. Rescheduling and refunds are no longer available." },
      { status: 400 }
    );
  }

  // Guard 3: new slot must start more than 30 mins from now
  const newApptTime = getAppointmentDateTime(new Date(scheduledAt), slotTime);
  if (newApptTime.getTime() - Date.now() <= THIRTY_MINS_MS) {
    return NextResponse.json(
      { error: "The selected slot starts in less than 30 minutes and cannot be booked." },
      { status: 400 }
    );
  }

  // Guard 4: reject unreasonably far-future dates (> 1 year)
  const MAX_FUTURE_MS = 365 * 24 * 60 * 60 * 1000;
  if (newApptTime.getTime() - Date.now() > MAX_FUTURE_MS) {
    return NextResponse.json(
      { error: "Cannot reschedule more than one year in advance." },
      { status: 400 }
    );
  }

  // Guard 5: if a doctor slot is provided, verify it belongs to the booking's doctor
  if (availabilitySlotId && booking.doctorId) {
    const slot = await db.availabilitySlot.findFirst({
      where: { id: availabilitySlotId, doctorId: booking.doctorId },
      select: { id: true },
    });
    if (!slot) {
      return NextResponse.json(
        { error: "The selected slot does not belong to the booking's doctor." },
        { status: 400 }
      );
    }
  }

  try {
    const data: Record<string, unknown> = {
      scheduledAt: new Date(scheduledAt),
      slotTime,
      rescheduleCount: { increment: 1 },
      ...(availabilitySlotId !== undefined
        ? { availabilitySlotId: availabilitySlotId ?? null }
        : {}),
    };

    const updated = await db.booking.update({
      where: { id },
      data: data as never,
    });

    return NextResponse.json({
      scheduledAt: updated.scheduledAt.toISOString(),
      slotTime: updated.slotTime,
      rescheduleCount: (updated as { rescheduleCount?: number }).rescheduleCount ?? 0,
    });
  } catch (err: unknown) {
    // Unique constraint: slot already booked on that date by someone else
    if (
      typeof err === "object" &&
      err !== null &&
      "code" in err &&
      (err as { code: string }).code === "P2002"
    ) {
      return NextResponse.json(
        { error: "That time slot is already booked. Please choose another." },
        { status: 409 }
      );
    }
    console.error("Reschedule error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
