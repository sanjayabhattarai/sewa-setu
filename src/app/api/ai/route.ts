import { GoogleGenAI } from "@google/genai";
import { NextResponse } from "next/server";
import { MEDICAL_PACKAGES, PackageId } from "@/lib/packages";
import { db } from "@/lib/db";

/* -----------------------------------------------------
   Gemini Client (New SDK)
----------------------------------------------------- */
const API_KEY = process.env.GOOGLE_GENERATIVE_AI_API_KEY || "";

if (!API_KEY) {
  console.error("[AI API] ❌ GOOGLE_GENERATIVE_AI_API_KEY is missing");
}

// Initialize the new GoogleGenAI client
const ai = new GoogleGenAI({ apiKey: API_KEY });

/* -----------------------------------------------------
   Helpers
----------------------------------------------------- */

// Detect if user is asking to book
function detectBookingIntent(text: string): boolean {
  const bookingKeywords = [
    "book",
    "appointment",
    "checkup",
    "package",
    "reserve",
    "schedule",
    "want to book",
    "need help",
    "consult",
  ];
  return bookingKeywords.some((k) => text.toLowerCase().includes(k));
}

// Suggest a package based on user's symptoms/needs
function suggestPackage(
  userText: string
): { packageId: PackageId; name: string } {
  const text = userText.toLowerCase();

  if (text.includes("consultation")) {
    return { packageId: "consultation_physical", name: "Physical Consultation" };
  }
  if (
    text.includes("fever") ||
    text.includes("cold") ||
    text.includes("cough") ||
    text.includes("sick")
  ) {
    return { packageId: "general_checkup", name: "General Checkup" };
  }
  if (text.includes("appointment")) {
    return { packageId: "appointment", name: "Doctor Appointment" };
  }

  return { packageId: "general_checkup", name: "General Checkup" };
}

/* -----------------------------------------------------
   POST – AI Chat / Symptom Analysis
----------------------------------------------------- */
export async function POST(req: Request) {
  let userText = "";

  try {
    const body = await req.json();
    userText = body.prompt || "";
    const action = body.action || "chat";

    if (!userText) {
      return NextResponse.json({ text: "Please enter a message." });
    }

    console.log(
      `[AI API] New request – Action: ${action}, Text: ${userText.substring(0, 50)}`
    );

    const isBooking = detectBookingIntent(userText);
    const suggestedPackage = suggestPackage(userText);

    console.log(`[AI API] Intent detected: ${isBooking ? "BOOKING" : "CHAT"}`);

    /* ---------------- Booking Intent ---------------- */
    if (isBooking && action === "chat") {
      return NextResponse.json({
        text:
          "Great! I can help you book a consultation. " +
          "Please tell me about the health concern or symptoms.",
        type: "booking_intent",
        nextStep: "collect_symptoms",
      });
    }

    /* ---------------- Symptom Analysis ---------------- */
    if (action === "analyze_symptoms") {
      const analysisPrompt = `
You are a medical assistant for Sewa-Setu, a hospital booking platform in Nepal.

User's health concern:
"${userText}"

Provide a short, professional analysis (2–3 sentences) explaining
what type of consultation or checkup may be needed.
`;

      console.log("[AI API] Calling Gemini for symptom analysis...");
      
      const result = await ai.models.generateContent({
        model: "gemini-2.5-pro",
        contents: analysisPrompt,
      });
      
      const analysisText = result.text;

      console.log("[AI API] Symptom analysis successful");

      /* ---- Fetch hospitals ---- */
      const hospitals = await db.hospital.findMany({
        select: {
          id: true,
          name: true,
          slug: true,
          type: true,
          phone: true,
          email: true,
          location: {
            select: {
              city: true,
              district: true,
              area: true,
              addressLine: true,
            },
          },
          packages: { // <-- Fixed schema name
            select: {
              id: true,
              title: true,
              price: true,
              currency: true,
            },
          },
        },
        take: 10,
      });

      const cheapestHospitals = hospitals
        .map((h) => ({
          ...h,
          minPrice:
            h.packages.length > 0 // <-- Fixed schema name
              ? Math.min(...h.packages.map((p) => p.price ?? 999999).filter((p): p is number => typeof p === 'number'))
              : 999999,
        }))
        .sort((a, b) => a.minPrice - b.minPrice)
        .slice(0, 3);

      return NextResponse.json({
        text: analysisText,
        type: "symptoms_analyzed",
        hospitals: cheapestHospitals.map((h) => ({
          id: h.id,
          name: h.name,
          slug: h.slug,
          type: h.type,
          location: `${h.location.area || h.location.addressLine || ""}, ${
            h.location.city
          }`,
          minPrice: h.minPrice,
          services: h.packages.map((p) => p.title), // Mapping packages to 'services' so frontend doesn't break
        })),
        nextStep: "select_hospital",
      });
    }

    /* ---------------- Regular Chat ---------------- */
    console.log("[AI API] Calling Gemini for chat...");
    
    const chatResult = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `
You are the Sewa-Setu Medical Assistant.
Help users find the best health checkup packages for their parents in Nepal.

User says:
"${userText}"

Rules:
- Be polite and helpful
- Keep answers short (max 3 sentences)
- If booking is needed, suggest saying "I want to book"
`
    });

    return NextResponse.json({
      text: chatResult.text,
      type: "chat",
    });
  } catch (error: any) {
    console.error("[AI API ERROR]", error);

    /* -------- Rate limit -------- */
    if (error?.status === 429 || error?.message?.includes("429")) {
      return NextResponse.json(
        {
          text: "⏳ Too many requests right now. Please try again in a minute.",
          type: "error",
          error: "RATE_LIMITED",
        },
        { status: 429 }
      );
    }

    /* -------- Auth error -------- */
    if (error?.status === 403) {
      return NextResponse.json(
        {
          text: "🔑 AI authentication failed. Please check API key.",
          type: "error",
          error: "AUTH_FAILED",
        },
        { status: 403 }
      );
    }

    /* -------- Safe fallback (no retry storm) -------- */
    try {
      console.log("[AI API] Trying fallback model...");
      const res = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: userText || "Hello",
      });
      return NextResponse.json({
        text: res.text,
        type: "chat",
      });
    } catch {
      return NextResponse.json(
        {
          text: "⚠️ AI service temporarily unavailable. Please try again later.",
          type: "error",
        },
        { status: 503 }
      );
    }
  }
}

