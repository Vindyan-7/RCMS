"use server";

/**
 * Team Studio Domain - Server Actions Implementation
 * Single Source of Truth for Team Studio & Smart Team Builder with Collaboration Intelligence
 */

import { ApiResponse } from "@/core/types";
import { formatErrorResponse } from "@/core/errors";
import { logger } from "@/core/logger";
import { Authorizer, PERMISSIONS } from "@/core/security/rbac";
import { TeamStudioService, TeamStudioInitialResponse } from "@/services/team-studio/team-studio.service";
import { TeamGenerationService, TeamAlgorithm, TeamGenerationResult, MemberCollaborationSummary } from "@/services/team-studio/team-generation.service";

const teamStudioService = new TeamStudioService();
const teamGenService = new TeamGenerationService();

async function getActorContext() {
  return {
    id: "00000000-0000-0000-0000-000000000001",
    role: "super_admin",
    permissions: [PERMISSIONS.SETTINGS_VIEW, PERMISSIONS.MEMBERS_VIEW],
  };
}

export async function getTeamStudioInitialDataAction(
  selectedSessionId?: string
): Promise<ApiResponse<TeamStudioInitialResponse>> {
  logger.info("[Action: getTeamStudioInitialDataAction] Initiating action execution");
  try {
    const actor = await getActorContext();
    Authorizer.hasPermission(actor, PERMISSIONS.MEMBERS_VIEW);

    const data = await teamStudioService.getTeamStudioInitialData(selectedSessionId);

    return {
      success: true,
      data,
    };
  } catch (error) {
    logger.error("[Action: getTeamStudioInitialDataAction] Execution failed", error);
    return formatErrorResponse(error);
  }
}

export async function generateTeamsAction(
  attendanceSessionId: string,
  algorithm: TeamAlgorithm,
  teamSize: number,
  pinnedMembersMap: Record<number, string[]> = {}
): Promise<ApiResponse<TeamGenerationResult>> {
  logger.info(`[Action: generateTeamsAction] Generating teams for session ${attendanceSessionId} with ${algorithm}`);
  try {
    const actor = await getActorContext();
    Authorizer.hasPermission(actor, PERMISSIONS.MEMBERS_VIEW);

    const result = await teamGenService.generateTeams(attendanceSessionId, algorithm, teamSize, "Faculty Coordinator", pinnedMembersMap);

    return {
      success: true,
      data: result,
    };
  } catch (error) {
    logger.error("[Action: generateTeamsAction] Execution failed", error);
    return formatErrorResponse(error);
  }
}

export async function getMemberCollaborationSummaryAction(
  memberId: string
): Promise<ApiResponse<MemberCollaborationSummary>> {
  logger.info(`[Action: getMemberCollaborationSummaryAction] Fetching collaboration summary for member ${memberId}`);
  try {
    const actor = await getActorContext();
    Authorizer.hasPermission(actor, PERMISSIONS.MEMBERS_VIEW);

    const summary = await teamGenService.getMemberCollaborationSummary(memberId);

    return {
      success: true,
      data: summary,
    };
  } catch (error) {
    logger.error("[Action: getMemberCollaborationSummaryAction] Execution failed", error);
    return formatErrorResponse(error);
  }
}

export async function exportTeamsCsvAction(
  result: TeamGenerationResult
): Promise<ApiResponse<{ filename: string; csvContent: string }>> {
  logger.info(`[Action: exportTeamsCsvAction] Exporting teams CSV for generation ${result.generationId}`);
  try {
    const actor = await getActorContext();
    Authorizer.hasPermission(actor, PERMISSIONS.MEMBERS_VIEW);

    const rows: string[] = [
      `"Team Number","Team Name","Member Name","Membership ID","Branch","Year","Pinned"`
    ];

    result.teams.forEach((t) => {
      t.members.forEach((m) => {
        const safeName = `"${m.name.replace(/"/g, '""')}"`;
        const safeMemId = `"${m.membershipId.replace(/"/g, '""')}"`;
        const safeBranch = `"${m.branch.replace(/"/g, '""')}"`;
        const pinnedStr = m.isPinned ? `"Yes"` : `"No"`;
        rows.push(`"${t.teamNumber}","${t.teamName}",${safeName},${safeMemId},${safeBranch},"${m.year}",${pinnedStr}`);
      });
    });

    const csvBody = rows.join("\r\n");
    const csvContent = `\uFEFF${csvBody}`;

    const safeTitle = result.sessionTitle.replace(/[^a-zA-Z0-9_-]/g, "_");
    const filename = `teams_${safeTitle}_${result.teamSize}perTeam.csv`;

    return {
      success: true,
      data: {
        filename,
        csvContent,
      },
    };
  } catch (error) {
    logger.error("[Action: exportTeamsCsvAction] Execution failed", error);
    return formatErrorResponse(error);
  }
}
