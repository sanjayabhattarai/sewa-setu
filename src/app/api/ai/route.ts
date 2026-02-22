import { GoogleGenAI } from "@google/genai";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";

/* -----------------------------------------------------
   Gemini Client (New SDK)
----------------------------------------------------- */
const API_KEY = process.env.GOOGLE_GENERATIVE_AI_API_KEY || "";

// Initialize the new GoogleGenAI client only if API_KEY exists
let ai: InstanceType<typeof GoogleGenAI> | null = null;

if (API_KEY) {
  ai = new GoogleGenAI({ apiKey: API_KEY });
} else {
  console.warn("[AI API] ⚠️ GOOGLE_GENERATIVE_AI_API_KEY is missing - AI features will be unavailable");
}

// Department synonyms mapping
const DEPARTMENT_SYNONYMS: Record<string, string[]> = {
  "cardiology": ["heart", "cardiac", "cardiovascular", "chest pain", "bp", "blood pressure", "hypertension"],
  "neurology": ["brain", "nerve", "headache", "migraine", "stroke", "paralysis", "seizure", "neuro"],
  "orthopedics": ["bone", "joint", "spine", "back pain", "knee", "hip", "fracture", "arthritis", "ortho"],
  "pediatrics": ["child", "children", "infant", "baby", "adolescent", "paediatric", "pediatric"],
  "gynecology": ["women", "pregnancy", "menstrual", "fertility", "obstetrics", "gynae", "gynaecology"],
  "dermatology": ["skin", "hair", "rash", "acne", "allergy", "derma", "psoriasis", "eczema"],
  "gastroenterology": ["stomach", "digestive", "liver", "intestine", "abdomen", "gastro", "hepatology"],
  "pulmonology": ["lung", "breathing", "asthma", "cough", "respiratory", "chest infection", "pneumonia"],
  "nephrology": ["kidney", "renal", "dialysis", "urine", "nephro"],
  "urology": ["urinary", "bladder", "prostate", "stone", "urethra", "urologist"],
  "endocrinology": ["diabetes", "thyroid", "hormone", "endocrine", "sugar"],
  "ophthalmology": ["eye", "vision", "sight", "cataract", "glaucoma", "retina"],
  "ent": ["ear", "nose", "throat", "hearing", "sinus", "tonsil", "otolaryngology"],
  "psychiatry": ["mental", "depression", "anxiety", "stress", "psychological", "psychiatric"],
  "oncology": ["cancer", "tumor", "chemotherapy", "onco", "malignancy"],
  "rheumatology": ["arthritis", "autoimmune", "joint pain", "rheumatoid", "lupus"],
  "dentistry": ["teeth", "dental", "oral", "tooth", "gum", "root canal"],
  "emergency": ["accident", "trauma", "urgent", "emergency", "critical"],
  "general medicine": ["fever", "infection", "viral", "bacterial", "general physician", "internal medicine"],
};

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

async function matchSymptomsToDepartments(symptoms: string) {
  const text = symptoms.toLowerCase();
  const matches: Array<{ department: string; confidence: number; matchedKeywords: string[] }> = [];

  for (const [dept, keywords] of Object.entries(DEPARTMENT_SYNONYMS)) {
    const matchedKeywords = keywords.filter(keyword => text.includes(keyword.toLowerCase()));
    if (matchedKeywords.length > 0) {
      const confidence = matchedKeywords.length / keywords.length;
      matches.push({
        department: dept,
        confidence: Math.min(confidence + 0.3, 1),
        matchedKeywords,
      });
    }
  }

  return matches.sort((a, b) => b.confidence - a.confidence);
}

