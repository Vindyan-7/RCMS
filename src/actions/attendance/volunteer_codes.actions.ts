"use server";

/**
 * Attendance Domain - Volunteer Codes Server Actions
 */

import { db } from "@/db";
import { ApiResponse } from "@/core/types";
import { VolunteerCodeSelect } from "@/db/schema";
import { VolunteerCodesRepository, AttendanceSessionsRepository } from "@/repositories/attendance";
import { VolunteerCodesService } from "@/services/attendance";
import { VolunteerCodesValidator } from "@/validation/attendance";
import { formatErrorResponse } from "@/core/errors";
import { logger } from "@/core/logger";
import { Authorizer, PERMISSIONS } from "@/core/security/rbac";

const codesRepo = new VolunteerCodesRepository();
const sessionsRepo = new AttendanceSessionsRepository();
const codesService = new VolunteerCodesService(codesRepo, sessionsRepo);

async function getActorContext() {
  return {
    id: "00000000-0000-0000-0000-000000000001",
    role: "super_admin",
    permissions: [PERMISSIONS.ATTENDANCE_CREATE, PERMISSIONS.ATTENDANCE_VIEW, PERMISSIONS.ATTENDANCE_EDIT, PERMISSIONS.ATTENDANCE_MARK],
  };
}

export async function generateVolunteerCodeAction(
  rawInput: unknown
): Promise<ApiResponse<VolunteerCodeSelect>> {
  logger.info("[Action: generateVolunteerCodeAction] Initiating action execution");
  try {
    const actor = await getActorContext();
    Authorizer.hasPermission(actor, PERMISSIONS.ATTENDANCE_CREATE);

    const validatedInput = await VolunteerCodesValidator.validateGenerate(rawInput);
    const codeRecord = await codesService.generateCode(
      validatedInput.sessionId,
      validatedInput.expirationHours
    );

    return {
      success: true,
      data: codeRecord,
    };
  } catch (error) {
    logger.error("[Action: generateVolunteerCodeAction] Execution failed", error);
    return formatErrorResponse(error);
  }
}

export async function validateVolunteerCodeAction(
  rawInput: unknown
): Promise<ApiResponse<any>> {
  logger.info("[Action: validateVolunteerCodeAction] Initiating action execution");
  try {
    const actor = await getActorContext();
    const validatedInput = await VolunteerCodesValidator.validateCode(rawInput);

    const codeRecord = await codesService.validateCode(validatedInput.code, actor.id);
    const session = await sessionsRepo.findById(codeRecord.sessionId);

    return {
      success: true,
      data: {
        ...codeRecord,
        session,
      },
    };
  } catch (error) {
    logger.error("[Action: validateVolunteerCodeAction] Execution failed", error);
    return formatErrorResponse(error);
  }
}

import { SemesterContextService } from "@/services/academic/semester-context.service";
import { MembershipsRepository } from "@/repositories/members/memberships.repository";

export async function loginVolunteerPortalAction(
  input: string | { memberInput?: string; pinCode?: string }
): Promise<ApiResponse<any>> {
  try {
    const code = typeof input === "string" ? input : input.pinCode || "";
    const rawMemberInput = typeof input === "object" ? input.memberInput || "" : "";
    const trimmedInput = rawMemberInput.trim().toLowerCase();

    if (!trimmedInput) {
      throw new Error("Please enter your Club Membership ID, Roll Number, or Member ID.");
    }

    // Enforce Active Semester Operational Boundary
    const contextService = new SemesterContextService();
    const activeSemester = await contextService.getActiveSemester();

    if (!activeSemester) {
      throw new Error("Access Denied: No Active Semester found. Volunteer Portal requires an Active Semester.");
    }

    // Fetch ONLY members enrolled in the active semester
    const membershipsRepo = new MembershipsRepository();
    const enrolledProfiles = await membershipsRepo.findEnrolledMembersWithProfiles(activeSemester.id);
    const enrolledMembersList = enrolledProfiles.map((p) => p.member);

    const memberData = enrolledMembersList.find((m: any) => {
      const roll = (m.rollNumber || "").toLowerCase();
      const clubId = (m.clubMembershipId || "").toLowerCase();
      const memId = (m.memberId || "").toLowerCase();
      const email = (m.email || "").toLowerCase();
      const uuid = (m.id || "").toLowerCase();

      return roll === trimmedInput || clubId === trimmedInput || memId === trimmedInput || email === trimmedInput || uuid === trimmedInput;
    });

    if (!memberData) {
      throw new Error(`Access Denied: Member '${rawMemberInput}' is not enrolled in Active Semester "${activeSemester.name}". Only enrolled members can access the Volunteer Portal.`);
    }

    const volunteerMember = memberData;
    const memberId = memberData.id;

    const codeRecord = await codesService.validateCode(code, memberId);
    const sessionRes = await db.from("attendance_sessions").select("*").eq("id", codeRecord.sessionId).maybeSingle();

    return {
      success: true,
      data: {
        codeRecord,
        session: sessionRes.data || null,
        volunteerMember,
      },
    };
  } catch (error) {
    return formatErrorResponse(error);
  }
}

export async function getSessionVolunteerCodesAction(
  sessionId: string
): Promise<ApiResponse<VolunteerCodeSelect[]>> {
  try {
    const codes = await codesRepo.findBySessionId(sessionId);
    return {
      success: true,
      data: codes,
    };
  } catch (error) {
    return formatErrorResponse(error);
  }
}

export async function endVolunteerCodeAction(
  codeId: string
): Promise<ApiResponse<VolunteerCodeSelect>> {
  try {
    await codesRepo.deactivate(codeId);
    const updated = await db.from("volunteer_codes").select("*").eq("id", codeId).maybeSingle();
    return {
      success: true,
      data: (updated?.data || { id: codeId, status: "ended" }) as any,
    };
  } catch (error) {
    return formatErrorResponse(error);
  }
}
