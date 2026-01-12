import { NextResponse } from "next/server";
import Stripe from "stripe";

export const dynamic = "force-dynamic";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-12-15.clover", 
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    
    // 1. Basic Validation (Safety First)
    const { price, buyerEmail, packageName } = body;
    if (!price || price <= 0) {
       return NextResponse.json({ error: "Invalid price" }, { status: 400 });
    }

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || `https://${process.env.VERCEL_URL}`;

    // 2. Create Session
    const session = await stripe.checkout.sessions.create({
      customer_email: buyerEmail, // Pre-fills the email on Stripe's page
      payment_method_types: ["card"],
      line_items: [{
        price_data: {
          currency: "eur",
          product_data: { 
            name: packageName,
            // Add a timestamp to prevent duplicate products
            metadata: { id: Date.now().toString() } 
          },
          unit_amount: Math.round(price * 100),
        },
        quantity: 1,
      }],
      mode: "payment",
      success_url: `${baseUrl}/book/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/`,
      // IMPORTANT: Metadata is limited to 50 keys and strings only
      metadata: {
        hospitalName: String(body.hospitalName).substring(0, 50),
        packageName: String(body.packageName).substring(0, 50),
        patientName: String(body.patientName).substring(0, 50),
        price: String(price),
        buyerEmail: String(buyerEmail),
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (error: any) {
    console.error("Stripe production error:", error.message);
    return NextResponse.json({ error: "Checkout initialization failed" }, { status: 500 });
  }
}