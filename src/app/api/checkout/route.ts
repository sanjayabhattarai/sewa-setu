import { NextResponse } from "next/server";
import { MEDICAL_PACKAGES, PackageId } from "@/lib/packages";

export const dynamic = "force-dynamic";

// Supported payment currency
const SUPPORTED_CURRENCY = "eur" as const;

export async function POST(req: Request) {
  try {
    // TODO: Add rate limiting here (e.g., @upstash/ratelimit) to prevent abuse
    
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

    // INPUT VALIDATION (Security Layer)
    
    // Validate email
    if (!buyerEmail || typeof buyerEmail !== 'string' || !buyerEmail.includes('@') || buyerEmail.length > 254) {
      return NextResponse.json({ error: "Invalid email address" }, { status: 400 });
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(buyerEmail)) {
      return NextResponse.json({ error: "Invalid email format" }, { status: 400 });
    }

    // Validate patient name
    if (!patientName || typeof patientName !== 'string') {
      return NextResponse.json({ error: "Patient name is required" }, { status: 400 });
    }
    const trimmedName = patientName.trim();
    if (trimmedName.length < 2 || trimmedName.length > 100) {
      return NextResponse.json({ error: "Name must be between 2-100 characters" }, { status: 400 });
    }
    // Only allow letters, spaces, hyphens, and apostrophes
    if (!/^[a-zA-Z\s\-']+$/.test(trimmedName)) {
      return NextResponse.json({ error: "Name contains invalid characters" }, { status: 400 });
    }

    // Validate phone number
    if (!patientPhone || typeof patientPhone !== 'string') {
      return NextResponse.json({ error: "Phone number is required" }, { status: 400 });
    }
    const cleanPhone = patientPhone.replace(/[\s\-()]/g, '');
    // Nepal phone numbers are typically 10 digits starting with 9
    if (!/^\d{10}$/.test(cleanPhone)) {
      return NextResponse.json({ error: "Phone number must be 10 digits" }, { status: 400 });
    }

    // Validate age
    if (patientAge === undefined || patientAge === null) {
      return NextResponse.json({ error: "Patient age is required" }, { status: 400 });
    }
    const age = Number(patientAge);
    if (isNaN(age) || age < 0 || age > 150 || !Number.isInteger(age)) {
      return NextResponse.json({ error: "Age must be a valid number between 0-150" }, { status: 400 });
    }

    // Validate booking date
    if (bookingDate) {
      const date = new Date(bookingDate);
      if (isNaN(date.getTime())) {
        return NextResponse.json({ error: "Invalid booking date" }, { status: 400 });
      }
      // Ensure date is not in the past (allow same day)
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (date < today) {
        return NextResponse.json({ error: "Booking date cannot be in the past" }, { status: 400 });
      }
    }

    // Validate package ID exists
    if (!packageId || typeof packageId !== 'string') {
      return NextResponse.json({ error: "Package ID is required" }, { status: 400 });
    }

    // SANITIZE INPUTS: Remove any HTML/script tags and excess whitespace
    const sanitizedName = trimmedName.replace(/<[^>]*>/g, '').trim();
    const sanitizedEmail = buyerEmail.toLowerCase().trim();
    const sanitizedPhone = cleanPhone;

    // 1. SERVER-SIDE LOOKUP (The Security Part)
    const selectedPackage = MEDICAL_PACKAGES[packageId as PackageId];

    if (!selectedPackage) {
      return NextResponse.json({ error: "Package not found" }, { status: 404 });
    }

    // We use the price from OUR file, NOT from the user's request
    const validatedPrice = selectedPackage.price;

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || `https://${process.env.VERCEL_URL}`;

    // SESSION EXPIRY: Prevent stale checkout sessions (Security Enhancement)
    const expiresAt = Math.floor(Date.now() / 1000) + (30 * 60); // 30 minutes from now

    const session = await stripe.checkout.sessions.create({
      customer_email: sanitizedEmail,
      payment_method_types: ["card"],
      line_items: [{
        price_data: {
          currency: SUPPORTED_CURRENCY,
          product_data: { name: selectedPackage.name },
          unit_amount: Math.round(validatedPrice * 100), // Secure price
        },
        quantity: 1,
      }],
      mode: "payment",
      expires_at: expiresAt, // Auto-expire after 30 minutes
      success_url: `${baseUrl}/book/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/`,
      metadata: {
        packageName: selectedPackage.name,
        patientName: sanitizedName,
        patientAge: String(patientAge),
        patientPhone: sanitizedPhone,
        bookingDate: String(bookingDate || new Date().toISOString()),
        price: String(validatedPrice),
        buyerEmail: sanitizedEmail,
      },
    });

    // SECURITY LOGGING: Track successful checkout attempts
    console.log(`✅ Checkout session created: ${session.id} | Email: ${sanitizedEmail} | Package: ${packageId} | Price: €${validatedPrice}`);

    return NextResponse.json({ url: session.url });
  } catch (error: any) {
    // SECURITY LOGGING: Track failed checkout attempts for monitoring
    const errorDetails = {
      message: error.message,
      type: error.type || 'unknown',
      timestamp: new Date().toISOString(),
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    };
    console.error("❌ Checkout error:", errorDetails);
    
    // Don't expose internal errors to client
    const clientMessage = error.type === 'StripeInvalidRequestError' 
      ? 'Invalid payment request' 
      : 'Payment processing error. Please try again.';
    
    return NextResponse.json({ error: clientMessage }, { status: 500 });
  }
}