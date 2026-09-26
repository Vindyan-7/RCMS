/**
 * Events Domain - Event Submissions Repository Implementation
 * Dual-tier execution: Drizzle ORM primary + Supabase PostgREST API fallback
 */

import { eq, and, sql, desc, asc } from "drizzle-orm";
import { db, supabase, toCamelCase, toSnakeCase, isServerless } from "@/db";
import { eventSubmissions, EventSubmissionSelect, EventSubmissionInsert } from "@/db/schema";
import { UUID } from "@/core/types";
import { logger } from "@/core/logger";

export class EventSubmissionsRepository {
  public async findById(id: UUID): Promise<EventSubmissionSelect | null> {
    if (isServerless) {
      try {
        const { data } = await supabase.from("event_submissions").select("*").eq("id", id).limit(1);
        if (data && data[0]) return toCamelCase<EventSubmissionSelect>(data[0]);
      } catch (err) {
        logger.error("[EventSubmissionsRepository] REST findById error", err);
      }
    }

    try {
      const result = await db
        .select()
        .from(eventSubmissions)
        .where(eq(eventSubmissions.id, id))
        .limit(1);

      if (result[0]) return result[0];
    } catch (err) {
      logger.error("[EventSubmissionsRepository] Drizzle findById error", err);
    }

    try {
      const { data } = await supabase.from("event_submissions").select("*").eq("id", id).limit(1);
      if (data && data[0]) return toCamelCase<EventSubmissionSelect>(data[0]);
    } catch {}

    return null;
  }

  public async findByEventAndParticipant(
    eventId: UUID,
    participantId: UUID
  ): Promise<EventSubmissionSelect | null> {
    if (isServerless) {
      try {
        const { data } = await supabase
          .from("event_submissions")
          .select("*")
          .eq("event_id", eventId)
          .eq("participant_id", participantId)
          .limit(1);
        if (data && data[0]) return toCamelCase<EventSubmissionSelect>(data[0]);
      } catch (err) {
        logger.error("[EventSubmissionsRepository] REST findByEventAndParticipant error", err);
      }
    }

    try {
      const result = await db
        .select()
        .from(eventSubmissions)
        .where(
          and(
            eq(eventSubmissions.eventId, eventId),
            eq(eventSubmissions.participantId, participantId)
          )
        )
        .limit(1);

      if (result[0]) return result[0];
    } catch (err) {
      logger.error("[EventSubmissionsRepository] Drizzle findByEventAndParticipant error", err);
    }

    try {
      const { data } = await supabase
        .from("event_submissions")
        .select("*")
        .eq("event_id", eventId)
        .eq("participant_id", participantId)
        .limit(1);
      if (data && data[0]) return toCamelCase<EventSubmissionSelect>(data[0]);
    } catch {}

    return null;
  }

  public async findByEvent(
    eventId: UUID,
    status?: string
  ): Promise<EventSubmissionSelect[]> {
    if (isServerless) {
      try {
        let req = supabase.from("event_submissions").select("*").eq("event_id", eventId);
        if (status) req = req.eq("status", status);
        const { data } = await req.order("created_at", { ascending: false });
        if (data) return toCamelCase<EventSubmissionSelect[]>(data);
      } catch (err) {
        logger.error("[EventSubmissionsRepository] REST findByEvent error", err);
      }
    }

    try {
      const conditions = [eq(eventSubmissions.eventId, eventId)];
      if (status) conditions.push(eq(eventSubmissions.status, status));

      const rows = await db
        .select()
        .from(eventSubmissions)
        .where(and(...conditions))
        .orderBy(desc(eventSubmissions.createdAt));

      if (rows && rows.length > 0) return rows;
    } catch (err) {
      logger.error("[EventSubmissionsRepository] Drizzle findByEvent error", err);
    }

    try {
      let req = supabase.from("event_submissions").select("*").eq("event_id", eventId);
      if (status) req = req.eq("status", status);
      const { data } = await req.order("created_at", { ascending: false });
      if (data) return toCamelCase<EventSubmissionSelect[]>(data);
    } catch {}

    return [];
  }

  public async findPublishedByEvent(
    eventId: UUID
  ): Promise<EventSubmissionSelect[]> {
    return this.findByEvent(eventId, "published");
  }

  public async create(data: EventSubmissionInsert): Promise<EventSubmissionSelect> {
    if (isServerless) {
      try {
        const snakePayload = toSnakeCase(data);
        const { data: restResult, error } = await supabase
          .from("event_submissions")
          .insert(snakePayload)
          .select()
          .single();

        if (!error && restResult) {
          return toCamelCase<EventSubmissionSelect>(restResult);
        }
      } catch (err) {
        logger.error("[EventSubmissionsRepository] REST create error", err);
      }
    }

    try {
      const result = await db.insert(eventSubmissions).values(data).returning();
      if (result[0]) return result[0];
    } catch (err) {
      logger.error("[EventSubmissionsRepository] Drizzle create error, falling back to REST", err);
    }

    const snakePayload = toSnakeCase(data);
    const { data: restResult, error } = await supabase
      .from("event_submissions")
      .insert(snakePayload)
      .select()
      .single();

    if (error || !restResult) {
      throw new Error(`[EventSubmissionsRepository] Create failed: ${error?.message || "Unknown error"}`);
    }

    return toCamelCase<EventSubmissionSelect>(restResult);
  }

