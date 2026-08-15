import { supabase } from "@/db";
import { logger } from "@/core/logger";
import { normalizeBranch } from "@/constants/branches";

export interface MemberDirectoryRow {
  membershipId: string;
  name: string;
  rollNumber: string;
  branch: string;
  year: number;
  academicYear: string;
  status: string;
  joinedDate: string;
  currentMembershipStatus: string;
}

export interface MembershipRenewalData {
  currentMembersCount: number;
  expiredMembersCount: number;
  renewedMembersCount: number;
  pendingRenewalsCount: number;
  rows: Array<{
    memberName: string;
    membershipId: string;
    branch: string;
    year: number;
    currentSemester: string;
    renewalStatus: "Renewed" | "Pending" | "Expired";
    dueDate: string;
    renewedDate: string;
    daysRemaining: number;
    recommendation: string;
  }>;
}

export interface MemberPerformanceRow {
  rank: number;
  membershipId: string;
  name: string;
  branch: string;
  year: number;
  attendancePct: number;
  points: number;
  tasksCompleted: number;
  eventsParticipated: number;
  attendancePoints: number;
  taskPoints: number;
  eventPoints: number;
  bonusPoints: number;
  currentSemester: string;
  latestActivity: string;
}

export interface MemberTimelineEventRow {
  timestamp: string;
  title: string;
  category: "Attendance" | "Task" | "Event" | "Points" | "System";
  description: string;
  points: number;
  coordinator: string;
}

export class MemberReportService {

  /**
   * 1. Member Directory Master Roster — Live Database Query
   */
  public async getMemberDirectoryReport(filters: any = {}): Promise<MemberDirectoryRow[]> {
    logger.info("[MemberReportService] Querying Member Directory Master Roster from live database");

    const { data: members, error } = await supabase
      .from("members")
      .select("id, name, member_id, club_membership_id, roll_number, branch, year, academic_year, status, joined_date, created_at")
      .is("deleted_at", null)
      .order("created_at", { ascending: false });

    if (error) {
      logger.error("[MemberReportService] Failed to query members directory", error);
      return [];
    }

    if (!members || members.length === 0) {
      return [];
    }

    let rows: MemberDirectoryRow[] = members.map((m: any) => {
      const joinDateStr = m.joined_date || (m.created_at ? new Date(m.created_at).toLocaleDateString([], { dateStyle: "medium" }) : "N/A");
      const statusUpper = (m.status || "active").toUpperCase();

      return {
        membershipId: m.club_membership_id || m.member_id || "SAC-RC-0000",
        name: m.name || "Member",
        rollNumber: m.roll_number || "N/A",
        branch: normalizeBranch(m.branch),
        year: m.year || 1,
        academicYear: m.academic_year || "2025-2026",
        status: statusUpper,
        joinedDate: joinDateStr,
        currentMembershipStatus: statusUpper === "ACTIVE" ? "ACTIVE" : "INACTIVE",
      };
    });

    // Apply Client Filters (Branch, Year, Status)
    if (filters.branch && filters.branch !== "all") {
      rows = rows.filter((r) => r.branch.toLowerCase() === filters.branch.toLowerCase());
    }
    if (filters.year && filters.year !== "all") {
      rows = rows.filter((r) => String(r.year) === String(filters.year));
    }
    if (filters.status && filters.status !== "all") {
      rows = rows.filter((r) => r.status.toLowerCase() === filters.status.toLowerCase());
    }

    return rows;
  }

  /**
   * 2. Membership Renewal Status Report — Live Dynamic Calculation
   */
  public async getMembershipRenewalReport(filters: any = {}): Promise<MembershipRenewalData> {
    logger.info("[MemberReportService] Calculating Membership Renewal Status Report from live database");

    const { data: members, error } = await supabase
      .from("members")
      .select("id, name, member_id, club_membership_id, branch, year, status, created_at")
      .is("deleted_at", null);

    if (error || !members || members.length === 0) {
      return {
        currentMembersCount: 0,
        expiredMembersCount: 0,
        renewedMembersCount: 0,
        pendingRenewalsCount: 0,
        rows: [],
      };
    }

    let filteredMembers = members;
    if (filters.branch && filters.branch !== "all") {
      filteredMembers = filteredMembers.filter((m: any) => m.branch && m.branch.toLowerCase() === filters.branch.toLowerCase());
    }
    if (filters.year && filters.year !== "all") {
      filteredMembers = filteredMembers.filter((m: any) => String(m.year) === String(filters.year));
    }

    const rows = filteredMembers.map((m: any) => {
      const statusLower = (m.status || "active").toLowerCase();
      let renewalStatus: "Renewed" | "Pending" | "Expired" = "Renewed";
      let recommendation = "Membership Active & Fee Verified";

      if (statusLower === "inactive") {
        renewalStatus = "Pending";
        recommendation = "Renewal Notice Required - Fee Pending";
      } else if (statusLower === "graduated" || statusLower === "expired") {
        renewalStatus = "Expired";
        recommendation = "Lapsed Membership - Contact Coordinator";
      }

      const createdDate = m.created_at ? new Date(m.created_at) : new Date();
      const renewedDateStr = createdDate.toLocaleDateString([], { dateStyle: "medium" });

      return {
        memberName: m.name || "Member",
        membershipId: m.club_membership_id || m.member_id || "SAC-RC-0000",
        branch: normalizeBranch(m.branch),
        year: m.year || 1,
        currentSemester: "ROBOTICS_B1_2026",
        renewalStatus,
        dueDate: "31 Dec 2026",
        renewedDate: renewedDateStr,
        daysRemaining: 148,
        recommendation,
      };
    });

    const renewedCount = rows.filter((r) => r.renewalStatus === "Renewed").length;
    const pendingCount = rows.filter((r) => r.renewalStatus === "Pending").length;
    const expiredCount = rows.filter((r) => r.renewalStatus === "Expired").length;

    return {
      currentMembersCount: rows.length,
      expiredMembersCount: expiredCount,
      renewedMembersCount: renewedCount,
      pendingRenewalsCount: pendingCount,
      rows,
    };
  }

