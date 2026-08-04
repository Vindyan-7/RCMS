/**
 * Academic Domain - Semesters Repository Implementation
 */

import { eq, and, isNull, sql, desc } from "drizzle-orm";
import { db, supabase, toCamelCase } from "@/db";
import { semesters, SemesterSelect, SemesterInsert } from "@/db/schema";
import { BaseRepository } from "@/core/repository/base-repository";
import { PaginatedResult, QueryOptions } from "@/core/repository/repository.types";
import { UUID, PaginationQuery } from "@/core/types";
import { logger } from "@/core/logger";

export class SemestersRepository extends BaseRepository<
  SemesterSelect,
  SemesterInsert,
  Partial<SemesterInsert>
> {
  protected getTableName(): string {
    return "semesters";
  }

  public async findById(
    id: UUID,
    options?: { includeDeleted?: boolean }
  ): Promise<SemesterSelect | null> {
    const conditions = [eq(semesters.id, id)];
    if (!options?.includeDeleted) {
      conditions.push(isNull(semesters.deletedAt));
    }

    try {
      const result = await db
        .select()
        .from(semesters)
        .where(and(...conditions))
        .limit(1);

      if (result[0]) return result[0];
    } catch (err) {
      logger.error("[SemestersRepository] Drizzle findById error", err);
    }

    try {
      const { data } = await supabase.from("semesters").select("*").eq("id", id).limit(1);
      if (data && data[0]) return toCamelCase<SemesterSelect>(data[0]);
    } catch {}

    return null;
  }

  public async findActive(): Promise<SemesterSelect | null> {
    try {
      const result = await db
        .select()
        .from(semesters)
        .where(and(eq(semesters.status, "active"), isNull(semesters.deletedAt)))
        .orderBy(desc(semesters.startDate))
        .limit(1);

      if (result[0]) return result[0];
    } catch (err) {
      logger.error("[SemestersRepository] Drizzle findActive error, falling back to REST API", err);
    }

    try {
      const { data } = await supabase
        .from("semesters")
        .select("*")
        .eq("status", "active")
        .is("deleted_at", null)
        .order("start_date", { ascending: false })
        .limit(1);

      if (data && data[0]) {
        return toCamelCase<SemesterSelect>(data[0]);
      }
    } catch (restErr) {
      logger.error("[SemestersRepository] REST fallback error", restErr);
    }

    return null;
  }

  public async findAll(
    query: PaginationQuery,
    options?: QueryOptions
  ): Promise<PaginatedResult<SemesterSelect>> {
    const page = query.page || 1;
    const limit = query.limit || 50;
    const offset = (page - 1) * limit;

    const conditions = [];
    if (!options?.includeDeleted) {
      conditions.push(isNull(semesters.deletedAt));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    let items: SemesterSelect[] = [];
    try {
      items = await db
        .select()
        .from(semesters)
        .where(whereClause)
        .orderBy(desc(semesters.startDate))
        .limit(limit)
        .offset(offset);
    } catch (err) {
      logger.error("[SemestersRepository] Drizzle findAll error", err);
    }

    if (items.length === 0) {
      try {
        const { data } = await supabase
          .from("semesters")
          .select("*")
          .is("deleted_at", null)
          .order("start_date", { ascending: false });
        if (data && data.length > 0) {
          items = toCamelCase<SemesterSelect[]>(data);
        }
      } catch {}
    }

    return {
      items,
      total: items.length,
      page,
      limit,
      totalPages: this.calculateTotalPages(items.length, limit),
    };
  }

  public async create(data: SemesterInsert, creatorId: UUID): Promise<SemesterSelect> {
    const audit = this.getAuditFields(creatorId, "create");
    const payload = { ...data, ...audit };
    const result = await db.insert(semesters).values(payload).returning();
    return result[0];
  }

  public async update(
    id: UUID,
    data: Partial<SemesterInsert>,
    updaterId: UUID
  ): Promise<SemesterSelect> {
    const audit = this.getAuditFields(updaterId, "update");
    const result = await db
      .update(semesters)
      .set({ ...data, ...audit })
      .where(and(eq(semesters.id, id), isNull(semesters.deletedAt)))
      .returning();
    return result[0];
  }

  public async delete(id: UUID, deleterId: UUID): Promise<boolean> {
    const timestamp = new Date();
    const result = await db
      .update(semesters)
      .set({ deletedAt: timestamp, deletedBy: deleterId, updatedAt: timestamp, updatedBy: deleterId })
      .where(and(eq(semesters.id, id), isNull(semesters.deletedAt)))
      .returning();
    return result.length > 0;
  }

  public async purge(id: UUID): Promise<boolean> {
    const result = await db
      .delete(semesters)
      .where(eq(semesters.id, id))
      .returning();
    return result.length > 0;
  }
}
