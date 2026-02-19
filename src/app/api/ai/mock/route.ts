import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// Mock AI endpoint for testing WITHOUT hitting Gemini rate limits
export async function POST(req: Request) {
  const body = await req.json();
  const userText = body.prompt || "";
  const action = body.action || "chat";

  console.log(`[MOCK AI] Action: ${action}, Text: ${userText.substring(0, 50)}`);

  // Mock booking intent
  if (action === "chat" && userText.toLowerCase().includes("book")) {
    return NextResponse.json({
      text: "Great! I'd like to help you book a consultation. First, tell me more about your health concern. What specific symptoms or problems are you experiencing?",
      type: "booking_intent",
      nextStep: "collect_symptoms",
    });
  }

  // Mock symptom analysis
  if (action === "analyze_symptoms") {
    console.log("[MOCK AI] Analyzing symptoms and fetching hospitals...");

    const hospitals = await db.hospital.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
        type: true,
        location: {
          select: {
            area: true,
            city: true,
            addressLine: true,
          },
        },
        packages: {
          select: {
            title: true,
            price: true,
          },
        },
      },
      take: 10,
    });

    const hospitalsWithMinPrice = hospitals
      .map((h) => ({
        ...h,
        minPrice: h.packages.length > 0 
          ? Math.min(...h.packages.map(s => s.price).filter((p): p is number => p !== null))
          : 999999,
      }))
      .sort((a, b) => a.minPrice - b.minPrice)
      .slice(0, 3);

    return NextResponse.json({
      text: `Based on your symptoms, I recommend a general checkup. I've found ${hospitalsWithMinPrice.length} nearby hospitals that offer affordable services.`,
      type: "symptoms_analyzed",
      hospitals: hospitalsWithMinPrice.map((h) => ({
        id: h.id,
        name: h.name,
        slug: h.slug,
        type: h.type,
        location: `${h.location.area || h.location.addressLine || ""}, ${h.location.city}`,
        minPrice: h.minPrice,
        services: h.packages.map(s => s.title),
      })),
      nextStep: "select_hospital",
    });
  }

  // Mock regular chat
  return NextResponse.json({
    text: "Hello! I'm the Sewa-Setu Medical Assistant. How can I help you find the right health checkup today?",
    type: "chat",
  });
}

// Create booking
export async function PUT(req: Request) {
  const body = await req.json();
  const { hospitalId, patientName, patientAge, patientPhone, buyerEmail, problemDescription } = body;

  console.log(`[MOCK AI] Creating booking for ${patientName}...`);

  if (!hospitalId || !patientName || !patientAge || !patientPhone || !buyerEmail) {
    return NextResponse.json(
      { error: "Missing required fields" },
      { status: 400 }
    );
  }

  try {
    // Get or create user
    let user = await db.user.findUnique({
      where: { email: buyerEmail },
    });

    if (!user) {
      user = await db.user.create({
        data: {
          email: buyerEmail,
          fullName: patientName,
          phone: patientPhone,
          country: "Nepal",
        },
      });
    }

    // Get or create patient
    let patient = await db.patient.findFirst({
      where: { user: { email: buyerEmail } },
    });

    if (!patient) {
      patient = await db.patient.create({
        data: {
          userId: user.id,
          fullName: patientName,
          phone: patientPhone,
        },
      });
    }

    // Get hospital
    const hospital = await db.hospital.findUnique({
      where: { id: hospitalId },
    });

    if (!hospital) {
      return NextResponse.json({ error: "Hospital not found" }, { status: 404 });
    }

    // Create booking
    const booking = await db.booking.create({
      data: {
        userId: user.id,
        patientId: patient.id,
        hospitalId: hospital.id,
        mode: "PHYSICAL",
        scheduledAt: new Date(new Date().getTime() + 7 * 24 * 60 * 60 * 1000),
        notes: `Problem: ${problemDescription}`,
        status: "REQUESTED",
      },
    });

    console.log(`[MOCK AI] ✓ Booking created: ${booking.id}`);

    return NextResponse.json({
      success: true,
      booking: {
        id: booking.id,
        hospitalName: hospital.name,
        status: booking.status,
      },
    });
  } catch (error: any) {
    console.error("[MOCK AI] Error:", error.message);
    return NextResponse.json(
      { error: error.message || "Booking failed" },
      { status: 500 }
    );
  }
}
