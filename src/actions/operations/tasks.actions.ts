"use server";

/**
 * Operations Domain - Tasks Server Actions
 * Production Polish: Enriched completions & Task CSV Export
 */

import { ApiResponse, PaginationQuery } from "@/core/types";
import { TaskSelect, TaskCompletionSelect } from "@/db/schema";
import { TasksRepository, TaskCompletionsRepository } from "@/repositories/operations";
import { MembersRepository } from "@/repositories/members";
import { PointsLedgerRepository } from "@/repositories/points";
import { TasksService } from "@/services/operations";
import { TasksValidator } from "@/validation/operations";
import { formatErrorResponse } from "@/core/errors";
import { logger } from "@/core/logger";
import { Authorizer, PERMISSIONS } from "@/core/security/rbac";
import { PaginatedResult } from "@/core/repository/repository.types";
import { supabase } from "@/db";

const tasksRepo = new TasksRepository();
const completionsRepo = new TaskCompletionsRepository();
const membersRepo = new MembersRepository();
const ledgerRepo = new PointsLedgerRepository();
const tasksService = new TasksService(tasksRepo, completionsRepo, membersRepo);

async function getActorContext() {
  return {
    id: "00000000-0000-0000-0000-000000000001",
    role: "super_admin",
    permissions: [PERMISSIONS.ACTIVITIES_CREATE, PERMISSIONS.ACTIVITIES_VIEW, PERMISSIONS.ACTIVITIES_EDIT, PERMISSIONS.ACTIVITIES_COMPLETE],
  };
}

