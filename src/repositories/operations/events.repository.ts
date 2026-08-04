/**
 * Operations Domain - Events Repository Implementation
 */

import { eq, and, isNull, sql } from "drizzle-orm";
import { db, supabase, toCamelCase } from "@/db";
import { events, EventSelect, EventInsert } from "@/db/schema";
import { BaseRepository } from "@/core/repository/base-repository";
import { PaginatedResult, QueryOptions } from "@/core/repository/repository.types";
import { UUID, PaginationQuery } from "@/core/types";
import { logger } from "@/core/logger";

export class EventsRepository extends BaseRepository<
  EventSelect,
  EventInsert,
  Partial<EventInsert>
> {
  protected getTableName(): string {
    return "events";
  }

  public async findById(
    id: UUID,
    options?: { includeDeleted?: boolean }
  ): Promise<EventSelect | null> {
    const conditions = [eq(events.id, id)];
    if (!options?.includeDeleted) {
      conditions.push(isNull(events.deletedAt));
    }

    try {
      const result = await db
        .select()
        .from(events)
        .where(and(...conditions))
        .limit(1);

      if (result[0]) return result[0];
    } catch (err) {
      logger.error("[EventsRepository] Drizzle findById error", err);
    }

    try {
      const { data } = await supabase.from("events").select("*").eq("id", id).limit(1);
      if (data && data[0]) return toCamelCase<EventSelect>(data[0]);
    } catch {}

    return null;
  }

  public async findAll(
    query: PaginationQuery,
    options?: QueryOptions
  ): Promise<PaginatedResult<EventSelect>> {
    const page = query.page || 1;
    const limit = query.limit || 1000;
    const offset = (page - 1) * limit;

    const conditions = [];
    if (!options?.includeDeleted) {
      conditions.push(isNull(events.deletedAt));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    let items: EventSelect[] = [];
    try {
      items = await db
        .select()
        .from(events)
        .where(whereClause)
        .limit(limit)
        .offset(offset);
    } catch (err) {
      logger.error("[EventsRepository] Drizzle findAll error", err);
    }

    if (items.length === 0) {
      try {
        const { data } = await supabase.from("events").select("*").is("deleted_at", null);
        if (data && data.length > 0) {
          items = toCamelCase<EventSelect[]>(data);
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

  public async create(data: EventInsert, creatorId: UUID): Promise<EventSelect> {
    const audit = this.getAuditFields(creatorId, "create");
    const payload = {
      ...data,
      ...audit,
    };

    const result = await db.insert(events).values(payload).returning();
    return result[0];
  }

  public async update(
    id: UUID,
    data: Partial<EventInsert>,
    updaterId: UUID
  ): Promise<EventSelect> {
    const audit = this.getAuditFields(updaterId, "update");
    const payload = {
      ...data,
      ...audit,
    };

    const result = await db
      .update(events)
      .set(payload)
      .where(and(eq(events.id, id), isNull(events.deletedAt)))
      .returning();

    return result[0];
  }

  public async delete(id: UUID, deleterId: UUID): Promise<boolean> {
    const timestamp = new Date();
    const result = await db
      .update(events)
      .set({
        deletedAt: timestamp,
        deletedBy: deleterId,
        updatedAt: timestamp,
        updatedBy: deleterId,
      })
      .where(and(eq(events.id, id), isNull(events.deletedAt)))
      .returning();

    return result.length > 0;
  }

  public async restore(id: UUID, restorerId: UUID): Promise<boolean> {
    const timestamp = new Date();
    const result = await db
      .update(events)
      .set({
        deletedAt: null,
        deletedBy: null,
        updatedAt: timestamp,
        updatedBy: restorerId,
      })
      .where(eq(events.id, id))
      .returning();

    return result.length > 0;
  }

  public async purge(id: UUID): Promise<boolean> {
    const result = await db.delete(events).where(eq(events.id, id)).returning();
    return result.length > 0;
  }
}
