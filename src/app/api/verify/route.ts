import { NextResponse } from "next/server";
import Stripe from "stripe";
import { db } from "@/lib/db"; // Our database helper

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-12-15.clover",
});

export async function POST(req: Request) {
  try {
    const { sessionId } = await req.json();

    if (!sessionId) {
      return NextResponse.json({ error: "No session ID" }, { status: 400 });
    }

    // 1. Get the session details from Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    // 2. Check if paid
    if (session.payment_status !== "paid") {
      return NextResponse.json({ error: "Not paid" }, { status: 400 });
    }

    // 3. Get the data we hid in "metadata" earlier
    const data = session.metadata;
    if (!data) {
      return NextResponse.json({ error: "No metadata found" }, { status: 400 });
    }

    // 4. Save to Database
    // We use "upsert" so we don't save the same booking twice if they refresh
    const booking = await db.booking.upsert({
      where: { stripeSessionId: session.id },
      update: {}, // If exists, do nothing
      create: {
        stripeSessionId: session.id,
        hospitalName: data.hospitalName,
        packageName: data.packageName,
        price: parseInt(data.price),
        patientName: data.patientName,
        patientAge: data.patientAge,
        patientPhone: data.patientPhone,
        buyerEmail: data.buyerEmail,
        bookingDate: new Date(), // Using current date for simplicity
        status: "PAID",
      },
    });

    return NextResponse.json({ success: true, booking });

  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
}