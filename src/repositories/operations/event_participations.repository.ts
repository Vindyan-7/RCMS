/**
 * Operations Domain - Event Participations Repository Implementation
 */

import { eq, and, sql } from "drizzle-orm";
import { db, supabase, toCamelCase, toSnakeCase } from "@/db";
import { eventParticipations, EventParticipationSelect, EventParticipationInsert } from "@/db/schema";
import { PaginatedResult } from "@/core/repository/repository.types";
import { UUID, PaginationQuery } from "@/core/types";
import { logger } from "@/core/logger";

export class EventParticipationsRepository {
  public async findById(id: UUID): Promise<EventParticipationSelect | null> {
    try {
      const result = await db
        .select()
        .from(eventParticipations)
        .where(eq(eventParticipations.id, id))
        .limit(1);

      if (result[0]) return result[0];
    } catch (err) {
      logger.error("[EventParticipationsRepository] Drizzle findById error", err);
    }

    try {
      const { data } = await supabase.from("event_participations").select("*").eq("id", id).limit(1);
      if (data && data[0]) return toCamelCase<EventParticipationSelect>(data[0]);
    } catch {}

    return null;
  }

  public async findByEventAndMember(
    eventId: UUID,
    memberId: UUID
  ): Promise<EventParticipationSelect | null> {
    try {
      const result = await db
        .select()
        .from(eventParticipations)
        .where(
          and(
            eq(eventParticipations.eventId, eventId),
            eq(eventParticipations.memberId, memberId)
          )
        )
        .limit(1);

      if (result[0]) return result[0];
    } catch (err) {
      logger.error("[EventParticipationsRepository] Drizzle findByEventAndMember error", err);
    }

    try {
      const { data } = await supabase
        .from("event_participations")
        .select("*")
        .eq("event_id", eventId)
        .eq("member_id", memberId)
        .limit(1);
      if (data && data[0]) return toCamelCase<EventParticipationSelect>(data[0]);
    } catch {}

    return null;
  }

  public async getByEventId(
    eventId: UUID,
    query: PaginationQuery
  ): Promise<PaginatedResult<EventParticipationSelect>> {
    const page = query.page || 1;
    const limit = query.limit || 1000;
    const offset = (page - 1) * limit;

    let items: EventParticipationSelect[] = [];
    try {
      items = await db
        .select()
        .from(eventParticipations)
        .where(eq(eventParticipations.eventId, eventId))
        .limit(limit)
        .offset(offset);
    } catch (err) {
      logger.error("[EventParticipationsRepository] Drizzle getByEventId error", err);
    }

    if (items.length === 0) {
      try {
        const { data } = await supabase
          .from("event_participations")
          .select("*")
          .eq("event_id", eventId);
        if (data && data.length > 0) {
          items = toCamelCase<EventParticipationSelect[]>(data);
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
  ): Promise<PaginatedResult<EventParticipationSelect>> {
    const page = query.page || 1;
    const limit = query.limit || 1000;
    const offset = (page - 1) * limit;

    let items: EventParticipationSelect[] = [];
    try {
      items = await db
        .select()
        .from(eventParticipations)
        .where(eq(eventParticipations.memberId, memberId))
        .limit(limit)
        .offset(offset);
    } catch (err) {
      logger.error("[EventParticipationsRepository] Drizzle getByMemberId error", err);
    }

    if (items.length === 0) {
      try {
        const { data } = await supabase
          .from("event_participations")
          .select("*")
          .eq("member_id", memberId);
        if (data && data.length > 0) {
          items = toCamelCase<EventParticipationSelect[]>(data);
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

  public async create(data: EventParticipationInsert): Promise<EventParticipationSelect> {
    try {
      const result = await db.insert(eventParticipations).values(data).returning();
      if (result[0]) return result[0];
    } catch (err) {
      logger.error("[EventParticipationsRepository] Drizzle create error, falling back to REST API", err);
    }

    const snakePayload = toSnakeCase(data);
    const { data: restResult, error } = await supabase
      .from("event_participations")
      .insert(snakePayload)
      .select()
      .single();

    if (error || !restResult) {
      throw new Error(`[EventParticipationsRepository] Create failed: ${error?.message}`);
    }
    return toCamelCase<EventParticipationSelect>(restResult);
  }

  public async delete(id: UUID): Promise<boolean> {
    try {
      const result = await db
        .delete(eventParticipations)
        .where(eq(eventParticipations.id, id))
        .returning();

      if (result.length > 0) return true;
    } catch (err) {
      logger.error("[EventParticipationsRepository] Drizzle delete error", err);
    }

    try {
      const { error } = await supabase.from("event_participations").delete().eq("id", id);
      return !error;
    } catch {
      return false;
    }
  }
}
