"use server";

/**
 * Academic Domain - Semester Server Actions
 */

import { ApiResponse, PaginationQuery } from "@/core/types";
import { SemesterSelect, MemberSelect } from "@/db/schema";
import { SemestersRepository } from "@/repositories/members/semesters.repository";
import { MembershipsRepository } from "@/repositories/members/memberships.repository";
import { SemestersService } from "@/services/members/semesters.service";
import { formatErrorResponse } from "@/core/errors";
import { logger } from "@/core/logger";
import { Authorizer, PERMISSIONS } from "@/core/security/rbac";
import { PaginatedResult } from "@/core/repository/repository.types";

import { MembersRepository } from "@/repositories/members/members.repository";
import { SemesterDashboardService, SemesterDashboardData } from "@/services/members/semester-dashboard.service";

const semestersRepo = new SemestersRepository();
const membershipsRepo = new MembershipsRepository();
const membersRepo = new MembersRepository();
const semestersService = new SemestersService(semestersRepo, membershipsRepo);
const semesterDashboardService = new SemesterDashboardService(semestersRepo, membersRepo, membershipsRepo);

async function getActorContext() {
  return {
    id: "00000000-0000-0000-0000-000000000001",
    role: "super_admin",
    permissions: [
      PERMISSIONS.MEMBERS_CREATE,
      PERMISSIONS.MEMBERS_VIEW,
      PERMISSIONS.MEMBERS_EDIT,
      PERMISSIONS.MEMBERS_DELETE,
    ],
  };
}

export async function createSemesterAction(
  rawInput: unknown
): Promise<ApiResponse<SemesterSelect>> {
  logger.info("[Action: createSemesterAction] Initiating");
  try {
    const actor = await getActorContext();
    Authorizer.hasPermission(actor, PERMISSIONS.MEMBERS_CREATE);

    const data = rawInput as any;
    if (!data?.name || !data?.startDate || !data?.endDate || !data?.academicYearId) {
      return { success: false, error: { code: "VALIDATION_ERROR", message: "name, startDate, endDate, and academicYearId are required" } };
    }

    const semester = await semestersService.createSemester(
      {
        academicYearId: data.academicYearId,
        name: data.name,
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
        registrationStart: data.registrationStart ? new Date(data.registrationStart) : null,
        registrationEnd: data.registrationEnd ? new Date(data.registrationEnd) : null,
        status: data.status || "upcoming",
      },
      actor.id
    );

    logger.info("[Action: createSemesterAction] Done", { id: semester.id });
    return { success: true, data: semester };
  } catch (error) {
    logger.error("[Action: createSemesterAction] Failed", error);
    return formatErrorResponse(error);
  }
}

export async function updateSemesterAction(
  id: string,
  rawInput: unknown
): Promise<ApiResponse<SemesterSelect>> {
  logger.info("[Action: updateSemesterAction] Initiating", { id });
  try {
    const actor = await getActorContext();
    Authorizer.hasPermission(actor, PERMISSIONS.MEMBERS_EDIT);

    const data = rawInput as any;
    const updated = await semestersService.updateSemester(
      id,
      {
        name: data.name,
        startDate: data.startDate ? new Date(data.startDate) : undefined,
        endDate: data.endDate ? new Date(data.endDate) : undefined,
        registrationStart: data.registrationStart ? new Date(data.registrationStart) : undefined,
        registrationEnd: data.registrationEnd ? new Date(data.registrationEnd) : undefined,
        status: data.status,
      },
      actor.id
    );

    logger.info("[Action: updateSemesterAction] Done", { id });
    return { success: true, data: updated };
  } catch (error) {
    logger.error("[Action: updateSemesterAction] Failed", error);
    return formatErrorResponse(error);
  }
}

export async function activateSemesterAction(
  id: string
): Promise<ApiResponse<SemesterSelect>> {
  logger.info("[Action: activateSemesterAction] Initiating", { id });
  try {
    const actor = await getActorContext();
    Authorizer.hasPermission(actor, PERMISSIONS.MEMBERS_EDIT);
    const semester = await semestersService.activateSemester(id, actor.id);
    return { success: true, data: semester };
  } catch (error) {
    logger.error("[Action: activateSemesterAction] Failed", error);
    return formatErrorResponse(error);
  }
}

