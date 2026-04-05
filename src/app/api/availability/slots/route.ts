import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

// GET /api/availability/slots?doctorId=xxx
// Returns all active availability slots for a doctor (used for reschedule picker)
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const doctorId = searchParams.get("doctorId");

  if (!doctorId) {
    return NextResponse.json({ error: "doctorId required" }, { status: 400 });
  }

  const slots = await db.availabilitySlot.findMany({
    where: { doctorId, isActive: true },
    select: {
      id: true,
      doctorId: true,
      hospitalId: true,
      mode: true,
      dayOfWeek: true,
      startTime: true,
      endTime: true,
      slotDurationMinutes: true,
    },
    orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
  });

  return NextResponse.json({ slots });
}