async function findHospitalsWithDepartments(matchedDepartments: string[], limit: number = 5) {
  // Find all departments that match the specialties
  const departments = await db.hospitalDepartment.findMany({
    where: {
      OR: matchedDepartments.map(dept => ({
        name: {
          contains: dept,
          mode: "insensitive",
        },
      })),
      isActive: true,
    },
    include: {
      hospital: {
        include: {
          location: true,
          packages: {
            where: { isActive: true },
            take: 1,
          },
        },
      },
      doctors: {
        where: { isActive: true },
        take: 3,
        include: {
          doctor: {
            include: {
              specialties: { include: { specialty: true } },
            },
          },
        },
      },
    },
    take: limit * 3,
  });

  // Group by hospital
  const hospitalMap = new Map();
  
  for (const dept of departments) {
    if (!hospitalMap.has(dept.hospital.id)) {
      hospitalMap.set(dept.hospital.id, {
        id: dept.hospital.id,
        name: dept.hospital.name,
        slug: dept.hospital.slug,
        type: dept.hospital.type,
        location: `${dept.hospital.location.area || dept.hospital.location.addressLine || ""}, ${dept.hospital.location.city}`.trim(),
        departments: [],
        minPrice: dept.hospital.packages[0]?.price ?? null,
        specialties: [],
        services: dept.hospital.packages.map((p: any) => p.title),
      });
    }
    
    const hospitalData = hospitalMap.get(dept.hospital.id);
    hospitalData.departments.push({
      id: dept.id,
      name: dept.name,
      slug: dept.slug,
      doctorCount: dept.doctors.length,
    });
    
    // Add specialties from doctors
    dept.doctors.forEach((dd: any) => {
      dd.doctor.specialties.forEach((s: any) => {
        if (!hospitalData.specialties.includes(s.specialty.name)) {
          hospitalData.specialties.push(s.specialty.name);
        }
      });
    });
  }

  return Array.from(hospitalMap.values()).slice(0, limit);
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
    const conversationId = body.conversationId;

    if (!userText) {
      return NextResponse.json({ text: "Please enter a message." });
    }

    console.log(
      `[AI API] New request – Action: ${action}, Text: ${userText.substring(0, 50)}`
    );

    const isBooking = detectBookingIntent(userText);

    console.log(`[AI API] Intent detected: ${isBooking ? "BOOKING" : "CHAT"}`);

    /* ---------------- Booking Intent ---------------- */
    if (isBooking && action === "chat") {
      return NextResponse.json({
        text: "I'll help you book a consultation. Please describe your symptoms or health concern in detail so I can recommend the right specialist.",
        type: "booking_intent",
        nextStep: "collect_symptoms",
        conversationId: conversationId || "",
      });
    }

    /* ---------------- Symptom Analysis ---------------- */
    if (action === "analyze_symptoms") {
      // Match symptoms to departments
      const matches = await matchSymptomsToDepartments(userText);
      
      let analysisText = "";
      let matchedDepts = matches.map(m => m.department);
      
      if (ai) {
        const analysisPrompt = `
You are a medical assistant for Sewa-Setu, a hospital booking platform in Nepal.

User's symptoms:
"${userText}"

Based on these symptoms, provide:
1. A brief analysis (2-3 sentences) explaining what might be wrong
2. The top 2-3 medical specialties that should be consulted

Keep the response professional, empathetic, and clear.
`;

        const result = await ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents: analysisPrompt,
        });
        
        analysisText = result.text || "Based on your symptoms, you should consult a specialist.";
      } else {
        analysisText = `Based on your symptoms, you may need to consult a specialist. I recommend seeing a doctor specializing in: ${matchedDepts.slice(0, 3).join(", ")}.`;
      }

      // Find hospitals with matching departments
      const hospitals = await findHospitalsWithDepartments(matchedDepts);

      return NextResponse.json({
        text: analysisText,
        type: "symptoms_analyzed",
        hospitals: hospitals.map(h => ({
          id: h.id,
          name: h.name,
          slug: h.slug,
          type: h.type,
          location: h.location,
          minPrice: h.minPrice,
          services: h.services,
          specialties: h.specialties.slice(0, 5),
          departments: h.departments,
          matchedDepartment: h.departments[0]?.name,
        })),
        matchedDepartments: matches.slice(0, 5),
        nextStep: "select_hospital",
        conversationId: conversationId || "",
      });
    }

    /* ---------------- Regular Chat ---------------- */
    if (!ai) {
      return NextResponse.json({
        text: "Namaste! 🙏 I'm here to help you find the right doctor. You can tell me your symptoms, and I'll recommend the best hospital and specialist for you.",
        type: "chat",
        conversationId,
      });
    }

    const chatResult = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `
You are the Sewa-Setu Medical Assistant. Help users find the right doctors and hospitals in Nepal.

User says:
"${userText}"

Rules:
- Be polite and helpful
- Keep answers short (max 3 sentences)
- If they mention symptoms, suggest they describe them in detail
- If they want to book, ask about their symptoms
`
    });

    return NextResponse.json({
      text: chatResult.text,
      type: "chat",
      conversationId,
    });

  } catch (error: any) {
    console.error("[AI API ERROR]", error);
    
    return NextResponse.json({
      text: "I'm having trouble right now. Please try again in a moment.",
      type: "error",
    }, { status: 500 });
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
      departmentId,
      conversationId,
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
      include: { packages: true },
    });

    if (!hospital) {
      return NextResponse.json({ error: "Hospital not found" }, { status: 404 });
    }

    let snapshotPrice = 0;
    let snapshotServiceName = "";

    if (hospitalServiceId) {
      const selectedPackage = hospital.packages.find((p) => p.id === hospitalServiceId);
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
        notes: `Problem: ${problemDescription}\nService: ${snapshotServiceName}\nPrice: ${snapshotPrice}\nDepartment ID: ${departmentId || "none"}`,
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
        departmentId,
      },
      conversationId,
    });
  } catch (error: any) {
    console.error("Booking error:", error);
    return NextResponse.json(
      { error: error.message || "Booking failed" },
      { status: 500 }
    );
  }
}