/* -----------------------------------------------------
   PUT – Create Booking (No Payment)
----------------------------------------------------- */
export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const {
      hospitalId,
      patientName,
      patientAge,
      patientPhone,
      buyerEmail,
      problemDescription,
      hospitalServiceId, 
    } = body;

    if (!hospitalId || !patientName || !patientAge || !patientPhone || !buyerEmail) {
      return NextResponse.json(
        { error: "Missing required booking information" },
        { status: 400 }
      );
    }

    let patient = await db.patient.findFirst({
      where: { user: { email: buyerEmail } },
    });

    if (!patient) {
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

      patient = await db.patient.create({
        data: {
          userId: user.id,
          fullName: patientName,
          phone: patientPhone,
        },
      });
    }

    const hospital = await db.hospital.findUnique({
      where: { id: hospitalId },
      include: { packages: true }, // <-- Fixed schema name
    });

    if (!hospital) {
      return NextResponse.json({ error: "Hospital not found" }, { status: 404 });
    }

    let snapshotPrice = 0;
    let snapshotServiceName = "";

    if (hospitalServiceId) {
      const selectedPackage = hospital.packages.find((p) => p.id === hospitalServiceId); // <-- Fixed schema name
      if (selectedPackage) {
        snapshotPrice = selectedPackage.price ?? 0;
        snapshotServiceName = selectedPackage.title;
      }
    }

    const booking = await db.booking.create({
      data: {
        userId: patient.userId,
        patientId: patient.id,
        hospitalId: hospital.id,
        mode: "PHYSICAL",
        scheduledAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        notes: `Problem: ${problemDescription}\nService: ${snapshotServiceName}\nPrice: ${snapshotPrice}`,
        status: "REQUESTED",
      },
      include: {
        hospital: true,
      },
    });

    return NextResponse.json({
      success: true,
      booking: {
        id: booking.id,
        hospitalName: booking.hospital.name,
        serviceName: snapshotServiceName,
        price: snapshotPrice,
        currency: snapshotPrice > 0 ? "NPR" : "EUR",
        patientName: patient.fullName,
        status: booking.status,
      },
    });
  } catch (error: any) {
    console.error("Booking error:", error);
    return NextResponse.json(
      { error: error.message || "Booking failed" },
      { status: 500 }
    );
  }
}