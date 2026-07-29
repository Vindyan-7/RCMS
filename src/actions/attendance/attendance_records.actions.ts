"use server";

/**
 * Attendance Domain - Attendance Records Server Actions
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

    // ── Sync attendance points to points_ledger so leaderboard reflects them ──
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
): Promise<ApiResponse<PaginatedResult<AttendanceRecordSelect>>> {
  logger.debug("[Action: getAttendanceRecordsAction] Initiating action execution");
  try {
    const actor = await getActorContext();
    Authorizer.hasPermission(actor, PERMISSIONS.ATTENDANCE_VIEW);

    const records = await recordsService.getAllRecords(pagination || {});

    return {
      success: true,
      data: records,
    };
  } catch (error) {
    logger.error("[Action: getAttendanceRecordsAction] Execution failed", error);
    return formatErrorResponse(error);
  }
}

export async function exportAttendanceRecordsCsvAction(sessionId?: string): Promise<ApiResponse<string>> {
  logger.info("[Action: exportAttendanceRecordsCsvAction] Exporting attendance records CSV", { sessionId });
  try {
    const actor = await getActorContext();
    Authorizer.hasPermission(actor, PERMISSIONS.ATTENDANCE_VIEW);

    const records = sessionId
      ? (await recordsService.getSessionRecords(sessionId, { limit: 1000 })).items
      : (await recordsService.getAllRecords({ limit: 1000 })).items;

    const headers = ["Record ID", "Session ID", "Member ID", "Scan Time", "Points", "Method", "Late", "Remarks"];
    const rows = (records as any[]).map((r) => [
      r.id,
      r.sessionId,
      r.memberId,
      r.scanTime ? new Date(r.scanTime).toISOString() : "",
      r.points,
      r.method,
      r.late ? "Yes" : "No",
      `"${(r.remarks || "").replace(/"/g, '""')}"`,
    ]);

    const csvContent = [headers.join(","), ...rows.map((row) => row.join(","))].join("\n");

    return {
      success: true,
      data: csvContent,
    };
  } catch (error) {
    logger.error("[Action: exportAttendanceRecordsCsvAction] Execution failed", error);
    return formatErrorResponse(error);
  }
}