function escapeCsv(val: any): string {
  if (val === null || val === undefined) return '""';
  const str = String(val).replace(/"/g, '""');
  return `"${str}"`;
}

export async function createTaskAction(
  rawInput: unknown
): Promise<ApiResponse<TaskSelect>> {
  logger.info("[Action: createTaskAction] Initiating action execution");
  try {
    const actor = await getActorContext();
    Authorizer.hasPermission(actor, PERMISSIONS.ACTIVITIES_CREATE);

    const validatedInput = await TasksValidator.validateCreate(rawInput);
    const task = await tasksService.createTask(validatedInput, actor.id);

    logger.info("[Action: createTaskAction] Action completed successfully", { id: task.id });

    return {
      success: true,
      data: task,
    };
  } catch (error) {
    logger.error("[Action: createTaskAction] Execution failed", error);
    return formatErrorResponse(error);
  }
}

export async function updateTaskAction(
  id: string,
  rawInput: unknown
): Promise<ApiResponse<TaskSelect>> {
  logger.info("[Action: updateTaskAction] Initiating action execution", { id });
  try {
    const actor = await getActorContext();
    Authorizer.hasPermission(actor, PERMISSIONS.ACTIVITIES_EDIT);

    const validatedInput = await TasksValidator.validateUpdate(rawInput);
    const task = await tasksService.updateTask(id, validatedInput, actor.id);

    return {
      success: true,
      data: task,
    };
  } catch (error) {
    logger.error("[Action: updateTaskAction] Execution failed", error);
    return formatErrorResponse(error);
  }
}

export async function completeTaskAction(
  rawInput: unknown
): Promise<ApiResponse<TaskCompletionSelect>> {
  logger.info("[Action: completeTaskAction] Initiating action execution");
  try {
    const actor = await getActorContext();
    Authorizer.hasPermission(actor, PERMISSIONS.ACTIVITIES_COMPLETE);

    const validatedInput = await TasksValidator.validateComplete(rawInput);
    const completion = await tasksService.completeTask(
      validatedInput.taskId,
      validatedInput.memberId,
      actor.id
    );

    // Sync points to ledger
    try {
      const task = await tasksRepo.findById(validatedInput.taskId);
      const pts = (task as any)?.points ?? (task as any)?.pointsValue ?? 0;
      if (pts > 0) {
        await ledgerRepo.create({
          memberId: validatedInput.memberId,
          category: "task",
          referenceType: "task_completion",
          referenceId: completion.id,
          points: pts,
          createdBy: actor.id,
          remarks: `Task completed: ${(task as any)?.title ?? validatedInput.taskId}`,
        });
      }
    } catch (ledgerErr) {
      logger.warn("[Action: completeTaskAction] Ledger write skipped", { error: String(ledgerErr) });
    }

    return {
      success: true,
      data: completion,
    };
  } catch (error) {
    logger.error("[Action: completeTaskAction] Execution failed", error);
    return formatErrorResponse(error);
  }
}

export async function getTaskCompletionsAction(
  taskId: string,
  pagination?: PaginationQuery
): Promise<ApiResponse<PaginatedResult<any>>> {
  logger.debug("[Action: getTaskCompletionsAction] Initiating action execution with member enrichment", { taskId });
  try {
    const actor = await getActorContext();
    Authorizer.hasPermission(actor, PERMISSIONS.ACTIVITIES_VIEW);

    const completions = await tasksService.getTaskCompletions(taskId, pagination || {});
    const items = completions.items || [];

    // Fetch member details for enrichment
    const { data: membersData } = await supabase.from("members").select("id, name, member_id, club_membership_id, branch");
    const memberMap = new Map((membersData || []).map((m: any) => [m.id, m]));

    const enrichedItems = items.map((c: any) => {
      const mem = memberMap.get(c.memberId);
      return {
        ...c,
        memberName: mem?.name || "Member",
        membershipId: mem?.club_membership_id || mem?.member_id || "—",
        branch: (mem?.branch || "—").toUpperCase(),
        verifierName: "System Coordinator",
        verificationStatus: c.isRevoked ? "Revoked" : "Verified",
      };
    });

    return {
      success: true,
      data: {
        ...completions,
        items: enrichedItems,
      },
    };
  } catch (error) {
    logger.error("[Action: getTaskCompletionsAction] Execution failed", error);
    return formatErrorResponse(error);
  }
}

export async function getTasksAction(
  pagination?: PaginationQuery
): Promise<ApiResponse<PaginatedResult<TaskSelect>>> {
  logger.debug("[Action: getTasksAction] Initiating action execution");
  try {
    const actor = await getActorContext();
    Authorizer.hasPermission(actor, PERMISSIONS.ACTIVITIES_VIEW);

    const tasksList = await tasksService.getAll(pagination || {});

    return {
      success: true,
      data: tasksList,
    };
  } catch (error) {
    logger.error("[Action: getTasksAction] Execution failed", error);
    return formatErrorResponse(error);
  }
}

export async function revokeTaskCompletionAction(
  completionId: string
): Promise<ApiResponse<boolean>> {
  logger.info("[Action: revokeTaskCompletionAction] Initiating revoke", { completionId });
  try {
    const actor = await getActorContext();
    Authorizer.hasPermission(actor, PERMISSIONS.ACTIVITIES_COMPLETE);

    const success = await completionsRepo.revoke(completionId, actor.id, "Revoked via Operations Workspace");

    return { success, data: success };
  } catch (error) {
    logger.error("[Action: revokeTaskCompletionAction] Execution failed", error);
    return formatErrorResponse(error);
  }
}

export async function getTaskMemberCompletionsAction(
  taskId: string
): Promise<ApiResponse<Record<string, TaskCompletionSelect>>> {
  logger.debug("[Action: getTaskMemberCompletionsAction] Loading completions for task", { taskId });
  try {
    const actor = await getActorContext();
    Authorizer.hasPermission(actor, PERMISSIONS.ACTIVITIES_VIEW);

    const result = await completionsRepo.getByTaskId(taskId, { limit: 1000 });
    const completionMap: Record<string, TaskCompletionSelect> = {};
    for (const c of result.items) {
      const completion = c as any;
      if (!completion.isRevoked) {
        completionMap[completion.memberId] = completion;
      }
    }

    return { success: true, data: completionMap };
  } catch (error) {
    logger.error("[Action: getTaskMemberCompletionsAction] Execution failed", error);
    return formatErrorResponse(error);
  }
}

export async function exportTaskCsvAction(
  taskId: string
): Promise<ApiResponse<{ csvContent: string; filename: string }>> {
  logger.info("[Action: exportTaskCsvAction] Generating task completions CSV", { taskId });
  try {
    const actor = await getActorContext();
    Authorizer.hasPermission(actor, PERMISSIONS.ACTIVITIES_VIEW);

    const task = await tasksRepo.findById(taskId);
    if (!task) {
      return { success: false, error: { code: "NOT_FOUND", message: "Task not found" } };
    }

    // Active Semester Name
    const { data: semData } = await supabase
      .from("semesters")
      .select("name")
      .eq("status", "active")
      .is("deleted_at", null)
      .limit(1);
    const semesterName = semData && semData[0] ? semData[0].name : "Active Semester";

    // Task completions
    const completionsRes = await completionsRepo.getByTaskId(taskId, { limit: 1000 });
    const completions = completionsRes.items || [];

    const { data: membersData } = await supabase.from("members").select("id, name, member_id, club_membership_id, branch");
    const memberMap = new Map((membersData || []).map((m: any) => [m.id, m]));

    const headers = [
      "Task Name",
      "Semester",
      "Member Name",
      "Membership ID",
      "Branch",
      "Completion Date",
      "Points Awarded",
      "Verifier",
    ];

    const taskPoints = (task as any).points ?? 20;

    const rows = completions
      .filter((c: any) => !c.isRevoked)
      .map((c: any) => {
        const mem = memberMap.get(c.memberId);
        const compDateStr = c.completedAt
          ? new Date(c.completedAt).toLocaleString("en-IN")
          : c.createdAt
          ? new Date(c.createdAt).toLocaleString("en-IN")
          : "—";

        return [
          task.title,
          semesterName,
          mem?.name || "Member",
          mem?.club_membership_id || mem?.member_id || "—",
          (mem?.branch || "—").toUpperCase(),
          compDateStr,
          String(taskPoints),
          "System Coordinator",
        ];
      });

    const csvContent = "\uFEFF" + [
      headers.map(escapeCsv).join(","),
      ...rows.map((row) => row.map(escapeCsv).join(",")),
    ].join("\r\n");

    const sanitizedTitle = task.title.replace(/[^a-zA-Z0-9_-]/g, "_");
    const filename = `task_${sanitizedTitle}.csv`;

    return {
      success: true,
      data: {
        csvContent,
        filename,
      },
    };
  } catch (error) {
    logger.error("[Action: exportTaskCsvAction] Execution failed", error);
    return formatErrorResponse(error);
  }
}
