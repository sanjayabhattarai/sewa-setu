import { NextResponse } from "next/server";

// Force Vercel to skip static analysis
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    // 1. LAZY LOAD DB: Prevents build errors
    const { db } = await import("@/lib/db");
    
    // 2. LAZY LOAD STRIPE: This prevents the build error 100%
    const StripeModule = await import("stripe");
    const Stripe = StripeModule.default;

    const stripeKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeKey) {
      return NextResponse.json({ error: "Config error" }, { status: 500 });
    }

    // 2. Initialize using your specific version
    const stripe = new Stripe(stripeKey, {
      apiVersion: "2025-12-15.clover" as any, 
    });

    const { sessionId } = await req.json();
    if (!sessionId) {
      return NextResponse.json({ error: "No session ID" }, { status: 400 });
    }

    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status !== "paid") {
      return NextResponse.json({ error: "Not paid" }, { status: 400 });
    }

    const data = session.metadata;

    // 3. Save to Database
    const booking = await db.booking.upsert({
      where: { stripeSessionId: session.id },
      update: {}, 
      create: {
        stripeSessionId: session.id,
        hospitalName: data?.hospitalName || "Unknown",
        packageName: data?.packageName || "Unknown",
        price: parseInt(data?.price || "0"),
        patientName: data?.patientName || "Guest",
        patientAge: data?.patientAge || "N/A", 
        patientPhone: data?.patientPhone || "N/A", 
        buyerEmail: data?.buyerEmail || "",
        status: "PAID",
        bookingDate: new Date(),
      },
    });

    return NextResponse.json({ success: true, booking });

  } catch (error: any) {
    console.error("Verification Error:", error.message);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}