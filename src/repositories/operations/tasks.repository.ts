/**
 * Operations Domain - Tasks Repository Implementation
 */

import { eq, and, isNull, sql } from "drizzle-orm";
import { db, supabase, toCamelCase, toSnakeCase, isServerless } from "@/db";
import { tasks, TaskSelect, TaskInsert } from "@/db/schema";
import { BaseRepository } from "@/core/repository/base-repository";
import { PaginatedResult, QueryOptions } from "@/core/repository/repository.types";
import { UUID, PaginationQuery } from "@/core/types";
import { logger } from "@/core/logger";

export class TasksRepository extends BaseRepository<
  TaskSelect,
  TaskInsert,
  Partial<TaskInsert>
> {
  protected getTableName(): string {
    return "tasks";
  }

  public async findById(
    id: UUID,
    options?: { includeDeleted?: boolean }
  ): Promise<TaskSelect | null> {
    if (isServerless) {
      try {
        const { data } = await supabase.from("tasks").select("*").eq("id", id).limit(1);
        if (data && data[0]) return toCamelCase<TaskSelect>(data[0]);
      } catch {}
      return null;
    }

    const conditions = [eq(tasks.id, id)];
    if (!options?.includeDeleted) {
      conditions.push(isNull(tasks.deletedAt));
    }

    try {
      const result = await db
        .select()
        .from(tasks)
        .where(and(...conditions))
        .limit(1);

      if (result[0]) return result[0];
    } catch (err) {
      logger.error("[TasksRepository] Drizzle findById error", err);
    }

    try {
      const { data } = await supabase.from("tasks").select("*").eq("id", id).limit(1);
      if (data && data[0]) return toCamelCase<TaskSelect>(data[0]);
    } catch {}

    return null;
  }

  public async findAll(
    query: PaginationQuery,
    options?: QueryOptions
  ): Promise<PaginatedResult<TaskSelect>> {
    const page = query.page || 1;
    const limit = query.limit || 1000;
    const offset = (page - 1) * limit;

    let items: TaskSelect[] = [];
    if (isServerless) {
      try {
        const { data } = await supabase.from("tasks").select("*").is("deleted_at", null);
        if (data && data.length > 0) {
          items = toCamelCase<TaskSelect[]>(data);
        }
      } catch (err) {
        logger.error("[TasksRepository] REST query error", err);
      }
    } else {
      const conditions = [];
      if (!options?.includeDeleted) {
        conditions.push(isNull(tasks.deletedAt));
      }
      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

      try {
        items = await db
          .select()
          .from(tasks)
          .where(whereClause)
          .limit(limit)
          .offset(offset);
      } catch (err) {
        logger.error("[TasksRepository] Drizzle findAll error", err);
      }

      if (items.length === 0) {
        try {
          const { data } = await supabase.from("tasks").select("*").is("deleted_at", null);
          if (data && data.length > 0) {
            items = toCamelCase<TaskSelect[]>(data);
          }
        } catch {}
      }
    }

    return {
      items,
      total: items.length,
      page,
      limit,
      totalPages: this.calculateTotalPages(items.length, limit),
    };
  }

  public async create(data: TaskInsert, creatorId: UUID): Promise<TaskSelect> {
    const audit = this.getAuditFields(creatorId, "create");
    const payload = {
      ...data,
      ...audit,
    };

    try {
      const result = await db.insert(tasks).values(payload).returning();
      if (result[0]) return result[0];
    } catch (err) {
      logger.error("[TasksRepository] Drizzle create error, falling back to REST API", err);
    }

    const snakePayload = toSnakeCase(payload);
    const { data: restResult, error } = await supabase.from("tasks").insert(snakePayload).select().single();
    if (error || !restResult) {
      throw new Error(`[TasksRepository] Create failed: ${error?.message || "Unknown error"}`);
    }
    return toCamelCase<TaskSelect>(restResult);
  }

  public async update(
    id: UUID,
    data: Partial<TaskInsert>,
    updaterId: UUID
  ): Promise<TaskSelect> {
    const audit = this.getAuditFields(updaterId, "update");
    const payload = {
      ...data,
      ...audit,
    };

    try {
      const result = await db
        .update(tasks)
        .set(payload)
        .where(and(eq(tasks.id, id), isNull(tasks.deletedAt)))
        .returning();

      if (result[0]) return result[0];
    } catch (err) {
      logger.error("[TasksRepository] Drizzle update error, falling back to REST API", err);
    }

    const snakePayload = toSnakeCase(payload);
    const { data: restResult, error } = await supabase
      .from("tasks")
      .update(snakePayload)
      .eq("id", id)
      .select()
      .single();

    if (error || !restResult) {
      throw new Error(`[TasksRepository] Update failed: ${error?.message || "Unknown error"}`);
    }
    return toCamelCase<TaskSelect>(restResult);
  }

  public async delete(id: UUID, deleterId: UUID): Promise<boolean> {
    const timestamp = new Date();
    try {
      const result = await db
        .update(tasks)
        .set({
          deletedAt: timestamp,
          deletedBy: deleterId,
          updatedAt: timestamp,
          updatedBy: deleterId,
        })
        .where(and(eq(tasks.id, id), isNull(tasks.deletedAt)))
        .returning();

      if (result.length > 0) return true;
    } catch (err) {
      logger.error("[TasksRepository] Drizzle delete error, falling back to REST API", err);
    }

    try {
      const { error } = await supabase
        .from("tasks")
        .update({
          deleted_at: timestamp.toISOString(),
          deleted_by: deleterId,
          updated_at: timestamp.toISOString(),
          updated_by: deleterId,
        })
        .eq("id", id);
      return !error;
    } catch {
      return false;
    }
  }

  public async restore(id: UUID, restorerId: UUID): Promise<boolean> {
    const timestamp = new Date();
    try {
      const result = await db
        .update(tasks)
        .set({
          deletedAt: null,
          deletedBy: null,
          updatedAt: timestamp,
          updatedBy: restorerId,
        })
        .where(eq(tasks.id, id))
        .returning();

      if (result.length > 0) return true;
    } catch {
      // Ignore
    }

    try {
      const { error } = await supabase
        .from("tasks")
        .update({
          deleted_at: null,
          deleted_by: null,
          updated_at: timestamp.toISOString(),
          updated_by: restorerId,
        })
        .eq("id", id);
      return !error;
    } catch {
      return false;
    }
  }

  public async purge(id: UUID): Promise<boolean> {
    try {
      const result = await db.delete(tasks).where(eq(tasks.id, id)).returning();
      if (result.length > 0) return true;
    } catch {}

    try {
      const { error } = await supabase.from("tasks").delete().eq("id", id);
      return !error;
    } catch {
      return false;
    }
  }
}
