"use server";

/**
 * Members Domain - Memberships Server Actions
 */

import { ApiResponse, PaginationQuery } from "@/core/types";
import { MembershipSelect } from "@/db/schema";
import { MembershipsRepository } from "@/repositories/members/memberships.repository";
import { MembersRepository } from "@/repositories/members/members.repository";
import { MembershipsService } from "@/services/members";
import { MembershipValidator } from "@/validation/members";
import { formatErrorResponse } from "@/core/errors";
import { logger } from "@/core/logger";
import { Authorizer, PERMISSIONS } from "@/core/security/rbac";
import { PaginatedResult } from "@/core/repository/repository.types";

// Singleton instances for Server Actions environment
const membershipsRepo = new MembershipsRepository();
const membersRepo = new MembersRepository();
const membershipsService = new MembershipsService(membershipsRepo, membersRepo);

// Helper for security context in Server Actions
async function getActorContext() {
  return {
    id: "00000000-0000-0000-0000-000000000001",
    role: "super_admin",
    permissions: [PERMISSIONS.MEMBERS_CREATE, PERMISSIONS.MEMBERS_VIEW, PERMISSIONS.MEMBERS_EDIT, PERMISSIONS.MEMBERS_DELETE],
  };
}

export async function createMembershipAction(
  rawInput: unknown
): Promise<ApiResponse<MembershipSelect>> {
  logger.info("[Action: createMembershipAction] Initiating action execution");
  try {
    const actor = await getActorContext();
    Authorizer.hasPermission(actor, PERMISSIONS.MEMBERS_CREATE);

    const validatedInput = await MembershipValidator.validateCreate(rawInput);
    const createdMembership = await membershipsService.createMembership(validatedInput, actor.id);

    logger.info("[Action: createMembershipAction] Action completed successfully", {
      id: createdMembership.id,
    });

    return {
      success: true,
      data: createdMembership,
    };
  } catch (error) {
    logger.error("[Action: createMembershipAction] Execution failed", error);
    return formatErrorResponse(error);
  }
}

export async function activateMembershipAction(
  id: string
): Promise<ApiResponse<MembershipSelect>> {
  logger.info("[Action: activateMembershipAction] Initiating action execution", { id });
  try {
    const actor = await getActorContext();
    Authorizer.hasPermission(actor, PERMISSIONS.MEMBERS_EDIT);

    const activated = await membershipsService.activateMembership(id, actor.id);

    logger.info("[Action: activateMembershipAction] Action completed successfully", { id });

    return {
      success: true,
      data: activated,
    };
  } catch (error) {
    logger.error("[Action: activateMembershipAction] Execution failed", error);
    return formatErrorResponse(error);
  }
}

export async function suspendMembershipAction(
  id: string
): Promise<ApiResponse<MembershipSelect>> {
  logger.info("[Action: suspendMembershipAction] Initiating action execution", { id });
  try {
    const actor = await getActorContext();
    Authorizer.hasPermission(actor, PERMISSIONS.MEMBERS_EDIT);

    const suspended = await membershipsService.suspendMembership(id, actor.id);

    logger.info("[Action: suspendMembershipAction] Action completed successfully", { id });

    return {
      success: true,
      data: suspended,
    };
  } catch (error) {
    logger.error("[Action: suspendMembershipAction] Execution failed", error);
    return formatErrorResponse(error);
  }
}

export async function closeMembershipAction(
  id: string
): Promise<ApiResponse<MembershipSelect>> {
  logger.info("[Action: closeMembershipAction] Initiating action execution", { id });
  try {
    const actor = await getActorContext();
    Authorizer.hasPermission(actor, PERMISSIONS.MEMBERS_EDIT);

    const closed = await membershipsService.closeMembership(id, actor.id);

    logger.info("[Action: closeMembershipAction] Action completed successfully", { id });

    return {
      success: true,
      data: closed,
    };
  } catch (error) {
    logger.error("[Action: closeMembershipAction] Execution failed", error);
    return formatErrorResponse(error);
  }
}

export async function getActiveMembershipAction(
  memberId: string
): Promise<ApiResponse<MembershipSelect | null>> {
  logger.debug("[Action: getActiveMembershipAction] Initiating action execution", { memberId });
  try {
    const actor = await getActorContext();
    Authorizer.hasPermission(actor, PERMISSIONS.MEMBERS_VIEW);

    const active = await membershipsService.getActiveMembership(memberId);

    return {
      success: true,
      data: active,
    };
  } catch (error) {
    logger.error("[Action: getActiveMembershipAction] Execution failed", error);
    return formatErrorResponse(error);
  }
}

/**
 * Batch version — one DB round-trip for all members.
 * Returns a Record<memberId, MembershipSelect> map.
 */
export async function getAllActiveMembershipsAction(
  memberIds: string[]
): Promise<ApiResponse<Record<string, MembershipSelect>>> {
  logger.debug("[Action: getAllActiveMembershipsAction] Initiating", { count: memberIds.length });
  try {
    const actor = await getActorContext();
    Authorizer.hasPermission(actor, PERMISSIONS.MEMBERS_VIEW);

    const map = await membershipsRepo.findAllActiveMemberships(memberIds);

    return { success: true, data: map };
  } catch (error) {
    logger.error("[Action: getAllActiveMembershipsAction] Failed", error);
    return formatErrorResponse(error);
  }
}

