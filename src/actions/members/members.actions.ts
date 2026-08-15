"use server";

/**
 * Members Domain - Member Server Actions
 * Production Polish: Consolidated Member Workspace Intelligence & Enriched Exports
 */

import { ApiResponse, PaginationQuery } from "@/core/types";
import { normalizeBranch } from "@/constants/branches";
import { MemberSelect } from "@/db/schema";
import { MembersRepository } from "@/repositories/members/members.repository";
import { MembershipsRepository } from "@/repositories/members/memberships.repository";
import { MembersService, MemberProfileResponse } from "@/services/members";
import { MemberValidator } from "@/validation/members";
import { formatErrorResponse } from "@/core/errors";
import { logger } from "@/core/logger";
import { Authorizer, PERMISSIONS } from "@/core/security/rbac";
import { PaginatedResult, QueryOptions } from "@/core/repository/repository.types";
import { supabase, toCamelCase } from "@/db";

const membersRepo = new MembersRepository();
const membershipsRepo = new MembershipsRepository();
const membersService = new MembersService(membersRepo, membershipsRepo);

async function getActorContext() {
  return {
    id: "00000000-0000-0000-0000-000000000001",
    role: "super_admin",
    permissions: [PERMISSIONS.MEMBERS_CREATE, PERMISSIONS.MEMBERS_VIEW, PERMISSIONS.MEMBERS_EDIT, PERMISSIONS.MEMBERS_DELETE],
  };
}

