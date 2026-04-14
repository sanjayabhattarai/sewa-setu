import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { HospitalType } from "@prisma/client";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { hospitalName, type, contactName, email, phone, city, message } = body;

    if (!hospitalName || !type || !contactName || !email || !phone || !city) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    if (!Object.values(HospitalType).includes(type)) {
      return NextResponse.json({ error: "Invalid hospital type" }, { status: 400 });
    }

    const inquiry = await db.partnerInquiry.create({
      data: { hospitalName, type, contactName, email, phone, city, message: message || null },
    });

    return NextResponse.json({ success: true, id: inquiry.id }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
