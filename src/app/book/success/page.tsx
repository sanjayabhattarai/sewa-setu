"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { Navbar } from "@/components/navbar";
import { CheckCircle, Loader2, AlertCircle, Printer, Download } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

function SuccessContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const { user } = useUser();
  const [status, setStatus] = useState("loading"); 
  const [bookingData, setBookingData] = useState<any>(null);
  const [pendingBooking, setPendingBooking] = useState<any>(null);

  // Step 1: fetch booking data when sessionId is ready
  useEffect(() => {
    if (!sessionId) return;

    fetch("/api/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId }),
    })
      .then(async (res) => {
        if (res.ok) {
          const data = await res.json();
          setStatus("success");
          setBookingData(data.booking);
          // Stage the booking — save to localStorage once user.id is ready
          setPendingBooking({
            id: data.booking.id,
            hospital: data.booking.hospitalName,
            package: data.booking.packageName,
            date: data.booking.bookingDate,
            patient: data.booking.patientName,
          });
        } else {
          setStatus("error");
        }
      })
      .catch(() => setStatus("error"));
  }, [sessionId]);

  // Step 2: as soon as we have BOTH booking data AND user.id, persist to localStorage
  useEffect(() => {
    if (!pendingBooking || !user?.id) return;
    localStorage.setItem(`sewa_last_booking_${user.id}`, JSON.stringify(pendingBooking));
    setPendingBooking(null); // clear so we don't re-save
  }, [pendingBooking, user?.id]);

  const handlePrint = () => {
    window.print();
  };

  if (status === "loading") {
    return (
      <div className="flex flex-col items-center pt-20">
        <Loader2 className="h-16 w-16 text-[#c8a96e] animate-spin mb-4" />
        <h2 className="text-2xl font-bold text-slate-900">Verifying Payment...</h2>
      </div>
    );
  }

  if (status === "error") return <div>Error loading booking.</div>;

  return (
    <div className="flex flex-col items-center animate-in fade-in duration-500 pb-20">
      {/* Success Message */}
      <div className="text-center mb-8 print:hidden">
        <div className="h-20 w-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="h-10 w-10 text-green-600" />
        </div>
        <h1 className="text-3xl font-bold text-slate-900">Booking Confirmed!</h1>
        <p className="text-slate-600 mt-2">A receipt has been sent to your email.</p>
      </div>

      {/* TICKET / DOCUMENT CARD */}
      <div className="bg-white border-2 border-slate-200 rounded-2xl p-8 max-w-xl w-full shadow-sm print:border-black print:shadow-none">
        
        {/* Header */}
        <div className="flex justify-between items-start border-b border-slate-100 pb-6 mb-6">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Booking ID</p>
            <p className="text-xl font-mono font-bold text-slate-900">{bookingData?.id}</p>
          </div>
          <div className="text-right">
             <h3 className="text-lg font-bold text-[#a88b50]">Sewa-Setu</h3>
             <p className="text-xs text-slate-400">Health Verification Ticket</p>
          </div>
        </div>

        {/* Details Grid */}
        <div className="grid grid-cols-2 gap-y-6 gap-x-4 mb-8">
          <div>
            <p className="text-sm text-slate-500">Patient Name</p>
            <p className="font-semibold text-slate-900">{bookingData?.patientName}</p>
          </div>
          <div>
            <p className="text-sm text-slate-500">Age</p>
            <p className="font-semibold text-slate-900">{bookingData?.patientAge}</p>
          </div>
          <div className="col-span-2">
            <p className="text-sm text-slate-500">Hospital</p>
            <p className="font-semibold text-slate-900 text-lg">{bookingData?.hospitalName}</p>
          </div>
          <div className="col-span-2">
            <p className="text-sm text-slate-500">Package</p>
            <p className="font-semibold text-slate-900">{bookingData?.packageName}</p>
          </div>
        </div>

        {/* Status Badge */}
        <div className="bg-green-50 border border-green-100 rounded-lg p-4 flex justify-between items-center">
          <span className="text-green-800 font-bold text-sm">PAYMENT SUCCESSFUL</span>
          <span className="text-slate-900 font-bold">{bookingData?.amountPaid}</span>
        </div>
        
        <div className="mt-6 text-center text-xs text-slate-400 print:block hidden">
            Show this document at the hospital reception.
        </div>
      </div>

      {/* Buttons (Hidden when printing) */}
      <div className="flex gap-4 mt-8 print:hidden">
        <Button variant="outline" onClick={handlePrint}>
          <Printer className="mr-2 h-4 w-4" /> Print / Save PDF
        </Button>
        <Link href="/">
          <Button>Back to Home</Button>
        </Link>
      </div>
    </div>
  );
}
export default function SuccessPage() {
  return (
    <main className="min-h-screen bg-white">
      <Navbar />
      
      {/* 1. "items-center": Fixes the left/right gap by centering horizontally.
        2. "justify-start": Keeps it at the top on mobile.
        3. "md:justify-center": Centers it vertically ONLY on desktop.
      */}
      <div className="flex flex-col items-center justify-start md:justify-center min-h-screen w-full px-6 pt-32 pb-12 md:pt-0">
        <Suspense fallback={<div>Loading...</div>}>
          <div className="w-full max-w-xl mx-auto flex flex-col items-center">
             <SuccessContent />
          </div>
        </Suspense>
      </div>
    </main>
  );
}