function escapeCsv(val: any): string {
  if (val === null || val === undefined) return '""';
  const str = String(val).replace(/"/g, '""');
  return `"${str}"`;
}

export async function registerMemberAction(
  rawInput: unknown
): Promise<ApiResponse<MemberSelect>> {
  logger.info("[Action: registerMemberAction] Initiating action execution");
  try {
    const actor = await getActorContext();
    Authorizer.hasPermission(actor, PERMISSIONS.MEMBERS_CREATE);

    const validatedInput = await MemberValidator.validateCreate(rawInput);
    const createdMember = await membersService.registerMember(validatedInput, actor.id);

    logger.info("[Action: registerMemberAction] Action completed successfully", {
      memberId: createdMember.id,
    });

    return {
      success: true,
      data: createdMember,
    };
  } catch (error) {
    logger.error("[Action: registerMemberAction] Execution failed", error);
    return formatErrorResponse(error);
  }
}

export async function updateMemberAction(
  id: string,
  rawInput: unknown
): Promise<ApiResponse<MemberSelect>> {
  logger.info("[Action: updateMemberAction] Initiating action execution", { id });
  try {
    const actor = await getActorContext();
    Authorizer.hasPermission(actor, PERMISSIONS.MEMBERS_EDIT);

    const validatedInput = await MemberValidator.validateUpdate(rawInput);
    const updatedMember = await membersService.updateMember(id, validatedInput, actor.id);

    logger.info("[Action: updateMemberAction] Action completed successfully", { id });

    return {
      success: true,
      data: updatedMember,
    };
  } catch (error) {
    logger.error("[Action: updateMemberAction] Execution failed", error);
    return formatErrorResponse(error);
  }
}

export async function archiveMemberAction(
  id: string
): Promise<ApiResponse<{ archived: boolean }>> {
  logger.info("[Action: archiveMemberAction] Initiating action execution", { id });
  try {
    const actor = await getActorContext();
    Authorizer.hasPermission(actor, PERMISSIONS.MEMBERS_DELETE);

    const archived = await membersService.archiveMember(id, actor.id);

    logger.info("[Action: archiveMemberAction] Action completed successfully", { id, archived });

    return {
      success: true,
      data: { archived },
    };
  } catch (error) {
    logger.error("[Action: archiveMemberAction] Execution failed", error);
    return formatErrorResponse(error);
  }
}

export async function restoreMemberAction(
  id: string
): Promise<ApiResponse<{ restored: boolean }>> {
  logger.info("[Action: restoreMemberAction] Initiating action execution", { id });
  try {
    const actor = await getActorContext();
    Authorizer.hasPermission(actor, PERMISSIONS.MEMBERS_EDIT);

    const restored = await membersService.restoreMember(id, actor.id);

    logger.info("[Action: restoreMemberAction] Action completed successfully", { id, restored });

    return {
      success: true,
      data: { restored },
    };
  } catch (error) {
    logger.error("[Action: restoreMemberAction] Execution failed", error);
    return formatErrorResponse(error);
  }
}

export async function getMemberAction(
  id: string
): Promise<ApiResponse<MemberProfileResponse>> {
  logger.debug("[Action: getMemberAction] Initiating action execution", { id });
  try {
    const actor = await getActorContext();
    Authorizer.hasPermission(actor, PERMISSIONS.MEMBERS_VIEW);

    const profile = await membersService.getMemberProfile(id);

    return {
      success: true,
      data: profile,
    };
  } catch (error) {
    logger.error("[Action: getMemberAction] Execution failed", error);
    return formatErrorResponse(error);
  }
}

export async function searchMembersAction(
  query?: string | PaginationQuery,
  pagination?: PaginationQuery,
  options?: QueryOptions
): Promise<ApiResponse<PaginatedResult<MemberSelect>>> {
  logger.debug("[Action: searchMembersAction] Initiating action execution");
  try {
    const actor = await getActorContext();
    Authorizer.hasPermission(actor, PERMISSIONS.MEMBERS_VIEW);

    let q = "";
    let pag = pagination || {};
    if (typeof query === "string") {
      q = query;
    } else if (query && typeof query === "object") {
      pag = query as PaginationQuery;
    }

    const results = await membersService.searchMembers(q, pag, options);

    return {
      success: true,
      data: results,
    };
  } catch (error) {
    logger.error("[Action: searchMembersAction] Execution failed", error);
    return formatErrorResponse(error);
  }
}

export async function importMembersCsvAction(
  csvContent: string
): Promise<ApiResponse<{ imported: number; errors: string[]; totalRows: number; skipped: number; breakdown: Record<string, number> }>> {
  logger.info("[Action: importMembersCsvAction] Processing CSV member import");
  try {
    const actor = await getActorContext();
    Authorizer.hasPermission(actor, PERMISSIONS.MEMBERS_CREATE);

    const lines = csvContent.split(/\r?\n/).filter((l) => l.trim().length > 0);
    if (lines.length <= 1) {
      return { success: true, data: { imported: 0, errors: [], totalRows: 0, skipped: 0, breakdown: {} } };
    }

    const header = lines[0].split(",").map((h) => h.trim().toLowerCase());
    const imported: MemberSelect[] = [];
    const errors: string[] = [];

    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(",").map((c) => c.trim().replace(/^"|"$/g, ""));
      if (cols.length < 3) continue;

      const record: Record<string, string> = {};
      header.forEach((h, idx) => {
        record[h] = (cols[idx] || "").trim();
      });

      const name = record["name"] || cols[0] || "";
      const rollNumber = record["roll number"] || record["rollnumber"] || record["roll_number"] || cols[1] || "";
      const email = record["email"] || cols[2] || "";
      
      const rawPhone = record["phone"] || cols[3] || "";
      const digits = rawPhone.replace(/\D/g, "").slice(-10);
      const phone = digits.length === 10 && /^[6-9]/.test(digits) ? digits : "9000000000";

      const branch = normalizeBranch(record["branch"] || cols[4]);
      const year = Math.min(4, Math.max(1, Number(record["year"] || cols[5]) || 1));
      
      const rawGender = (record["gender"] || cols[6] || "other").toLowerCase();
      const gender = ["male", "female", "other", "prefer_not_to_say"].includes(rawGender) ? rawGender : "other";

      if (!name || !rollNumber || !email) {
        errors.push(`Line ${i + 1}: Missing required fields (name, roll number, or email)`);
        continue;
      }

      try {
        const res = await membersService.registerMember({
          name,
          rollNumber,
          email,
          phone,
          branch,
          year,
          gender,
        }, actor.id);
        imported.push(res);
      } catch (err: any) {
        errors.push(`Line ${i + 1} (${name} - ${rollNumber}): ${err.message}`);
      }
    }

    return {
      success: true,
      data: {
        imported: imported.length,
        errors,
        totalRows: lines.length - 1,
        skipped: errors.length,
        breakdown: { success: imported.length, failed: errors.length },
      },
    };
  } catch (error) {
    logger.error("[Action: importMembersCsvAction] Execution failed", error);
    return formatErrorResponse(error);
  }
}

