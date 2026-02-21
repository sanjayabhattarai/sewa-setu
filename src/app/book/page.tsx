'use client'

import { useState } from "react";
import { Navbar } from "@/components/navbar";
import { Calendar, User, Phone, Loader2 } from "lucide-react";

export default function BookingPage() {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    date: "",
    age: "",
  });

  // Get package ID from URL (e.g., /book?package=norvic-full-body)
  const searchParams = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '');
  const packageId = searchParams.get('package') || 'norvic-full-body';

  const handleConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          packageId,
          patientName: formData.name,
          patientPhone: formData.phone,
          patientAge: formData.age,
          bookingDate: formData.date,
          buyerEmail: formData.email,
        }),
      });

      const data = await res.json();
      if (data.url) {
        window.location.href = data.url; // This takes them to Stripe!
      } else {
        alert("Failed to start checkout: " + data.error);
      }
    } catch (err) {
      console.error("Payment error", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="mx-auto max-w-3xl px-4 py-12">
        <div className="rounded-xl bg-white p-8 shadow-sm border border-gray-100">
          <h1 className="text-2xl font-bold">Book Appointment</h1>
          
          <form onSubmit={handleConfirm} className="mt-8 space-y-6">
            {/* Patient Name */}
            <input
              required
              placeholder="Full Name"
              className="w-full border p-3 rounded-md"
              onChange={(e) => setFormData({...formData, name: e.target.value})}
            />

            {/* Patient Age (New field for your DB) */}
            <input
              required
              type="number"
              placeholder="Patient Age"
              className="w-full border p-3 rounded-md"
              onChange={(e) => setFormData({...formData, age: e.target.value})}
            />

            {/* Email */}
            <input
              required
              type="email"
              placeholder="Email Address"
              className="w-full border p-3 rounded-md"
              onChange={(e) => setFormData({...formData, email: e.target.value})}
            />

            {/* Patient Phone */}
            <input
              required
              placeholder="98XXXXXXXX"
              className="w-full border p-3 rounded-md"
              onChange={(e) => setFormData({...formData, phone: e.target.value})}
            />

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-md bg-[#0f1e38] py-4 font-semibold text-[#c8a96e] hover:bg-[#1a3059] flex items-center justify-center"
            >
              {loading ? <Loader2 className="animate-spin mr-2" /> : null}
              {loading ? "Initializing Secure Payment..." : "Confirm & Pay Now"}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}