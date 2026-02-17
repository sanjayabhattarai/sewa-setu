import { NextResponse } from "next/server";
import Stripe from "stripe";
import { headers } from "next/headers";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    // 1. Get the raw body as text for signature verification
    const body = await req.text();
    const signature = (await headers()).get("Stripe-Signature") as string;

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: "2025-12-15.clover" as any,
    });

    let event: Stripe.Event;

    try {
      // 2. VERIFY THE REQUEST (Security Check)
      event = stripe.webhooks.constructEvent(
        body,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET!
      );
    } catch (err: any) {
      console.error(`Webhook Signature Verification Failed: ${err.message}`);
      return NextResponse.json({ error: "Invalid Signature" }, { status: 400 });
    }

    // 3. Handle the "checkout.session.completed" event
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const data = session.metadata;

      console.log(`✅ Payment received via Webhook:`, {
        sessionId: session.id,
        amount: session.amount_total,
        customer: session.customer_email,
        metadata: data,
      });

      // Note: New booking flow creates bookings through /api/ai, 
      // not through Stripe webhooks. This just logs the payment.
    }

    // Always return a 200 to Stripe to acknowledge receipt
    return NextResponse.json({ received: true }, { status: 200 });
      
  } catch (error: any) {
    console.error("Webhook Error:", error.message);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
