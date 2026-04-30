"use client";

import { useEffect, useState, useCallback } from "react";
import { Settings, AlertCircle, CheckCircle2 } from "lucide-react";

type HospitalSettings = {
  id: string;
  name: string;
  slug: string;
  type: string;
  phone: string | null;
  email: string | null;
  website: string | null;
  openingHours: string | null;
  emergencyAvailable: boolean;
  servicesSummary: string | null;
  verified: boolean;
  isActive: boolean;
  location: {
    country: string;
    province: string | null;
    district: string;
    city: string;
    area: string | null;
    addressLine: string | null;
  } | null;
};

export default function SettingsClient({ slug }: { slug: string }) {
  const [hospital, setHospital] = useState<HospitalSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const [form, setForm] = useState({
    phone: "",
    email: "",
    website: "",
    openingHours: "",
    emergencyAvailable: false,
    servicesSummary: "",
  });

  const fetchSettings = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/admin/h/${slug}/settings`);
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      setHospital(data.hospital);
      setForm({
        phone: data.hospital.phone ?? "",
        email: data.hospital.email ?? "",
        website: data.hospital.website ?? "",
        openingHours: data.hospital.openingHours ?? "",
        emergencyAvailable: data.hospital.emergencyAvailable,
        servicesSummary: data.hospital.servicesSummary ?? "",
      });
    } catch {
      setError("Failed to load settings.");
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void fetchSettings();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [fetchSettings]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess(false);
    try {
      const res = await fetch(`/api/admin/h/${slug}/settings`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Failed to save"); return; }
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch {
      setError("Network error. Try again.");
    } finally {
      setSaving(false);
    }
  };

  const field = (key: keyof typeof form) => ({
    value: form[key] as string,
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((f) => ({ ...f, [key]: e.target.value })),
  });

  return (
    <div className="space-y-5 max-w-2xl">

      <div>
        <h1 className="text-xl font-extrabold text-[#0f1e38]">Settings</h1>
        <p className="text-sm text-gray-400 mt-0.5">Hospital profile and contact information</p>
      </div>

      {error && (
        <div className="p-3 rounded-xl text-sm font-semibold text-red-600 flex items-center gap-2"
          style={{ background: "#fef2f2", border: "1px solid rgba(220,38,38,.2)" }}>
          <AlertCircle size={14} /> {error}
        </div>
      )}

      {success && (
        <div className="p-3 rounded-xl text-sm font-semibold text-emerald-700 flex items-center gap-2"
          style={{ background: "rgba(16,185,129,.08)", border: "1px solid rgba(16,185,129,.25)" }}>
          <CheckCircle2 size={14} /> Settings saved successfully
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-solid border-[#c8a96e] border-r-transparent" />
        </div>
      ) : !hospital ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-gray-100">
          <Settings size={28} className="text-gray-200 mx-auto mb-3" />
          <p className="text-sm text-gray-400">Could not load settings</p>
        </div>
      ) : (
        <form onSubmit={handleSave} className="space-y-5">

          {/* Read-only info */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4">
            <p className="text-xs font-bold uppercase tracking-widest text-gray-400">Hospital Info</p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-400 mb-1">Name</p>
                <p className="text-sm font-semibold text-[#0f1e38]">{hospital.name}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-1">Type</p>
                <p className="text-sm font-semibold text-[#0f1e38] capitalize">{hospital.type.toLowerCase()}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-1">Slug</p>
                <p className="text-sm font-mono text-gray-500">{hospital.slug}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-1">Status</p>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                  style={{
                    background: hospital.verified ? "rgba(16,185,129,.1)" : "rgba(245,158,11,.1)",
                    color: hospital.verified ? "#059669" : "#b45309",
                  }}>
                  {hospital.verified ? "Verified" : "Unverified"}
                </span>
              </div>
            </div>
            {hospital.location && (
              <div>
                <p className="text-xs text-gray-400 mb-1">Location</p>
                <p className="text-sm text-gray-500">
                  {[hospital.location.addressLine, hospital.location.area, hospital.location.city, hospital.location.district]
                    .filter(Boolean).join(", ")}
                </p>
              </div>
            )}
            <p className="text-[10px] text-gray-300">Name, type, slug and location can only be changed by platform admin.</p>
          </div>

          {/* Editable fields */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4">
            <p className="text-xs font-bold uppercase tracking-widest text-gray-400">Contact & Hours</p>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-gray-400 block mb-1.5">Phone</label>
                <input {...field("phone")} placeholder="+977 1 234 5678"
                  className="w-full h-10 rounded-xl px-3 text-sm outline-none"
                  style={{ background: "#f7f4ef", border: "1.5px solid rgba(15,30,56,.1)" }} />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-400 block mb-1.5">Email</label>
                <input {...field("email")} type="email" placeholder="info@hospital.com"
                  className="w-full h-10 rounded-xl px-3 text-sm outline-none"
                  style={{ background: "#f7f4ef", border: "1.5px solid rgba(15,30,56,.1)" }} />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-gray-400 block mb-1.5">Website</label>
              <input {...field("website")} placeholder="https://hospital.com"
                className="w-full h-10 rounded-xl px-3 text-sm outline-none"
                style={{ background: "#f7f4ef", border: "1.5px solid rgba(15,30,56,.1)" }} />
            </div>

            <div>
              <label className="text-xs font-bold text-gray-400 block mb-1.5">Opening Hours</label>
              <input {...field("openingHours")} placeholder="Sun–Fri: 8am–6pm, Sat: 8am–1pm"
                className="w-full h-10 rounded-xl px-3 text-sm outline-none"
                style={{ background: "#f7f4ef", border: "1.5px solid rgba(15,30,56,.1)" }} />
            </div>

            <div>
              <label className="text-xs font-bold text-gray-400 block mb-1.5">Services Summary</label>
              <textarea
                value={form.servicesSummary}
                onChange={(e) => setForm((f) => ({ ...f, servicesSummary: e.target.value }))}
                placeholder="Brief summary of services offered..."
                rows={3}
                className="w-full rounded-xl px-3 py-2.5 text-sm outline-none resize-none"
                style={{ background: "#f7f4ef", border: "1.5px solid rgba(15,30,56,.1)" }}
              />
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setForm((f) => ({ ...f, emergencyAvailable: !f.emergencyAvailable }))}
                className="relative h-6 w-11 rounded-full transition-all flex-shrink-0"
                style={{ background: form.emergencyAvailable ? "#c8a96e" : "#e5e7eb" }}
              >
                <span className="absolute top-0.5 h-5 w-5 bg-white rounded-full shadow transition-all"
                  style={{ left: form.emergencyAvailable ? "calc(100% - 22px)" : "2px" }} />
              </button>
              <div>
                <p className="text-sm font-semibold text-[#0f1e38]">Emergency Available</p>
                <p className="text-xs text-gray-400">Shown on the hospital listing</p>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full h-11 rounded-xl font-bold text-sm disabled:opacity-50 transition-all"
            style={{ background: "linear-gradient(135deg,#0f1e38,#1a3059)", color: "#c8a96e" }}
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </form>
      )}
    </div>
  );
}
