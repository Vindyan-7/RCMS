/**
 * Attendance Domain - Attendance Sessions Repository
 */

import { eq, and, isNull, sql } from "drizzle-orm";
import { db, supabase, toCamelCase, isServerless } from "@/db";
import { attendanceSessions, AttendanceSessionSelect, AttendanceSessionInsert } from "@/db/schema";
import { BaseRepository } from "@/core/repository/base-repository";
import { PaginatedResult, QueryOptions } from "@/core/repository/repository.types";
import { UUID, PaginationQuery } from "@/core/types";
import { logger } from "@/core/logger";

export class AttendanceSessionsRepository extends BaseRepository<
  AttendanceSessionSelect,
  AttendanceSessionInsert,
  Partial<AttendanceSessionInsert>
> {
  protected getTableName(): string {
    return "attendance_sessions";
  }

  public async findById(
    id: UUID,
    options?: { includeDeleted?: boolean }
  ): Promise<AttendanceSessionSelect | null> {
    const conditions = [eq(attendanceSessions.id, id)];
    if (!options?.includeDeleted) {
      conditions.push(isNull(attendanceSessions.deletedAt));
    }

    try {
      const result = await db
        .select()
        .from(attendanceSessions)
        .where(and(...conditions))
        .limit(1);

      if (result[0]) return result[0];
    } catch (err) {
      logger.error("[AttendanceSessionsRepository] Drizzle findById error", err);
    }

    try {
      const { data } = await supabase.from("attendance_sessions").select("*").eq("id", id).limit(1);
      if (data && data[0]) return toCamelCase<AttendanceSessionSelect>(data[0]);
    } catch {}

    return null;
  }

  public async findAll(
    query: PaginationQuery,
    options?: QueryOptions
  ): Promise<PaginatedResult<AttendanceSessionSelect>> {
    const page = query.page || 1;
    const limit = query.limit || 1000;
    const offset = (page - 1) * limit;

    const conditions = [];
    if (!options?.includeDeleted) {
      conditions.push(isNull(attendanceSessions.deletedAt));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    let items: AttendanceSessionSelect[] = [];
    if (isServerless) {
      try {
        const { data } = await supabase.from("attendance_sessions").select("*").is("deleted_at", null);
        if (data && data.length > 0) {
          items = toCamelCase<AttendanceSessionSelect[]>(data);
        }
      } catch (err) {
        logger.error("[AttendanceSessionsRepository] REST query error", err);
      }
    } else {
      try {
        items = await db
          .select()
          .from(attendanceSessions)
          .where(whereClause)
          .limit(limit)
          .offset(offset);
      } catch (err) {
        logger.error("[AttendanceSessionsRepository] Drizzle findAll error", err);
      }

      if (items.length === 0) {
        try {
          const { data } = await supabase.from("attendance_sessions").select("*").is("deleted_at", null);
          if (data && data.length > 0) {
            items = toCamelCase<AttendanceSessionSelect[]>(data);
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

  public async create(
    data: AttendanceSessionInsert,
    creatorId: UUID
  ): Promise<AttendanceSessionSelect> {
    const audit = this.getAuditFields(creatorId, "create");
    const payload = {
      ...data,
      ...audit,
    };

    const result = await db.insert(attendanceSessions).values(payload).returning();
    return result[0];
  }

  public async update(
    id: UUID,
    data: Partial<AttendanceSessionInsert>,
    updaterId: UUID
  ): Promise<AttendanceSessionSelect> {
    const audit = this.getAuditFields(updaterId, "update");
    const payload = {
      ...data,
      ...audit,
    };

    const result = await db
      .update(attendanceSessions)
      .set(payload)
      .where(and(eq(attendanceSessions.id, id), isNull(attendanceSessions.deletedAt)))
      .returning();

    return result[0];
  }

  public async delete(id: UUID, deleterId: UUID): Promise<boolean> {
    const timestamp = new Date();
    const result = await db
      .update(attendanceSessions)
      .set({
        deletedAt: timestamp,
        deletedBy: deleterId,
        updatedAt: timestamp,
        updatedBy: deleterId,
      })
      .where(and(eq(attendanceSessions.id, id), isNull(attendanceSessions.deletedAt)))
      .returning();

    return result.length > 0;
  }

  public async restore(id: UUID, restorerId: UUID): Promise<boolean> {
    const timestamp = new Date();
    const result = await db
      .update(attendanceSessions)
      .set({
        deletedAt: null,
        deletedBy: null,
        updatedAt: timestamp,
        updatedBy: restorerId,
      })
      .where(eq(attendanceSessions.id, id))
      .returning();

    return result.length > 0;
  }

  public async purge(id: UUID): Promise<boolean> {
    const result = await db
      .delete(attendanceSessions)
      .where(eq(attendanceSessions.id, id))
      .returning();
    return result.length > 0;
  }
}
