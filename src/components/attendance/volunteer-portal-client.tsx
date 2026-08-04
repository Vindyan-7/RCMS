"use client";

/**
 * Mobile-First Volunteer Attendance Experience (RCMS Attendance Module v4)
 */

import { useState, useEffect, useRef, useTransition } from "react";
import {
  loginVolunteerPortalAction,
  validateVolunteerCodeAction,
} from "@/actions/attendance/volunteer_codes.actions";
import {
  recordAttendanceAction,
  getSessionRecordsAction,
} from "@/actions/attendance/attendance_records.actions";
import { getEnrolledMembersForActiveSemesterAction } from "@/actions/members/semesters.actions";
import { sortMembersByClubMembershipId } from "@/core/utils/member-sorting";
import { AttendanceSessionSelect, VolunteerCodeSelect, MemberSelect, AttendanceRecordSelect } from "@/db/schema";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Bot,
  QrCode,
  Search,
  CheckCircle,
  AlertCircle,
  X,
  LogOut,
  RefreshCw,
  Award,
  Users,
  Clock,
  ShieldCheck,
  Zap,
  UserCheck,
  Check,
  SearchX,
  ArrowRight,
} from "lucide-react";

export function VolunteerPortalClient() {
  const [authSession, setAuthSession] = useState<{
    codeRecord: VolunteerCodeSelect;
    session: AttendanceSessionSelect;
    volunteerMember: MemberSelect;
  } | null>(null);

  // Login Form State
  const [memberInput, setMemberInput] = useState("");
  const [pinCode, setPinCode] = useState("");
  const [loginError, setLoginError] = useState<string | null>(null);

  // Tab State: "search" vs "qr"
  const [activeTab, setActiveTab] = useState<"search" | "qr">("search");

  // Search & Member List State
  const [searchQuery, setSearchQuery] = useState("");
  const [allMembers, setAllMembers] = useState<MemberSelect[]>([]);
  const [filteredMembers, setFilteredMembers] = useState<MemberSelect[]>([]);
  const [isSearchingMembers, setIsSearchingMembers] = useState(false);

  // Marked Attendance Records State
  const [markedMemberIds, setMarkedMemberIds] = useState<Set<string>>(new Set());
  const [liveScannedCount, setLiveScannedCount] = useState(0);
  const [totalMembersCount, setTotalMembersCount] = useState(0);

  // Feedback & Timer State
  const [feedback, setFeedback] = useState<{ type: "success" | "error" | "info"; message: string } | null>(null);
  const [nowTime, setNowTime] = useState(Date.now());
  const [isPending, startTransition] = useTransition();

  const searchInputRef = useRef<HTMLInputElement>(null);

  // Live timer tick for countdown
  useEffect(() => {
    const interval = setInterval(() => {
      setNowTime(Date.now());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Polling check for PIN expiration or coordinator termination
  useEffect(() => {
    if (!authSession) return;

    const interval = setInterval(async () => {
      const res = await validateVolunteerCodeAction({ code: authSession.codeRecord.code });
      if (!res.success) {
        setAuthSession(null);
        setLoginError("Your Volunteer Passcode PIN has expired or been terminated by the coordinator.");
      }
    }, 10000);

    return () => clearInterval(interval);
  }, [authSession]);

  // Load existing records and member directory when authenticated
  useEffect(() => {
    if (!authSession) return;

    const loadSessionData = async () => {
      setIsSearchingMembers(true);
      const [recsRes, membersRes] = await Promise.all([
        getSessionRecordsAction(authSession.session.id),
        getEnrolledMembersForActiveSemesterAction(),
      ]);

      if (recsRes.success && recsRes.data) {
        const markedSet = new Set<string>();
        recsRes.data.items.forEach((r: AttendanceRecordSelect) => markedSet.add(r.memberId));
        setMarkedMemberIds(markedSet);
        setLiveScannedCount(recsRes.data.total);
      }

      if (membersRes.success && membersRes.data) {
        const sorted = sortMembersByClubMembershipId(membersRes.data);
        setAllMembers(sorted);
        setTotalMembersCount(sorted.length);
        setFilteredMembers(sorted);
      }
      setIsSearchingMembers(false);
    };

    loadSessionData();
  }, [authSession]);

  // Universal multi-field member search across Club Membership ID, Roll No, Name, Phone, Internal ID
  useEffect(() => {
    const sortedAll = sortMembersByClubMembershipId(allMembers);
    if (!searchQuery.trim()) {
      setFilteredMembers(sortedAll);
      return;
    }

    const q = searchQuery.trim().toLowerCase();
    const matches = sortedAll.filter((m) => {
      const memId = (m.clubMembershipId || "").toLowerCase();
      const roll = (m.rollNumber || "").toLowerCase();
      const name = (m.name || "").toLowerCase();
      const phone = (m.phone || "").toLowerCase();
      const internalId = (m.memberId || "").toLowerCase();

      return (
        memId.includes(q) ||
        roll.includes(q) ||
        name.includes(q) ||
        phone.includes(q) ||
        internalId.includes(q)
      );
    });

    setFilteredMembers(matches);
  }, [searchQuery, allMembers]);

  // Volunteer Portal Login handler
  const handleVolunteerLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);

    startTransition(async () => {
      const res = await loginVolunteerPortalAction({
        memberInput: memberInput.trim(),
        pinCode: pinCode.trim(),
      });

      if (res.success && res.data) {
        setAuthSession(res.data);
        setFeedback({
          type: "success",
          message: `Authenticated as ${res.data.volunteerMember.name}! Ready to record attendance.`,
        });
        setTimeout(() => searchInputRef.current?.focus(), 100);
      } else {
        setLoginError(res.error?.message || "Volunteer Login failed. Please check your credentials.");
      }
    });
  };

  // Fast successive attendance check-in handler
  const handleMarkPresent = async (member: MemberSelect) => {
    if (!authSession) return;
    if (markedMemberIds.has(member.id)) {
      setFeedback({ type: "info", message: `${member.name} has already been marked PRESENT.` });
      return;
    }

    startTransition(async () => {
      const res = await recordAttendanceAction({
        memberId: member.id,
        sessionId: authSession.session.id,
        method: "manual",
      });

      if (res.success && res.data) {
        const isLate = res.data.late;
        const pts = res.data.points;

        // Update local state instantly
        setMarkedMemberIds((prev) => new Set(prev).add(member.id));
        setLiveScannedCount((prev) => prev + 1);

        setFeedback({
          type: "success",
          message: `✓ PRESENT: ${member.name} (${member.clubMembershipId || member.rollNumber}) marked ${isLate ? "LATE" : "ON TIME"} (+${pts} Pts).`,
        });

        // Fast successive workflow: auto-clear search & refocus
        setSearchQuery("");
        setTimeout(() => searchInputRef.current?.focus(), 50);
      } else {
        setFeedback({ type: "error", message: res.error?.message || "Check-in failed" });
      }
    });
  };

  const handleLogout = () => {
    setAuthSession(null);
    setMemberInput("");
    setPinCode("");
    setSearchQuery("");
    setFeedback(null);
  };

  // Calculate remaining PIN validity countdown
  const remainingMs = authSession
    ? Math.max(0, new Date(authSession.codeRecord.expiresAt).getTime() - nowTime)
    : 0;
  const remainingMins = Math.floor(remainingMs / 60000);
  const remainingSecs = Math.floor((remainingMs % 60000) / 1000);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col justify-between p-3 sm:p-6 font-sans select-none">
      {/* Top Header */}
      <header className="flex items-center justify-between border-b border-border pb-3 mb-3 max-w-lg mx-auto w-full">
        <div className="flex items-center space-x-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-md">
            <Bot className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-base font-bold tracking-tight">RCMS Volunteer Portal</h1>
            <p className="text-[10px] text-muted-foreground">Live Event Attendance Scanner App</p>
          </div>
        </div>

        {authSession ? (
          <Button variant="ghost" size="sm" onClick={handleLogout} className="text-xs text-destructive hover:bg-destructive/10 h-8">
            <LogOut className="h-4 w-4 mr-1" /> Logout
          </Button>
        ) : (
          <Badge variant="outline" className="text-[10px] font-mono">v4 Mobile App</Badge>
        )}
      </header>

      {/* Main Content Area */}
      <main className="max-w-lg mx-auto w-full flex-1 space-y-4 text-left">
        {/* Global Feedback Banner */}
        {feedback && (
          <div
            className={`flex items-center justify-between p-3 rounded-xl text-xs font-medium border shadow-sm transition-all ${
              feedback.type === "success"
                ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20 dark:text-emerald-400"
                : feedback.type === "error"
                ? "bg-destructive/10 text-destructive border-destructive/20"
                : "bg-blue-500/10 text-blue-600 border-blue-500/20 dark:text-blue-400"
            }`}
          >
            <div className="flex items-center space-x-2">
              {feedback.type === "success" ? (
                <CheckCircle className="h-4 w-4 shrink-0 text-emerald-500" />
              ) : (
                <AlertCircle className="h-4 w-4 shrink-0" />
              )}
              <span>{feedback.message}</span>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setFeedback(null)} className="h-5 w-5 p-0 rounded-full">
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
        )}

        {/* STATE 1: VOLUNTEER AUTHENTICATION LOGIN */}
        {!authSession ? (
          <div className="rounded-2xl border border-border bg-card p-5 shadow-xl space-y-4">
            <div className="space-y-1 border-b border-border pb-3">
              <h2 className="text-base font-bold text-foreground flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-primary" />
                <span>Volunteer Authentication</span>
              </h2>
              <p className="text-xs text-muted-foreground">
                Enter your Club Membership ID or Roll Number along with the 6-digit Volunteer Passcode PIN provided by your event coordinator.
              </p>
            </div>

            {loginError && (
              <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-center space-x-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{loginError}</span>
              </div>
            )}

            <form onSubmit={handleVolunteerLogin} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-foreground">
                  Club Membership ID or Roll Number
                </label>
                <input
                  type="text"
                  required
                  value={memberInput}
                  placeholder="e.g. SAC-RC-26001 or 26RC1001"
                  onChange={(e) => setMemberInput(e.target.value)}
                  className="w-full rounded-xl border border-input bg-background px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-foreground">
                  Volunteer Session Passcode PIN (6-Digits)
                </label>
                <input
                  type="text"
                  required
                  value={pinCode}
                  placeholder="Enter 6-digit PIN..."
                  onChange={(e) => setPinCode(e.target.value)}
                  className="w-full rounded-xl border border-input bg-background px-3.5 py-2.5 text-sm font-mono tracking-widest text-center font-bold text-lg focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <Button type="submit" className="w-full h-11 font-bold text-sm" disabled={isPending}>
                {isPending ? "Authenticating..." : "Authenticate & Open Scanner"}
              </Button>
            </form>

            <div className="p-3.5 rounded-xl bg-muted/30 border border-border text-[11px] text-muted-foreground space-y-1">
              <div className="font-semibold text-foreground flex items-center gap-1.5">
                <Zap className="h-3.5 w-3.5 text-primary" />
                <span>Session-Based Temporary Access</span>
              </div>
              <p>
                Access is granted for the active event session and automatically expires when the PIN lifetime ends.
              </p>
            </div>
          </div>
        ) : (
          /* STATE 2: VOLUNTEER ATTENDANCE APP INTERFACE */
          <div className="space-y-4">
            {/* REQUIREMENT 2: Active Session Banner */}
            <div className="rounded-2xl border border-primary/30 bg-primary/5 p-4 shadow-sm space-y-2.5 border-l-4 border-l-primary">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="font-bold text-sm text-foreground line-clamp-1">{authSession.session.title}</h3>
                  <p className="text-[11px] text-muted-foreground flex items-center gap-1.5 mt-0.5">
                    <UserCheck className="h-3.5 w-3.5 text-primary" />
                    <span>Volunteer: <strong className="text-foreground">{authSession.volunteerMember.name}</strong></span>
                  </p>
                </div>
                <Badge variant="success" className="animate-pulse text-[10px]">Attendance Active</Badge>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs border-t border-primary/20 pt-2.5">
                {/* REQUIREMENT 7: Live Attendance Counter */}
                <div className="flex items-center space-x-1.5 font-bold text-foreground bg-background/60 p-2 rounded-xl border border-border">
                  <Users className="h-4 w-4 text-primary" />
                  <span>Present: <strong className="text-primary font-mono">{liveScannedCount}</strong> / {totalMembersCount || liveScannedCount}</span>
                </div>

                <div className="flex items-center space-x-1.5 text-muted-foreground bg-background/60 p-2 rounded-xl border border-border font-mono text-[11px]">
                  <Clock className="h-4 w-4 text-amber-500 shrink-0" />
                  <span>Expires In: <strong className="text-foreground">{remainingMins}m {remainingSecs}s</strong></span>
                </div>
              </div>
            </div>

            {/* Attendance Taking Mode Tabs */}
            <div className="flex rounded-xl bg-muted p-1 border border-border">
              <button
                type="button"
                onClick={() => setActiveTab("search")}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center space-x-1.5 ${
                  activeTab === "search"
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Search className="h-3.5 w-3.5" />
                <span>Universal Search Check-in</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("qr")}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center space-x-1.5 ${
                  activeTab === "qr"
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <QrCode className="h-3.5 w-3.5" />
                <span>QR Scanner</span>
              </button>
            </div>

            {/* REQUIREMENT 3 & 4: Universal Search & Mobile-Optimized Member List */}
            {activeTab === "search" && (
              <div className="space-y-3">
                {/* Universal Search Bar */}
                <div className="relative">
                  <Search className="absolute left-3.5 top-3 h-4 w-4 text-muted-foreground" />
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={searchQuery}
                    placeholder="Search Club Membership ID, Roll No, Name, Phone..."
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full rounded-2xl border border-input bg-card pl-10 pr-10 py-2.5 text-sm font-medium shadow-sm focus:ring-2 focus:ring-primary/20"
                  />
                  {searchQuery ? (
                    <button
                      onClick={() => {
                        setSearchQuery("");
                        searchInputRef.current?.focus();
                      }}
                      className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  ) : isSearchingMembers ? (
                    <RefreshCw className="absolute right-3 top-3 h-4 w-4 animate-spin text-muted-foreground" />
                  ) : null}
                </div>

                {/* Mobile-Optimized Member List */}
                <div className="space-y-2.5 max-h-[60vh] overflow-y-auto pr-1">
                  {filteredMembers.length === 0 ? (
                    /* REQUIREMENT 8: Empty Search State */
                    <div className="p-8 text-center border border-dashed rounded-2xl bg-card space-y-2">
                      <SearchX className="h-8 w-8 text-muted-foreground mx-auto" />
                      <div className="font-semibold text-xs text-foreground">No members found matching &apos;{searchQuery}&apos;</div>
                      <p className="text-[11px] text-muted-foreground">Verify Club Membership ID, Roll Number, or Name spelling.</p>
                    </div>
                  ) : (
                    filteredMembers.map((member) => {
                      const isMarked = markedMemberIds.has(member.id);

                      return (
                        <div
                          key={member.id}
                          className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between gap-3 bg-card shadow-sm ${
                            isMarked ? "border-emerald-500/30 bg-emerald-500/5 opacity-80" : "border-border hover:border-primary/30"
                          }`}
                        >
                          <div className="space-y-1 min-w-0 flex-1">
                            <div className="flex items-center space-x-2">
                              <span className="bg-primary/10 text-primary font-mono font-bold text-xs px-2 py-0.5 rounded-md border border-primary/20">
                                {member.clubMembershipId || "NO-ID"}
                              </span>
                              <span className="text-[11px] font-mono text-muted-foreground">{member.rollNumber || "—"}</span>
                            </div>
                            
                            <div className="font-bold text-sm text-foreground truncate">{member.name}</div>
                            
                            <div className="text-[11px] text-muted-foreground flex items-center gap-1.5">
                              <span>Dept: <strong className="text-foreground">{member.branch || "ECE"}</strong></span>
                              <span>•</span>
                              <span>Yr {member.year || "1"}</span>
                            </div>
                          </div>

                          {/* REQUIREMENT 5: Large Present Button / Badge */}
                          <div className="shrink-0">
                            {isMarked ? (
                              <div className="flex items-center space-x-1 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-3 py-2 rounded-xl border border-emerald-500/20 font-bold text-xs">
                                <Check className="h-4 w-4" />
                                <span>Present</span>
                              </div>
                            ) : (
                              <Button
                                size="sm"
                                onClick={() => handleMarkPresent(member)}
                                disabled={isPending}
                                className="h-10 px-4 font-bold text-xs flex items-center space-x-1.5 shadow-sm active:scale-95 transition-transform"
                              >
                                <CheckCircle className="h-4 w-4" />
                                <span>Mark Present</span>
                              </Button>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}

            {/* REQUIREMENT 9: QR Scanner Placeholder View */}
            {activeTab === "qr" && (
              <div className="rounded-2xl border border-border bg-card p-6 shadow-lg space-y-4 text-center">
                <div className="space-y-1">
                  <h3 className="font-bold text-base text-foreground flex items-center justify-center gap-2">
                    <QrCode className="h-5 w-5 text-primary" />
                    <span>QR Attendance Coming Soon</span>
                  </h3>
                  <p className="text-xs text-muted-foreground max-w-xs mx-auto">
                    Camera-based QR code scanning will be available in an upcoming update. Currently, please use the fast Manual Search Check-in.
                  </p>
                </div>

                <div className="relative w-full aspect-square max-w-[220px] mx-auto rounded-2xl border-2 border-dashed border-primary/40 bg-muted/20 flex flex-col items-center justify-center p-4">
                  <QrCode className="h-14 w-14 text-primary/40 mb-2 animate-pulse" />
                  <span className="text-xs font-semibold text-foreground">QR Scanner Module</span>
                  <span className="text-[10px] text-muted-foreground">Ready for camera integration</span>
                </div>

                <Button
                  onClick={() => {
                    setActiveTab("search");
                    setTimeout(() => searchInputRef.current?.focus(), 50);
                  }}
                  className="w-full text-xs font-bold flex items-center justify-center space-x-2 h-10"
                >
                  <span>Switch to Manual Search Check-in</span>
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-6 text-center text-[10px] text-muted-foreground border-t border-border pt-3">
        Robotics Club Management System (RCMS) • Volunteer Attendance App v4
      </footer>
    </div>
  );
}
