import { NextResponse } from "next/server";

// Force Vercel to skip static analysis
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    // 1. LAZY LOAD STRIPE
    const StripeModule = await import("stripe");
    const Stripe = StripeModule.default;

    const stripeKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeKey) {
      return NextResponse.json({ error: "Config error" }, { status: 500 });
    }

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

    // Log payment verification (new booking system doesn't use Stripe, bookings are created in /api/ai)
    console.log("✓ Payment verified:", {
      sessionId: session.id,
      amount: session.amount_total,
      customer: session.customer_email,
      metadata: data,
    });

    return NextResponse.json({ 
      success: true, 
      message: "Payment verified successfully",
      sessionId: session.id,
      email: session.customer_email,
    });

  } catch (error: any) {
    console.error("Verification Error:", error.message);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}