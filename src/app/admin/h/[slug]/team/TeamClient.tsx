"use client";

import { useEffect, useState, useCallback } from "react";
import { Users, RefreshCw, AlertCircle, Trash2, ChevronDown } from "lucide-react";

type Member = {
  id: string;
  userId: string;
  role: string;
  status: string;
  invitedBy: string | null;
  rejectedReason: string | null;
  createdAt: string;
  user: { fullName: string; email: string; memberSince: string };
};

const ROLE_LABELS: Record<string, string> = {
  HOSPITAL_OWNER:   "Owner",
  HOSPITAL_MANAGER: "Manager",
  RECEPTION:        "Receptionist",
  CONTENT_EDITOR:   "Content Editor",
};

const STATUS_CONFIG: Record<string, { label: string; bg: string; color: string }> = {
  APPROVED: { label: "Approved", bg: "rgba(16,185,129,.1)",  color: "#059669" },
  PENDING:  { label: "Pending",  bg: "rgba(245,158,11,.1)", color: "#b45309" },
  REJECTED: { label: "Rejected", bg: "rgba(239,68,68,.08)", color: "#dc2626" },
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export default function TeamClient({ slug }: { slug: string }) {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchMembers = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/admin/h/${slug}/team`);
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      setMembers(data.members);
    } catch {
      setError("Failed to load team.");
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => { fetchMembers(); }, [fetchMembers]);

  const handleRoleChange = async (memberId: string, role: string) => {
    setActionLoading(memberId + "role");
    try {
      const res = await fetch(`/api/admin/h/${slug}/team`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ memberId, role }),
      });
      if (!res.ok) throw new Error("Failed");
      await fetchMembers();
    } catch {
      setError("Failed to update role.");
    } finally {
      setActionLoading(null);
    }
  };

  const handleStatusChange = async (memberId: string, status: string) => {
    setActionLoading(memberId + "status");
    try {
      const res = await fetch(`/api/admin/h/${slug}/team`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ memberId, status }),
      });
      if (!res.ok) throw new Error("Failed");
      await fetchMembers();
    } catch {
      setError("Failed to update status.");
    } finally {
      setActionLoading(null);
    }
  };

  const handleRemove = async (memberId: string) => {
    if (!confirm("Remove this team member?")) return;
    setActionLoading(memberId + "remove");
    try {
      const res = await fetch(`/api/admin/h/${slug}/team?memberId=${memberId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed");
      await fetchMembers();
    } catch {
      setError("Failed to remove member.");
    } finally {
      setActionLoading(null);
    }
  };

  const approved = members.filter((m) => m.status === "APPROVED");
  const pending  = members.filter((m) => m.status === "PENDING");
  const rejected = members.filter((m) => m.status === "REJECTED");

  return (
    <div className="space-y-6 max-w-4xl">

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-extrabold text-[#0f1e38]">Team</h1>
          <p className="text-sm text-gray-400 mt-0.5">
            {approved.length} active · {pending.length} pending
          </p>
        </div>
        <button onClick={fetchMembers}
          className="flex items-center gap-2 px-3 h-9 rounded-xl text-xs font-semibold transition-all"
          style={{ background: "#fff", border: "1.5px solid rgba(15,30,56,.1)", color: "#6b7a96" }}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#c8a96e"; e.currentTarget.style.color = "#c8a96e"; }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = "rgba(15,30,56,.1)"; e.currentTarget.style.color = "#6b7a96"; }}>
          <RefreshCw size={13} /> Refresh
        </button>
      </div>

      {error && (
        <div className="p-3 rounded-xl text-sm font-semibold text-red-600 flex items-center gap-2"
          style={{ background: "#fef2f2", border: "1px solid rgba(220,38,38,.2)" }}>
          <AlertCircle size={14} /> {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-solid border-[#c8a96e] border-r-transparent" />
        </div>
      ) : members.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-gray-100">
          <Users size={28} className="text-gray-200 mx-auto mb-3" />
          <p className="text-sm font-semibold text-gray-400">No team members yet</p>
          <p className="text-xs text-gray-300 mt-1">Staff can request access from /admin/request-access</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Pending requests */}
          {pending.length > 0 && (
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-amber-600 mb-3">
                Pending Requests ({pending.length})
              </p>
              <div className="space-y-2">
                {pending.map((m) => (
                  <MemberRow key={m.id} member={m} actionLoading={actionLoading}
                    onRoleChange={handleRoleChange} onStatusChange={handleStatusChange} onRemove={handleRemove} />
                ))}
              </div>
            </div>
          )}

          {/* Active members */}
          {approved.length > 0 && (
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">
                Active Members ({approved.length})
              </p>
              <div className="space-y-2">
                {approved.map((m) => (
                  <MemberRow key={m.id} member={m} actionLoading={actionLoading}
                    onRoleChange={handleRoleChange} onStatusChange={handleStatusChange} onRemove={handleRemove} />
                ))}
              </div>
            </div>
          )}

          {/* Rejected */}
          {rejected.length > 0 && (
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">
                Rejected ({rejected.length})
              </p>
              <div className="space-y-2">
                {rejected.map((m) => (
                  <MemberRow key={m.id} member={m} actionLoading={actionLoading}
                    onRoleChange={handleRoleChange} onStatusChange={handleStatusChange} onRemove={handleRemove} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function MemberRow({
  member, actionLoading, onRoleChange, onStatusChange, onRemove,
}: {
  member: Member;
  actionLoading: string | null;
  onRoleChange: (id: string, role: string) => void;
  onStatusChange: (id: string, status: string) => void;
  onRemove: (id: string) => void;
}) {
  const st = STATUS_CONFIG[member.status] ?? STATUS_CONFIG.PENDING;
  const busy = actionLoading?.startsWith(member.id);

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center gap-4 flex-wrap">
      {/* Avatar */}
      <div className="h-9 w-9 rounded-xl flex items-center justify-center flex-shrink-0 text-sm font-bold"
        style={{ background: "rgba(200,169,110,.12)", color: "#c8a96e" }}>
        {member.user.fullName.charAt(0).toUpperCase()}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="font-bold text-[#0f1e38] text-sm">{member.user.fullName}</p>
        <p className="text-xs text-gray-400">{member.user.email}</p>
        <p className="text-[10px] text-gray-300 mt-0.5">
          Joined {formatDate(member.createdAt)}
          {member.invitedBy ? " · Invited" : " · Self-requested"}
        </p>
      </div>

      {/* Status badge */}
      <span className="text-xs font-bold px-2.5 py-1 rounded-full flex-shrink-0"
        style={{ background: st.bg, color: st.color }}>
        {st.label}
      </span>

      {/* Role selector */}
      <div className="relative flex-shrink-0">
        <select
          value={member.role}
          onChange={(e) => onRoleChange(member.id, e.target.value)}
          disabled={!!busy}
          className="h-8 rounded-xl pl-3 pr-7 text-xs font-semibold appearance-none outline-none disabled:opacity-50"
          style={{ background: "#f7f4ef", border: "1.5px solid rgba(15,30,56,.1)", color: "#0f1e38" }}
        >
          {Object.entries(ROLE_LABELS).map(([val, label]) => (
            <option key={val} value={val}>{label}</option>
          ))}
        </select>
        <ChevronDown size={11} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
      </div>

      {/* Approve/Reject for pending */}
      {member.status === "PENDING" && (
        <div className="flex gap-2 flex-shrink-0">
          <button
            onClick={() => onStatusChange(member.id, "APPROVED")}
            disabled={!!busy}
            className="h-8 px-3 rounded-xl text-xs font-bold disabled:opacity-50"
            style={{ background: "rgba(16,185,129,.1)", color: "#059669" }}>
            {actionLoading === member.id + "status" ? "..." : "Approve"}
          </button>
          <button
            onClick={() => onStatusChange(member.id, "REJECTED")}
            disabled={!!busy}
            className="h-8 px-3 rounded-xl text-xs font-bold disabled:opacity-50"
            style={{ background: "rgba(239,68,68,.08)", color: "#dc2626" }}>
            Reject
          </button>
        </div>
      )}

      {/* Remove */}
      <button
        onClick={() => onRemove(member.id)}
        disabled={!!busy}
        className="h-8 w-8 rounded-xl flex items-center justify-center flex-shrink-0 disabled:opacity-50 transition-all"
        style={{ background: "transparent", color: "#d1d5db" }}
        onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(239,68,68,.08)"; e.currentTarget.style.color = "#dc2626"; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#d1d5db"; }}
      >
        <Trash2 size={13} />
      </button>
    </div>
  );
}
