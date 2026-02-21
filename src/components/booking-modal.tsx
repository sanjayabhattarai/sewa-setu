"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { User, Phone, Mail, CreditCard, X } from "lucide-react";
import type { UiPackage } from "@/types/package";

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  hospitalName: string;
  selectedPackage: UiPackage;
  packageId?: string;
}

export function BookingModal({ isOpen, onClose, hospitalName, selectedPackage, packageId }: BookingModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    patientName: "",
    patientAge: "",
    patientPhone: "",
    buyerEmail: "",
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // 1. Call our Checkout API
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          packageId,
          patientName: formData.patientName,
          patientAge: formData.patientAge,
          patientPhone: formData.patientPhone,
          buyerEmail: formData.buyerEmail,
          bookingDate: new Date().toISOString(),
        }),
      });

      const data = await response.json();

      // 2. Redirect to Stripe
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert("Payment failed to initialize.");
        setIsLoading(false);
      }
    } catch (error) {
      console.error(error);
      alert("Something went wrong.");
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Confirm Booking</h2>
            <p className="text-sm text-slate-500 mt-1">
              {selectedPackage.name} at {hospitalName}
            </p>
          </div>
          <button onClick={onClose} className="rounded-full p-2 hover:bg-slate-100 transition-colors" title="Close booking modal">
            <X className="h-5 w-5 text-slate-500" />
          </button>
        </div>

        {/* Summary Card */}
        <div className="mb-6 rounded-xl bg-[#c8a96e]/10 p-4 border border-[#c8a96e]/20 flex justify-between items-center">
          <span className="text-[#a88b50] font-medium">Total to pay</span>
          <span className="text-2xl font-bold text-[#a88b50]">₨ {selectedPackage.price}</span>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Patient Name</label>
            <div className="relative">
              <User className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
              <Input 
                name="patientName" required placeholder="Full Name (Parent)" className="pl-9" 
                onChange={handleInputChange} 
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Age</label>
              <Input 
                name="patientAge" required type="number" placeholder="60" 
                onChange={handleInputChange}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Phone (Nepal)</label>
              <div className="relative">
                <Phone className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <Input 
                  name="patientPhone" required placeholder="98XXXXXXXX" className="pl-9" 
                  onChange={handleInputChange}
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Your Email (For Receipt)</label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
              <Input 
                name="buyerEmail" required type="email" placeholder="you@example.com" className="pl-9" 
                onChange={handleInputChange}
              />
            </div>
          </div>

          <Button 
            type="submit" 
            className="w-full h-12 text-lg mt-4 bg-[#0f1e38] hover:bg-[#1a3059] text-[#c8a96e] shadow-lg"
            disabled={isLoading}
          >
            {isLoading ? (
              "Processing..."
            ) : (
              <span className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" /> Pay Securely
              </span>
            )}
          </Button>
          
          <p className="text-xs text-center text-slate-400 mt-4">
            Payments are processed securely by Stripe.
          </p>
        </form>
      </div>
    </div>
  );
}