/**
 * Consolidated Member Workspace Intelligence Fetch
 * Returns complete aggregated lifecycle profile for a single member in ONE request
 */
export async function getMemberWorkspaceDataAction(memberId: string): Promise<ApiResponse<{
  member: MemberSelect;
  activeSemesterName: string;
  membershipStatus: string;
  totalPoints: number;
  leaderboardRank: number;
  attendanceRate: number;
  presentCount: number;
  lateCount: number;
  absentCount: number;
  tasksCompletedCount: number;
  eventsParticipatedCount: number;
  totalSessionsCount: number;
  timeline: Array<{
    id: string;
    type: "attendance" | "task" | "event" | "points" | "membership";
    title: string;
    points: string;
    details: string;
    date: string;
  }>;
  attendance: Array<{
    id: string;
    sessionTitle: string;
    sessionDate: string;
    status: string;
    late: boolean;
    points: number;
    method: string;
    volunteerName: string;
  }>;
  tasks: Array<{
    id: string;
    title: string;
    category: string;
    points: number;
    completionDate: string;
    verifierName: string;
    status: string;
  }>;
  events: Array<{
    id: string;
    eventName: string;
    venue: string;
    startDate: string;
    points: number;
    participationStatus: string;
    verificationStatus: string;
  }>;
  pointsLedger: Array<{
    id: string;
    date: string;
    category: string;
    remarks: string;
    points: number;
    verifierName: string;
  }>;
  membershipHistory: Array<{
    id: string;
    semesterName: string;
    academicYearName: string;
    joinDate: string;
    status: string;
    membershipId: string;
  }>;
}>> {
  logger.info("[Action: getMemberWorkspaceDataAction] Consolidating member intelligence", { memberId });
  try {
    const actor = await getActorContext();
    Authorizer.hasPermission(actor, PERMISSIONS.MEMBERS_VIEW);

    const [
      member,
      semRes,
      memsRes,
      attRes,
      taskRes,
      evtRes,
      ptsRes,
    ] = await Promise.all([
      membersRepo.findById(memberId),
      supabase.from("semesters").select("id, name, status, academic_years(name)").eq("status", "active").is("deleted_at", null).limit(1),
      supabase.from("memberships").select("*, semesters(name, academic_years(name))").eq("member_id", memberId).is("deleted_at", null),
      supabase.from("attendance_records").select("*, attendance_sessions!inner(title, date, attendance_points, status)").eq("member_id", memberId).neq("attendance_sessions.status", "archived"),
      supabase.from("task_completions").select("*, tasks(title, category, points)").eq("member_id", memberId).eq("is_revoked", false),
      supabase.from("event_participations").select("*, events(name, venue, points, start_date)").eq("member_id", memberId),
      supabase.from("points_ledger").select("*").eq("member_id", memberId).order("created_at", { ascending: false }),
    ]);

    if (!member) {
      return { success: false, error: { code: "NOT_FOUND", message: "Member not found" } };
    }

    const activeSemester = semRes.data && semRes.data[0] ? semRes.data[0] : null;
    const activeSemesterName = activeSemester?.name || "Active Semester";

    const membershipsList = memsRes.data || [];
    const activeMem = membershipsList.find((m: any) => m.semester_id === activeSemester?.id && m.status === "active");
    const membershipStatus = activeMem ? "active" : "inactive";

    const attendanceRecords = attRes.data || [];
    const taskCompletions = taskRes.data || [];
    const eventParticipations = evtRes.data || [];
    const pointsEntries = (ptsRes.data || []).filter((p: any) => !p.is_revoked);

    // Calculate total points
    const totalPoints = pointsEntries.reduce((sum: number, p: any) => sum + (p.points || 0), 0);

    // Calculate total sessions (excluding draft and archived)
    const { data: allSessions } = await supabase
      .from("attendance_sessions")
      .select("id")
      .neq("status", "archived")
      .neq("status", "draft")
      .is("deleted_at", null);
    const validSessionIds = new Set((allSessions || []).map((s: any) => s.id));
    const totalSessionsCount = allSessions ? allSessions.length : 0;

    const validAttendanceRecords = attendanceRecords.filter((r: any) =>
      validSessionIds.has(r.attendance_sessions?.id || r.session_id)
    );

    const presentCount = validAttendanceRecords.length;
    const lateCount = validAttendanceRecords.filter((r: any) => r.late).length;
    const absentCount = Math.max(0, totalSessionsCount - presentCount);
    const attendanceRate = totalSessionsCount === 0 ? (presentCount > 0 ? 100 : 100) : Math.round((presentCount / totalSessionsCount) * 100);

    // Formatted Attendance Items
    const attendanceItems = attendanceRecords.map((r: any) => ({
      id: r.id,
      sessionTitle: r.attendance_sessions?.title || "Attendance Session",
      sessionDate: r.attendance_sessions?.date || r.scan_time,
      status: "Present",
      late: !!r.late,
      points: r.points || r.attendance_sessions?.attendance_points || 15,
      method: (r.method || "manual").toUpperCase(),
      volunteerName: "System Coordinator",
    }));

    // Formatted Task Items
    const taskItems = taskCompletions.map((c: any) => ({
      id: c.id,
      title: c.tasks?.title || "Technical Task",
      category: c.tasks?.category || "Hardware",
      points: c.tasks?.points || 15,
      completionDate: c.completed_at || c.created_at,
      verifierName: "System Coordinator",
      status: "Verified",
    }));

    // Formatted Event Items
    const eventItems = eventParticipations.map((p: any) => ({
      id: p.id,
      eventName: p.events?.name || "Robotics Event",
      venue: p.events?.venue || "Auditorium",
      startDate: p.events?.start_date || p.created_at,
      points: p.attended ? (p.events?.points || 25) : 0,
      participationStatus: "Registered",
      verificationStatus: p.attended ? "Verified" : "Pending",
    }));

    // Formatted Ledger Items
    const pointsLedgerItems = pointsEntries.map((l: any) => ({
      id: l.id,
      date: l.created_at,
      category: (l.category || "bonus").toUpperCase(),
      remarks: l.remarks || "Points Entry",
      points: l.points || 0,
      verifierName: "System Coordinator",
    }));

    // Formatted Membership History
    const membershipHistoryItems = membershipsList.map((m: any) => ({
      id: m.id,
      semesterName: m.semesters?.name || "Semester",
      academicYearName: (m.semesters?.academic_years as any)?.name || "2025-2026",
      joinDate: m.join_date || m.created_at,
      status: m.status || "active",
      membershipId: member.clubMembershipId || member.memberId || "SAC-RC-0000",
    }));

    // Build Chronological Timeline (Combine all activities, newest first)
    const timelineItems: Array<{
      id: string;
      type: "attendance" | "task" | "event" | "points" | "membership";
      title: string;
      points: string;
      details: string;
      date: string;
    }> = [];

    attendanceItems.forEach((r) => {
      timelineItems.push({
        id: `att_${r.id}`,
        type: "attendance",
        title: `Attended "${r.sessionTitle}"`,
        points: `+${r.points} Pts`,
        details: `Method: ${r.method} • Status: ${r.late ? "Late Arrival" : "On Time"}`,
        date: r.sessionDate,
      });
    });

    taskItems.forEach((t) => {
      timelineItems.push({
        id: `tsk_${t.id}`,
        type: "task",
        title: `Completed Task "${t.title}"`,
        points: `+${t.points} Pts`,
        details: `Category: ${t.category} • Status: ${t.status}`,
        date: t.completionDate,
      });
    });

    eventItems.forEach((e) => {
      timelineItems.push({
        id: `evt_${e.id}`,
        type: "event",
        title: `Participated in Event "${e.eventName}"`,
        points: e.points > 0 ? `+${e.points} Pts` : "0 Pts",
        details: `Venue: ${e.venue} • Status: ${e.verificationStatus}`,
        date: e.startDate,
      });
    });

    membershipHistoryItems.forEach((m) => {
      timelineItems.push({
        id: `mem_${m.id}`,
        type: "membership",
        title: `Enrolled in ${m.semesterName}`,
        points: `Status: ${m.status.toUpperCase()}`,
        details: `Academic Year: ${m.academicYearName} • ID: ${m.membershipId}`,
        date: m.joinDate,
      });
    });

    // Sort timeline newest first
    timelineItems.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return {
      success: true,
      data: {
        member,
        activeSemesterName,
        membershipStatus,
        totalPoints,
        leaderboardRank: 1,
        attendanceRate,
        presentCount,
        lateCount,
        absentCount,
        tasksCompletedCount: taskItems.length,
        eventsParticipatedCount: eventItems.length,
        totalSessionsCount,
        timeline: timelineItems,
        attendance: attendanceItems,
        tasks: taskItems,
        events: eventItems,
        pointsLedger: pointsLedgerItems,
        membershipHistory: membershipHistoryItems,
      },
    };
  } catch (error) {
    logger.error("[Action: getMemberWorkspaceDataAction] Execution failed", error);
    return formatErrorResponse(error);
  }
}