  public async updateStatus(
    id: UUID,
    status: string,
    adminFeedback?: string
  ): Promise<EventSubmissionSelect> {
    const payload: any = {
      status,
      updatedAt: new Date(),
    };
    if (adminFeedback !== undefined) {
      payload.adminFeedback = adminFeedback;
    }

    if (isServerless) {
      try {
        const snakePayload = toSnakeCase(payload);
        const { data: updated, error } = await supabase
          .from("event_submissions")
          .update(snakePayload)
          .eq("id", id)
          .select()
          .single();

        if (!error && updated) {
          return toCamelCase<EventSubmissionSelect>(updated);
        }
      } catch (err) {
        logger.error("[EventSubmissionsRepository] REST updateStatus error", err);
      }
    }

    try {
      const result = await db
        .update(eventSubmissions)
        .set(payload)
        .where(eq(eventSubmissions.id, id))
        .returning();

      if (result[0]) return result[0];
    } catch (err) {
      logger.error("[EventSubmissionsRepository] Drizzle updateStatus error", err);
    }

    const snakePayload = toSnakeCase(payload);
    const { data: updated, error } = await supabase
      .from("event_submissions")
      .update(snakePayload)
      .eq("id", id)
      .select()
      .single();

    if (error || !updated) {
      throw new Error(`[EventSubmissionsRepository] Update status failed: ${error?.message || "Unknown error"}`);
    }

    return toCamelCase<EventSubmissionSelect>(updated);
  }

  public async updateWinnerRank(
    id: UUID,
    winnerRank: number | null
  ): Promise<EventSubmissionSelect> {
    const payload = {
      winnerRank,
      updatedAt: new Date(),
    };

    if (isServerless) {
      try {
        const snakePayload = toSnakeCase(payload);
        const { data: updated, error } = await supabase
          .from("event_submissions")
          .update(snakePayload)
          .eq("id", id)
          .select()
          .single();

        if (!error && updated) {
          return toCamelCase<EventSubmissionSelect>(updated);
        }
      } catch (err) {
        logger.error("[EventSubmissionsRepository] REST updateWinnerRank error", err);
      }
    }

    try {
      const result = await db
        .update(eventSubmissions)
        .set(payload)
        .where(eq(eventSubmissions.id, id))
        .returning();

      if (result[0]) return result[0];
    } catch (err) {
      logger.error("[EventSubmissionsRepository] Drizzle updateWinnerRank error", err);
    }

    const snakePayload = toSnakeCase(payload);
    const { data: updated, error } = await supabase
      .from("event_submissions")
      .update(snakePayload)
      .eq("id", id)
      .select()
      .single();

    if (error || !updated) {
      throw new Error(`[EventSubmissionsRepository] Update winner rank failed: ${error?.message || "Unknown error"}`);
    }

    return toCamelCase<EventSubmissionSelect>(updated);
  }

  public async countByEvent(
    eventId: UUID
  ): Promise<{ total: number; published: number; submitted: number; rejected: number; hidden: number }> {
    try {
      const rows = await db
        .select({
          status: eventSubmissions.status,
          count: sql<number>`count(*)`,
        })
        .from(eventSubmissions)
        .where(eq(eventSubmissions.eventId, eventId))
        .groupBy(eventSubmissions.status);

      let total = 0;
      let published = 0;
      let submitted = 0;
      let rejected = 0;
      let hidden = 0;

      for (const r of rows) {
        const c = Number(r.count || 0);
        total += c;
        if (r.status === "published") published += c;
        if (r.status === "submitted") submitted += c;
        if (r.status === "rejected") rejected += c;
        if (r.status === "hidden") hidden += c;
      }

      return { total, published, submitted, rejected, hidden };
    } catch (err) {
      logger.error("[EventSubmissionsRepository] Drizzle countByEvent error", err);
    }

    try {
      const { data } = await supabase
        .from("event_submissions")
        .select("status")
        .eq("event_id", eventId);

      if (data) {
        let total = data.length;
        let published = 0;
        let submitted = 0;
        let rejected = 0;
        let hidden = 0;
        for (const row of data) {
          if (row.status === "published") published++;
          if (row.status === "submitted") submitted++;
          if (row.status === "rejected") rejected++;
          if (row.status === "hidden") hidden++;
        }
        return { total, published, submitted, rejected, hidden };
      }
    } catch {}

    return { total: 0, published: 0, submitted: 0, rejected: 0, hidden: 0 };
  }
}
