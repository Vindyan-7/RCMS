"use server";

/**
 * Attendance Domain - Session Server Actions
 */

import { ApiResponse, PaginationQuery } from "@/core/types";
import { AttendanceSessionSelect } from "@/db/schema";
import { AttendanceSessionsRepository } from "@/repositories/attendance";
import { AttendanceSessionsService } from "@/services/attendance";
import { AttendanceSessionsValidator } from "@/validation/attendance";
import { formatErrorResponse } from "@/core/errors";
import { logger } from "@/core/logger";
import { Authorizer, PERMISSIONS } from "@/core/security/rbac";
import { PaginatedResult } from "@/core/repository/repository.types";

const sessionsRepo = new AttendanceSessionsRepository();
const sessionsService = new AttendanceSessionsService(sessionsRepo);

async function getActorContext() {
  return {
    id: "00000000-0000-0000-0000-000000000001",
    role: "super_admin",
    permissions: [PERMISSIONS.ATTENDANCE_CREATE, PERMISSIONS.ATTENDANCE_VIEW, PERMISSIONS.ATTENDANCE_EDIT, PERMISSIONS.ATTENDANCE_MARK],
  };
}

export async function createAttendanceSessionAction(
  rawInput: unknown
): Promise<ApiResponse<AttendanceSessionSelect>> {
  logger.info("[Action: createAttendanceSessionAction] Initiating action execution");
  try {
    const actor = await getActorContext();
    Authorizer.hasPermission(actor, PERMISSIONS.ATTENDANCE_CREATE);

    const validatedInput = await AttendanceSessionsValidator.validateCreate(rawInput);
    const session = await sessionsService.createSession(validatedInput, actor.id);

    logger.info("[Action: createAttendanceSessionAction] Action completed successfully", { id: session.id });

    return {
      success: true,
      data: session,
    };
  } catch (error) {
    logger.error("[Action: createAttendanceSessionAction] Execution failed", error);
    return formatErrorResponse(error);
  }
}

export async function openAttendanceSessionAction(
  id: string
): Promise<ApiResponse<AttendanceSessionSelect>> {
  logger.info("[Action: openAttendanceSessionAction] Initiating action execution", { id });
  try {
    const actor = await getActorContext();
    Authorizer.hasPermission(actor, PERMISSIONS.ATTENDANCE_EDIT);

    const session = await sessionsService.openSession(id, actor.id);

    return {
      success: true,
      data: session,
    };
  } catch (error) {
    logger.error("[Action: openAttendanceSessionAction] Execution failed", error);
    return formatErrorResponse(error);
  }
}

export async function pauseAttendanceSessionAction(
  id: string
): Promise<ApiResponse<AttendanceSessionSelect>> {
  logger.info("[Action: pauseAttendanceSessionAction] Initiating action execution", { id });
  try {
    const actor = await getActorContext();
    Authorizer.hasPermission(actor, PERMISSIONS.ATTENDANCE_EDIT);

    const session = await sessionsService.pauseSession(id, actor.id);

    return {
      success: true,
      data: session,
    };
  } catch (error) {
    logger.error("[Action: pauseAttendanceSessionAction] Execution failed", error);
    return formatErrorResponse(error);
  }
}

export async function closeAttendanceSessionAction(
  id: string
): Promise<ApiResponse<AttendanceSessionSelect>> {
  logger.info("[Action: closeAttendanceSessionAction] Initiating action execution", { id });
  try {
    const actor = await getActorContext();
    Authorizer.hasPermission(actor, PERMISSIONS.ATTENDANCE_EDIT);

    const session = await sessionsService.closeSession(id, actor.id);

    return {
      success: true,
      data: session,
    };
  } catch (error) {
    logger.error("[Action: closeAttendanceSessionAction] Execution failed", error);
    return formatErrorResponse(error);
  }
}

export async function archiveAttendanceSessionAction(
  id: string
): Promise<ApiResponse<AttendanceSessionSelect>> {
  logger.info("[Action: archiveAttendanceSessionAction] Initiating action execution", { id });
  try {
    const actor = await getActorContext();
    Authorizer.hasPermission(actor, PERMISSIONS.ATTENDANCE_EDIT);

    const session = await sessionsService.archiveSession(id, actor.id);

    return {
      success: true,
      data: session,
    };
  } catch (error) {
    logger.error("[Action: archiveAttendanceSessionAction] Execution failed", error);
    return formatErrorResponse(error);
  }
}

