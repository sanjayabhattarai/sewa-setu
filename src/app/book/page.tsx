import { Navbar } from "@/components/navbar";
import { Calendar, User, Phone } from "lucide-react";
import Link from "next/link"; // <--- 1. Import Link

export default function BookingPage() {
  return (
    <main className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="rounded-xl bg-white p-8 shadow-sm border border-gray-100">
          <h1 className="text-2xl font-bold text-gray-900">Book Appointment</h1>
          <p className="mt-2 text-gray-600">Enter your parent&apos;s details to confirm the slot.</p>

          <form className="mt-8 space-y-6">
            {/* Patient Name */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Patient Name (Parent)
              </label>
              <div className="relative mt-2">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <User className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="name"
                  type="text"
                  className="block w-full rounded-md border border-gray-300 py-3 pl-10 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="Full Name"
                />
              </div>
            </div>

            {/* Phone Number */}
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                Contact Number (Nepal)
              </label>
              <div className="relative mt-2">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <Phone className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="phone"
                  type="tel"
                  className="block w-full rounded-md border border-gray-300 py-3 pl-10 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none"
                  placeholder="98XXXXXXXX"
                />
              </div>
            </div>

            {/* Date Selection */}
            <div>
              <label htmlFor="date" className="block text-sm font-medium text-gray-700">
                Preferred Date
              </label>
              <div className="relative mt-2">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <Calendar className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="date"
                  type="date"
                  className="block w-full rounded-md border border-gray-300 py-3 pl-10 text-gray-900 focus:border-blue-500 focus:outline-none"
                />
              </div>
            </div>

            {/* 2. Wrapped the button in Link to Success Page */}
            <Link href="/book/success" className="block w-full">
              <button
                type="button"
                className="mt-8 w-full rounded-md bg-blue-600 py-4 text-lg font-semibold text-white shadow-sm hover:bg-blue-700"
              >
                Confirm Booking
              </button>
            </Link>
          </form>
        </div>
      </div>
    </main>
  );
}