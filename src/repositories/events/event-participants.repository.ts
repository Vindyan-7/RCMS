/**
 * Events Domain - Event Participants Repository Implementation
 * Dual-tier execution: Drizzle ORM primary + Supabase PostgREST API fallback
 */

import { eq, and, sql } from "drizzle-orm";
import { db, supabase, toCamelCase, toSnakeCase, isServerless } from "@/db";
import { eventParticipants, EventParticipantSelect, EventParticipantInsert } from "@/db/schema";
import { PaginatedResult } from "@/core/repository/repository.types";
import { UUID, PaginationQuery } from "@/core/types";
import { logger } from "@/core/logger";

export class EventParticipantsRepository {
  public async findById(id: UUID): Promise<EventParticipantSelect | null> {
    if (isServerless) {
      try {
        const { data } = await supabase.from("event_participants").select("*").eq("id", id).limit(1);
        if (data && data[0]) return toCamelCase<EventParticipantSelect>(data[0]);
      } catch (err) {
        logger.error("[EventParticipantsRepository] REST findById error", err);
      }
    }

    try {
      const result = await db
        .select()
        .from(eventParticipants)
        .where(eq(eventParticipants.id, id))
        .limit(1);

      if (result[0]) return result[0];
    } catch (err) {
      logger.error("[EventParticipantsRepository] Drizzle findById error", err);
    }

    try {
      const { data } = await supabase.from("event_participants").select("*").eq("id", id).limit(1);
      if (data && data[0]) return toCamelCase<EventParticipantSelect>(data[0]);
    } catch {}

    return null;
  }

  public async findByEventAndMemberId(
    eventId: UUID,
    memberId: UUID
  ): Promise<EventParticipantSelect | null> {
    if (isServerless) {
      try {
        const { data } = await supabase
          .from("event_participants")
          .select("*")
          .eq("event_id", eventId)
          .eq("member_id", memberId)
          .limit(1);
        if (data && data[0]) return toCamelCase<EventParticipantSelect>(data[0]);
      } catch (err) {
        logger.error("[EventParticipantsRepository] REST findByEventAndMemberId error", err);
      }
    }

    try {
      const result = await db
        .select()
        .from(eventParticipants)
        .where(
          and(
            eq(eventParticipants.eventId, eventId),
            eq(eventParticipants.memberId, memberId)
          )
        )
        .limit(1);

      if (result[0]) return result[0];
    } catch (err) {
      logger.error("[EventParticipantsRepository] Drizzle findByEventAndMemberId error", err);
    }

    try {
      const { data } = await supabase
        .from("event_participants")
        .select("*")
        .eq("event_id", eventId)
        .eq("member_id", memberId)
        .limit(1);
      if (data && data[0]) return toCamelCase<EventParticipantSelect>(data[0]);
    } catch {}

    return null;
  }

  public async findByEventAndNormalizedMobile(
    eventId: UUID,
    normalizedMobile: string
  ): Promise<EventParticipantSelect | null> {
    if (isServerless) {
      try {
        const { data } = await supabase
          .from("event_participants")
          .select("*")
          .eq("event_id", eventId)
          .eq("normalized_mobile", normalizedMobile)
          .limit(1);
        if (data && data[0]) return toCamelCase<EventParticipantSelect>(data[0]);
      } catch (err) {
        logger.error("[EventParticipantsRepository] REST findByEventAndNormalizedMobile error", err);
      }
    }

    try {
      const result = await db
        .select()
        .from(eventParticipants)
        .where(
          and(
            eq(eventParticipants.eventId, eventId),
            eq(eventParticipants.normalizedMobile, normalizedMobile)
          )
        )
        .limit(1);

      if (result[0]) return result[0];
    } catch (err) {
      logger.error("[EventParticipantsRepository] Drizzle findByEventAndNormalizedMobile error", err);
    }

    try {
      const { data } = await supabase
        .from("event_participants")
        .select("*")
        .eq("event_id", eventId)
        .eq("normalized_mobile", normalizedMobile)
        .limit(1);
      if (data && data[0]) return toCamelCase<EventParticipantSelect>(data[0]);
    } catch {}

    return null;
  }

