/**
 * Attendance Domain - Attendance Records Repository
 */

import { eq, and, sql, desc } from "drizzle-orm";
import { db } from "@/db";
import { attendanceRecords, AttendanceRecordSelect, AttendanceRecordInsert } from "@/db/schema";
import { PaginatedResult } from "@/core/repository/repository.types";
import { UUID, PaginationQuery } from "@/core/types";

export class AttendanceRecordsRepository {
  public async findById(id: UUID): Promise<AttendanceRecordSelect | null> {
    const result = await db
      .select()
      .from(attendanceRecords)
      .where(eq(attendanceRecords.id, id))
      .limit(1);

    return result[0] || null;
  }

  public async findByMemberAndSession(
    memberId: UUID,
    sessionId: UUID
  ): Promise<AttendanceRecordSelect | null> {
    const result = await db
      .select()
      .from(attendanceRecords)
      .where(
        and(
          eq(attendanceRecords.memberId, memberId),
          eq(attendanceRecords.sessionId, sessionId)
        )
      )
      .limit(1);

    return result[0] || null;
  }

  public async getBySessionId(
    sessionId: UUID,
    query: PaginationQuery
  ): Promise<PaginatedResult<AttendanceRecordSelect>> {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const offset = (page - 1) * limit;

    const whereClause = eq(attendanceRecords.sessionId, sessionId);

    const [items, totalRes] = await Promise.all([
      db
        .select()
        .from(attendanceRecords)
        .where(whereClause)
        .limit(limit)
        .offset(offset),
      db
        .select({ count: sql<number>`count(*)` })
        .from(attendanceRecords)
        .where(whereClause),
    ]);

    const total = Number(totalRes[0]?.count || 0);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  public async getByMemberId(
    memberId: UUID,
    query: PaginationQuery
  ): Promise<PaginatedResult<AttendanceRecordSelect>> {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const offset = (page - 1) * limit;

    const whereClause = eq(attendanceRecords.memberId, memberId);

    const [items, totalRes] = await Promise.all([
      db
        .select()
        .from(attendanceRecords)
        .where(whereClause)
        .limit(limit)
        .offset(offset),
      db
        .select({ count: sql<number>`count(*)` })
        .from(attendanceRecords)
        .where(whereClause),
    ]);

    const total = Number(totalRes[0]?.count || 0);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  public async create(data: AttendanceRecordInsert): Promise<AttendanceRecordSelect> {
    const result = await db.insert(attendanceRecords).values(data).returning();
    return result[0];
  }

  public async getAll(
    query: PaginationQuery
  ): Promise<PaginatedResult<AttendanceRecordSelect>> {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const offset = (page - 1) * limit;

    const [items, totalRes] = await Promise.all([
      db
        .select()
        .from(attendanceRecords)
        .orderBy(desc(attendanceRecords.scanTime))
        .limit(limit)
        .offset(offset),
      db
        .select({ count: sql<number>`count(*)` })
        .from(attendanceRecords),
    ]);

    const total = Number(totalRes[0]?.count || 0);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  public async delete(id: UUID): Promise<boolean> {
    const result = await db
      .delete(attendanceRecords)
      .where(eq(attendanceRecords.id, id))
      .returning();

    return result.length > 0;
  }
}
