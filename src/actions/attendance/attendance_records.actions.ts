"use server";

/**
 * Attendance Domain - Attendance Records Server Actions
 * Production Polish: Enriched CSV exports & Human readable records
 */

import { ApiResponse, PaginationQuery } from "@/core/types";
import { AttendanceRecordSelect } from "@/db/schema";
import { AttendanceRecordsRepository, AttendanceSessionsRepository } from "@/repositories/attendance";
import { MembersRepository } from "@/repositories/members";
import { PointsLedgerRepository } from "@/repositories/points";
import { AttendanceRecordsService } from "@/services/attendance";
import { AttendanceRecordsValidator } from "@/validation/attendance";
import { formatErrorResponse } from "@/core/errors";
import { logger } from "@/core/logger";
import { Authorizer, PERMISSIONS } from "@/core/security/rbac";
import { PaginatedResult } from "@/core/repository/repository.types";
import { supabase, toCamelCase } from "@/db";

const recordsRepo = new AttendanceRecordsRepository();
const sessionsRepo = new AttendanceSessionsRepository();
const membersRepo = new MembersRepository();
const ledgerRepo = new PointsLedgerRepository();
const recordsService = new AttendanceRecordsService(recordsRepo, sessionsRepo, membersRepo);

async function getActorContext() {
  return {
    id: "00000000-0000-0000-0000-000000000001",
    role: "super_admin",
    permissions: [PERMISSIONS.ATTENDANCE_CREATE, PERMISSIONS.ATTENDANCE_VIEW, PERMISSIONS.ATTENDANCE_EDIT, PERMISSIONS.ATTENDANCE_MARK],
  };
}

export async function recordAttendanceAction(
  rawInput: unknown
): Promise<ApiResponse<AttendanceRecordSelect>> {
  logger.info("[Action: recordAttendanceAction] Initiating action execution");
  try {
    const actor = await getActorContext();
    Authorizer.hasPermission(actor, PERMISSIONS.ATTENDANCE_MARK);

    const validatedInput = await AttendanceRecordsValidator.validateRecord(rawInput);
    const record = await recordsService.recordAttendance(
      {
        ...validatedInput,
        remarks: validatedInput.remarks || undefined,
      },
      actor.id
    );

    logger.info("[Action: recordAttendanceAction] Action completed successfully", { id: record.id });

    // Sync attendance points to points_ledger
    try {
      const pts = Number((record as any).points ?? 0);
      if (pts > 0) {
        await ledgerRepo.create({
          memberId: record.memberId,
          category: "attendance",
          referenceType: "attendance_record",
          referenceId: record.id,
          points: pts,
          createdBy: actor.id,
          remarks: `Attendance recorded for session ${record.sessionId}`,
        });
      }
    } catch (ledgerErr) {
      logger.warn("[Action: recordAttendanceAction] Ledger sync skipped", { error: String(ledgerErr) });
    }

    return {
      success: true,
      data: record,
    };
  } catch (error) {
    logger.error("[Action: recordAttendanceAction] Execution failed", error);
    return formatErrorResponse(error);
  }
}

export async function getSessionRecordsAction(
  sessionId: string,
  pagination?: PaginationQuery
): Promise<ApiResponse<PaginatedResult<AttendanceRecordSelect>>> {
  logger.debug("[Action: getSessionRecordsAction] Initiating action execution", { sessionId });
  try {
    const actor = await getActorContext();
    Authorizer.hasPermission(actor, PERMISSIONS.ATTENDANCE_VIEW);

    const records = await recordsService.getSessionRecords(sessionId, pagination || {});

    return {
      success: true,
      data: records,
    };
  } catch (error) {
    logger.error("[Action: getSessionRecordsAction] Execution failed", error);
    return formatErrorResponse(error);
  }
}

