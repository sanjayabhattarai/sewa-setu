import { NextResponse } from "next/server";
import Stripe from "stripe";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    // 1. Check for the key FIRST
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) {
      console.error("STRIPE_SECRET_KEY is missing in environment");
      return NextResponse.json({ error: "Configuration error" }, { status: 500 });
    }

    // 2. Initialize Stripe INSIDE the function only
    const stripe = new Stripe(key, {
      apiVersion: "2025-12-15.clover",
    });

    const body = await req.json();
    const { price, buyerEmail, packageName, patientAge, patientPhone, hospitalName, patientName } = body;

    // 3. Simple URL helper
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || `https://${process.env.VERCEL_URL}`;

    // 4. Create Session
    const session = await stripe.checkout.sessions.create({
      customer_email: buyerEmail,
      payment_method_types: ["card"],
      line_items: [{
        price_data: {
          currency: "eur",
          product_data: { name: packageName },
          unit_amount: Math.round(price * 100),
        },
        quantity: 1,
      }],
      mode: "payment",
      success_url: `${baseUrl}/book/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/`,
      metadata: {
        hospitalName: String(hospitalName || "").substring(0, 50),
        packageName: String(packageName || "").substring(0, 50),
        patientName: String(patientName || "").substring(0, 50),
        patientAge: String(patientAge || ""),
        patientPhone: String(patientPhone || ""),
        price: String(price),
        buyerEmail: String(buyerEmail || ""),
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (error: any) {
    console.error("Stripe Error:", error.message);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}