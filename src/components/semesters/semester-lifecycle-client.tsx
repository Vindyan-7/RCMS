"use client";

/**
 * Semester & Membership Lifecycle – Client Component
 *
 * Coordinator workspace to:
 *  - Manage semester entities (create, activate, complete)
 *  - View all members and their current semester membership status
 *  - Renew memberships into the active semester (Member ID never changes)
 *  - View full membership history per member
 */

import { useState, useTransition, useEffect } from "react";
import {
  getAllSemestersAction,
  createSemesterAction,
  activateSemesterAction,
  completeSemesterAction,
  deleteSemesterAction,
} from "@/actions/members/semesters.actions";
import {
  renewMembershipAction,
  getMembershipHistoryAction,
  getActiveMembershipAction,
} from "@/actions/members/memberships.actions";
import { searchMembersAction } from "@/actions/members/members.actions";
import { SemesterSelect, MemberSelect, MembershipSelect } from "@/db/schema";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  GraduationCap,
  Plus,
  RefreshCw,
  X,
  CheckCircle,
  Clock,
  CalendarRange,
  RotateCcw,
  History,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  Users,
  Zap,
} from "lucide-react";

interface SemesterClientProps {
  initialSemesters: SemesterSelect[];
  initialMembers: MemberSelect[];
}

// ── Helpers ────────────────────────────────────────────────────────────────
function statusBadge(status: string) {
  const map: Record<string, { label: string; cls: string }> = {
    upcoming: { label: "Upcoming", cls: "bg-amber-950/60 text-amber-400 border-amber-700/50" },
    active:   { label: "Active",   cls: "bg-emerald-950/60 text-emerald-400 border-emerald-700/50" },
    completed:{ label: "Completed",cls: "bg-slate-800 text-slate-400 border-slate-600" },
  };
  const s = map[status] || { label: status, cls: "bg-muted text-muted-foreground border-border" };
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${s.cls}`}>
      {s.label}
    </span>
  );
}

function membershipStatusBadge(status: string) {
  const map: Record<string, { label: string; cls: string }> = {
    active:   { label: "Active",    cls: "bg-emerald-950/60 text-emerald-400 border-emerald-700/50" },
    past:     { label: "Past",      cls: "bg-slate-800 text-slate-400 border-slate-600" },
    inactive: { label: "Inactive",  cls: "bg-slate-800 text-slate-400 border-slate-600" },
    suspended:{ label: "Suspended", cls: "bg-red-950/60 text-red-400 border-red-700/50" },
  };
  const s = map[status] || { label: status, cls: "bg-muted text-muted-foreground border-border" };
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${s.cls}`}>
      {s.label}
    </span>
  );
}

