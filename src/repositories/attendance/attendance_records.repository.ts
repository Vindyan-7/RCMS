/**
 * Attendance Domain - Attendance Records Repository
 */

import { eq, and, sql, desc } from "drizzle-orm";
import { db, supabase, toCamelCase, toSnakeCase, isServerless } from "@/db";
import { attendanceRecords, AttendanceRecordSelect, AttendanceRecordInsert } from "@/db/schema";
import { PaginatedResult } from "@/core/repository/repository.types";
import { UUID, PaginationQuery } from "@/core/types";
import { logger } from "@/core/logger";

export class AttendanceRecordsRepository {
  public async findById(id: UUID): Promise<AttendanceRecordSelect | null> {
    try {
      const result = await db
        .select()
        .from(attendanceRecords)
        .where(eq(attendanceRecords.id, id))
        .limit(1);

      if (result[0]) return result[0];
    } catch (err) {
      logger.error("[AttendanceRecordsRepository] Drizzle findById error", err);
    }

    try {
      const { data } = await supabase.from("attendance_records").select("*").eq("id", id).limit(1);
      if (data && data[0]) return toCamelCase<AttendanceRecordSelect>(data[0]);
    } catch {}

    return null;
  }

  public async findByMemberAndSession(
    memberId: UUID,
    sessionId: UUID
  ): Promise<AttendanceRecordSelect | null> {
    try {
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

      if (result[0]) return result[0];
    } catch (err) {
      logger.error("[AttendanceRecordsRepository] Drizzle findByMemberAndSession error", err);
    }

    try {
      const { data } = await supabase
        .from("attendance_records")
        .select("*")
        .eq("member_id", memberId)
        .eq("session_id", sessionId)
        .limit(1);
      if (data && data[0]) return toCamelCase<AttendanceRecordSelect>(data[0]);
    } catch {}

    return null;
  }

  public async getBySessionId(
    sessionId: UUID,
    query: PaginationQuery
  ): Promise<PaginatedResult<AttendanceRecordSelect>> {
    const page = query.page || 1;
    const limit = query.limit || 1000;
    const offset = (page - 1) * limit;

    let items: AttendanceRecordSelect[] = [];
    try {
      items = await db
        .select()
        .from(attendanceRecords)
        .where(eq(attendanceRecords.sessionId, sessionId))
        .limit(limit)
        .offset(offset);
    } catch (err) {
      logger.error("[AttendanceRecordsRepository] Drizzle getBySessionId error", err);
    }

    if (items.length === 0) {
      try {
        const { data } = await supabase
          .from("attendance_records")
          .select("*")
          .eq("session_id", sessionId);
        if (data && data.length > 0) {
          items = toCamelCase<AttendanceRecordSelect[]>(data);
        }
      } catch {}
    }

    return {
      items,
      total: items.length,
      page,
      limit,
      totalPages: Math.max(1, Math.ceil(items.length / limit)),
    };
  }

  public async getByMemberId(
    memberId: UUID,
    query: PaginationQuery
  ): Promise<PaginatedResult<AttendanceRecordSelect>> {
    const page = query.page || 1;
    const limit = query.limit || 1000;
    const offset = (page - 1) * limit;

    let items: AttendanceRecordSelect[] = [];
    try {
      items = await db
        .select()
        .from(attendanceRecords)
        .where(eq(attendanceRecords.memberId, memberId))
        .limit(limit)
        .offset(offset);
    } catch (err) {
      logger.error("[AttendanceRecordsRepository] Drizzle getByMemberId error", err);
    }

    if (items.length === 0) {
      try {
        const { data } = await supabase
          .from("attendance_records")
          .select("*")
          .eq("member_id", memberId);
        if (data && data.length > 0) {
          items = toCamelCase<AttendanceRecordSelect[]>(data);
        }
      } catch {}
    }

    return {
      items,
      total: items.length,
      page,
      limit,
      totalPages: Math.max(1, Math.ceil(items.length / limit)),
    };
  }

  public async create(data: AttendanceRecordInsert): Promise<AttendanceRecordSelect> {
    const payload: any = { ...data };

    try {
      const result = await db.insert(attendanceRecords).values(payload).returning();
      if (result[0]) return result[0];
    } catch (err) {
      logger.error("[AttendanceRecordsRepository] Drizzle create error, falling back to REST API", err);
    }

    const snakePayload = toSnakeCase(payload);
    const { data: restResult, error } = await supabase
      .from("attendance_records")
      .insert(snakePayload)
      .select()
      .single();

    if (error || !restResult) {
      throw new Error(`[AttendanceRecordsRepository] Create failed: ${error?.message}`);
    }
    return toCamelCase<AttendanceRecordSelect>(restResult);
  }

  public async getAll(
    query: PaginationQuery
  ): Promise<PaginatedResult<AttendanceRecordSelect>> {
    const page = query.page || 1;
    const limit = query.limit || 1000;
    const offset = (page - 1) * limit;

    let items: AttendanceRecordSelect[] = [];
    if (isServerless) {
      try {
        const { data } = await supabase
          .from("attendance_records")
          .select("*")
          .order("scan_time", { ascending: false });
        if (data && data.length > 0) {
          items = toCamelCase<AttendanceRecordSelect[]>(data);
        }
      } catch (err) {
        logger.error("[AttendanceRecordsRepository] REST query error", err);
      }
    } else {
      try {
        items = await db
          .select()
          .from(attendanceRecords)
          .orderBy(desc(attendanceRecords.scanTime))
          .limit(limit)
          .offset(offset);
      } catch (err) {
        logger.error("[AttendanceRecordsRepository] Drizzle getAll error", err);
      }

      if (items.length === 0) {
        try {
          const { data } = await supabase
            .from("attendance_records")
            .select("*")
            .order("scan_time", { ascending: false });
          if (data && data.length > 0) {
            items = toCamelCase<AttendanceRecordSelect[]>(data);
          }
        } catch {}
      }
    }

    return {
      items,
      total: items.length,
      page,
      limit,
      totalPages: Math.max(1, Math.ceil(items.length / limit)),
    };
  }

  public async delete(id: UUID): Promise<boolean> {
    try {
      const result = await db
        .delete(attendanceRecords)
        .where(eq(attendanceRecords.id, id))
        .returning();

      if (result.length > 0) return true;
    } catch (err) {
      logger.error("[AttendanceRecordsRepository] Drizzle delete error", err);
    }

    try {
      const { error } = await supabase.from("attendance_records").delete().eq("id", id);
      return !error;
    } catch {
      return false;
    }
  }
}
