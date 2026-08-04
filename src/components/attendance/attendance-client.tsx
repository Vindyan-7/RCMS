"use client";

/**
 * Attendance & Volunteer Authentication Client Component
 */

import { useState, useTransition, useEffect, useCallback, useMemo } from "react";
import { sortMembersByClubMembershipId } from "@/core/utils/member-sorting";
import {
  createAttendanceSessionAction,
  openAttendanceSessionAction,
  closeAttendanceSessionAction,
  pauseAttendanceSessionAction,
  getAttendanceSessionsAction,
} from "@/actions/attendance/attendance_sessions.actions";
import {
  generateVolunteerCodeAction,
  validateVolunteerCodeAction,
  getSessionVolunteerCodesAction,
  endVolunteerCodeAction,
} from "@/actions/attendance/volunteer_codes.actions";
import {
  recordAttendanceAction,
  getAttendanceRecordsAction,
  exportAttendanceRecordsCsvAction,
  bulkRecordAttendanceAction,
} from "@/actions/attendance/attendance_records.actions";
import {
  getSemesterContextMetadataAction,
  getEnrolledMembersForActiveSemesterAction,
} from "@/actions/members/semesters.actions";
import { SemesterContextMetadata } from "@/services/academic/semester-context.service";
import { AttendanceSessionSelect, AttendanceRecordSelect, VolunteerCodeSelect, MemberSelect } from "@/db/schema";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Plus,
  Play,
  Pause,
  StopCircle,
  Key,
  X,
  UserCheck,
  RefreshCw,
  QrCode,
  Download,
  ExternalLink,
  History,
  CheckCircle2,
  Users,
  Clock,
  Ribbon,
  Copy,
  AlertTriangle,
  Search,
} from "lucide-react";
import Link from "next/link";

interface AttendanceClientProps {
  initialSessions: AttendanceSessionSelect[];
  initialRecords: AttendanceRecordSelect[];
}

