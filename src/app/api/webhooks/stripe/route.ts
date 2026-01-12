import { NextResponse } from "next/server";
import Stripe from "stripe";
import { db } from "@/lib/db";
import { headers } from "next/headers";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
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

    if (!data) {
       return NextResponse.json({ error: "No metadata found" }, { status: 200 });
    }

    try {
      // 4. SAVE TO DATABASE (Reliability Check)
      // We use upsert so we don't create duplicates if Stripe retries the webhook
      await db.booking.upsert({
        where: { stripeSessionId: session.id },
        update: { status: "PAID" }, 
        create: {
          stripeSessionId: session.id,
          hospitalName: data.hospitalName,
          packageName: data.packageName,
          price: parseInt(data.price),
          patientName: data.patientName,
          patientAge: data.patientAge,
          patientPhone: data.patientPhone,
          buyerEmail: data.buyerEmail,
          bookingDate: new Date(),
          status: "PAID",
        },
      });
      console.log(`✅ Booking saved via Webhook: ${session.id}`);
    } catch (dbError) {
      console.error("Database Error in Webhook:", dbError);
      // Return a 500 so Stripe knows to try sending the webhook again later
      return NextResponse.json({ error: "Database failed" }, { status: 500 });
    }
  }

  // 5. Always return a 200 to Stripe to acknowledge receipt
  return NextResponse.json({ received: true }, { status: 200 });
}