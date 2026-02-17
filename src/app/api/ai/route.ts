import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";
import { MEDICAL_PACKAGES, PackageId } from "@/lib/packages";
import { db } from "@/lib/db";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY || "");

// Detect if user is asking to book
function detectBookingIntent(text: string): boolean {
  const bookingKeywords = ["book", "appointment", "checkup", "package", "reserve", "schedule", "want to book", "need help", "consult"];
  return bookingKeywords.some(keyword => text.toLowerCase().includes(keyword));
}

// Suggest a package based on user's symptoms/needs
function suggestPackage(userText: string): { packageId: PackageId; name: string } | null {
  const text = userText.toLowerCase();
  
  if (text.includes("consultation")) {
    return { packageId: "consultation_physical", name: "Physical Consultation" };
  }
  if (text.includes("fever") || text.includes("cold") || text.includes("cough") || text.includes("sick")) {
    return { packageId: "general_checkup", name: "General Checkup" };
  }
  if (text.includes("appointment")) {
    return { packageId: "appointment", name: "Doctor Appointment" };
  }
  
  return { packageId: "general_checkup", name: "General Checkup" };
}

export async function POST(req: Request) {
  let userText = "";

  try {
    const body = await req.json();
    userText = body.prompt || "";
    const action = body.action || "chat";

    console.log(`[AI API] New request - Action: ${action}, Text: ${userText.substring(0, 50)}`);

    if (!userText) {
      return NextResponse.json({ text: "Please enter a message." });
    }

    // Check if user wants to book
    const isBooking = detectBookingIntent(userText);
    const suggestedPackage = suggestPackage(userText);
    
    console.log(`[AI API] Intent detected: ${isBooking ? "BOOKING" : "CHAT"}`);

    if (isBooking && action === "chat") {
      // Return booking response with special structure
      return NextResponse.json({
        text: `Great! I'd like to help you book a consultation. First, tell me more about your health concern. What specific symptoms or problems are you experiencing? (e.g., fever, chest pain, general checkup, etc.)`,
        type: "booking_intent",
        nextStep: "collect_symptoms",
      });
    }

    // If user is providing symptoms, analyze and suggest hospitals
    if (action === "analyze_symptoms") {
      let analysis = "";
      
      try {
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

        const analysisPrompt = `You are a medical assistant for Sewa-Setu, a hospital booking platform in Nepal.
        
        User's health concern: "${userText}"

        Please provide a brief professional analysis (2-3 sentences) of what type of checkup/consultation they might need, and what to expect.`;

        console.log("Calling Gemini for symptom analysis...");
        const result = await model.generateContent(analysisPrompt);
        const response = await result.response;
        analysis = response.text();
        console.log("Symptom analysis completed successfully");
      } catch (analyzeError: any) {
        console.error("Symptom analysis error:", analyzeError.message);
        if (analyzeError.message?.includes("429") || analyzeError.status === 429) {
          return NextResponse.json({
            text: "I'm analyzing too many requests. Please wait a moment and try again.",
            type: "error",
            error: "RATE_LIMITED"
          }, { status: 429 });
        }
        throw analyzeError; // Re-throw to main catch
      }

      // Fetch hospitals from database
      console.log("[AI API] Fetching hospitals from database...");
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
          services: {
            select: {
              id: true,
              title: true,
              price: true,
              currency: true,
              description: true,
            },
          },
        },
        take: 10,
      });

      console.log(`[AI API] Found ${hospitals.length} hospitals`);

      // Sort hospitals by price of services (cheapest first)
      const hospitalsWithMinPrice = hospitals
        .map(h => ({
          ...h,
          minPrice: h.services.length > 0 
            ? Math.min(...h.services.map(s => s.price))
            : 999999,
        }))
        .sort((a, b) => a.minPrice - b.minPrice)
        .slice(0, 3); // Top 3 cheapest

      console.log(`[AI API] Returning ${hospitalsWithMinPrice.length} cheapest hospitals`);

      return NextResponse.json({
        text: analysis,
        type: "symptoms_analyzed",
        hospitals: hospitalsWithMinPrice.map(h => ({
          id: h.id,
          name: h.name,
          slug: h.slug,
          type: h.type,
          location: `${h.location.area || h.location.addressLine || ""}, ${h.location.city}`,
          minPrice: h.minPrice,
          services: h.services.map(s => s.title),
        })),
        nextStep: "select_hospital",
      });
    }

    // Regular conversation
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    console.log("[AI API] Calling Gemini for chat response...");
    const result = await model.generateContent(
      `You are the Sewa-Setu Medical Assistant. 
       Your goal is to help users find the best health checkup packages for their parents in Nepal.
       
       User says: "${userText}"
       
       Instructions:
       - Be polite and helpful.
       - If they mention a health issue, suggest they say "I want to book" to proceed with booking.
       - Keep answers short (max 3 sentences).`
    );

    const response = await result.response;
    const aiText = response.text();
    console.log("[AI API] Chat response completed successfully");

    return NextResponse.json({ text: aiText, type: "chat" });

  } catch (error: any) {
    console.error("=== [AI API ERROR] ===");
    console.error("Error message:", error.message);
    console.error("Error status:", error.status);
    console.error("Error code:", error.code);
    console.error("Full error:", error);
    
    // Check if rate limited
    if (error.message?.includes("429") || error.message?.includes("rate") || error.status === 429) {
      console.error("[AI API] ❌ RATE LIMITED - Too many requests");
      return NextResponse.json({
        text: "⏳ I'm getting too many requests. Please wait 1-2 minutes and try again.",
        type: "error",
        error: "RATE_LIMITED",
        retryAfter: 60
      }, { status: 429 });
    }

    // Check if API key is invalid
    if (error.message?.includes("403") || error.message?.includes("Forbidden") || error.status === 403) {
      console.error("[AI API] ❌ AUTH FAILED - Check API key");
      return NextResponse.json({
        text: "🔑 API authentication failed. Please check your GOOGLE_GENERATIVE_AI_API_KEY in .env",
        type: "error",
        error: "AUTH_FAILED"
      }, { status: 403 });
    }

    // Check if API key is missing
    if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
      console.error("[AI API] ❌ API KEY MISSING");
      return NextResponse.json({
        text: "🔑 API key not configured. Please set GOOGLE_GENERATIVE_AI_API_KEY in .env",
        type: "error",
        error: "NO_API_KEY"
      }, { status: 400 });
    }
    
    try {
        console.log("[AI API] 🔄 Trying fallback model...");
        const fallback = genAI.getGenerativeModel({ model: "gemini-flash-latest" });
        const res = await fallback.generateContent(userText || "Hello");
        const fallbackText = res.response.text();
        console.log("[AI API] ✓ Fallback succeeded");
        
        return NextResponse.json({ text: fallbackText, type: "chat" });
    } catch (e: any) {
        console.error("[AI API] ❌ Fallback also failed:", e.message);
        return NextResponse.json({
          text: "⏳ Service is temporarily overloaded. Please wait a moment and try again.",
          type: "error"
        }, { status: 503 });
    }
  }
}