export async function restoreAttendanceSessionAction(
  id: string
): Promise<ApiResponse<AttendanceSessionSelect>> {
  logger.info("[Action: restoreAttendanceSessionAction] Initiating action execution", { id });
  try {
    const actor = await getActorContext();
    Authorizer.hasPermission(actor, PERMISSIONS.ATTENDANCE_EDIT);

    const session = await sessionsService.restoreSession(id, actor.id);

    return {
      success: true,
      data: session,
    };
  } catch (error) {
    logger.error("[Action: restoreAttendanceSessionAction] Execution failed", error);
    return formatErrorResponse(error);
  }
}

export async function lockAttendanceSessionAction(
  id: string
): Promise<ApiResponse<AttendanceSessionSelect>> {
  return archiveAttendanceSessionAction(id);
}

export async function getAttendanceSessionsAction(
  pagination?: PaginationQuery
): Promise<ApiResponse<PaginatedResult<AttendanceSessionSelect>>> {
  logger.debug("[Action: getAttendanceSessionsAction] Initiating action execution");
  try {
    const actor = await getActorContext();
    Authorizer.hasPermission(actor, PERMISSIONS.ATTENDANCE_VIEW);

    const sessions = await sessionsService.getActiveSessions(pagination || {});

    return {
      success: true,
      data: sessions,
    };
  } catch (error) {
    logger.error("[Action: getAttendanceSessionsAction] Execution failed", error);
    return formatErrorResponse(error);
  }
}

export async function getArchivedAttendanceSessionsAction(
  pagination?: PaginationQuery
): Promise<ApiResponse<PaginatedResult<AttendanceSessionSelect>>> {
  logger.debug("[Action: getArchivedAttendanceSessionsAction] Initiating action execution");
  try {
    const actor = await getActorContext();
    Authorizer.hasPermission(actor, PERMISSIONS.ATTENDANCE_VIEW);

    const sessions = await sessionsService.getArchivedSessions(pagination || {});

    return {
      success: true,
      data: sessions,
    };
  } catch (error) {
    logger.error("[Action: getArchivedAttendanceSessionsAction] Execution failed", error);
    return formatErrorResponse(error);
  }
}

export interface AttendanceDashboardInitialData {
  sessions: AttendanceSessionSelect[];
  archivedSessions: AttendanceSessionSelect[];
  records: any[];
  semesterContext: any;
  enrolledMembers: any[];
}

export async function getAttendanceDashboardInitialDataAction(): Promise<ApiResponse<AttendanceDashboardInitialData>> {
  logger.info("[Action: getAttendanceDashboardInitialDataAction] Initiating consolidated data load");
  try {
    const actor = await getActorContext();
    Authorizer.hasPermission(actor, PERMISSIONS.ATTENDANCE_VIEW);

    const { AttendanceRecordsRepository } = await import("@/repositories/attendance");
    const { SemesterContextService } = await import("@/services/academic/semester-context.service");
    const recordsRepo = new AttendanceRecordsRepository();
    const semesterContextService = new SemesterContextService();

    const results = await Promise.allSettled([
      sessionsService.getActiveSessions({ limit: 1000 }),
      sessionsService.getArchivedSessions({ limit: 1000 }),
      recordsRepo.getAll({ limit: 1000 }),
      semesterContextService.getSemesterMetadata().catch(() => null),
      semesterContextService.getEnrolledMembers().catch(() => []),
    ]);

    const sessRes = results[0].status === "fulfilled" ? results[0].value : { items: [], total: 0, page: 1, limit: 1000, totalPages: 0 };
    const archRes = results[1].status === "fulfilled" ? results[1].value : { items: [], total: 0, page: 1, limit: 1000, totalPages: 0 };
    const recsRes = results[2].status === "fulfilled" ? results[2].value : { items: [], total: 0, page: 1, limit: 1000, totalPages: 0 };
    const metaRes = results[3].status === "fulfilled" ? results[3].value : null;
    const membersRes = results[4].status === "fulfilled" ? results[4].value : [];

    return {
      success: true,
      data: {
        sessions: sessRes.items || [],
        archivedSessions: archRes.items || [],
        records: recsRes.items || [],
        semesterContext: metaRes,
        enrolledMembers: membersRes || [],
      },
    };
  } catch (error) {
    logger.error("[Action: getAttendanceDashboardInitialDataAction] Execution failed", error);
    return formatErrorResponse(error);
  }
}
