import { NextResponse } from "next/server";
import Stripe from "stripe";

// Initialize Stripe with your Secret Key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-12-15.clover", // Use the latest API version
});

export async function POST(req: Request) {
  try {
    // 1. Get the booking details from the Frontend
    const body = await req.json();
    const { 
      hospitalName, 
      packageName, 
      price, 
      patientName, 
      patientAge, 
      patientPhone, 
      buyerEmail 
    } = body;

    // 2. Create a Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "eur", // We are charging in Euro
            product_data: {
              name: `${packageName} at ${hospitalName}`,
              description: `Patient: ${patientName}`,
            },
            unit_amount: Math.round(price * 100), // Stripe expects cents (e.g., €35.00 -> 3500)
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      // Where to send the user after payment?
      success_url: `http://localhost:3000/book/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `http://localhost:3000/`,
      
      // 3. Store all booking data in "Metadata"
      // (Stripe will hold this for us, and give it back when payment succeeds)
      metadata: {
        hospitalName,
        packageName,
        patientName,
        patientAge,
        patientPhone,
        buyerEmail,
        price: price.toString(),
      },
    });

    // 4. Send the Stripe URL back to the frontend
    return NextResponse.json({ url: session.url });
    
  } catch (error) {
    console.error("Stripe Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}