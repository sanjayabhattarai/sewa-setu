"use client";

import { useState } from "react";
import type { HospitalRole } from "@prisma/client";
import { Building2, Clock, CheckCircle2, XCircle, ChevronDown } from "lucide-react";
import { ACCESS_REQUEST_ROLES, HOSPITAL_ROLE_LABELS } from "@/lib/admin-roles";

type Hospital = { id: string; name: string; slug: string };
type Membership = {
  id: string;
  hospitalId: string;
  hospitalName: string;
  hospitalSlug: string;
  role: HospitalRole;
  status: string;
};

const ROLE_DESCRIPTIONS: Record<string, string> = {
  MANAGER: "Manage day-to-day operations, schedules, packages, and reports",
  RECEPTIONIST: "Handle bookings, rescheduling, cancellations, and check-ins",
  DOCTOR: "Access only your own schedule and assigned patient appointments",
  STAFF: "Limited support access for assigned hospital tasks",
};

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  PENDING: { label: "Pending Approval", color: "#a88b50", icon: <Clock size={14} /> },
  APPROVED: { label: "Approved", color: "#16a34a", icon: <CheckCircle2 size={14} /> },
  REJECTED: { label: "Rejected", color: "#dc2626", icon: <XCircle size={14} /> },
};

export default function RequestAccessClient({
  user,
  hospitals,
  existingMemberships,
  pendingStatus,
}: {
  user: { fullName: string; email: string };
  hospitals: Hospital[];
  existingMemberships: Membership[];
  pendingStatus: boolean;
}) {
  const [hospitalId, setHospitalId] = useState("");
  const [role, setRole] = useState<HospitalRole | "">("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const alreadyRequestedIds = new Set(existingMemberships.map((membership) => membership.hospitalId));
  const availableHospitals = hospitals.filter((hospital) => !alreadyRequestedIds.has(hospital.id));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hospitalId || !role) return;
    setSubmitting(true);
    setError("");

    try {
      const res = await fetch("/api/admin/request-access", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hospitalId, role }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Something went wrong");
        return;
      }

      setSubmitted(true);
      setHospitalId("");
      setRole("");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: "#f0ece4" }}>
      <div className="w-full" style={{ maxWidth: 520 }}>
        <div className="text-center mb-8">
          <div
            className="inline-flex items-center justify-center h-14 w-14 rounded-2xl mb-4"
            style={{ background: "linear-gradient(135deg,#0f1e38 0%,#1a3059 100%)" }}
          >
            <Building2 size={24} className="text-[#c8a96e]" />
          </div>
          <h1 className="text-2xl font-extrabold text-[#0f1e38]">Request Hospital Access</h1>
          <p className="text-sm text-gray-500 mt-1">
            Signed in as <span className="font-semibold text-[#0f1e38]">{user.email}</span>
          </p>
        </div>

        {existingMemberships.length > 0 && (
          <div className="mb-6 space-y-2">
            <p className="text-xs font-bold uppercase tracking-widest text-[#c8a96e] mb-3">Your Access Requests</p>
            {existingMemberships.map((membership) => {
              const status = STATUS_CONFIG[membership.status];
              return (
                <div
                  key={membership.id}
                  className="flex items-center justify-between p-4 rounded-2xl bg-white border border-gray-100"
                >
                  <div>
                    <p className="font-semibold text-[#0f1e38] text-sm">{membership.hospitalName}</p>
                    <p className="text-xs text-gray-400">
                      {HOSPITAL_ROLE_LABELS[membership.role] ?? membership.role}
                    </p>
                  </div>
                  <span
                    className="flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full"
                    style={{ background: `${status.color}18`, color: status.color }}
                  >
                    {status.icon} {status.label}
                  </span>
                </div>
              );
            })}
          </div>
        )}

        {(pendingStatus || submitted) && (
          <div
            className="mb-5 flex items-start gap-3 p-4 rounded-2xl"
            style={{ background: "rgba(200,169,110,.1)", border: "1.5px solid rgba(200,169,110,.3)" }}
          >
            <Clock size={16} className="text-[#c8a96e] flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-bold text-[#0f1e38]">Request Submitted</p>
              <p className="text-xs text-gray-500 mt-0.5">
                Your request is pending approval from the hospital owner or manager.
              </p>
            </div>
          </div>
        )}

        {availableHospitals.length > 0 && (
          <form onSubmit={handleSubmit} className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 space-y-4">
            <p className="text-sm font-bold text-[#0f1e38]">
              {existingMemberships.length > 0 ? "Request access to another hospital" : "Select your hospital and role"}
            </p>

            <div>
              <label className="text-xs font-bold uppercase tracking-widest text-gray-400 block mb-2">Hospital</label>
              <div className="relative">
                <select
                  value={hospitalId}
                  onChange={(e) => setHospitalId(e.target.value)}
                  required
                  className="w-full h-11 rounded-xl px-3 pr-9 text-sm font-medium text-[#0f1e38] appearance-none outline-none"
                  style={{ background: "#f7f4ef", border: "1.5px solid rgba(15,30,56,.12)" }}
                >
                  <option value="">Select a hospital...</option>
                  {availableHospitals.map((hospital) => (
                    <option key={hospital.id} value={hospital.id}>
                      {hospital.name}
                    </option>
                  ))}
                </select>
                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-widest text-gray-400 block mb-2">Your Role</label>
              <div className="space-y-2">
                {ACCESS_REQUEST_ROLES.map((value) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setRole(value)}
                    className="w-full text-left p-3 rounded-xl transition-all"
                    style={{
                      border: role === value ? "2px solid #c8a96e" : "2px solid rgba(15,30,56,.08)",
                      background: role === value ? "rgba(200,169,110,.08)" : "#fff",
                    }}
                  >
                    <p className="text-sm font-semibold text-[#0f1e38]">{HOSPITAL_ROLE_LABELS[value]}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{ROLE_DESCRIPTIONS[value]}</p>
                  </button>
                ))}
              </div>
            </div>

            {error && <p className="text-xs text-red-600 font-semibold">{error}</p>}

            <button
              type="submit"
              disabled={!hospitalId || !role || submitting}
              className="w-full h-11 rounded-xl font-bold text-sm transition-all disabled:opacity-50"
              style={{
                background: "linear-gradient(135deg,#0f1e38 0%,#1a3059 100%)",
                color: "#c8a96e",
                border: "none",
              }}
            >
              {submitting ? "Submitting..." : "Submit Request"}
            </button>
          </form>
        )}

        {availableHospitals.length === 0 && existingMemberships.length > 0 && (
          <p className="text-center text-sm text-gray-400 mt-4">You have requested access to all available hospitals.</p>
        )}
      </div>
    </div>
  );
}
