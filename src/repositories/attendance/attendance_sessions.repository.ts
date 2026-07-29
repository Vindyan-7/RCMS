/**
 * Attendance Domain - Attendance Sessions Repository
 */

import { eq, and, isNull, sql } from "drizzle-orm";
import { db } from "@/db";
import { attendanceSessions, AttendanceSessionSelect, AttendanceSessionInsert } from "@/db/schema";
import { BaseRepository } from "@/core/repository/base-repository";
import { PaginatedResult, QueryOptions } from "@/core/repository/repository.types";
import { UUID, PaginationQuery } from "@/core/types";

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

    const result = await db
      .select()
      .from(attendanceSessions)
      .where(and(...conditions))
      .limit(1);

    return result[0] || null;
  }

  public async findAll(
    query: PaginationQuery,
    options?: QueryOptions
  ): Promise<PaginatedResult<AttendanceSessionSelect>> {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const offset = (page - 1) * limit;

    const conditions = [];
    if (!options?.includeDeleted) {
      conditions.push(isNull(attendanceSessions.deletedAt));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [items, totalRes] = await Promise.all([
      db
        .select()
        .from(attendanceSessions)
        .where(whereClause)
        .limit(limit)
        .offset(offset),
      db
        .select({ count: sql<number>`count(*)` })
        .from(attendanceSessions)
        .where(whereClause),
    ]);

    const total = Number(totalRes[0]?.count || 0);

    return {
      items,
      total,
      page,
      limit,
      totalPages: this.calculateTotalPages(total, limit),
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
