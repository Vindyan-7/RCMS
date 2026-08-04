/**
 * Academic Domain - Semesters Repository Implementation
 */

import { eq, and, isNull, sql, desc } from "drizzle-orm";
import { db, supabase, toCamelCase, toSnakeCase, isServerless } from "@/db";
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
    if (isServerless) {
      try {
        const { data } = await supabase.from("semesters").select("*").eq("id", id).limit(1);
        if (data && data[0]) return toCamelCase<SemesterSelect>(data[0]);
      } catch {}
      return null;
    }

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
    if (isServerless) {
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
        logger.error("[SemestersRepository] REST query error", restErr);
      }
      return null;
    }

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

    let items: SemesterSelect[] = [];
    if (isServerless) {
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
    } else {
      const conditions = [];
      if (!options?.includeDeleted) {
        conditions.push(isNull(semesters.deletedAt));
      }
      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

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

    try {
      const result = await db.insert(semesters).values(payload).returning();
      if (result[0]) return result[0];
    } catch {}

    const snakePayload = toSnakeCase(payload);
    const { data: restResult, error } = await supabase
      .from("semesters")
      .insert(snakePayload)
      .select()
      .single();

    if (error || !restResult) {
      throw new Error(`[SemestersRepository] Create failed: ${error?.message}`);
    }
    return toCamelCase<SemesterSelect>(restResult);
  }

  public async update(
    id: UUID,
    data: Partial<SemesterInsert>,
    updaterId: UUID
  ): Promise<SemesterSelect> {
    const audit = this.getAuditFields(updaterId, "update");
    const payload = { ...data, ...audit };

    try {
      const result = await db
        .update(semesters)
        .set(payload)
        .where(and(eq(semesters.id, id), isNull(semesters.deletedAt)))
        .returning();
      if (result[0]) return result[0];
    } catch {}

    const snakePayload = toSnakeCase(payload);
    const { data: restResult, error } = await supabase
      .from("semesters")
      .update(snakePayload)
      .eq("id", id)
      .select()
      .single();

    if (error || !restResult) {
      throw new Error(`[SemestersRepository] Update failed: ${error?.message}`);
    }
    return toCamelCase<SemesterSelect>(restResult);
  }

  public async delete(id: UUID, deleterId: UUID): Promise<boolean> {
    const timestamp = new Date();
    try {
      const result = await db
        .update(semesters)
        .set({ deletedAt: timestamp, deletedBy: deleterId, updatedAt: timestamp, updatedBy: deleterId })
        .where(and(eq(semesters.id, id), isNull(semesters.deletedAt)))
        .returning();
      if (result.length > 0) return true;
    } catch {}

    try {
      const { error } = await supabase
        .from("semesters")
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

  public async purge(id: UUID): Promise<boolean> {
    try {
      const result = await db.delete(semesters).where(eq(semesters.id, id)).returning();
      if (result.length > 0) return true;
    } catch {}

    try {
      const { error } = await supabase.from("semesters").delete().eq("id", id);
      return !error;
    } catch {
      return false;
    }
  }
}