function fmtDate(d: Date | string | null | undefined): string {
  if (!d) return "—";
  const date = d instanceof Date ? d : new Date(d);
  return date.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

// ── Component ──────────────────────────────────────────────────────────────
export function SemesterLifecycleClient({ initialSemesters, initialMembers }: SemesterClientProps) {
  const [semesters, setSemesters] = useState<SemesterSelect[]>(initialSemesters);
  const [members, setMembers] = useState<MemberSelect[]>(initialMembers);
  const [activeTab, setActiveTab] = useState<"semesters" | "memberships">("semesters");

  // Semester form
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [semName, setSemName] = useState("");
  const [semAcYear, setSemAcYear] = useState("");
  const [semStart, setSemStart] = useState("");
  const [semEnd, setSemEnd] = useState("");
  const [semRegStart, setSemRegStart] = useState("");
  const [semRegEnd, setSemRegEnd] = useState("");
  const [semStatus, setSemStatus] = useState("upcoming");

  // Member membership states
  const [memberActiveMemberships, setMemberActiveMemberships] = useState<Record<string, MembershipSelect | null>>({});
  const [expandedMember, setExpandedMember] = useState<string | null>(null);
  const [memberHistory, setMemberHistory] = useState<Record<string, MembershipSelect[]>>({});
  const [renewingId, setRenewingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{ type: "ok" | "err"; msg: string } | null>(null);

  const activeSemester = semesters.find((s) => s.status === "active");

  // ── Load active memberships for all members on mount ─────────────────────
  useEffect(() => {
    const load = async () => {
      const results: Record<string, MembershipSelect | null> = {};
      await Promise.all(
        members.map(async (m) => {
          const res = await getActiveMembershipAction(m.id);
          results[m.id] = res.success ? res.data ?? null : null;
        })
      );
      setMemberActiveMemberships(results);
    };
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [members]);

  const showFeedback = (type: "ok" | "err", msg: string) => {
    setFeedback({ type, msg });
    setTimeout(() => setFeedback(null), 4000);
  };

  // ── Refresh ───────────────────────────────────────────────────────────────
  const handleRefresh = () => {
    startTransition(async () => {
      const [semRes, memRes] = await Promise.all([
        getAllSemestersAction(),
        searchMembersAction("", { limit: 1000 }),
      ]);
      if (semRes.success && semRes.data) setSemesters(semRes.data.items);
      if (memRes.success && memRes.data) setMembers(memRes.data.items);
    });
  };

  // ── Create Semester ────────────────────────────────────────────────────────
  const handleCreateSemester = async (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      const res = await createSemesterAction({
        academicYearId: semAcYear,
        name: semName,
        startDate: semStart,
        endDate: semEnd,
        registrationStart: semRegStart || null,
        registrationEnd: semRegEnd || null,
        status: semStatus,
      });
      if (res.success) {
        setShowCreateForm(false);
        setSemName(""); setSemAcYear(""); setSemStart(""); setSemEnd(""); setSemRegStart(""); setSemRegEnd(""); setSemStatus("upcoming");
        handleRefresh();
        showFeedback("ok", "Semester created successfully.");
      } else {
        showFeedback("err", res.error?.message || "Failed to create semester.");
      }
    });
  };

  // ── Activate Semester ──────────────────────────────────────────────────────
  const handleActivate = (id: string) => {
    if (!confirm("Activate this semester? Only one semester can be active at a time.")) return;
    startTransition(async () => {
      const res = await activateSemesterAction(id);
      if (res.success) { handleRefresh(); showFeedback("ok", "Semester activated."); }
      else showFeedback("err", res.error?.message || "Failed to activate.");
    });
  };

  // ── Complete Semester ──────────────────────────────────────────────────────
  const handleComplete = (id: string) => {
    if (!confirm("Complete this semester? All active memberships will be moved to 'Past'. This cannot be undone.")) return;
    startTransition(async () => {
      const res = await completeSemesterAction(id);
      if (res.success) { handleRefresh(); showFeedback("ok", "Semester completed. All memberships closed."); }
      else showFeedback("err", res.error?.message || "Failed to complete.");
    });
  };

  // ── Delete Semester ────────────────────────────────────────────────────────
  const handleDelete = (id: string) => {
    if (!confirm("Delete this semester? This is a soft delete.")) return;
    startTransition(async () => {
      const res = await deleteSemesterAction(id);
      if (res.success) { handleRefresh(); showFeedback("ok", "Semester deleted."); }
      else showFeedback("err", res.error?.message || "Failed to delete.");
    });
  };

  // ── Renew Membership ───────────────────────────────────────────────────────
  const handleRenew = async (memberId: string) => {
    setRenewingId(memberId);
    try {
      const res = await renewMembershipAction(memberId);
      if (res.success) {
        // Update local active membership map
        setMemberActiveMemberships((prev) => ({ ...prev, [memberId]: res.data! }));
        showFeedback("ok", "Membership renewed — Member ID preserved, history intact.");
      } else {
        showFeedback("err", res.error?.message || "Renewal failed.");
      }
    } finally {
      setRenewingId(null);
    }
  };

  // ── Toggle history panel for a member ─────────────────────────────────────
  const handleToggleHistory = async (memberId: string) => {
    if (expandedMember === memberId) { setExpandedMember(null); return; }
    setExpandedMember(memberId);
    if (!memberHistory[memberId]) {
      const res = await getMembershipHistoryAction(memberId);
      if (res.success && res.data) {
        setMemberHistory((prev) => ({ ...prev, [memberId]: res.data as MembershipSelect[] }));
      }
    }
  };

  const filteredMembers = members.filter((m) => {
    const q = searchQuery.toLowerCase();
    return (
      !q ||
      m.name?.toLowerCase().includes(q) ||
      m.rollNumber?.toLowerCase().includes(q) ||
      m.clubMembershipId?.toLowerCase().includes(q) ||
      m.memberId?.toLowerCase().includes(q)
    );
  });

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Feedback Banner */}
      {feedback && (
        <div
          className={`flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-medium border ${
            feedback.type === "ok"
              ? "bg-emerald-950/60 border-emerald-700/50 text-emerald-300"
              : "bg-red-950/60 border-red-700/50 text-red-300"
          }`}
        >
          {feedback.type === "ok" ? <CheckCircle className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
          {feedback.msg}
        </div>
      )}

      {/* Active Semester Banner */}
      {activeSemester && (
        <div className="flex items-center gap-3 rounded-xl border border-emerald-700/40 bg-emerald-950/30 px-5 py-3">
          <Zap className="h-5 w-5 text-emerald-400 shrink-0" />
          <div className="flex-1 min-w-0">
            <span className="text-sm font-semibold text-emerald-300">Active Semester: </span>
            <span className="text-sm text-foreground font-medium">{activeSemester.name}</span>
            <span className="ml-3 text-xs text-muted-foreground">
              {fmtDate(activeSemester.startDate)} – {fmtDate(activeSemester.endDate)}
            </span>
          </div>
          <span className="text-xs text-muted-foreground">Registrations: {fmtDate(activeSemester.registrationStart)} → {fmtDate(activeSemester.registrationEnd)}</span>
        </div>
      )}

      {!activeSemester && (
        <div className="flex items-center gap-3 rounded-xl border border-amber-700/40 bg-amber-950/30 px-5 py-3">
          <AlertTriangle className="h-5 w-5 text-amber-400 shrink-0" />
          <span className="text-sm text-amber-300 font-medium">No active semester. Activate a semester to enable membership renewals.</span>
        </div>
      )}

      {/* Header */}
      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <GraduationCap className="h-5 w-5 text-primary" />
              Semester &amp; Membership Lifecycle
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Manage academic semesters and renew member enrollments — Member IDs never change
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isPending} className="text-xs">
              <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${isPending ? "animate-spin" : ""}`} /> Sync
            </Button>
            {activeTab === "semesters" && (
              <Button size="sm" onClick={() => setShowCreateForm(true)} className="text-xs">
                <Plus className="h-3.5 w-3.5 mr-1.5" /> New Semester
              </Button>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-border gap-6">
          <button
            onClick={() => setActiveTab("semesters")}
            className={`pb-2.5 text-sm font-medium transition-colors ${activeTab === "semesters" ? "border-b-2 border-primary text-foreground" : "text-muted-foreground hover:text-foreground"}`}
          >
            <CalendarRange className="inline h-4 w-4 mr-1.5 -mt-0.5" />
            Semesters ({semesters.length})
          </button>
          <button
            onClick={() => setActiveTab("memberships")}
            className={`pb-2.5 text-sm font-medium transition-colors ${activeTab === "memberships" ? "border-b-2 border-primary text-foreground" : "text-muted-foreground hover:text-foreground"}`}
          >
            <Users className="inline h-4 w-4 mr-1.5 -mt-0.5" />
            Member Enrollments ({members.length})
          </button>
        </div>

        {/* ── SEMESTERS TAB ─────────────────────────────────────────────── */}
        {activeTab === "semesters" && (
          <div className="space-y-4">
            {/* Create Semester Form */}
            {showCreateForm && (
              <div className="rounded-xl border border-border bg-muted/20 p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-foreground text-sm">Create New Semester</h3>
                  <button onClick={() => setShowCreateForm(false)} className="text-muted-foreground hover:text-foreground">
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <form onSubmit={handleCreateSemester} className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold uppercase text-muted-foreground">Semester Name *</label>
                    <input
                      required value={semName} onChange={(e) => setSemName(e.target.value)}
                      placeholder="e.g. Semester I 2025–26"
                      className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold uppercase text-muted-foreground">Academic Year ID *</label>
                    <input
                      required value={semAcYear} onChange={(e) => setSemAcYear(e.target.value)}
                      placeholder="UUID of academic year"
                      className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none font-mono"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold uppercase text-muted-foreground">Start Date *</label>
                    <input
                      required type="date" value={semStart} onChange={(e) => setSemStart(e.target.value)}
                      className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold uppercase text-muted-foreground">End Date *</label>
                    <input
                      required type="date" value={semEnd} onChange={(e) => setSemEnd(e.target.value)}
                      className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold uppercase text-muted-foreground">Registration Opens</label>
                    <input
                      type="date" value={semRegStart} onChange={(e) => setSemRegStart(e.target.value)}
                      className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold uppercase text-muted-foreground">Registration Closes</label>
                    <input
                      type="date" value={semRegEnd} onChange={(e) => setSemRegEnd(e.target.value)}
                      className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold uppercase text-muted-foreground">Initial Status</label>
                    <select
                      value={semStatus} onChange={(e) => setSemStatus(e.target.value)}
                      className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none"
                    >
                      <option value="upcoming">Upcoming</option>
                      <option value="active">Active</option>
                    </select>
                  </div>
                  <div className="sm:col-span-2 flex gap-3 pt-1">
                    <Button type="submit" disabled={isPending} className="flex-1 text-sm">
                      {isPending ? "Creating..." : "Create Semester"}
                    </Button>
                    <Button type="button" variant="outline" onClick={() => setShowCreateForm(false)} className="text-sm">
                      Cancel
                    </Button>
                  </div>
                </form>
              </div>
            )}

            {/* Semesters Table */}
            <div className="overflow-x-auto rounded-xl border border-border/80 bg-background/40">
              <table className="w-full text-left text-xs text-foreground whitespace-nowrap">
                <thead className="border-b border-border bg-muted/30 font-semibold uppercase tracking-wider text-[11px] text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3">SEMESTER NAME</th>
                    <th className="px-4 py-3">STATUS</th>
                    <th className="px-4 py-3">PERIOD</th>
                    <th className="px-4 py-3">REGISTRATION WINDOW</th>
                    <th className="px-4 py-3 text-right">ACTIONS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {semesters.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                        No semesters yet. Create the first one above.
                      </td>
                    </tr>
                  ) : (
                    semesters.map((s) => (
                      <tr key={s.id} className="hover:bg-accent/30 transition-colors">
                        <td className="px-4 py-3">
                          <div className="font-semibold text-foreground flex items-center gap-2">
                            <GraduationCap className="h-3.5 w-3.5 text-primary shrink-0" />
                            {s.name}
                          </div>
                          <div className="text-[10px] text-muted-foreground font-mono mt-0.5">{s.id.slice(0, 12)}…</div>
                        </td>
                        <td className="px-4 py-3">{statusBadge(s.status)}</td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {fmtDate(s.startDate)} → {fmtDate(s.endDate)}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {s.registrationStart ? `${fmtDate(s.registrationStart)} → ${fmtDate(s.registrationEnd)}` : "—"}
                        </td>
                        <td className="px-4 py-3 text-right space-x-2">
                          {s.status === "upcoming" && (
                            <Button size="sm" variant="outline" className="h-7 text-[11px] text-emerald-400 border-emerald-700/50 hover:bg-emerald-950/40"
                              onClick={() => handleActivate(s.id)} disabled={isPending}>
                              <CheckCircle className="h-3 w-3 mr-1" /> Activate
                            </Button>
                          )}
                          {s.status === "active" && (
                            <Button size="sm" variant="outline" className="h-7 text-[11px] text-slate-400 border-slate-600 hover:bg-slate-800/50"
                              onClick={() => handleComplete(s.id)} disabled={isPending}>
                              <Clock className="h-3 w-3 mr-1" /> Complete
                            </Button>
                          )}
                          {s.status !== "active" && (
                            <Button size="sm" variant="ghost" className="h-7 text-[11px] text-destructive hover:bg-destructive/10"
                              onClick={() => handleDelete(s.id)} disabled={isPending}>
                              <X className="h-3 w-3" />
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── MEMBERSHIPS TAB ───────────────────────────────────────────── */}
        {activeTab === "memberships" && (
          <div className="space-y-4">
            {/* Search */}
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, roll number, member ID or club ID…"
              className="w-full rounded-xl border border-input bg-background/60 px-4 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />

            {/* Table */}
            <div className="overflow-x-auto rounded-xl border border-border/80 bg-background/40">
              <table className="w-full text-left text-xs text-foreground whitespace-nowrap">
                <thead className="border-b border-border bg-muted/30 font-semibold uppercase tracking-wider text-[11px] text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3">MEMBER</th>
                    <th className="px-4 py-3">MEMBER ID</th>
                    <th className="px-4 py-3">CURRENT MEMBERSHIP</th>
                    <th className="px-4 py-3">SEMESTER</th>
                    <th className="px-4 py-3">JOINED</th>
                    <th className="px-4 py-3 text-right">ACTIONS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {filteredMembers.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">No members found.</td>
                    </tr>
                  ) : (
                    filteredMembers.map((member) => {
                      const activeMem = memberActiveMemberships[member.id];
                      const isExpanded = expandedMember === member.id;
                      const history = memberHistory[member.id];
                      const inCurrentSemester =
                        activeMem &&
                        activeSemester &&
                        activeMem.semesterId === activeSemester.id &&
                        activeMem.status === "active";

                      return (
                        <>
                          <tr key={member.id} className="hover:bg-accent/30 transition-colors">
                            <td className="px-4 py-3">
                              <div className="font-semibold text-foreground">{member.name}</div>
                              <div className="text-[10px] text-muted-foreground">{member.rollNumber}</div>
                            </td>
                            <td className="px-4 py-3">
                              <span className="font-mono text-[11px] bg-slate-900 text-slate-300 border border-slate-700 px-2 py-0.5 rounded-md">
                                {member.memberId || "—"}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              {activeMem ? membershipStatusBadge(activeMem.status) : (
                                <span className="text-muted-foreground text-[11px]">No enrollment</span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-muted-foreground">
                              {inCurrentSemester
                                ? <span className="text-emerald-400 font-medium">{activeSemester!.name}</span>
                                : activeMem
                                  ? <span className="text-amber-400">Past semester</span>
                                  : "—"
                              }
                            </td>
                            <td className="px-4 py-3 text-muted-foreground">
                              {activeMem ? fmtDate(activeMem.joinDate) : "—"}
                            </td>
                            <td className="px-4 py-3 text-right space-x-1.5">
                              {/* Renew button — only if not already in the current active semester */}
                              {!inCurrentSemester && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-7 text-[11px] text-primary border-primary/40 hover:bg-primary/10"
                                  onClick={() => handleRenew(member.id)}
                                  disabled={!activeSemester || renewingId === member.id}
                                >
                                  <RotateCcw className={`h-3 w-3 mr-1 ${renewingId === member.id ? "animate-spin" : ""}`} />
                                  {renewingId === member.id ? "Renewing…" : "Renew"}
                                </Button>
                              )}
                              {inCurrentSemester && (
                                <span className="text-[11px] text-emerald-400 font-medium">✓ Enrolled</span>
                              )}
                              {/* History toggle */}
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-7 text-[11px] text-muted-foreground hover:text-foreground"
                                onClick={() => handleToggleHistory(member.id)}
                              >
                                <History className="h-3 w-3 mr-1" />
                                {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                              </Button>
                            </td>
                          </tr>

                          {/* History expansion row */}
                          {isExpanded && (
                            <tr key={`${member.id}-history`} className="bg-muted/10">
                              <td colSpan={6} className="px-6 py-4">
                                <div className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
                                  <History className="h-3.5 w-3.5" />
                                  Membership History — {member.name}
                                  <span className="text-muted-foreground/60 font-normal">(Member ID never changes)</span>
                                </div>
                                {!history ? (
                                  <div className="text-xs text-muted-foreground">Loading…</div>
                                ) : history.length === 0 ? (
                                  <div className="text-xs text-muted-foreground">No membership history.</div>
                                ) : (
                                  <div className="space-y-2">
                                    {history.map((h) => (
                                      <div key={h.id} className="flex items-center gap-4 rounded-lg border border-border/50 bg-background/40 px-4 py-2.5">
                                        {membershipStatusBadge(h.status)}
                                        <span className="text-xs text-foreground font-medium">Joined: {fmtDate(h.joinDate)}</span>
                                        {h.exitDate && <span className="text-xs text-muted-foreground">Exited: {fmtDate(h.exitDate)}</span>}
                                        <span className="font-mono text-[10px] text-muted-foreground/60 ml-auto">Sem: {h.semesterId.slice(0, 8)}…</span>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </td>
                            </tr>
                          )}
                        </>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Legend */}
            <div className="flex flex-wrap items-center gap-4 text-[11px] text-muted-foreground border-t border-border/40 pt-3">
              <span className="font-semibold">Notes:</span>
              <span>• Member IDs are permanent and never change on renewal</span>
              <span>• Each renewal creates a new Membership record (history preserved)</span>
              <span>• Completing a semester moves all memberships to &apos;Past&apos;</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
