import { supabase } from "@/db";
import { logger } from "@/core/logger";
import { normalizeBranch } from "@/constants/branches";

export interface AttendanceRegisterRow {
  sessionTitle: string;
  date: string;
  memberName: string;
  membershipId: string;
  rollNumber: string;
  branch: string;
  year: number;
  status: "Present" | "Absent" | "Late";
  lateMinutes: number;
  pointsAwarded: number;
  isVolunteer: boolean;
  method: string;
  scanTime: string;
}

export interface AttendanceSummaryData {
  totalSessions: number;
  avgAttendancePct: number;
  highestAttendanceSession: string;
  lowestAttendanceSession: string;
  presentCount: number;
  lateCount: number;
  absentCount: number;
  totalPointsDistributed: number;
  rows: Array<{
    memberId: string;
    memberName: string;
    membershipId: string;
    branch: string;
    year: number;
    sessionsAttended: number;
    attendancePct: number;
    rank: number;
  }>;
}

export interface LowAttendanceRow {
  memberId: string;
  memberName: string;
  membershipId: string;
  branch: string;
  year: number;
  attendancePct: number;
  presentCount: number;
  absentCount: number;
  recommendation: "Academic Warning" | "Counseling Required" | "Notice Issued";
}

export interface PerfectAttendanceRow {
  memberId: string;
  memberName: string;
  membershipId: string;
  branch: string;
  year: number;
  sessionsAttended: number;
  attendancePct: number;
}

export interface SemesterAttendanceSummaryData {
  semesterName: string;
  academicYear: string;
  totalMembers: number;
  totalSessions: number;
  overallAttendancePct: number;
  attendanceTrend: string;
  sessionBreakdown: Array<{
    title: string;
    date: string;
    presentCount: number;
    attendancePct: number;
  }>;
}

export class AttendanceReportService {

