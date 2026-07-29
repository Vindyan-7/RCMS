/**
 * Operations Domain - Tasks Service Implementation
 */

import { BaseService } from "@/core/service/base-service";
import { TasksRepository } from "@/repositories/operations/tasks.repository";
import { TaskCompletionsRepository } from "@/repositories/operations/task_completions.repository";
import { MembersRepository } from "@/repositories/members/members.repository";
import { TaskSelect, TaskInsert, TaskCompletionSelect } from "@/db/schema";
import { UUID, PaginationQuery } from "@/core/types";
import { PaginatedResult } from "@/core/repository/repository.types";
import { ConflictError, NotFoundError, BadRequestError } from "@/core/errors";
import { logger } from "@/core/logger";

export class TasksService extends BaseService<
  TaskSelect,
  TaskInsert,
  Partial<TaskInsert>
> {
  constructor(
    private readonly tasksRepo: TasksRepository,
    private readonly completionsRepo: TaskCompletionsRepository,
    private readonly membersRepo?: MembersRepository
  ) {
    super(tasksRepo, undefined, "TasksService");
  }

  public async createTask(
    data: any,
    actorId: UUID
  ): Promise<TaskSelect> {
    logger.info("[TasksService] Creating task", { title: data.title, actorId });
    return this.tasksRepo.create(data, actorId);
  }

  public async updateTask(
    id: UUID,
    data: Partial<TaskInsert>,
    actorId: UUID
  ): Promise<TaskSelect> {
    logger.info("[TasksService] Updating task", { id, actorId });
    await this.getById(id);
    return this.tasksRepo.update(id, data, actorId);
  }

  public async completeTask(
    taskId: UUID,
    memberId: UUID,
    actorId: UUID
  ): Promise<TaskCompletionSelect> {
    logger.info("[TasksService] Marking task complete for member", { taskId, memberId, actorId });

    const task = await this.getById(taskId);
    if (task.status !== "active") {
      throw new BadRequestError(`Task ${taskId} is currently ${task.status}. Only active tasks can be completed`);
    }

    if (this.membersRepo) {
      const member = await this.membersRepo.findById(memberId);
      if (!member) {
        throw new NotFoundError(`Member ${memberId} not found`, "MEMBER_NOT_FOUND");
      }
    }

    const existing = await this.completionsRepo.findByTaskAndMember(taskId, memberId);
    if (existing) {
      throw new ConflictError("Task has already been completed by this member");
    }

    if (!task.isUnlimited && task.maxMembers && task.maxMembers > 0) {
      const currentCompletionsCount = await this.completionsRepo.getCompletionCount(taskId);
      if (currentCompletionsCount >= task.maxMembers) {
        throw new BadRequestError(`Task limit reached: This task has already reached its maximum allowed member completions (${task.maxMembers}).`);
      }
    }

    return this.completionsRepo.create({
      taskId,
      memberId,
      completedBy: actorId,
    });
  }

  public async getTaskCompletions(
    taskId: UUID,
    pagination: PaginationQuery
  ): Promise<PaginatedResult<TaskCompletionSelect>> {
    return this.completionsRepo.getByTaskId(taskId, pagination);
  }

  public async archiveTask(id: UUID, actorId: UUID): Promise<boolean> {
    logger.info("[TasksService] Archiving task", { id, actorId });
    await this.getById(id);
    return this.tasksRepo.delete(id, actorId);
  }
}