export async function getMemberAttendanceRecordsAction(
  memberId: string,
  pagination?: PaginationQuery
): Promise<ApiResponse<PaginatedResult<AttendanceRecordSelect>>> {
  logger.debug("[Action: getMemberAttendanceRecordsAction] Initiating action execution", { memberId });
  try {
    const actor = await getActorContext();
    Authorizer.hasPermission(actor, PERMISSIONS.ATTENDANCE_VIEW);

    const records = await recordsService.getMemberRecords(memberId, pagination || {});

    return {
      success: true,
      data: records,
    };
  } catch (error) {
    logger.error("[Action: getMemberAttendanceRecordsAction] Execution failed", error);
    return formatErrorResponse(error);
  }
}

export async function getAttendanceRecordsAction(
  pagination?: PaginationQuery
): Promise<ApiResponse<PaginatedResult<any>>> {
  logger.debug("[Action: getAttendanceRecordsAction] Initiating action execution with member enrichment");
  try {
    const actor = await getActorContext();
    Authorizer.hasPermission(actor, PERMISSIONS.ATTENDANCE_VIEW);

    const rawRecords = await recordsService.getAllRecords(pagination || {});
    const items = rawRecords.items || [];

    // Enrich records with Member & Session details (No UUIDs in UI)
    const { data: membersData } = await supabase.from("members").select("id, name, member_id, club_membership_id, roll_number");
    const { data: sessionsData } = await supabase.from("attendance_sessions").select("id, title, date");

    const memberMap = new Map((membersData || []).map((m: any) => [m.id, m]));
    const sessionMap = new Map((sessionsData || []).map((s: any) => [s.id, s]));

    const enrichedItems = items.map((r: any) => {
      const mem = memberMap.get(r.memberId);
      const sess = sessionMap.get(r.sessionId);
      return {
        ...r,
        memberName: mem?.name || "Member",
        membershipId: mem?.clubMembershipId || mem?.member_id || mem?.memberId || "—",
        rollNumber: mem?.rollNumber || mem?.roll_number || "—",
        sessionTitle: sess?.title || "Attendance Session",
        sessionDate: sess?.date || r.scanTime,
      };
    });

    return {
      success: true,
      data: {
        ...rawRecords,
        items: enrichedItems,
      },
    };
  } catch (error) {
    logger.error("[Action: getAttendanceRecordsAction] Execution failed", error);
    return formatErrorResponse(error);
  }
}

