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

export async function lockAttendanceSessionAction(
  id: string
): Promise<ApiResponse<AttendanceSessionSelect>> {
  logger.info("[Action: lockAttendanceSessionAction] Initiating action execution", { id });
  try {
    const actor = await getActorContext();
    Authorizer.hasPermission(actor, PERMISSIONS.ATTENDANCE_EDIT);

    const session = await sessionsService.lockSession(id, actor.id);

    return {
      success: true,
      data: session,
    };
  } catch (error) {
    logger.error("[Action: lockAttendanceSessionAction] Execution failed", error);
    return formatErrorResponse(error);
  }
}

export async function getAttendanceSessionsAction(
  pagination?: PaginationQuery
): Promise<ApiResponse<PaginatedResult<AttendanceSessionSelect>>> {
  logger.debug("[Action: getAttendanceSessionsAction] Initiating action execution");
  try {
    const actor = await getActorContext();
    Authorizer.hasPermission(actor, PERMISSIONS.ATTENDANCE_VIEW);

    const sessions = await sessionsService.getAll(pagination || {});

    return {
      success: true,
      data: sessions,
    };
  } catch (error) {
    logger.error("[Action: getAttendanceSessionsAction] Execution failed", error);
    return formatErrorResponse(error);
  }
}
