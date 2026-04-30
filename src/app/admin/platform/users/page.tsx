"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import type { HospitalRole, UserRole } from "@prisma/client";
import { Users, Search, RefreshCw, AlertCircle, ChevronLeft, ChevronRight, CheckCircle2, XCircle, Ban } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import {
  HOSPITAL_ROLE_LABELS,
  PLATFORM_ROLE_LABELS,
  isPlatformAdmin,
  isPlatformStaff,
} from "@/lib/admin-roles";

type Membership = { id: string; role: HospitalRole; status: string; hospitalName: string; hospitalSlug: string };
type SupportAssignment = { id: string; hospitalId: string; hospitalName: string; hospitalSlug: string };
type SupportHospital = { id: string; name: string };
type User = {
  id: string; fullName: string; email: string; phone: string | null;
  role: UserRole; bannedAt: string | null; createdAt: string;
  bookingCount: number; memberships: Membership[]; supportAssignments: SupportAssignment[];
};

const STATUS_CONFIG: Record<string, { bg: string; color: string }> = {
  APPROVED: { bg: "rgba(16,185,129,.1)",  color: "#059669" },
  PENDING:  { bg: "rgba(245,158,11,.1)",  color: "#b45309" },
  REJECTED: { bg: "rgba(239,68,68,.08)", color: "#dc2626" },
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

const FILTERS = [
  { value: "all",     label: "All Users" },
  { value: "pending", label: "Pending" },
  { value: "banned",  label: "Banned" },
];

const PLATFORM_ROLE_OPTIONS: UserRole[] = ["USER", "PLATFORM_SUPPORT", "PLATFORM_ADMIN"];

function UsersContent() {
  const searchParams = useSearchParams();
  const [users, setUsers] = useState<User[]>([]);
  const [supportHospitals, setSupportHospitals] = useState<SupportHospital[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [filter, setFilter] = useState(searchParams.get("filter") ?? "all");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState("");
  const searchRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchUsers = useCallback(async (q = search, f = filter, p = page) => {
    setLoading(true); setError("");
    try {
      const params = new URLSearchParams({ page: String(p), filter: f });
      if (q) params.set("search", q);
      const res = await fetch(`/api/admin/platform/users?${params}`);
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      setUsers(data.users); setTotal(data.total); setHasMore(data.hasMore);
      setSupportHospitals(data.supportAssignableHospitals ?? []);
      setCurrentUserId(data.currentUserId ?? null);
    } catch { setError("Failed to load users."); }
    finally { setLoading(false); }
  }, [search, filter, page]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void fetchUsers(search, filter, page);
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [fetchUsers, search, filter, page]);

  const handleSearch = (val: string) => {
    setSearchInput(val);
    if (searchRef.current) clearTimeout(searchRef.current);
    searchRef.current = setTimeout(() => { setSearch(val); setPage(1); }, 350);
  };

  const handleMembership = async (membershipId: string, action: "APPROVE_MEMBERSHIP" | "REJECT_MEMBERSHIP") => {
    setActionLoading(membershipId + action);
    try {
      const res = await fetch("/api/admin/platform/users", {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, membershipId }),
      });
      if (!res.ok) throw new Error("Failed");
      await fetchUsers(search, filter, page);
    } catch { setError("Action failed."); }
    finally { setActionLoading(null); }
  };

  const handleBan = async (userId: string, banned: boolean) => {
    if (!confirm(banned ? "Unban this user?" : "Ban this user? They will lose all access.")) return;
    setActionLoading(userId + "ban");
    try {
      const res = await fetch("/api/admin/platform/users", {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: banned ? "UNBAN_USER" : "BAN_USER", userId }),
      });
      if (!res.ok) throw new Error("Failed");
      await fetchUsers(search, filter, page);
    } catch { setError("Action failed."); }
    finally { setActionLoading(null); }
  };

  const handlePlatformRoleChange = async (userId: string, role: UserRole) => {
    if (!confirm(`Change this user's platform role to ${PLATFORM_ROLE_LABELS[role]}?`)) return;
    setActionLoading(userId + "role");
    try {
      const res = await fetch("/api/admin/platform/users", {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "UPDATE_PLATFORM_ROLE", userId, role }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed");
      await fetchUsers(search, filter, page);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update platform role.");
    } finally {
      setActionLoading(null);
    }
  };

  const handleAssignSupport = async (userId: string, hospitalId: string) => {
    if (!hospitalId) return;
    setActionLoading(userId + "assign");
    try {
      const res = await fetch("/api/admin/platform/users", {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "ASSIGN_SUPPORT", userId, hospitalId }),
      });
      if (!res.ok) throw new Error("Failed");
      await fetchUsers(search, filter, page);
    } catch { setError("Failed to assign support hospital."); }
    finally { setActionLoading(null); }
  };

  const handleUnassignSupport = async (assignmentId: string) => {
    if (!confirm("Remove this support assignment?")) return;
    setActionLoading(assignmentId + "unassign");
    try {
      const res = await fetch("/api/admin/platform/users", {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "UNASSIGN_SUPPORT", assignmentId }),
      });
      if (!res.ok) throw new Error("Failed");
      await fetchUsers(search, filter, page);
    } catch { setError("Failed to remove support assignment."); }
    finally { setActionLoading(null); }
  };

  return (
    <div className="space-y-6 w-full max-w-7xl">

      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-[#0f1e38]">Users</h1>
          <p className="text-sm text-gray-400 mt-0.5">{total} user{total !== 1 ? "s" : ""}</p>
        </div>
        <button onClick={() => fetchUsers()}
          className="flex items-center gap-2 h-9 px-3 rounded-xl text-xs font-semibold transition-all flex-shrink-0"
          style={{ background: "#fff", border: "1.5px solid rgba(15,30,56,.1)", color: "#6b7a96" }}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#c8a96e"; e.currentTarget.style.color = "#c8a96e"; }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = "rgba(15,30,56,.1)"; e.currentTarget.style.color = "#6b7a96"; }}>
          <RefreshCw size={13} /> Refresh
        </button>
      </div>

      <div className="flex gap-3 flex-wrap items-center">
        <div className="flex items-center gap-2 h-10 rounded-xl px-3 bg-white flex-1 min-w-48 border border-gray-100">
          <Search size={13} className="text-gray-400 flex-shrink-0" />
          <input value={searchInput} onChange={(e) => handleSearch(e.target.value)}
            placeholder="Search by name or email…"
            className="flex-1 text-sm outline-none bg-transparent text-[#0f1e38] placeholder-gray-400" />
        </div>
        <div className="flex gap-1.5">
          {FILTERS.map((f) => (
            <button key={f.value} onClick={() => { setFilter(f.value); setPage(1); }}
              className="h-9 px-4 rounded-xl text-xs font-semibold transition-all"
              style={{
                background: filter === f.value ? "#0f1e38" : "#fff",
                color: filter === f.value ? "#c8a96e" : "#6b7a96",
                border: filter === f.value ? "none" : "1.5px solid rgba(15,30,56,.09)",
              }}>
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="p-3 rounded-2xl text-sm font-semibold text-red-600 flex items-center gap-2"
          style={{ background: "#fef2f2", border: "1px solid rgba(220,38,38,.2)" }}>
          <AlertCircle size={14} /> {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center h-56">
          <div className="h-9 w-9 animate-spin rounded-full border-2 border-solid border-[#c8a96e] border-r-transparent" />
        </div>
      ) : users.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-gray-100">
          <div className="h-12 w-12 rounded-xl flex items-center justify-center mx-auto mb-3"
            style={{ background: "rgba(200,169,110,.1)" }}>
            <Users size={20} className="text-[#c8a96e]" />
          </div>
          <p className="text-sm font-semibold text-[#0f1e38]">No users found</p>
          <p className="text-xs mt-1" style={{ color: "#8a9ab5" }}>Try a different filter</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="w-full overflow-x-auto">
            <table className="w-full min-w-[1180px] text-sm">
              <thead style={{ background: "#f7f4ef" }}>
                <tr>
                  <th className="w-[28%] text-left px-5 py-3 text-[11px] font-bold uppercase tracking-widest text-gray-400">User</th>
                  <th className="w-[26%] text-left px-5 py-3 text-[11px] font-bold uppercase tracking-widest text-gray-400">Platform Role</th>
                  <th className="w-[12%] text-left px-5 py-3 text-[11px] font-bold uppercase tracking-widest text-gray-400">Joined</th>
                  <th className="w-[24%] text-left px-5 py-3 text-[11px] font-bold uppercase tracking-widest text-gray-400">Hospital Access</th>
                  <th className="w-[10%] text-right px-5 py-3 text-[11px] font-bold uppercase tracking-widest text-gray-400">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} className="border-t border-gray-100 align-top" style={{ opacity: user.bannedAt ? 0.7 : 1 }}>
                    <td className="px-5 py-4 align-top">
                      <div className="flex items-start gap-3 min-w-0">
                        <div className="h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0 text-sm font-bold text-white"
                          style={{
                            background: isPlatformStaff(user.role)
                              ? "#c8a96e"
                              : "#6366f1",
                          }}>
                          {user.fullName.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-bold text-[#0f1e38] leading-tight">{user.fullName}</p>
                            {user.bannedAt && (
                              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                                style={{ background: "rgba(239,68,68,.08)", color: "#dc2626" }}>Banned</span>
                            )}
                          </div>
                          <p className="text-xs break-all" style={{ color: "#8a9ab5" }}>{user.email}</p>
                          <p className="text-[11px]" style={{ color: "#bfcbd9" }}>
                            {user.bookingCount} booking{user.bookingCount !== 1 ? "s" : ""}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="px-5 py-4 align-top">
                      {user.role !== "USER" ? (
                        <div className="space-y-3">
                          <select
                            value={user.role}
                            disabled={actionLoading === user.id + "role"}
                            onChange={(e) => handlePlatformRoleChange(user.id, e.target.value as UserRole)}
                            className="h-8 w-full max-w-[220px] rounded-lg px-2 text-xs font-semibold outline-none disabled:opacity-50"
                            style={{ background: "rgba(200,169,110,.15)", border: "1px solid rgba(200,169,110,.2)", color: "#a88b50" }}
                          >
                            {PLATFORM_ROLE_OPTIONS.map((role) => (
                              <option key={role} value={role}>{PLATFORM_ROLE_LABELS[role]}</option>
                            ))}
                          </select>
                          {user.role === "PLATFORM_SUPPORT" && (
                            <div className="space-y-1.5">
                              {user.supportAssignments.length === 0 ? (
                                <p className="text-[11px] text-gray-400">No assigned hospitals</p>
                              ) : (
                                user.supportAssignments.map((assignment) => (
                                  <div key={assignment.id} className="flex items-center gap-2">
                                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                                      style={{ background: "rgba(15,30,56,.06)", color: "#6b7a96" }}>
                                      {assignment.hospitalName}
                                    </span>
                                    <button
                                      onClick={() => handleUnassignSupport(assignment.id)}
                                      disabled={actionLoading === assignment.id + "unassign"}
                                      className="text-[10px] font-bold text-red-500 disabled:opacity-40"
                                    >
                                      Remove
                                    </button>
                                  </div>
                                ))
                              )}
                              <select
                                value=""
                                disabled={actionLoading === user.id + "assign"}
                                onChange={(e) => handleAssignSupport(user.id, e.target.value)}
                                className="h-8 w-full max-w-[220px] rounded-lg px-2 text-xs font-semibold outline-none"
                                style={{ background: "#f7f4ef", border: "1px solid rgba(15,30,56,.1)", color: "#6b7a96" }}
                              >
                                <option value="">Assign hospital...</option>
                                {supportHospitals
                                  .filter((hospital) => !user.supportAssignments.some((assignment) => assignment.hospitalId === hospital.id))
                                  .map((hospital) => (
                                    <option key={hospital.id} value={hospital.id}>{hospital.name}</option>
                                  ))}
                              </select>
                            </div>
                          )}
                        </div>
                      ) : (
                        <select
                          value={user.role}
                          disabled={actionLoading === user.id + "role"}
                          onChange={(e) => handlePlatformRoleChange(user.id, e.target.value as UserRole)}
                          className="h-8 w-full max-w-[220px] rounded-lg px-2 text-xs font-semibold outline-none disabled:opacity-50"
                          style={{ background: "#f7f4ef", border: "1px solid rgba(15,30,56,.1)", color: "#6b7a96" }}
                        >
                          {PLATFORM_ROLE_OPTIONS.map((role) => (
                            <option key={role} value={role}>{PLATFORM_ROLE_LABELS[role]}</option>
                          ))}
                        </select>
                      )}
                    </td>

                    <td className="px-5 py-4 align-top">
                      <span className="text-xs font-semibold text-[#0f1e38]">{formatDate(user.createdAt)}</span>
                    </td>

                    <td className="px-5 py-4 align-top">
                      {user.memberships.length === 0 ? (
                        <span className="text-xs text-gray-400">No memberships</span>
                      ) : (
                        <div className="space-y-2">
                          {user.memberships.map((m) => {
                            const st = STATUS_CONFIG[m.status] ?? STATUS_CONFIG.PENDING;
                            const busy = actionLoading?.startsWith(m.id);
                            return (
                              <div key={m.id} className="p-2 rounded-lg" style={{ background: "rgba(15,30,56,.03)" }}>
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="text-xs font-bold text-[#0f1e38]">{m.hospitalName}</span>
                                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                                    style={{ background: "rgba(15,30,56,.06)", color: "#6b7a96" }}>
                                    {HOSPITAL_ROLE_LABELS[m.role] ?? m.role}
                                  </span>
                                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                                    style={{ background: st.bg, color: st.color }}>
                                    {m.status.charAt(0) + m.status.slice(1).toLowerCase()}
                                  </span>
                                </div>

                                {m.status === "PENDING" && (
                                  <div className="mt-2 flex items-center gap-2">
                                    <button onClick={() => handleMembership(m.id, "APPROVE_MEMBERSHIP")} disabled={!!busy}
                                      className="flex items-center gap-1 h-7 px-2 rounded-lg text-[11px] font-bold disabled:opacity-50"
                                      style={{ background: "rgba(16,185,129,.1)", color: "#059669" }}>
                                      <CheckCircle2 size={10} />
                                      {actionLoading === m.id + "APPROVE_MEMBERSHIP" ? "..." : "Approve"}
                                    </button>
                                    <button onClick={() => handleMembership(m.id, "REJECT_MEMBERSHIP")} disabled={!!busy}
                                      className="flex items-center gap-1 h-7 px-2 rounded-lg text-[11px] font-bold disabled:opacity-50"
                                      style={{ background: "rgba(239,68,68,.08)", color: "#dc2626" }}>
                                      <XCircle size={10} />
                                      {actionLoading === m.id + "REJECT_MEMBERSHIP" ? "..." : "Reject"}
                                    </button>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </td>

                    <td className="px-5 py-4 text-right align-top">
                      <button onClick={() => handleBan(user.id, !!user.bannedAt)}
                        disabled={actionLoading === user.id + "ban" || user.id === currentUserId || isPlatformAdmin(user.role)}
                        className="inline-flex items-center gap-1.5 h-8 px-3 rounded-xl text-xs font-bold disabled:opacity-30 transition-all"
                        style={{
                          background: user.bannedAt ? "rgba(16,185,129,.08)" : "rgba(239,68,68,.07)",
                          color: user.bannedAt ? "#059669" : "#dc2626",
                        }}>
                        <Ban size={12} />
                        {actionLoading === user.id + "ban" ? "..." : user.bannedAt ? "Unban" : "Ban"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {total > 20 && (
        <div className="flex items-center justify-between pt-2">
          <p className="text-xs font-semibold" style={{ color: "#8a9ab5" }}>
            Showing {(page - 1) * 20 + 1}–{Math.min(page * 20, total)} of {total}
          </p>
          <div className="flex gap-2">
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
              className="h-9 w-9 rounded-xl flex items-center justify-center disabled:opacity-30"
              style={{ background: "#fff", border: "1.5px solid rgba(15,30,56,.1)" }}>
              <ChevronLeft size={15} className="text-[#0f1e38]" />
            </button>
            <span className="h-8 px-3 flex items-center text-xs font-semibold text-[#0f1e38]"
              style={{ background: "#fff", border: "1.5px solid rgba(15,30,56,.1)", borderRadius: 12 }}>{page}</span>
            <button onClick={() => setPage((p) => p + 1)} disabled={!hasMore}
              className="h-9 w-9 rounded-xl flex items-center justify-center disabled:opacity-30"
              style={{ background: "#fff", border: "1.5px solid rgba(15,30,56,.1)" }}>
              <ChevronRight size={15} className="text-[#0f1e38]" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function PlatformUsersPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-56"><div className="h-9 w-9 animate-spin rounded-full border-2 border-solid border-[#c8a96e] border-r-transparent" /></div>}>
      <UsersContent />
    </Suspense>
  );
}
