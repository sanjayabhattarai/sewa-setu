import { NextResponse } from "next/server";
import Stripe from "stripe";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

const getStripe = () => {
  if (!process.env.STRIPE_SECRET_KEY) return null;
  return new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: "2025-12-15.clover",
  });
};

export async function POST(req: Request) {
  try {
    const stripe = getStripe();
    if (!stripe) return NextResponse.json({ error: "Config error" }, { status: 500 });

    const { sessionId } = await req.json();
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status !== "paid") {
      return NextResponse.json({ error: "Not paid" }, { status: 400 });
    }

    const data = session.metadata;

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
    console.error("Verification Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}