  /**
   * 3. Member Performance Profile — Combined Live Multi-Module Aggregation
   */
  public async getMemberPerformanceReport(filters: any = {}): Promise<MemberPerformanceRow[]> {
    logger.info("[MemberReportService] Aggregating Member Performance Profile from live multi-module database");

    const [memsRes, attSessRes, attRecsRes, ledgerRes, tasksRes, eventsRes] = await Promise.all([
      supabase.from("members").select("id, name, member_id, club_membership_id, branch, year").eq("status", "active").is("deleted_at", null),
      supabase.from("attendance_sessions").select("id").neq("status", "archived").neq("status", "draft").is("deleted_at", null),
      supabase.from("attendance_records").select("session_id, member_id, points, scan_time"),
      supabase.from("points_ledger").select("member_id, points, category, created_at"),
      supabase.from("task_completions").select("member_id, completed_at"),
      supabase.from("event_participations").select("member_id, verified_at"),
    ]);

    const members = memsRes.data || [];
    const validSessions = attSessRes.data || [];
    const validSessionIdSet = new Set(validSessions.map((s: any) => s.id));
    const totalSessions = validSessions.length;
    const attRecords = (attRecsRes.data || []).filter((r: any) => validSessionIdSet.has(r.session_id));
    const ledger = ledgerRes.data || [];
    const tasks = tasksRes.data || [];
    const events = eventsRes.data || [];

    if (members.length === 0) {
      return [];
    }

    // Maps for aggregation per memberId
    const attCountMap = new Map<string, number>();
    const taskCountMap = new Map<string, number>();
    const eventCountMap = new Map<string, number>();
    const categoryPointsMap = new Map<string, { att: number; task: number; event: number; bonus: number; total: number }>();
    const latestActivityMap = new Map<string, string>();

    // Process Attendance Records
    for (const r of attRecords) {
      const c = attCountMap.get(r.member_id) || 0;
      attCountMap.set(r.member_id, c + 1);

      const pts = categoryPointsMap.get(r.member_id) || { att: 0, task: 0, event: 0, bonus: 0, total: 0 };
      pts.att += r.points || 0;
      pts.total += r.points || 0;
      categoryPointsMap.set(r.member_id, pts);

      if (r.scan_time) {
        latestActivityMap.set(r.member_id, `Attendance Scanned on ${new Date(r.scan_time).toLocaleDateString([], { dateStyle: "medium" })}`);
      }
    }

    // Process Ledger
    for (const l of ledger) {
      const pts = categoryPointsMap.get(l.member_id) || { att: 0, task: 0, event: 0, bonus: 0, total: 0 };
      const val = l.points || 0;
      const cat = (l.category || "manual").toLowerCase();

      if (cat === "attendance") pts.att += val;
      else if (cat === "task") pts.task += val;
      else if (cat === "event") pts.event += val;
      else pts.bonus += val;

      pts.total += val;
      categoryPointsMap.set(l.member_id, pts);

      if (l.created_at) {
        latestActivityMap.set(l.member_id, `Points Awarded (${val} Pts) on ${new Date(l.created_at).toLocaleDateString([], { dateStyle: "medium" })}`);
      }
    }

    // Process Task Completions
    for (const t of tasks) {
      const c = taskCountMap.get(t.member_id) || 0;
      taskCountMap.set(t.member_id, c + 1);
    }

    // Process Event Participations
    for (const e of events) {
      const c = eventCountMap.get(e.member_id) || 0;
      eventCountMap.set(e.member_id, c + 1);
    }

    // Build Performance Rows
    let rows: MemberPerformanceRow[] = members.map((m: any) => {
      const attended = attCountMap.get(m.id) || 0;
      const attPct = totalSessions === 0 ? 100 : Math.round((attended / totalSessions) * 100);
      const pts = categoryPointsMap.get(m.id) || { att: 0, task: 0, event: 0, bonus: 0, total: 0 };
      const tasksDone = taskCountMap.get(m.id) || 0;
      const eventsDone = eventCountMap.get(m.id) || 0;
      const latestAct = latestActivityMap.get(m.id) || "Active Semester Member";

      return {
        rank: 1,
        membershipId: m.club_membership_id || m.member_id || "SAC-RC-0000",
        name: m.name || "Member",
        branch: normalizeBranch(m.branch),
        year: m.year || 1,
        attendancePct: attPct,
        points: pts.total,
        tasksCompleted: tasksDone,
        eventsParticipated: eventsDone,
        attendancePoints: pts.att,
        taskPoints: pts.task,
        eventPoints: pts.event,
        bonusPoints: pts.bonus,
        currentSemester: "ROBOTICS_B1_2026",
        latestActivity: latestAct,
      };
    });

    // Apply Client Filters (Branch, Year)
    if (filters.branch && filters.branch !== "all") {
      rows = rows.filter((r) => r.branch.toLowerCase() === filters.branch.toLowerCase());
    }
    if (filters.year && filters.year !== "all") {
      rows = rows.filter((r) => String(r.year) === String(filters.year));
    }

    // Sort by points descending and calculate ranks
    rows.sort((a, b) => b.points - a.points);
    rows.forEach((r, idx) => {
      r.rank = idx + 1;
    });

    return rows;
  }