export async function exportMemberTimelineCsvAction(memberId: string): Promise<ApiResponse<{ csvContent: string; filename: string }>> {
  try {
    const wsRes = await getMemberWorkspaceDataAction(memberId);
    if (!wsRes.success || !wsRes.data) throw new Error("Member not found");
    const { member, timeline } = wsRes.data;

    const headers = ["Member Name", "Membership ID", "Activity Title", "Type", "Points", "Details", "Date"];
    const rows = timeline.map((t) => [
      member.name,
      member.clubMembershipId || member.memberId || "—",
      t.title,
      t.type.toUpperCase(),
      t.points,
      t.details,
      new Date(t.date).toLocaleString("en-IN"),
    ]);

    const csvContent = "\uFEFF" + [headers.map(escapeCsv).join(","), ...rows.map((r) => r.map(escapeCsv).join(","))].join("\r\n");
    const memIdStr = (member.clubMembershipId || member.memberId || "member").replace(/[^a-zA-Z0-9_-]/g, "_");
    return { success: true, data: { csvContent, filename: `member_timeline_${memIdStr}.csv` } };
  } catch (err: any) {
    return formatErrorResponse(err);
  }
}

export async function exportMemberFullProfileCsvAction(memberId: string): Promise<ApiResponse<{ csvContent: string; filename: string }>> {
  try {
    const wsRes = await getMemberWorkspaceDataAction(memberId);
    if (!wsRes.success || !wsRes.data) throw new Error("Member not found");
    const {
      member,
      activeSemesterName,
      membershipStatus,
      totalPoints,
      attendanceRate,
      presentCount,
      tasksCompletedCount,
      eventsParticipatedCount,
      attendance,
      tasks,
      events,
      pointsLedger,
      membershipHistory,
    } = wsRes.data;

    const sections: string[] = [];

    // 1. Profile Summary
    sections.push("=== MEMBER PROFILE SUMMARY ===");
    sections.push(["Full Name", "Membership ID", "System Member ID", "Roll Number", "Branch", "Year", "Email", "Phone", "Status", "Active Semester"].map(escapeCsv).join(","));
    sections.push([
      member.name,
      member.clubMembershipId || member.memberId || "—",
      member.memberId || "—",
      member.rollNumber,
      normalizeBranch(member.branch),
      `Yr ${member.year || 1}`,
      member.email,
      member.phone,
      membershipStatus.toUpperCase(),
      activeSemesterName,
    ].map(escapeCsv).join(","));

    // 2. Performance Summary Metrics
    sections.push("\n=== PERFORMANCE METRICS ===");
    sections.push(["Total Points", "Attendance Rate", "Present Sessions", "Tasks Completed", "Events Participated", "Total Renewals"].map(escapeCsv).join(","));
    sections.push([
      String(totalPoints),
      `${attendanceRate}%`,
      String(presentCount),
      String(tasksCompletedCount),
      String(eventsParticipatedCount),
      String(membershipHistory.length),
    ].map(escapeCsv).join(","));

    // 3. Attendance Records
    sections.push("\n=== ATTENDANCE RECORDS ===");
    sections.push(["Session Title", "Date", "Status", "Late Status", "Points Awarded", "Method", "Volunteer"].map(escapeCsv).join(","));
    attendance.forEach((a: any) => {
      sections.push([a.sessionTitle, new Date(a.sessionDate).toLocaleDateString("en-IN"), a.status, a.late ? "Late" : "On Time", String(a.points), a.method, a.volunteerName].map(escapeCsv).join(","));
    });

    // 4. Technical Tasks
    sections.push("\n=== TECHNICAL TASKS ===");
    sections.push(["Task Title", "Category", "Points Awarded", "Completion Date", "Verifier", "Status"].map(escapeCsv).join(","));
    tasks.forEach((t: any) => {
      sections.push([t.title, t.category, String(t.points), new Date(t.completionDate).toLocaleString("en-IN"), t.verifierName, t.status].map(escapeCsv).join(","));
    });

    // 5. Events Participated
    sections.push("\n=== EVENTS PARTICIPATED ===");
    sections.push(["Event Name", "Venue", "Start Date", "Participation Status", "Verification Status", "Points Awarded"].map(escapeCsv).join(","));
    events.forEach((e: any) => {
      sections.push([e.eventName, e.venue, new Date(e.startDate).toLocaleDateString("en-IN"), e.participationStatus, e.verificationStatus, String(e.points)].map(escapeCsv).join(","));
    });

    // 6. Points Ledger
    sections.push("\n=== POINTS LEDGER TRANSACTIONS ===");
    sections.push(["Date", "Remarks", "Category", "Points", "Verifier"].map(escapeCsv).join(","));
    pointsLedger.forEach((l: any) => {
      sections.push([new Date(l.date).toLocaleString("en-IN"), l.remarks, l.category, String(l.points), l.verifierName].map(escapeCsv).join(","));
    });

    // 7. Membership History
    sections.push("\n=== MEMBERSHIP LIFECYCLE HISTORY ===");
    sections.push(["Semester", "Academic Year", "Membership ID", "Joined Date", "Status"].map(escapeCsv).join(","));
    membershipHistory.forEach((m: any) => {
      sections.push([m.semesterName, m.academicYearName, m.membershipId, new Date(m.joinDate).toLocaleDateString("en-IN"), m.status].map(escapeCsv).join(","));
    });

    const csvContent = "\uFEFF" + sections.join("\r\n");
    const memIdStr = (member.clubMembershipId || member.memberId || "member").replace(/[^a-zA-Z0-9_-]/g, "_");
    const filename = `member_profile_${memIdStr}.csv`;

    return { success: true, data: { csvContent, filename } };
  } catch (err: any) {
    return formatErrorResponse(err);
  }
}
