import { Navbar } from "@/components/navbar";
import { CheckCircle } from "lucide-react";
import Link from "next/link";

export default function SuccessPage() {
  return (
    <main className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="flex flex-col items-center justify-center py-24 px-4 text-center">
        <div className="rounded-full bg-green-100 p-3">
          <CheckCircle className="h-12 w-12 text-green-600" />
        </div>
        <h1 className="mt-4 text-3xl font-bold text-gray-900">Booking Confirmed!</h1>
        <p className="mt-2 text-lg text-gray-600 max-w-md">
          We have sent the details to your email. The hospital team will call you shortly to confirm the time.
        </p>
        <Link href="/book/success" className="w-full">
  <button
    type="button"
    className="mt-8 w-full rounded-md bg-blue-600 py-4 text-lg font-semibold text-white shadow-sm hover:bg-blue-700"
  >
    Confirm Booking
  </button>
</Link>
      </div>
    </main>
  );
}