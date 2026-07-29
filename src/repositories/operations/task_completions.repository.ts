/**
 * Operations Domain - Task Completions Repository Implementation (Supabase JS Client)
 */

import { db, toCamelCase, toSnakeCase } from "@/db";
import { TaskCompletionSelect, TaskCompletionInsert } from "@/db/schema";
import { PaginatedResult } from "@/core/repository/repository.types";
import { UUID, PaginationQuery } from "@/core/types";

export class TaskCompletionsRepository {
  private tableName = "task_completions";

  public async findById(id: UUID): Promise<TaskCompletionSelect | null> {
    const { data, error } = await db
      .from(this.tableName)
      .select("*")
      .eq("id", id)
      .single();

    if (error || !data) return null;
    return toCamelCase<TaskCompletionSelect>(data);
  }

  public async findByTaskAndMember(
    taskId: UUID,
    memberId: UUID
  ): Promise<TaskCompletionSelect | null> {
    const { data, error } = await db
      .from(this.tableName)
      .select("*")
      .eq("task_id", taskId)
      .eq("member_id", memberId)
      .eq("is_revoked", false)
      .limit(1);

    if (error || !data || data.length === 0) return null;
    return toCamelCase<TaskCompletionSelect>(data[0]);
  }

  public async getCompletionCount(taskId: UUID): Promise<number> {
    const { count, error } = await db
      .from(this.tableName)
      .select("id", { count: "exact", head: true })
      .eq("task_id", taskId)
      .eq("is_revoked", false);

    if (error) return 0;
    return count || 0;
  }

  public async getByTaskId(
    taskId: UUID,
    query: PaginationQuery
  ): Promise<PaginatedResult<TaskCompletionSelect>> {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const offset = (page - 1) * limit;

    const { data, count, error } = await db
      .from(this.tableName)
      .select("*, members(name, roll_number)", { count: "exact" })
      .eq("task_id", taskId)
      .range(offset, offset + limit - 1);

    if (error || !data) {
      return { items: [], total: 0, page, limit, totalPages: 1 };
    }

    const total = count || data.length;
    return {
      items: toCamelCase<TaskCompletionSelect[]>(data),
      total,
      page,
      limit,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    };
  }

  public async getByMemberId(
    memberId: UUID,
    query: PaginationQuery
  ): Promise<PaginatedResult<TaskCompletionSelect>> {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const offset = (page - 1) * limit;

    const { data, count, error } = await db
      .from(this.tableName)
      .select("*", { count: "exact" })
      .eq("member_id", memberId)
      .range(offset, offset + limit - 1);

    if (error || !data) {
      return { items: [], total: 0, page, limit, totalPages: 1 };
    }

    const total = count || data.length;
    return {
      items: toCamelCase<TaskCompletionSelect[]>(data),
      total,
      page,
      limit,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    };
  }

  public async create(data: TaskCompletionInsert): Promise<TaskCompletionSelect> {
    const actorId = data.completedBy || (data as any).verifiedBy || (data as any).verified_by;

    // Construct explicit payload with only existing DB columns
    const payload: any = {
      task_id: data.taskId,
      member_id: data.memberId,
    };

    if (actorId) {
      payload.completed_by = actorId;
    }
    if ((data as any).pointsAwarded !== undefined) {
      payload.points_awarded = (data as any).pointsAwarded;
    }
    if ((data as any).status) {
      payload.status = (data as any).status;
    }

    let { data: result, error } = await db
      .from(this.tableName)
      .insert(payload)
      .select()
      .maybeSingle();

    if (error && (error.message.includes("foreign key") || error.message.includes("completed_by"))) {
      delete payload.completed_by;
      const retry = await db
        .from(this.tableName)
        .insert(payload)
        .select()
        .single();
      result = retry.data;
      error = retry.error;
    }

    if (error || !result) {
      throw new Error(`[TaskCompletionsRepository] Create failed: ${error?.message}`);
    }

    return toCamelCase<TaskCompletionSelect>(result);
  }

  public async revoke(id: UUID, revokedById: UUID, reason?: string): Promise<boolean> {
    // Step 1: mark is_revoked=true with metadata (revoked_by omitted to avoid FK issues)
    const payload: any = {
      is_revoked: true,
      revoked_at: new Date().toISOString(),
      revocation_reason: reason || null,
    };

    const { error, count } = await db
      .from(this.tableName)
      .update(payload)
      .eq("id", id)
      .select();

    if (error) {
      console.error("[TaskCompletionsRepository] Revoke update failed:", error.message, { id });
      return false;
    }

    return true;
  }

  public async delete(id: UUID): Promise<boolean> {
    const { error } = await db.from(this.tableName).delete().eq("id", id);
    return !error;
  }
}