// Create a booking (without payment)
export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { hospitalId, patientName, patientAge, patientPhone, buyerEmail, problemDescription, hospitalServiceId } = body;

    // Validate required fields
    if (!hospitalId || !patientName || !patientAge || !patientPhone || !buyerEmail) {
      return NextResponse.json(
        { error: "Missing required booking information" },
        { status: 400 }
      );
    }

    // Get or create patient (using email as identifier for now)
    let patient = await db.patient.findFirst({
      where: { user: { email: buyerEmail } },
    });

    if (!patient) {
      // Create a user first
      let user = await db.user.findUnique({
        where: { email: buyerEmail },
      });

      if (!user) {
        user = await db.user.create({
          data: {
            email: buyerEmail,
            fullName: patientName,
            phone: patientPhone,
            country: "Nepal", // Default for now
          },
        });
      }

      // Create patient
      patient = await db.patient.create({
        data: {
          userId: user.id,
          fullName: patientName,
          phone: patientPhone,
        },
      });
    }

    // Get hospital and service details for snapshot
    const hospital = await db.hospital.findUnique({
      where: { id: hospitalId },
      include: { services: true },
    });

    if (!hospital) {
      return NextResponse.json({ error: "Hospital not found" }, { status: 404 });
    }

    let snapshotPrice = 0;
    let snapshotServiceName = "";

    if (hospitalServiceId) {
      const service = hospital.services.find(s => s.id === hospitalServiceId);
      if (service) {
        snapshotPrice = service.price;
        snapshotServiceName = service.title;
      }
    }

    // Create booking in DRAFT status (no payment needed)
    const booking = await db.booking.create({
      data: {
        userId: patient.userId,
        patientId: patient.id,
        hospitalId: hospital.id,
        hospitalServiceId: hospitalServiceId || undefined,
        mode: "PHYSICAL", // Default mode
        scheduledAt: new Date(new Date().getTime() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
        notes: `Problem: ${problemDescription}`,
        snapshotHospitalName: hospital.name,
        snapshotServiceName,
        snapshotPrice,
        snapshotCurrency: snapshotPrice > 0 ? "NPR" : "EUR",
        status: "REQUESTED",
      },
      include: {
        hospital: true,
        hospitalService: true,
      },
    });

    return NextResponse.json({
      success: true,
      booking: {
        id: booking.id,
        hospitalName: booking.hospital.name,
        serviceName: booking.snapshotServiceName,
        price: booking.snapshotPrice,
        currency: booking.snapshotCurrency,
        patientName: patient.fullName,
        status: booking.status,
      },
    });
  } catch (error: any) {
    console.error("Booking error:", error);
    return NextResponse.json({ error: error.message || "Booking failed" }, { status: 500 });
  }
}