function escapeCsv(val: any): string {
  if (val === null || val === undefined) return '""';
  const str = String(val).replace(/"/g, '""');
  return `"${str}"`;
}

export async function exportAttendanceRecordsCsvAction(
  sessionId?: string
): Promise<ApiResponse<{ csvContent: string; filename: string }>> {
  logger.info("[Action: exportAttendanceRecordsCsvAction] Exporting enriched attendance records CSV", { sessionId });
  try {
    const actor = await getActorContext();
    Authorizer.hasPermission(actor, PERMISSIONS.ATTENDANCE_VIEW);

    // 1. Fetch Active Semester & Academic Year context
    const { data: semData } = await supabase
      .from("semesters")
      .select("id, name, academic_year_id, academic_years(name)")
      .eq("status", "active")
      .is("deleted_at", null)
      .limit(1);

    const activeSemester = semData && semData[0] ? semData[0] : null;
    const semesterName = activeSemester?.name || "Active Semester";
    const academicYearName = (activeSemester?.academic_years as any)?.name || "2025-2026";

    // 2. Fetch Sessions
    let sessionsToExport: any[] = [];
    if (sessionId) {
      const { data: singleSess } = await supabase
        .from("attendance_sessions")
        .select("*")
        .eq("id", sessionId);
      sessionsToExport = singleSess || [];
    } else {
      const { data: allSess } = await supabase
        .from("attendance_sessions")
        .select("*")
        .is("deleted_at", null)
        .order("date", { ascending: false });
      sessionsToExport = allSess || [];
    }

    if (sessionsToExport.length === 0) {
      return {
        success: false,
        error: { code: "NOT_FOUND", message: "No attendance sessions found to export." },
      };
    }

    // 3. Fetch Enrolled Members for Active Semester
    let membersList: any[] = [];
    if (activeSemester?.id) {
      const { data: memsData } = await supabase
        .from("memberships")
        .select("member_id, members(id, name, member_id, club_membership_id, roll_number, branch)")
        .eq("semester_id", activeSemester.id)
        .eq("status", "active")
        .is("deleted_at", null);

      if (memsData && memsData.length > 0) {
        membersList = memsData
          .filter((m: any) => m.members !== null)
          .map((m: any) => m.members);
      }
    }

    if (membersList.length === 0) {
      const { data: allMems } = await supabase
        .from("members")
        .select("id, name, member_id, club_membership_id, roll_number, branch")
        .eq("status", "active")
        .is("deleted_at", null);
      membersList = allMems || [];
    }

    // 4. Fetch Attendance Records
    const sessionIds = sessionsToExport.map((s) => s.id);
    const { data: recordsData } = await supabase
      .from("attendance_records")
      .select("*")
      .in("session_id", sessionIds);

    const recordsMap = new Map<string, any>(); // key: `${sessionId}_${memberId}`
    (recordsData || []).forEach((r: any) => {
      recordsMap.set(`${r.session_id}_${r.member_id}`, r);
    });

    // 5. Build Enriched CSV Rows
    const headers = [
      "Session Name",
      "Session Date",
      "Academic Year",
      "Semester",
      "Member Name",
      "Membership ID",
      "Roll Number",
      "Branch",
      "Attendance Status",
      "Late Status",
      "Points Awarded",
      "Attendance Method",
      "Timestamp",
      "Volunteer Name",
    ];

    const rows: string[][] = [];

    for (const sess of sessionsToExport) {
      const sessDateStr = sess.date ? new Date(sess.date).toLocaleDateString("en-IN") : "";
      for (const mem of membersList) {
        const recKey = `${sess.id}_${mem.id}`;
        const rec = recordsMap.get(recKey);

        const isPresent = !!rec;
        const statusStr = isPresent ? "Present" : "Absent";
        const lateStr = isPresent ? (rec.late ? "Late" : "On Time") : "N/A";
        const pts = isPresent ? (rec.points ?? sess.attendance_points ?? 15) : 0;
        const method = isPresent ? (rec.method ? rec.method.toUpperCase() : "MANUAL") : "N/A";
        const timestampStr = isPresent && rec.scan_time ? new Date(rec.scan_time).toLocaleString("en-IN") : "N/A";
        const volunteerStr = "System Coordinator";

        rows.push([
          sess.title,
          sessDateStr,
          academicYearName,
          semesterName,
          mem.name || "Member",
          mem.club_membership_id || mem.member_id || "—",
          mem.roll_number || "—",
          (mem.branch || "—").toUpperCase(),
          statusStr,
          lateStr,
          String(pts),
          method,
          timestampStr,
          volunteerStr,
        ]);
      }
    }

    // UTF-8 BOM prefix for Excel compatibility
    const csvContent = "\uFEFF" + [
      headers.map(escapeCsv).join(","),
      ...rows.map((row) => row.map(escapeCsv).join(",")),
    ].join("\r\n");

    const targetSession = sessionsToExport[0];
    const filename = sessionId && targetSession
      ? `attendance_${targetSession.title.replace(/[^a-zA-Z0-9_-]/g, "_")}.csv`
      : "attendance_all_sessions.csv";

    return {
      success: true,
      data: {
        csvContent,
        filename,
      },
    };
  } catch (error) {
    logger.error("[Action: exportAttendanceRecordsCsvAction] Execution failed", error);
    return formatErrorResponse(error);
  }
}

export async function bulkRecordAttendanceAction(
  sessionId: string,
  memberIds: string[]
): Promise<ApiResponse<{ recordedCount: number }>> {
  logger.info("[Action: bulkRecordAttendanceAction] Bulk recording attendance", { sessionId, count: memberIds.length });
  try {
    const actor = await getActorContext();
    Authorizer.hasPermission(actor, PERMISSIONS.ATTENDANCE_MARK);

    const res = await recordsService.bulkRecordAttendance(sessionId, memberIds, actor.id);

    return {
      success: true,
      data: res,
    };
  } catch (error) {
    logger.error("[Action: bulkRecordAttendanceAction] Execution failed", error);
    return formatErrorResponse(error);
  }
}
