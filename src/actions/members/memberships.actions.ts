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
