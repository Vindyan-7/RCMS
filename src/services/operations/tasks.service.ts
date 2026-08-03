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

import { MembershipsRepository } from "@/repositories/members/memberships.repository";
import { SemesterContextService } from "@/services/academic/semester-context.service";

export class TasksService extends BaseService<
  TaskSelect,
  TaskInsert,
  Partial<TaskInsert>
> {
  constructor(
    private readonly tasksRepo: TasksRepository,
    private readonly completionsRepo: TaskCompletionsRepository,
    private readonly membersRepo?: MembersRepository,
    private readonly membershipsRepo: MembershipsRepository = new MembershipsRepository(),
    private readonly semesterContextService: SemesterContextService = new SemesterContextService()
  ) {
    super(tasksRepo, undefined, "TasksService");
  }

  public async createTask(
    data: any,
    actorId: UUID
  ): Promise<TaskSelect> {
    logger.info("[TasksService] Creating task", { title: data.title, actorId });
    const activeSemester = await this.semesterContextService.ensureActiveSemester("Task creation");
    const payload = {
      ...data,
      semesterId: activeSemester.id,
    };
    return this.tasksRepo.create(payload, actorId);
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

    const activeSemester = await this.semesterContextService.getActiveSemester();
    if (activeSemester) {
      const activeMem = await this.membershipsRepo.findActiveMembership(memberId);
      if (!activeMem || activeMem.semesterId !== activeSemester.id || activeMem.status !== "active") {
        throw new ConflictError(
          "Member is not renewed for the active semester. Only active semester members can complete tasks.",
          "MEMBER_NOT_RENEWED"
        );
      }
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