export function AttendanceClient({ initialSessions, initialRecords }: AttendanceClientProps) {
  const [sessions, setSessions] = useState<AttendanceSessionSelect[]>(initialSessions);
  const [records, setRecords] = useState<AttendanceRecordSelect[]>(initialRecords);

  const [semesterContext, setSemesterContext] = useState<SemesterContextMetadata | null>(null);
  const [enrolledMembers, setEnrolledMembers] = useState<MemberSelect[]>([]);
  const [isPending, startTransition] = useTransition();

  const refreshSessionsAndRecords = useCallback(async () => {
    try {
      const [sessRes, recsRes, metaRes, membersRes] = await Promise.all([
        getAttendanceSessionsAction(),
        getAttendanceRecordsAction(),
        getSemesterContextMetadataAction(),
        getEnrolledMembersForActiveSemesterAction(),
      ]);
      if (sessRes.success && sessRes.data) setSessions(sessRes.data.items);
      if (recsRes.success && recsRes.data) setRecords(recsRes.data.items);
      if (metaRes.success && metaRes.data) setSemesterContext(metaRes.data);
      if (membersRes.success && membersRes.data) setEnrolledMembers(membersRes.data);
    } catch {}
  }, []);

  // Phase 1: Auto-fetch fresh data when page is opened / mounted
  useEffect(() => {
    refreshSessionsAndRecords();
  }, [refreshSessionsAndRecords]);

  // Top navigation view mode
  const [activeTab, setActiveTab] = useState<"admin" | "history">("admin");

  // Alert banner state
  const [alertMessage, setAlertMessage] = useState<string | null>(null);

  // Modal & Dialog controller states
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isPinsModalOpen, setIsPinsModalOpen] = useState(false);

  const [selectedSession, setSelectedSession] = useState<AttendanceSessionSelect | null>(null);
  const [sessionPins, setSessionPins] = useState<VolunteerCodeSelect[]>([]);
  const [volunteerPIN, setVolunteerPIN] = useState("");
  const [authenticatedSessionId, setAuthenticatedSessionId] = useState<string | null>(null);
  // Create Session Form Fields
  const [title, setTitle] = useState("");
  const [dateVal, setDateVal] = useState(new Date().toISOString().split("T")[0]);
  const [startTime, setStartTime] = useState("14:00");
  const [endTime, setEndTime] = useState("16:00");
  const [points, setPoints] = useState(15);
  const [lateThreshold, setLateThreshold] = useState(15);
  const [latePoints, setLatePoints] = useState(5);

  // Scan marking inputs
  const [scanMemberId, setScanMemberId] = useState("");
  const [scanMethod, setScanMethod] = useState("manual");
  const [scanRemarks, setScanRemarks] = useState("");

  const [attendanceMode, setAttendanceMode] = useState<"live" | "late">("live");
  const [activeAttendanceSession, setActiveAttendanceSession] = useState<AttendanceSessionSelect | null>(null);
  const [checkedMemberIds, setCheckedMemberIds] = useState<Set<string>>(new Set());
  const [attendanceSearch, setAttendanceSearch] = useState("");

  const handleOpenAttendanceScreen = (session: AttendanceSessionSelect) => {
    setActiveAttendanceSession(session);
    const existingForSession = new Set(
      records.filter((r) => r.sessionId === session.id).map((r) => r.memberId)
    );
    setCheckedMemberIds(existingForSession);
  };

  const toggleMemberCheck = (memberId: string) => {
    setCheckedMemberIds((prev) => {
      const next = new Set(prev);
      if (next.has(memberId)) {
        next.delete(memberId);
      } else {
        next.add(memberId);
      }
      return next;
    });
  };

  const handleSaveBulkAttendance = async () => {
    if (!activeAttendanceSession) return;
    startTransition(async () => {
      const res = await bulkRecordAttendanceAction(
        activeAttendanceSession.id,
        Array.from(checkedMemberIds)
      );

      if (res.success) {
        setAlertMessage(`Attendance Saved Successfully for ${activeAttendanceSession.title}!`);
        refreshSessionsAndRecords();
      } else {
        alert(res.error?.message || "Failed to save attendance");
      }
    });
  };

  const sortedEnrolledMembers = useMemo(() => {
    return sortMembersByClubMembershipId(enrolledMembers);
  }, [enrolledMembers]);

  const filteredEnrolledMembers = useMemo(() => {
    return sortedEnrolledMembers.filter((m) => {
      if (!attendanceSearch.trim()) return true;
      const q = attendanceSearch.toLowerCase();
      const name = (m.name || "").toLowerCase();
      const roll = (m.rollNumber || "").toLowerCase();
      const clubId = (m.clubMembershipId || "").toLowerCase();
      const memId = (m.memberId || "").toLowerCase();

      return name.includes(q) || roll.includes(q) || clubId.includes(q) || memId.includes(q);
    });
  }, [sortedEnrolledMembers, attendanceSearch]);

  const handleCreateSession = async (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      const status = attendanceMode === "live" ? "upcoming" : "completed";
      const payload: any = {
        title,
        date: new Date(dateVal).toISOString(),
        attendancePoints: points,
        status,
      };

      if (attendanceMode === "live") {
        payload.startTime = `${startTime}:00`;
        payload.endTime = `${endTime}:00`;
        payload.lateThreshold = lateThreshold;
        payload.latePoints = latePoints;
      } else {
        payload.startTime = "00:00:00";
        payload.endTime = "23:59:59";
      }

      const res = await createAttendanceSessionAction(payload);

      if (res.success && res.data) {
        setIsCreateOpen(false);
        setTitle("");
        setAlertMessage(
          attendanceMode === "live"
            ? `Upcoming Live Attendance session '${res.data.title}' created.`
            : `Late Attendance session '${res.data.title}' created. Ready for attendance recording!`
        );
        refreshSessionsAndRecords();

        // Phase 2: Late Attendance auto-navigates immediately to Take Attendance Screen without PIN/Volunteer prompts
        if (attendanceMode === "late") {
          handleOpenAttendanceScreen(res.data);
        }
      } else {
        alert(res.error?.message || "Failed to create session");
      }
    });
  };

  const handleOpenSession = async (id: string) => {
    startTransition(async () => {
      const res = await openAttendanceSessionAction(id);
      if (res.success) {
        setAlertMessage("Attendance session opened and activated for tracking!");
        refreshSessionsAndRecords();
      } else {
        alert(res.error?.message || "Failed to open session");
      }
    });
  };

  const handlePauseSession = async (id: string) => {
    startTransition(async () => {
      const res = await pauseAttendanceSessionAction(id);
      if (res.success) {
        setAlertMessage("Attendance session tracking paused.");
        refreshSessionsAndRecords();
      } else {
        alert(res.error?.message || "Failed to pause session");
      }
    });
  };

  const handleCloseSession = async (id: string) => {
    startTransition(async () => {
      const res = await closeAttendanceSessionAction(id);
      if (res.success) {
        setAlertMessage("Attendance session finalized and closed.");
        refreshSessionsAndRecords();
      } else {
        alert(res.error?.message || "Failed to close session");
      }
    });
  };

  const handleManagePINs = async (session: AttendanceSessionSelect) => {
    setSelectedSession(session);
    setIsPinsModalOpen(true);
    startTransition(async () => {
      const res = await getSessionVolunteerCodesAction(session.id);
      if (res.success && res.data) {
        setSessionPins(res.data);
      }
    });
  };

  const [pinExpirationHours, setPinExpirationHours] = useState<number>(1);

  const handleGeneratePIN = async (sessionId: string) => {
    startTransition(async () => {
      const res = await generateVolunteerCodeAction({
        sessionId,
        expirationHours: pinExpirationHours,
      });

      if (res.success && res.data) {
        alert(`Volunteer PIN Generated: ${res.data.code}`);
        if (selectedSession) {
          handleManagePINs(selectedSession);
        }
      } else {
        alert(res.error?.message || "Failed to generate PIN");
      }
    });
  };

  const handleEndPIN = async (codeId: string) => {
    startTransition(async () => {
      const res = await endVolunteerCodeAction(codeId);
      if (res.success) {
        if (selectedSession) {
          handleManagePINs(selectedSession);
        }
      } else {
        alert(res.error?.message || "Failed to terminate PIN");
      }
    });
  };

  const handleAuthenticateVolunteer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSession) return;

    startTransition(async () => {
      const res = await validateVolunteerCodeAction({
        code: volunteerPIN,
      });

      if (res.success && res.data) {
        setAuthenticatedSessionId(selectedSession.id);
        setIsAuthOpen(false);
        setVolunteerPIN("");
        alert("Volunteer Authenticated Successfully for live tracking!");
      } else {
        alert(res.error?.message || "Invalid or Expired Volunteer Code");
      }
    });
  };

  const handleMarkAttendance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authenticatedSessionId) {
      alert("Please authenticate using volunteer PIN before recording scans.");
      return;
    }

    startTransition(async () => {
      const res = await recordAttendanceAction({
        memberId: scanMemberId,
        sessionId: authenticatedSessionId,
        method: scanMethod,
        remarks: scanRemarks || undefined,
      });

      if (res.success) {
        alert("Attendance scanned and registered successfully!");
        setScanMemberId("");
        setScanRemarks("");
        refreshSessionsAndRecords();
      } else {
        alert(res.error?.message || "Check-in failed");
      }
    });
  };

  const handleExportCsv = async (sessionId?: string) => {
    startTransition(async () => {
      const res = await exportAttendanceRecordsCsvAction(sessionId);
      if (res.success && res.data) {
        const blob = new Blob([res.data.csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", res.data.filename);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        alert(res.error?.message || "Failed to export CSV");
      }
    });
  };

  // ── Phase 2 Guard: No Active Semester ──────────────────────────────────────
  if (semesterContext && !semesterContext.isOperationAllowed) {
    return (
      <div className="rounded-2xl border border-amber-800/40 bg-amber-950/20 p-8 text-amber-300 space-y-4 max-w-xl mx-auto my-12 text-center shadow-lg">
        <div className="flex justify-center">
          <AlertTriangle className="h-12 w-12 text-amber-400" />
        </div>
        <h2 className="text-xl font-bold text-amber-200">No Active Semester</h2>
        <p className="text-sm text-muted-foreground">
          Attendance is unavailable until a semester is activated.
        </p>
        <div className="pt-2">
          <Link href="/dashboard/semesters">
            <Button variant="outline" className="text-xs border-amber-700/60 text-amber-300 hover:bg-amber-900/40">
              Go to Semester Management
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  // ── Phase 3 Guard: Active Semester exists but 0 Members Enrolled ───────────
  if (semesterContext && semesterContext.isOperationAllowed && enrolledMembers.length === 0) {
    return (
      <div className="rounded-2xl border border-amber-800/40 bg-amber-950/20 p-8 text-amber-300 space-y-4 max-w-xl mx-auto my-12 text-center shadow-lg">
        <div className="flex justify-center">
          <AlertTriangle className="h-12 w-12 text-amber-400" />
        </div>
        <h2 className="text-xl font-bold text-amber-200">
          Active Semester: {semesterContext.activeSemester?.name}
        </h2>
        <p className="text-sm text-muted-foreground">
          No members are enrolled in the active semester.
        </p>
        <div className="pt-2">
          <Link href="/dashboard/semesters">
            <Button variant="outline" className="text-xs border-amber-700/60 text-amber-300 hover:bg-amber-900/40">
              Go to Semester Management → Member Enrollment
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 text-left">
      {/* Top Header Navigation Tabs matching Screenshot 1 */}
      <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0 border-b border-border/60 pb-4">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setActiveTab("admin")}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition-colors ${
              activeTab === "admin"
                ? "bg-blue-950/80 text-blue-400 border border-blue-800/60 shadow-sm"
                : "text-muted-foreground hover:bg-card hover:text-foreground"
            }`}
          >
            <CheckCircle2 className="h-4 w-4" />
            <span>Attendance Management (Admin)</span>
          </button>

          <button
            onClick={() => setActiveTab("history")}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition-colors ${
              activeTab === "history"
                ? "bg-blue-950/80 text-blue-400 border border-blue-800/60 shadow-sm"
                : "text-muted-foreground hover:bg-card hover:text-foreground"
            }`}
          >
            <History className="h-4 w-4" />
            <span>Attendance History & Reports</span>
          </button>
        </div>

        <Link href="/volunteer" target="_blank">
          <Button className="flex items-center space-x-2 text-xs bg-blue-600 hover:bg-blue-500 text-white rounded-xl shadow-md">
            <span>Open Volunteer Portal Interface</span>
            <ExternalLink className="h-3.5 w-3.5" />
          </Button>
        </Link>
      </div>

      {/* Dismissible Alert Banner matching Screenshot 1 */}
      {alertMessage && (
        <div className="rounded-xl border border-emerald-800/50 bg-emerald-950/40 p-3.5 text-emerald-400 flex items-center justify-between text-xs shadow-sm">
          <div className="flex items-center space-x-2 font-medium">
            <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
            <span>{alertMessage}</span>
          </div>
          <button onClick={() => setAlertMessage(null)} className="text-emerald-400 hover:text-emerald-200">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Phase 3 Reusable Attendance Screen */}
      {activeAttendanceSession ? (
        <div className="space-y-6 rounded-2xl border border-border bg-card p-6 shadow-sm">
          {/* Top Bar Header */}
          <div className="flex flex-col space-y-3 sm:flex-row sm:items-center sm:justify-between sm:space-y-0 border-b border-border/60 pb-4">
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setActiveAttendanceSession(null)}
                  className="text-xs h-7 px-2 flex items-center space-x-1"
                >
                  <span>← Back to Sessions</span>
                </Button>
                <Badge variant={activeAttendanceSession.status === "active" ? "success" : "secondary"} className="text-xs uppercase font-bold">
                  {activeAttendanceSession.status === "active" ? "Live Session" : activeAttendanceSession.status === "completed" ? "Late / Completed" : activeAttendanceSession.status}
                </Badge>
              </div>
              <h2 className="text-xl font-bold text-foreground">{activeAttendanceSession.title}</h2>
              <p className="text-xs text-muted-foreground">
                Session Date: {new Date(activeAttendanceSession.date).toLocaleDateString()} • Awarded Points: {activeAttendanceSession.attendancePoints} Pts
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleExportCsv(activeAttendanceSession.id)}
                disabled={isPending}
                className="text-xs h-8 flex items-center space-x-1"
              >
                <Download className="h-3.5 w-3.5" />
                <span>Export Session CSV</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCheckedMemberIds(new Set(enrolledMembers.map((m) => m.id)))}
                className="text-xs h-8"
              >
                Select All
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCheckedMemberIds(new Set())}
                className="text-xs h-8"
              >
                Deselect All
              </Button>
              <Button
                onClick={handleSaveBulkAttendance}
                disabled={isPending}
                className="text-xs h-8 bg-blue-600 hover:bg-blue-500 text-white font-bold px-4"
              >
                {isPending ? "Saving..." : "Save Attendance"}
              </Button>
            </div>
          </div>

          {/* Smart Search Bar & Progress Indicators */}
          <div className="grid gap-4 md:grid-cols-4">
            <div className="md:col-span-2 space-y-1">
              <label className="text-xs font-semibold text-foreground">Search Enrolled Members</label>
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  value={attendanceSearch}
                  placeholder="Search by Name, Roll No, or Member ID..."
                  onChange={(e) => setAttendanceSearch(e.target.value)}
                  className="w-full rounded-xl border border-input bg-background pl-9 pr-4 py-2 text-xs"
                />
              </div>
            </div>

            <div className="rounded-xl border border-emerald-800/40 bg-emerald-950/20 p-3 flex flex-col justify-between">
              <div className="text-[11px] font-semibold text-emerald-400">Present Count</div>
              <div className="text-xl font-bold text-emerald-300">
                {checkedMemberIds.size} <span className="text-xs text-muted-foreground font-normal">/ {enrolledMembers.length}</span>
              </div>
            </div>

            <div className="rounded-xl border border-amber-800/40 bg-amber-950/20 p-3 flex flex-col justify-between">
              <div className="flex justify-between items-center text-[11px] font-semibold text-amber-400">
                <span>Absent Count</span>
                <span>{enrolledMembers.length === 0 ? 0 : Math.round((checkedMemberIds.size / enrolledMembers.length) * 100)}% Complete</span>
              </div>
              <div className="text-xl font-bold text-amber-300">
                {enrolledMembers.length - checkedMemberIds.size} <span className="text-xs text-muted-foreground font-normal">Absent</span>
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-muted/40 h-2 rounded-full overflow-hidden">
            <div
              className="bg-blue-600 h-full transition-all duration-300"
              style={{
                width: `${enrolledMembers.length === 0 ? 0 : (checkedMemberIds.size / enrolledMembers.length) * 100}%`,
              }}
            />
          </div>

          {/* Enrolled Active Semester Member Checklist Table */}
          <div className="overflow-x-auto rounded-xl border border-border/60">
            <table className="w-full text-left text-xs text-foreground whitespace-nowrap">
              <thead className="border-b border-border bg-muted/40 font-semibold uppercase tracking-wider text-[11px] text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 text-center w-12">Present</th>
                  <th className="px-4 py-3">Member ID</th>
                  <th className="px-4 py-3">Roll Number</th>
                  <th className="px-4 py-3">Full Name</th>
                  <th className="px-4 py-3">Email / Contact</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {filteredEnrolledMembers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                      No matching enrolled members found for &quot;{attendanceSearch}&quot;.
                    </td>
                  </tr>
                ) : (
                  filteredEnrolledMembers.map((m) => {
                    const isChecked = checkedMemberIds.has(m.id);
                    return (
                      <tr
                        key={m.id}
                        onClick={() => toggleMemberCheck(m.id)}
                        className={`cursor-pointer transition-colors ${
                          isChecked ? "bg-emerald-950/20 hover:bg-emerald-950/30" : "hover:bg-accent/40"
                        }`}
                      >
                        <td className="px-4 py-3 text-center" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => toggleMemberCheck(m.id)}
                            className="h-4 w-4 rounded border-input text-blue-600 focus:ring-blue-500 cursor-pointer"
                          />
                        </td>
                        <td className="px-4 py-3 font-mono text-xs font-semibold">{m.memberId || m.clubMembershipId || m.id.substring(0, 8)}</td>
                        <td className="px-4 py-3 font-mono text-xs">{m.rollNumber || "N/A"}</td>
                        <td className="px-4 py-3 font-semibold">{m.name}</td>
                        <td className="px-4 py-3 text-muted-foreground">{m.email || m.phone || "N/A"}</td>
                        <td className="px-4 py-3">
                          <Badge variant={isChecked ? "success" : "secondary"} className="text-[10px]">
                            {isChecked ? "Present" : "Absent"}
                          </Badge>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <div className="flex justify-end pt-2">
            <Button
              onClick={handleSaveBulkAttendance}
              disabled={isPending}
              className="text-xs bg-blue-600 hover:bg-blue-500 text-white font-bold px-6 py-2 rounded-xl shadow-md"
            >
              {isPending ? "Saving Attendance..." : `Save Attendance (${checkedMemberIds.size} Present)`}
            </Button>
          </div>
        </div>
      ) : activeTab === "admin" ? (
        <div className="space-y-6">
          {/* Section Header Controls Bar */}
          <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
            <div>
              <h2 className="text-lg font-bold text-foreground">
                Attendance Sessions & Volunteer Activation
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Manage active club sessions, generate persistent PINs, and monitor live attendance
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleExportCsv()}
                disabled={isPending}
                className="flex items-center space-x-1.5 text-xs"
              >
                <Download className="h-3.5 w-3.5" />
                <span>Export CSV</span>
              </Button>

              <Button
                variant="outline"
                size="icon"
                onClick={refreshSessionsAndRecords}
                disabled={isPending}
                className="h-8 w-8"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${isPending ? "animate-spin" : ""}`} />
              </Button>

              <Button
                size="sm"
                onClick={() => setIsCreateOpen(true)}
                className="flex items-center space-x-1.5 text-xs bg-blue-600 hover:bg-blue-500 text-white"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Create Session</span>
              </Button>
            </div>
          </div>

          {/* Grid of Session Cards matching Screenshot 1 */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {sessions.map((session) => {
              const liveScansCount = records.filter((r) => r.sessionId === session.id).length;
              return (
                <div
                  key={session.id}
                  className="rounded-2xl border border-border bg-card p-5 shadow-sm space-y-4 relative overflow-hidden flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex justify-between items-start">
                      <div className="pr-2">
                        <h4 className="font-bold text-foreground text-sm line-clamp-1">
                          {session.title}
                        </h4>
                        <p className="text-[11px] text-muted-foreground mt-1 flex items-center space-x-2">
                          <Clock className="h-3 w-3 shrink-0" />
                          <span>
                            {new Date(session.date).toLocaleDateString("en-GB", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            })}{" "}
                            • {session.startTime} - {session.endTime}
                          </span>
                        </p>
                      </div>

                      {/* Status Badge Pills */}
                      <Badge
                        className={`capitalize text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                          session.status === "active"
                            ? "bg-emerald-950/80 text-emerald-400 border-emerald-800/60"
                            : session.status === "paused"
                            ? "bg-amber-950/80 text-amber-400 border-amber-800/60"
                            : session.status === "closed"
                            ? "bg-slate-900 text-slate-300 border-slate-700"
                            : "bg-slate-800 text-slate-400 border-slate-700"
                        }`}
                      >
                        {session.status}
                      </Badge>
                    </div>

                    <div className="flex justify-between items-center text-xs text-muted-foreground pt-1">
                      <span className="font-bold text-blue-400 flex items-center space-x-1">
                        <Ribbon className="h-3.5 w-3.5 text-blue-400" />
                        <span>{session.attendancePoints} Pts</span>
                      </span>

                      <span className="flex items-center space-x-1 text-slate-300 font-mono text-[11px]">
                        <Users className="h-3.5 w-3.5 text-slate-400" />
                        <span>{liveScansCount} Live Scans</span>
                      </span>
                    </div>
                  </div>

                  {/* Session Action Controls matching Screenshot 1 */}
                  <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-border/40">
                    {session.status === "draft" && (
                      <Button
                        size="sm"
                        className="text-[11px] h-8 flex items-center space-x-1.5 bg-emerald-600 hover:bg-emerald-500 text-white w-full"
                        onClick={() => handleOpenSession(session.id)}
                      >
                        <Play className="h-3.5 w-3.5" /> <span>Start Session</span>
                      </Button>
                    )}

                    {session.status === "active" && (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={isPending}
                          className="text-[11px] h-8 flex items-center space-x-1.5"
                          onClick={() => handlePauseSession(session.id)}
                        >
                          <Pause className="h-3.5 w-3.5" /> <span>Pause</span>
                        </Button>

                        <Button
                          size="sm"
                          variant="destructive"
                          disabled={isPending}
                          className="text-[11px] h-8 flex items-center space-x-1.5 bg-red-600/90 hover:bg-red-600"
                          onClick={() => handleCloseSession(session.id)}
                        >
                          <StopCircle className="h-3.5 w-3.5" /> <span>Close</span>
                        </Button>

                        <Button
                          size="sm"
                          variant="outline"
                          disabled={isPending}
                          className="text-[11px] h-8 flex items-center space-x-1.5"
                          onClick={() => handleManagePINs(session)}
                        >
                          <Key className="h-3.5 w-3.5 text-primary" /> <span>Manage PINs</span>
                        </Button>

                        <Button
                          size="sm"
                          disabled={isPending}
                          className="text-[11px] h-8 flex items-center space-x-1.5 bg-indigo-600 hover:bg-indigo-500 text-white"
                          onClick={() => handleOpenAttendanceScreen(session)}
                        >
                          <UserCheck className="h-3.5 w-3.5" /> <span>Take Attendance</span>
                        </Button>

                        <Button
                          size="sm"
                          disabled={isPending}
                          className="text-[11px] h-8 flex items-center space-x-1.5 bg-blue-600 hover:bg-blue-500 text-white"
                          onClick={() => {
                            setSelectedSession(session);
                            setIsAuthOpen(true);
                          }}
                        >
                          <Key className="h-3.5 w-3.5" /> <span>Authenticate</span>
                        </Button>
                      </>
                    )}

                    {session.status === "completed" && (
                      <Button
                        size="sm"
                        className="text-[11px] h-8 flex items-center space-x-1.5 bg-indigo-600 hover:bg-indigo-500 text-white w-full"
                        onClick={() => handleOpenAttendanceScreen(session)}
                      >
                        <UserCheck className="h-3.5 w-3.5" /> <span>Take / Edit Attendance</span>
                      </Button>
                    )}

                    {session.status === "paused" && (
                      <Button
                        size="sm"
                        className="text-[11px] h-8 flex items-center space-x-1.5 bg-emerald-600 hover:bg-emerald-500 text-white w-full"
                        onClick={() => handleOpenSession(session.id)}
                      >
                        <Play className="h-3.5 w-3.5" /> <span>Resume Session</span>
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Interactive Scan Attendance Checkin Form */}
          {authenticatedSessionId && (
            <div className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-4 mt-6">
              <div className="flex items-center space-x-2 border-b border-border pb-3">
                <QrCode className="h-5 w-5 text-primary" />
                <h3 className="font-semibold text-foreground text-sm">Volunteer Scanner Interface</h3>
              </div>

              <form onSubmit={handleMarkAttendance} className="grid gap-4 sm:grid-cols-3 items-end">
                <div className="space-y-1">
                  <label className="text-xs font-semibold">Member Roll Number / UUID</label>
                  <input
                    type="text"
                    required
                    value={scanMemberId}
                    placeholder="Enter Member ID..."
                    onChange={(e) => setScanMemberId(e.target.value)}
                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold">Remarks (Optional)</label>
                  <input
                    type="text"
                    value={scanRemarks}
                    placeholder="e.g. Late arrival verified"
                    onChange={(e) => setScanRemarks(e.target.value)}
                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                  />
                </div>
                <Button type="submit" disabled={isPending}>
                  {isPending ? "Logging checkin..." : "Submit Scan Record"}
                </Button>
              </form>
            </div>
          )}
        </div>
      ) : (
        /* Attendance History & Reports View */
        <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm space-y-4 p-6">
          <div className="flex justify-between items-center border-b border-border pb-4">
            <div>
              <h3 className="text-base font-bold text-foreground">Scanned Records Activity Ledger</h3>
              <p className="text-xs text-muted-foreground">Historical attendance entries across all sessions</p>
            </div>
            <Badge variant="outline" className="text-xs font-mono">{records.length} Scanned Records</Badge>
          </div>

          <div className="overflow-x-auto rounded-xl border border-border/60">
            <table className="w-full text-left text-xs text-foreground whitespace-nowrap">
              <thead className="border-b border-border bg-muted/40 font-semibold uppercase tracking-wider text-[11px] text-muted-foreground">
                <tr>
                  <th className="px-4 py-3">SESSION TITLE</th>
                  <th className="px-4 py-3">MEMBER NAME</th>
                  <th className="px-4 py-3">MEMBERSHIP ID</th>
                  <th className="px-4 py-3">ROLL NUMBER</th>
                  <th className="px-4 py-3">POINTS EARNED</th>
                  <th className="px-4 py-3">LATE STATUS</th>
                  <th className="px-4 py-3">SCAN METHOD</th>
                  <th className="px-4 py-3">TIMESTAMP</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {records.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">
                      No attendance records logged yet.
                    </td>
                  </tr>
                ) : (
                  records.map((rec: any) => (
                    <tr key={rec.id} className="hover:bg-accent/40 transition-colors">
                      <td className="px-4 py-3 font-semibold text-foreground">{rec.sessionTitle || "Attendance Session"}</td>
                      <td className="px-4 py-3 font-medium text-blue-300">{rec.memberName || "Member"}</td>
                      <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{rec.membershipId || "—"}</td>
                      <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{rec.rollNumber || "—"}</td>
                      <td className="px-4 py-3 font-bold text-emerald-400">{rec.points || 0} Pts</td>
                      <td className="px-4 py-3">
                        <Badge variant={rec.late ? "destructive" : "success"} className="text-[10px]">
                          {rec.late ? "Late" : "On Time"}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 capitalize text-xs text-muted-foreground">{rec.method || "Manual"}</td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">
                        {rec.scanTime ? new Date(rec.scanTime).toLocaleString("en-IN") : "—"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create Session Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="text-lg font-bold text-foreground">Create Attendance Session</h3>
              <Button variant="ghost" size="icon" onClick={() => setIsCreateOpen(false)}>
                <X className="h-5 w-5" />
              </Button>
            </div>

            {/* Attendance Mode Selector */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-foreground uppercase tracking-wide">Attendance Mode</label>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <label
                  className={`flex flex-col p-3 rounded-xl border cursor-pointer transition-all ${
                    attendanceMode === "live"
                      ? "border-primary bg-primary/10 text-primary font-semibold shadow-sm"
                      : "border-border bg-background text-muted-foreground hover:border-primary/50"
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <input
                      type="radio"
                      name="attendanceMode"
                      value="live"
                      checked={attendanceMode === "live"}
                      onChange={() => setAttendanceMode("live")}
                      className="text-primary focus:ring-primary"
                    />
                    <span>Live Attendance</span>
                  </div>
                  <span className="text-[10px] text-muted-foreground mt-1 font-normal">
                    Real-time tracking during event using volunteers/PIN.
                  </span>
                </label>

                <label
                  className={`flex flex-col p-3 rounded-xl border cursor-pointer transition-all ${
                    attendanceMode === "late"
                      ? "border-primary bg-primary/10 text-primary font-semibold shadow-sm"
                      : "border-border bg-background text-muted-foreground hover:border-primary/50"
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <input
                      type="radio"
                      name="attendanceMode"
                      value="late"
                      checked={attendanceMode === "late"}
                      onChange={() => setAttendanceMode("late")}
                      className="text-primary focus:ring-primary"
                    />
                    <span>Late Attendance</span>
                  </div>
                  <span className="text-[10px] text-muted-foreground mt-1 font-normal">
                    Entered afterward for missed or paper-based sessions.
                  </span>
                </label>
              </div>
            </div>

            <form onSubmit={handleCreateSession} className="space-y-4 text-left">
              <div className="space-y-1">
                <label className="text-xs font-semibold">Session Title</label>
                <input
                  type="text"
                  required
                  value={title}
                  placeholder="e.g. Autonomous Navigation Lab"
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold">
                  {attendanceMode === "live" ? "Session Date (Today or Future)" : "Attendance Date"}
                </label>
                <input
                  type="date"
                  required
                  value={dateVal}
                  min={attendanceMode === "live" ? new Date().toISOString().split("T")[0] : semesterContext?.activeSemester?.startDate ? new Date(semesterContext.activeSemester.startDate).toISOString().split("T")[0] : undefined}
                  max={attendanceMode === "late" && semesterContext?.activeSemester?.endDate ? new Date(semesterContext.activeSemester.endDate).toISOString().split("T")[0] : undefined}
                  onChange={(e) => setDateVal(e.target.value)}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                />
              </div>

              {attendanceMode === "live" && (
                <>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-1">
                      <label className="text-xs font-semibold">Start Time</label>
                      <input
                        type="time"
                        required
                        value={startTime}
                        onChange={(e) => setStartTime(e.target.value)}
                        className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-semibold">End Time</label>
                      <input
                        type="time"
                        required
                        value={endTime}
                        onChange={(e) => setEndTime(e.target.value)}
                        className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                      />
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-3">
                    <div className="space-y-1">
                      <label className="text-xs font-semibold">Points</label>
                      <input
                        type="number"
                        value={points}
                        onChange={(e) => setPoints(Number(e.target.value))}
                        className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-semibold">Late Threshold (Min)</label>
                      <input
                        type="number"
                        value={lateThreshold}
                        onChange={(e) => setLateThreshold(Number(e.target.value))}
                        className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-semibold">Late Pts</label>
                      <input
                        type="number"
                        value={latePoints}
                        onChange={(e) => setLatePoints(Number(e.target.value))}
                        className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                      />
                    </div>
                  </div>
                </>
              )}

              {attendanceMode === "late" && (
                <div className="space-y-1">
                  <label className="text-xs font-semibold">Points Awarded</label>
                  <input
                    type="number"
                    value={points}
                    onChange={(e) => setPoints(Number(e.target.value))}
                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                  />
                </div>
              )}

              <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 text-white" disabled={isPending}>
                {isPending ? "Saving..." : attendanceMode === "live" ? "Create Live Session" : "Create Late Session"}
              </Button>
            </form>
          </div>
        </div>
      )}

      {/* Volunteer Auth Modal */}
      {isAuthOpen && selectedSession && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="text-lg font-bold text-foreground font-sans">Volunteer Verification</h3>
              <Button variant="ghost" size="icon" onClick={() => setIsAuthOpen(false)}>
                <X className="h-5 w-5" />
              </Button>
            </div>

            <form onSubmit={handleAuthenticateVolunteer} className="space-y-4 text-left">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-foreground">Volunteer Session PIN</label>
                <input
                  type="text"
                  required
                  value={volunteerPIN}
                  placeholder="Enter session code or PIN..."
                  onChange={(e) => setVolunteerPIN(e.target.value)}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm"
                />
              </div>

              <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 text-white" disabled={isPending}>
                {isPending ? "Validating PIN..." : "Authenticate PIN"}
              </Button>
            </form>
          </div>
        </div>
      )}

      {/* Manage PINs Modal */}
      {isPinsModalOpen && selectedSession && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div>
                <h3 className="text-base font-bold text-foreground">Volunteer PIN Management</h3>
                <p className="text-xs text-muted-foreground">{selectedSession.title}</p>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setIsPinsModalOpen(false)}>
                <X className="h-5 w-5" />
              </Button>
            </div>

            <div className="space-y-3">
              <div className="flex items-center space-x-2 bg-muted/20 p-2.5 rounded-xl border border-border/60">
                <div className="flex-1">
                  <label className="text-[11px] font-semibold text-muted-foreground block mb-1">Time Limit / Expiration</label>
                  <select
                    value={pinExpirationHours}
                    onChange={(e) => setPinExpirationHours(Number(e.target.value))}
                    className="w-full rounded-lg border border-input bg-background px-2.5 py-1.5 text-xs font-bold text-foreground focus:outline-none"
                  >
                    <option value={0.5}>30 Minutes</option>
                    <option value={1}>1 Hour (Default)</option>
                    <option value={2}>2 Hours</option>
                    <option value={4}>4 Hours</option>
                    <option value={876000}>No Limit (Permanent)</option>
                  </select>
                </div>

                <Button
                  size="sm"
                  onClick={() => handleGeneratePIN(selectedSession.id)}
                  disabled={isPending}
                  className="bg-blue-600 hover:bg-blue-500 text-white text-xs self-end h-8 px-3 rounded-lg"
                >
                  + Generate PIN
                </Button>
              </div>

              <div className="space-y-2 max-h-60 overflow-y-auto pt-2">
                {sessionPins.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-4">No active PINs generated for this session yet.</p>
                ) : (
                  sessionPins.map((pin) => (
                    <div key={pin.id} className="flex justify-between items-center p-3 rounded-lg border border-border bg-background/50 text-xs">
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-mono font-bold text-blue-400 text-sm tracking-wider">{pin.code}</span>
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText(pin.code);
                              alert(`Volunteer PIN ${pin.code} copied to clipboard!`);
                            }}
                            className="p-1 rounded hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
                            title="Copy PIN Code"
                          >
                            <Copy className="h-3.5 w-3.5" />
                          </button>
                        </div>
                        <p className="text-[10px] text-muted-foreground mt-0.5">Status: {pin.status}</p>
                      </div>
                      {pin.status === "active" && (
                        <Button
                          size="sm"
                          variant="destructive"
                          className="h-7 text-[10px]"
                          onClick={() => handleEndPIN(pin.id)}
                        >
                          End PIN
                        </Button>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
