"use server";

/**
 * Members Domain - Member Server Actions
 */

import { ApiResponse, PaginationQuery } from "@/core/types";
import { MemberSelect } from "@/db/schema";
import { MembersRepository } from "@/repositories/members/members.repository";
import { MembershipsRepository } from "@/repositories/members/memberships.repository";
import { MembersService, MemberProfileResponse } from "@/services/members";
import { MemberValidator } from "@/validation/members";
import { formatErrorResponse } from "@/core/errors";
import { logger } from "@/core/logger";
import { Authorizer, PERMISSIONS } from "@/core/security/rbac";
import { PaginatedResult } from "@/core/repository/repository.types";

// Singleton instances for Server Actions environment
const membersRepo = new MembersRepository();
const membershipsRepo = new MembershipsRepository();
const membersService = new MembersService(membersRepo, membershipsRepo);

// Helper for security context in Server Actions
async function getActorContext() {
  // Prototype/System Actor context; in full runtime, resolves from Supabase Auth session
  return {
    id: "00000000-0000-0000-0000-000000000001",
    role: "super_admin",
    permissions: [PERMISSIONS.MEMBERS_CREATE, PERMISSIONS.MEMBERS_VIEW, PERMISSIONS.MEMBERS_EDIT, PERMISSIONS.MEMBERS_DELETE],
  };
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
  pagination?: PaginationQuery
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

    const results = await membersService.searchMembers(q, pag);

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
        record[h] = cols[idx] || "";
      });

      const name = record["name"] || cols[0];
      const rollNumber = record["roll number"] || record["rollnumber"] || record["roll_number"] || cols[1];
      const email = record["email"] || cols[2];
      const phone = record["phone"] || cols[3] || "0000000000";
      const branch = record["branch"] || cols[4] || "ECE";
      const year = Number(record["year"] || cols[5]) || 1;
      const gender = record["gender"] || "Other";

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
        errors.push(`Line ${i + 1}: ${err.message}`);
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