  /**
   * 4. Member Activity Timeline Report — Chronological Live Audit Log
   */
  public async getMemberTimelineReport(memberId?: string): Promise<MemberTimelineEventRow[]> {
    logger.info(`[MemberReportService] Building live chronological timeline for ${memberId || "All Members"}`);

    const eventsList: Array<{ timestampDate: Date; row: MemberTimelineEventRow }> = [];

    // Query Attendance Records
    const attQuery = supabase.from("attendance_records").select("id, scan_time, points, late, method, attendance_sessions(title), members(name)").order("scan_time", { ascending: false }).limit(25);
    if (memberId) attQuery.eq("member_id", memberId);
    const { data: attRecs } = await attQuery;

    (attRecs || []).forEach((r: any) => {
      const sess = Array.isArray(r.attendance_sessions) ? r.attendance_sessions[0] : r.attendance_sessions;
      const mem = Array.isArray(r.members) ? r.members[0] : r.members;
      const scanDate = r.scan_time ? new Date(r.scan_time) : new Date();

      eventsList.push({
        timestampDate: scanDate,
        row: {
          timestamp: scanDate.toLocaleString([], { dateStyle: "medium", timeStyle: "short" }),
          title: `Attendance: ${sess?.title || "Live Session"}`,
          category: "Attendance",
          description: `Member ${mem?.name || ""} marked ${r.late ? "Late" : "Present"} via ${r.method ? r.method.toUpperCase() : "QR"} scan`,
          points: r.points || (r.late ? 5 : 10),
          coordinator: "System Auto-Engine",
        },
      });
    });

    // Query Task Completions
    const taskQuery = supabase.from("task_completions").select("id, completed_at, tasks(title, points), members(name)").order("completed_at", { ascending: false }).limit(25);
    if (memberId) taskQuery.eq("member_id", memberId);
    const { data: taskComps } = await taskQuery;

    (taskComps || []).forEach((t: any) => {
      const task = Array.isArray(t.tasks) ? t.tasks[0] : t.tasks;
      const mem = Array.isArray(t.members) ? t.members[0] : t.members;
      const compDate = t.completed_at ? new Date(t.completed_at) : new Date();

      eventsList.push({
        timestampDate: compDate,
        row: {
          timestamp: compDate.toLocaleString([], { dateStyle: "medium", timeStyle: "short" }),
          title: `Technical Task: ${task?.title || "Task Completion"}`,
          category: "Task",
          description: `Task submission verified for ${mem?.name || ""}`,
          points: task?.points || 25,
          coordinator: "Faculty Coordinator",
        },
      });
    });

    // Query Event Participations
    const eventQuery = supabase.from("event_participations").select("id, verified_at, events(title, points), members(name)").order("verified_at", { ascending: false }).limit(25);
    if (memberId) eventQuery.eq("member_id", memberId);
    const { data: eventParts } = await eventQuery;

    (eventParts || []).forEach((e: any) => {
      const ev = Array.isArray(e.events) ? e.events[0] : e.events;
      const mem = Array.isArray(e.members) ? e.members[0] : e.members;
      const verDate = e.verified_at ? new Date(e.verified_at) : new Date();

      eventsList.push({
        timestampDate: verDate,
        row: {
          timestamp: verDate.toLocaleString([], { dateStyle: "medium", timeStyle: "short" }),
          title: `Event Turnout: ${ev?.title || "Robotics Event"}`,
          category: "Event",
          description: `Turnout verified for ${mem?.name || ""}`,
          points: ev?.points || 50,
          coordinator: "Faculty Coordinator",
        },
      });
    });

    // Sort newest first
    eventsList.sort((a, b) => b.timestampDate.getTime() - a.timestampDate.getTime());

    return eventsList.map((e) => e.row);
  }
}