  public async create(data: EventParticipantInsert): Promise<EventParticipantSelect> {
    if (isServerless) {
      try {
        const snakePayload = toSnakeCase(data);
        const { data: restResult, error } = await supabase
          .from("event_participants")
          .insert(snakePayload)
          .select()
          .single();

        if (!error && restResult) {
          return toCamelCase<EventParticipantSelect>(restResult);
        }
      } catch (err) {
        logger.error("[EventParticipantsRepository] REST create error", err);
      }
    }

    try {
      const result = await db.insert(eventParticipants).values(data).returning();
      if (result[0]) return result[0];
    } catch (err) {
      logger.error("[EventParticipantsRepository] Drizzle create error, attempting REST fallback", err);
    }

    const snakePayload = toSnakeCase(data);
    const { data: restResult, error } = await supabase
      .from("event_participants")
      .insert(snakePayload)
      .select()
      .single();

    if (error || !restResult) {
      throw new Error(`[EventParticipantsRepository] Create failed: ${error?.message || "Unknown error"}`);
    }

    return toCamelCase<EventParticipantSelect>(restResult);
  }

  public async update(
    id: UUID,
    data: Partial<EventParticipantInsert>
  ): Promise<EventParticipantSelect> {
    const updatePayload = {
      ...data,
      updatedAt: new Date(),
    };

    if (isServerless) {
      try {
        const snakePayload = toSnakeCase(updatePayload);
        const { data: restResult, error } = await supabase
          .from("event_participants")
          .update(snakePayload)
          .eq("id", id)
          .select()
          .single();

        if (!error && restResult) {
          return toCamelCase<EventParticipantSelect>(restResult);
        }
      } catch (err) {
        logger.error("[EventParticipantsRepository] REST update error", err);
      }
    }

    try {
      const result = await db
        .update(eventParticipants)
        .set(updatePayload)
        .where(eq(eventParticipants.id, id))
        .returning();

      if (result[0]) return result[0];
    } catch (err) {
      logger.error("[EventParticipantsRepository] Drizzle update error, attempting REST fallback", err);
    }

    const snakePayload = toSnakeCase(updatePayload);
    const { data: restResult, error } = await supabase
      .from("event_participants")
      .update(snakePayload)
      .eq("id", id)
      .select()
      .single();

    if (error || !restResult) {
      throw new Error(`[EventParticipantsRepository] Update failed: ${error?.message || "Unknown error"}`);
    }

    return toCamelCase<EventParticipantSelect>(restResult);
  }

  public async findByEvent(
    eventId: UUID,
    query: PaginationQuery = {}
  ): Promise<PaginatedResult<EventParticipantSelect>> {
    const page = query.page || 1;
    const limit = query.limit || 1000;
    const offset = (page - 1) * limit;

    let items: EventParticipantSelect[] = [];
    try {
      items = await db
        .select()
        .from(eventParticipants)
        .where(eq(eventParticipants.eventId, eventId))
        .limit(limit)
        .offset(offset);
    } catch (err) {
      logger.error("[EventParticipantsRepository] Drizzle findByEvent error", err);
    }

    if (items.length === 0) {
      try {
        const { data } = await supabase
          .from("event_participants")
          .select("*")
          .eq("event_id", eventId)
          .range(offset, offset + limit - 1);

        if (data && data.length > 0) {
          items = toCamelCase<EventParticipantSelect[]>(data);
        }
      } catch (err) {
        logger.error("[EventParticipantsRepository] REST findByEvent error", err);
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

  public async getParticipantStats(
    eventId: UUID
  ): Promise<{ total: number; members: number; freshers: number }> {
    try {
      const rows = await db
        .select({
          participantType: eventParticipants.participantType,
          count: sql<number>`count(*)`,
        })
        .from(eventParticipants)
        .where(eq(eventParticipants.eventId, eventId))
        .groupBy(eventParticipants.participantType);

      let membersCount = 0;
      let freshersCount = 0;
      for (const row of rows) {
        const count = Number(row.count || 0);
        if (row.participantType === "member") membersCount += count;
        if (row.participantType === "fresher") freshersCount += count;
      }

      return {
        total: membersCount + freshersCount,
        members: membersCount,
        freshers: freshersCount,
      };
    } catch (err) {
      logger.error("[EventParticipantsRepository] Drizzle stats error, falling back to REST", err);
    }

    try {
      const { data } = await supabase
        .from("event_participants")
        .select("participant_type")
        .eq("event_id", eventId);

      if (data) {
        let membersCount = 0;
        let freshersCount = 0;
        for (const row of data) {
          if (row.participant_type === "member") membersCount++;
          if (row.participant_type === "fresher") freshersCount++;
        }
        return {
          total: data.length,
          members: membersCount,
          freshers: freshersCount,
        };
      }
    } catch {}

    return { total: 0, members: 0, freshers: 0 };
  }
}