export async function getMembershipHistoryAction(
  memberId: string
): Promise<ApiResponse<MembershipSelect[]>> {
  logger.debug("[Action: getMembershipHistoryAction] Initiating action execution", { memberId });
  try {
    const actor = await getActorContext();
    Authorizer.hasPermission(actor, PERMISSIONS.MEMBERS_VIEW);

    const history = await membershipsService.getMembershipHistory(memberId);

    return {
      success: true,
      data: history,
    };
  } catch (error) {
    logger.error("[Action: getMembershipHistoryAction] Execution failed", error);
    return formatErrorResponse(error);
  }
}
import { SemestersRepository } from "@/repositories/members/semesters.repository";

const semestersRepo = new SemestersRepository();

export async function renewMembershipAction(
  memberId: string
): Promise<ApiResponse<MembershipSelect>> {
  logger.info("[Action: renewMembershipAction] Initiating", { memberId });
  try {
    const actor = await getActorContext();
    Authorizer.hasPermission(actor, PERMISSIONS.MEMBERS_EDIT);

    // 1. Resolve the currently active semester
    const activeSemester = await semestersRepo.findActive();
    if (!activeSemester) {
      return {
        success: false,
        error: {
          code: "NO_ACTIVE_SEMESTER",
          message: "There is no active semester to renew membership into. Activate a semester first.",
        },
      };
    }

    // 2. Close the current active membership (if any) — set to past
    const currentMembership = await membershipsRepo.findActiveMembership(memberId);
    if (currentMembership) {
      // Already enrolled in this semester — no renewal needed
      if (
        currentMembership.semesterId === activeSemester.id &&
        currentMembership.status === "active"
      ) {
        return {
          success: false,
          error: {
            code: "MEMBERSHIP_ALREADY_ACTIVE",
            message: "Member already has an active membership in the current semester.",
          },
        };
      }

      // Close the old membership gracefully
      await membershipsRepo.update(
        currentMembership.id,
        { status: "past", exitDate: new Date() },
        actor.id
      );
    }

    // 3. Create a new membership for the active semester
    //    Member ID (internal) is unchanged — only a new Membership record is inserted
    const renewed = await membershipsRepo.create(
      {
        memberId,
        academicYearId: activeSemester.academicYearId,
        semesterId: activeSemester.id,
        status: "active",
        joinDate: new Date(),
        createdBy: actor.id,
        updatedBy: actor.id,
      },
      actor.id
    );

    logger.info("[Action: renewMembershipAction] Renewal complete", {
      memberId,
      newMembershipId: renewed.id,
      semesterId: activeSemester.id,
    });

    return { success: true, data: renewed };
  } catch (error) {
    logger.error("[Action: renewMembershipAction] Failed", error);
    return formatErrorResponse(error);
  }
}

export async function bulkRenewMembershipsAction(
  memberIds: string[]
): Promise<ApiResponse<{ renewedCount: number; skippedCount: number; activeSemesterName: string }>> {
  logger.info("[Action: bulkRenewMembershipsAction] Initiating bulk renewal", { count: memberIds.length });
  try {
    const actor = await getActorContext();
    Authorizer.hasPermission(actor, PERMISSIONS.MEMBERS_EDIT);

    const activeSemester = await semestersRepo.findActive();
    if (!activeSemester) {
      return {
        success: false,
        error: {
          code: "NO_ACTIVE_SEMESTER",
          message: "There is no active semester to renew memberships into. Please activate a semester first.",
        },
      };
    }

    let renewedCount = 0;
    let skippedCount = 0;

    for (const memberId of memberIds) {
      const currentMembership = await membershipsRepo.findActiveMembership(memberId);
      if (
        currentMembership &&
        currentMembership.semesterId === activeSemester.id &&
        currentMembership.status === "active"
      ) {
        skippedCount++;
        continue;
      }

      if (currentMembership) {
        await membershipsRepo.update(
          currentMembership.id,
          { status: "past", exitDate: new Date() },
          actor.id
        );
      }

      await membershipsRepo.create(
        {
          memberId,
          academicYearId: activeSemester.academicYearId,
          semesterId: activeSemester.id,
          status: "active",
          joinDate: new Date(),
          createdBy: actor.id,
          updatedBy: actor.id,
        },
        actor.id
      );

      renewedCount++;
    }

    logger.info("[Action: bulkRenewMembershipsAction] Bulk renewal completed", {
      renewedCount,
      skippedCount,
      activeSemesterId: activeSemester.id,
    });

    return {
      success: true,
      data: {
        renewedCount,
        skippedCount,
        activeSemesterName: activeSemester.name,
      },
    };
  } catch (error) {
    logger.error("[Action: bulkRenewMembershipsAction] Failed", error);
    return formatErrorResponse(error);
  }
}
