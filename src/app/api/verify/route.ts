import { NextResponse } from "next/server";
import Stripe from "stripe";
import { db } from "@/lib/db";

// This tells Vercel: "Do not try to build this at compile time"
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    // 1. Check for the secret key INSIDE the function
    const stripeKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeKey) {
      return NextResponse.json({ error: "Configuration error" }, { status: 500 });
    }

    // 2. Initialize Stripe ONLY when a request actually happens
    const stripe = new Stripe(stripeKey, {
      apiVersion: "2025-12-15.clover",
    });

    const { sessionId } = await req.json();

    if (!sessionId) {
      return NextResponse.json({ error: "No session ID" }, { status: 400 });
    }

    // 3. Talk to Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status !== "paid") {
      return NextResponse.json({ error: "Payment not verified" }, { status: 400 });
    }

    const data = session.metadata;

    // 4. Save to Database
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