export async function completeSemesterAction(
  id: string
): Promise<ApiResponse<SemesterSelect>> {
  logger.info("[Action: completeSemesterAction] Initiating", { id });
  try {
    const actor = await getActorContext();
    Authorizer.hasPermission(actor, PERMISSIONS.MEMBERS_EDIT);
    const semester = await semestersService.completeSemester(id, actor.id);
    return { success: true, data: semester };
  } catch (error) {
    logger.error("[Action: completeSemesterAction] Failed", error);
    return formatErrorResponse(error);
  }
}

export async function getActiveSemesterAction(): Promise<ApiResponse<SemesterSelect | null>> {
  logger.debug("[Action: getActiveSemesterAction] Initiating");
  try {
    const actor = await getActorContext();
    Authorizer.hasPermission(actor, PERMISSIONS.MEMBERS_VIEW);
    const semester = await semestersService.getActiveSemester();
    return { success: true, data: semester };
  } catch (error) {
    logger.error("[Action: getActiveSemesterAction] Failed", error);
    return formatErrorResponse(error);
  }
}

export async function getAllSemestersAction(
  pagination?: PaginationQuery
): Promise<ApiResponse<PaginatedResult<SemesterSelect>>> {
  logger.debug("[Action: getAllSemestersAction] Initiating");
  try {
    const actor = await getActorContext();
    Authorizer.hasPermission(actor, PERMISSIONS.MEMBERS_VIEW);
    const results = await semestersService.getAllSemesters(pagination || {});
    return { success: true, data: results };
  } catch (error) {
    logger.error("[Action: getAllSemestersAction] Failed", error);
    return formatErrorResponse(error);
  }
}

export async function deleteSemesterAction(
  id: string
): Promise<ApiResponse<{ deleted: boolean }>> {
  logger.info("[Action: deleteSemesterAction] Initiating", { id });
  try {
    const actor = await getActorContext();
    Authorizer.hasPermission(actor, PERMISSIONS.MEMBERS_DELETE);
    const deleted = await semestersService.deleteSemester(id, actor.id);
    return { success: true, data: { deleted } };
  } catch (error) {
    logger.error("[Action: deleteSemesterAction] Failed", error);
    return formatErrorResponse(error);
  }
}

import { SemesterContextService, SemesterContextMetadata } from "@/services/academic/semester-context.service";

export async function getSemesterDashboardDataAction(): Promise<ApiResponse<SemesterDashboardData>> {
  logger.debug("[Action: getSemesterDashboardDataAction] Initiating consolidated dashboard fetch");
  try {
    const actor = await getActorContext();
    Authorizer.hasPermission(actor, PERMISSIONS.MEMBERS_VIEW);
    const data = await semesterDashboardService.getDashboardData();
    return { success: true, data };
  } catch (error) {
    logger.error("[Action: getSemesterDashboardDataAction] Failed", error);
    return formatErrorResponse(error);
  }
}

export async function getSemesterContextMetadataAction(): Promise<ApiResponse<SemesterContextMetadata>> {
  logger.debug("[Action: getSemesterContextMetadataAction] Initiating");
  try {
    const contextService = new SemesterContextService();
    const metadata = await contextService.getSemesterMetadata();
    return { success: true, data: metadata };
  } catch (error) {
    logger.error("[Action: getSemesterContextMetadataAction] Failed", error);
    return formatErrorResponse(error);
  }
}

export async function getEnrolledMembersForActiveSemesterAction(): Promise<ApiResponse<MemberSelect[]>> {
  logger.debug("[Action: getEnrolledMembersForActiveSemesterAction] Initiating");
  try {
    const actor = await getActorContext();
    Authorizer.hasPermission(actor, PERMISSIONS.MEMBERS_VIEW);
    const contextService = new SemesterContextService();
    const enrolledMembers = await contextService.getEnrolledMembers();
    return { success: true, data: enrolledMembers };
  } catch (error) {
    logger.error("[Action: getEnrolledMembersForActiveSemesterAction] Failed", error);
    return formatErrorResponse(error);
  }
}

