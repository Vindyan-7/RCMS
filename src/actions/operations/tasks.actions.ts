"use server";

/**
 * Operations Domain - Tasks Server Actions
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

    // ── Write to points ledger so rankings reflect the award immediately ──
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
      // Non-fatal: task completion is already saved; just log
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
): Promise<ApiResponse<PaginatedResult<TaskCompletionSelect>>> {
  logger.debug("[Action: getTaskCompletionsAction] Initiating action execution", { taskId });
  try {
    const actor = await getActorContext();
    Authorizer.hasPermission(actor, PERMISSIONS.ACTIVITIES_VIEW);

    const completions = await tasksService.getTaskCompletions(taskId, pagination || {});

    return {
      success: true,
      data: completions,
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

    const success = await completionsRepo.revoke(completionId, actor.id, "Revoked via Points Engine");

    return { success, data: success };
  } catch (error) {
    logger.error("[Action: revokeTaskCompletionAction] Execution failed", error);
    return formatErrorResponse(error);
  }
}

// Returns a map of { memberId -> completion } for a given task
// so the Points Engine knows which members already completed the task
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
