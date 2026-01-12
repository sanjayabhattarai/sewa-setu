import { NextResponse } from "next/server";
import { MEDICAL_PACKAGES, PackageId } from "@/lib/packages";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    // Check for required environment variable
    if (!process.env.STRIPE_SECRET_KEY) {
      console.error("Missing STRIPE_SECRET_KEY environment variable");
      return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
    }

    const StripeModule = await import("stripe");
    const Stripe = StripeModule.default;

    const body = await req.json();
    const { packageId, buyerEmail, patientName, patientAge, patientPhone, bookingDate } = body;

    console.log("Checkout request:", { packageId, buyerEmail, patientName });

    // 1. SERVER-SIDE LOOKUP (The Security Part)
    const selectedPackage = MEDICAL_PACKAGES[packageId as PackageId];

    if (!selectedPackage) {
      return NextResponse.json({ error: "Package not found" }, { status: 404 });
    }

    // We use the price from OUR file, NOT from the user's request
    const validatedPrice = selectedPackage.price;

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || `https://${process.env.VERCEL_URL}`;

    const session = await stripe.checkout.sessions.create({
      customer_email: buyerEmail,
      payment_method_types: ["card"],
      line_items: [{
        price_data: {
          currency: "eur",
          product_data: { name: selectedPackage.name },
          unit_amount: Math.round(validatedPrice * 100), // Secure price
        },
        quantity: 1,
      }],
      mode: "payment",
      success_url: `${baseUrl}/book/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/`,
      metadata: {
        hospitalName: selectedPackage.hospital,
        packageName: selectedPackage.name,
        patientName,
        patientAge: String(patientAge),
        patientPhone: String(patientPhone),
        bookingDate: String(bookingDate || new Date().toISOString()),
        price: String(validatedPrice),
        buyerEmail,
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (error: any) {
    console.error("Checkout error:", error);
    return NextResponse.json({ error: error.message || "Unknown error" }, { status: 500 });
  }
}