  /**
   * 1. Attendance Register Report — Live Database Query
   */
  public async getAttendanceRegisterReport(filters: any = {}): Promise<AttendanceRegisterRow[]> {
    logger.info("[AttendanceReportService] Generating Attendance Register Report from live database");

    // Query live attendance records joined with sessions and members
    const { data: recs, error } = await supabase
      .from("attendance_records")
      .select("id, session_id, member_id, late, points, method, scan_time, volunteer_user, attendance_sessions(title, date), members(name, club_membership_id, member_id, roll_number, branch, year, status)")
      .order("scan_time", { ascending: false });

    if (error) {
      logger.error("[AttendanceReportService] Failed to query attendance_records", error);
      return [];
    }

    if (!recs || recs.length === 0) {
      return [];
    }

    let rows: AttendanceRegisterRow[] = recs.map((r: any) => {
      const sess = Array.isArray(r.attendance_sessions) ? r.attendance_sessions[0] : r.attendance_sessions;
      const mem = Array.isArray(r.members) ? r.members[0] : r.members;

      const dateStr = sess?.date ? new Date(sess.date).toISOString().split("T")[0] : "N/A";
      const scanTimeStr = r.scan_time ? new Date(r.scan_time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "N/A";

      return {
        sessionTitle: sess?.title || "Attendance Session",
        date: dateStr,
        memberName: mem?.name || "Member",
        membershipId: mem?.club_membership_id || mem?.member_id || "SAC-RC-0000",
        rollNumber: mem?.roll_number || "N/A",
        branch: normalizeBranch(mem?.branch),
        year: mem?.year || 1,
        status: r.late ? "Late" : "Present",
        lateMinutes: r.late ? 15 : 0,
        pointsAwarded: r.points !== undefined && r.points !== null ? r.points : (r.late ? 5 : 10),
        isVolunteer: Boolean(r.volunteer_user),
        method: r.method ? r.method.toUpperCase() : "QR",
        scanTime: scanTimeStr,
      };
    });

    // Apply Client Filter Parameters (Branch, Year) if specified
    if (filters.branch && filters.branch !== "all") {
      rows = rows.filter((r) => r.branch.toLowerCase() === filters.branch.toLowerCase());
    }
    if (filters.year && filters.year !== "all") {
      rows = rows.filter((r) => String(r.year) === String(filters.year));
    }

    return rows;
  }

  /**
   * 2. Attendance Summary Report — Live Calculation & Aggregation
   */
  public async getAttendanceSummaryReport(filters: any = {}): Promise<AttendanceSummaryData> {
    logger.info("[AttendanceReportService] Calculating Attendance Summary Report from live database");

    const [sessRes, memsRes, recsRes] = await Promise.all([
      supabase.from("attendance_sessions").select("id, title, date").is("deleted_at", null),
      supabase.from("members").select("id, name, member_id, club_membership_id, branch, year").eq("status", "active").is("deleted_at", null),
      supabase.from("attendance_records").select("id, session_id, member_id, late, points"),
    ]);

    const sessions = sessRes.data || [];
    let members = memsRes.data || [];
    const records = recsRes.data || [];

    if (filters.branch && filters.branch !== "all") {
      members = members.filter((m: any) => m.branch && m.branch.toLowerCase() === filters.branch.toLowerCase());
    }
    if (filters.year && filters.year !== "all") {
      members = members.filter((m: any) => String(m.year) === String(filters.year));
    }

    const totalSessions = sessions.length;
    if (totalSessions === 0 || members.length === 0) {
      return {
        totalSessions: 0,
        avgAttendancePct: 0,
        highestAttendanceSession: "N/A",
        lowestAttendanceSession: "N/A",
        presentCount: 0,
        lateCount: 0,
        absentCount: 0,
        totalPointsDistributed: 0,
        rows: [],
      };
    }

    // Member attendance map: memberId -> { attendedCount, pointsSum }
    const memberAttendanceMap = new Map<string, { attendedCount: number; pointsSum: number }>();
    const sessionPresentMap = new Map<string, number>();

    let totalPresent = 0;
    let totalLate = 0;
    let totalPoints = 0;

    for (const r of records) {
      totalPoints += r.points || 0;
      if (r.late) totalLate++;
      else totalPresent++;

      // Track member attendance count
      const existing = memberAttendanceMap.get(r.member_id) || { attendedCount: 0, pointsSum: 0 };
      memberAttendanceMap.set(r.member_id, {
        attendedCount: existing.attendedCount + 1,
        pointsSum: existing.pointsSum + (r.points || 0),
      });

      // Track session present count
      const sCount = sessionPresentMap.get(r.session_id) || 0;
      sessionPresentMap.set(r.session_id, sCount + 1);
    }

    // Build Member Rows
    const memberRows = members.map((m: any) => {
      const stat = memberAttendanceMap.get(m.id) || { attendedCount: 0, pointsSum: 0 };
      const attended = Math.min(totalSessions, stat.attendedCount);
      const pct = Math.round((attended / totalSessions) * 100);

      return {
        memberId: m.id,
        memberName: m.name || "Member",
        membershipId: m.club_membership_id || m.member_id || "SAC-RC-0000",
        branch: normalizeBranch(m.branch),
        year: m.year || 1,
        sessionsAttended: attended,
        attendancePct: pct,
        rank: 1, // Calculated after sort
      };
    });

    // Sort member rows by attendancePct descending
    memberRows.sort((a, b) => b.attendancePct - a.attendancePct);
    memberRows.forEach((r, idx) => {
      r.rank = idx + 1;
    });

    // Highest and Lowest Sessions
    let highestSessionTitle = "N/A";
    let highestSessionCount = -1;
    let lowestSessionTitle = "N/A";
    let lowestSessionCount = Infinity;

    for (const s of sessions) {
      const count = sessionPresentMap.get(s.id) || 0;
      const sPct = Math.round((count / Math.max(1, members.length)) * 100);
      if (count > highestSessionCount) {
        highestSessionCount = count;
        highestSessionTitle = `${s.title} (${sPct}%)`;
      }
      if (count < lowestSessionCount) {
        lowestSessionCount = count;
        lowestSessionTitle = `${s.title} (${sPct}%)`;
      }
    }

    const totalPossible = totalSessions * members.length;
    const totalAttended = totalPresent + totalLate;
    const totalAbsent = Math.max(0, totalPossible - totalAttended);
    const avgAttendancePct = totalPossible > 0 ? Math.round((totalAttended / totalPossible) * 100) : 0;

    return {
      totalSessions,
      avgAttendancePct,
      highestAttendanceSession: highestSessionTitle,
      lowestAttendanceSession: lowestSessionTitle === "N/A" ? highestSessionTitle : lowestSessionTitle,
      presentCount: totalPresent,
      lateCount: totalLate,
      absentCount: totalAbsent,
      totalPointsDistributed: totalPoints,
      rows: memberRows,
    };
  }

  /**
   * 3. Low Attendance Warning Report (< threshold %) — Dynamic Recommendations
   */
  public async getLowAttendanceReport(threshold: number = 75): Promise<LowAttendanceRow[]> {
    logger.info(`[AttendanceReportService] Generating Low Attendance Report dynamically for threshold ${threshold}%`);

    const summary = await this.getAttendanceSummaryReport();
    if (summary.totalSessions === 0) {
      return [];
    }

    // Filter members falling strictly below the threshold
    const lowMembers = summary.rows.filter((m) => m.attendancePct < threshold);

    return lowMembers.map((m) => {
      const presentCount = m.sessionsAttended;
      const absentCount = Math.max(0, summary.totalSessions - presentCount);

      // Dynamic recommendation based on actual attendance percentage
      let recommendation: "Academic Warning" | "Counseling Required" | "Notice Issued" = "Academic Warning";
      if (m.attendancePct < 50) {
        recommendation = "Counseling Required";
      } else if (m.attendancePct < 65) {
        recommendation = "Notice Issued";
      }

      return {
        memberId: m.memberId,
        memberName: m.memberName,
        membershipId: m.membershipId,
        branch: m.branch,
        year: m.year,
        attendancePct: m.attendancePct,
        presentCount,
        absentCount,
        recommendation,
      };
    });
  }

  /**
   * 4. Perfect Attendance Report (Exactly 100%)
   */
  public async getPerfectAttendanceReport(): Promise<PerfectAttendanceRow[]> {
    logger.info("[AttendanceReportService] Querying Perfect Attendance members (100%) from live records");

    const summary = await this.getAttendanceSummaryReport();
    if (summary.totalSessions === 0) {
      return [];
    }

    // Filter members with exactly 100% attendance rate
    const perfectMembers = summary.rows.filter((m) => m.attendancePct === 100 && m.sessionsAttended > 0);

    return perfectMembers.map((m) => ({
      memberId: m.memberId,
      memberName: m.memberName,
      membershipId: m.membershipId,
      branch: m.branch,
      year: m.year,
      sessionsAttended: m.sessionsAttended,
      attendancePct: 100,
    }));
  }

  /**
   * 5. Semester Attendance Summary Report — Live Calculated Trends
   */
  public async getSemesterAttendanceSummary(semesterName: string = "ROBOTICS_B1_2026"): Promise<SemesterAttendanceSummaryData> {
    logger.info(`[AttendanceReportService] Generating Semester Attendance Summary for ${semesterName} from live records`);

    const summary = await this.getAttendanceSummaryReport();

    const { data: sessions } = await supabase
      .from("attendance_sessions")
      .select("id, title, date")
      .is("deleted_at", null)
      .order("date", { ascending: true });

    const { data: recs } = await supabase
      .from("attendance_records")
      .select("session_id, late");

    const sessionPresentMap = new Map<string, number>();
    (recs || []).forEach((r) => {
      const c = sessionPresentMap.get(r.session_id) || 0;
      sessionPresentMap.set(r.session_id, c + 1);
    });

    const totalMembersCount = Math.max(1, summary.rows.length);

    const sessionBreakdown = (sessions || []).map((s: any) => {
      const count = sessionPresentMap.get(s.id) || 0;
      const pct = Math.round((count / totalMembersCount) * 100);
      return {
        title: s.title || "Live Session",
        date: s.date ? new Date(s.date).toISOString().split("T")[0] : "N/A",
        presentCount: count,
        attendancePct: pct,
      };
    });

    // Dynamic Attendance Trend Calculation
    let attendanceTrend = "→ Stable";
    if (sessionBreakdown.length >= 2) {
      const mid = Math.floor(sessionBreakdown.length / 2);
      const firstHalf = sessionBreakdown.slice(0, mid);
      const secondHalf = sessionBreakdown.slice(mid);

      const avgFirst = firstHalf.reduce((sum, s) => sum + s.attendancePct, 0) / Math.max(1, firstHalf.length);
      const avgSecond = secondHalf.reduce((sum, s) => sum + s.attendancePct, 0) / Math.max(1, secondHalf.length);

      const diff = Math.round((avgSecond - avgFirst) * 10) / 10;
      if (diff >= 2.0) {
        attendanceTrend = `↑ Improving (+${diff}%)`;
      } else if (diff <= -2.0) {
        attendanceTrend = `↓ Needs Attention (${diff}%)`;
      }
    }

    return {
      semesterName,
      academicYear: "2025 - 2026",
      totalMembers: summary.rows.length,
      totalSessions: summary.totalSessions,
      overallAttendancePct: summary.avgAttendancePct,
      attendanceTrend,
      sessionBreakdown,
    };
  }
}
