/**
 * Events Domain - Event Votes Repository Implementation
 * Dual-tier execution: Drizzle ORM primary + Supabase PostgREST API fallback
 * Supports configurable votes_per_participant (1 or N votes per participant)
 */

import { eq, and, sql, desc, asc } from "drizzle-orm";
import { db, supabase, toCamelCase, toSnakeCase, isServerless } from "@/db";
import { eventVotes, eventSubmissions, EventVoteSelect, EventVoteInsert } from "@/db/schema";
import { UUID } from "@/core/types";
import { logger } from "@/core/logger";

export class EventVotesRepository {
  /**
   * Finds a vote by participant. If submissionId is provided, finds that exact vote.
   */
  public async findVote(
    eventId: UUID,
    voterParticipantId: UUID,
    submissionId?: UUID
  ): Promise<EventVoteSelect | null> {
    if (isServerless) {
      try {
        let query = supabase
          .from("event_votes")
          .select("*")
          .eq("event_id", eventId)
          .eq("voter_participant_id", voterParticipantId);

        if (submissionId) {
          query = query.eq("submission_id", submissionId);
        }

        const { data } = await query.limit(1);
        if (data && data[0]) return toCamelCase<EventVoteSelect>(data[0]);
      } catch (err) {
        logger.error("[EventVotesRepository] REST findVote error", err);
      }
    }

    try {
      const conditions = [
        eq(eventVotes.eventId, eventId),
        eq(eventVotes.voterParticipantId, voterParticipantId),
      ];

      if (submissionId) {
        conditions.push(eq(eventVotes.submissionId, submissionId));
      }

      const result = await db
        .select()
        .from(eventVotes)
        .where(and(...conditions))
        .limit(1);

      if (result[0]) return result[0];
    } catch (err) {
      logger.error("[EventVotesRepository] Drizzle findVote error", err);
    }

    try {
      let query = supabase
        .from("event_votes")
        .select("*")
        .eq("event_id", eventId)
        .eq("voter_participant_id", voterParticipantId);

      if (submissionId) {
        query = query.eq("submission_id", submissionId);
      }

      const { data } = await query.limit(1);
      if (data && data[0]) return toCamelCase<EventVoteSelect>(data[0]);
    } catch {}

    return null;
  }

  /**
   * Retrieves all votes cast by a participant for an event
   */
  public async findVotesByParticipant(
    eventId: UUID,
    voterParticipantId: UUID
  ): Promise<EventVoteSelect[]> {
    if (isServerless) {
      try {
        const { data } = await supabase
          .from("event_votes")
          .select("*")
          .eq("event_id", eventId)
          .eq("voter_participant_id", voterParticipantId);

        if (data) return toCamelCase<EventVoteSelect[]>(data);
      } catch (err) {
        logger.error("[EventVotesRepository] REST findVotesByParticipant error", err);
      }
    }

    try {
      const rows = await db
        .select()
        .from(eventVotes)
        .where(
          and(
            eq(eventVotes.eventId, eventId),
            eq(eventVotes.voterParticipantId, voterParticipantId)
          )
        );

      return rows;
    } catch (err) {
      logger.error("[EventVotesRepository] Drizzle findVotesByParticipant error", err);
    }

    try {
      const { data } = await supabase
        .from("event_votes")
        .select("*")
        .eq("event_id", eventId)
        .eq("voter_participant_id", voterParticipantId);

      if (data) return toCamelCase<EventVoteSelect[]>(data);
    } catch {}

    return [];
  }

  /**
   * Counts the total votes cast by a participant in an event
   */
  public async countVotesByParticipant(
    eventId: UUID,
    voterParticipantId: UUID
  ): Promise<number> {
    try {
      const rows = await db
        .select({ count: sql<number>`count(*)` })
        .from(eventVotes)
        .where(
          and(
            eq(eventVotes.eventId, eventId),
            eq(eventVotes.voterParticipantId, voterParticipantId)
          )
        );

      return Number(rows[0]?.count || 0);
    } catch (err) {
      logger.error("[EventVotesRepository] Drizzle countVotesByParticipant error", err);
    }

    try {
      const { count } = await supabase
        .from("event_votes")
        .select("*", { count: "exact", head: true })
        .eq("event_id", eventId)
        .eq("voter_participant_id", voterParticipantId);

      return count || 0;
    } catch {}

    return 0;
  }

  /**
   * Inserts a new vote
   */
  public async insertVote(
    eventId: UUID,
    voterParticipantId: UUID,
    submissionId: UUID
  ): Promise<EventVoteSelect> {
    const payload: EventVoteInsert = {
      eventId,
      voterParticipantId,
      submissionId,
    };

    if (isServerless) {
      try {
        const snakePayload = toSnakeCase(payload);
        const { data: inserted, error } = await supabase
          .from("event_votes")
          .insert(snakePayload)
          .select()
          .single();

        if (!error && inserted) {
          return toCamelCase<EventVoteSelect>(inserted);
        }
      } catch (err) {
        logger.error("[EventVotesRepository] REST insertVote error", err);
      }
    }

    try {
      const result = await db.insert(eventVotes).values(payload).returning();
      if (result[0]) return result[0];
    } catch (err) {
      logger.error("[EventVotesRepository] Drizzle insertVote error, falling back to REST", err);
    }

    const snakePayload = toSnakeCase(payload);
    const { data: inserted, error } = await supabase
      .from("event_votes")
      .insert(snakePayload)
      .select()
      .single();

    if (error || !inserted) {
      throw new Error(`[EventVotesRepository] Cast vote failed: ${error?.message || "Unknown error"}`);
    }

    return toCamelCase<EventVoteSelect>(inserted);
  }

  /**
   * Updates an existing vote to a different submission (single-vote mode switch)
   */
  public async updateVoteSubmission(
    voteId: UUID,
    newSubmissionId: UUID
  ): Promise<EventVoteSelect> {
    try {
      const result = await db
        .update(eventVotes)
        .set({
          submissionId: newSubmissionId,
          updatedAt: new Date(),
        })
        .where(eq(eventVotes.id, voteId))
        .returning();

      if (result[0]) return result[0];
    } catch (err) {
      logger.error("[EventVotesRepository] Drizzle updateVoteSubmission error, falling back to REST", err);
    }

    const { data: updated, error } = await supabase
      .from("event_votes")
      .update({
        submission_id: newSubmissionId,
        updated_at: new Date().toISOString(),
      })
      .eq("id", voteId)
      .select()
      .single();

    if (error || !updated) {
      throw new Error(`[EventVotesRepository] Update vote failed: ${error?.message || "Unknown error"}`);
    }

    return toCamelCase<EventVoteSelect>(updated);
  }

  /**
   * Deletes a vote. If submissionId is given, deletes only that submission vote.
   * If submissionId is not provided, deletes all votes by that participant.
   */
  public async deleteVote(
    eventId: UUID,
    voterParticipantId: UUID,
    submissionId?: UUID
  ): Promise<boolean> {
    try {
      const conditions = [
        eq(eventVotes.eventId, eventId),
        eq(eventVotes.voterParticipantId, voterParticipantId),
      ];
      if (submissionId) {
        conditions.push(eq(eventVotes.submissionId, submissionId));
      }

      const result = await db
        .delete(eventVotes)
        .where(and(...conditions))
        .returning();

      if (result.length > 0) return true;
    } catch (err) {
      logger.error("[EventVotesRepository] Drizzle deleteVote error", err);
    }

    try {
      let query = supabase
        .from("event_votes")
        .delete()
        .eq("event_id", eventId)
        .eq("voter_participant_id", voterParticipantId);

      if (submissionId) {
        query = query.eq("submission_id", submissionId);
      }

      const { error } = await query;
      return !error;
    } catch {
      return false;
    }
  }

  public async countVotesBySubmission(submissionId: UUID): Promise<number> {
    try {
      const rows = await db
        .select({ count: sql<number>`count(*)` })
        .from(eventVotes)
        .where(eq(eventVotes.submissionId, submissionId));

      return Number(rows[0]?.count || 0);
    } catch (err) {
      logger.error("[EventVotesRepository] Drizzle countVotesBySubmission error", err);
    }

    try {
      const { count } = await supabase
        .from("event_votes")
        .select("*", { count: "exact", head: true })
        .eq("submission_id", submissionId);

      return count || 0;
    } catch {}

    return 0;
  }

  public async countTotalVotesByEvent(eventId: UUID): Promise<number> {
    try {
      const rows = await db
        .select({ count: sql<number>`count(*)` })
        .from(eventVotes)
        .where(eq(eventVotes.eventId, eventId));

      return Number(rows[0]?.count || 0);
    } catch (err) {
      logger.error("[EventVotesRepository] Drizzle countTotalVotesByEvent error", err);
    }

    try {
      const { count } = await supabase
        .from("event_votes")
        .select("*", { count: "exact", head: true })
        .eq("event_id", eventId);

      return count || 0;
    } catch {}

    return 0;
  }

  public async getSubmissionVoteCounts(
    eventId: UUID
  ): Promise<Record<string, number>> {
    const counts: Record<string, number> = {};

    try {
      const rows = await db
        .select({
          submissionId: eventVotes.submissionId,
          count: sql<number>`count(*)`,
        })
        .from(eventVotes)
        .where(eq(eventVotes.eventId, eventId))
        .groupBy(eventVotes.submissionId);

      for (const r of rows) {
        counts[r.submissionId] = Number(r.count || 0);
      }
      return counts;
    } catch (err) {
      logger.error("[EventVotesRepository] Drizzle getSubmissionVoteCounts error", err);
    }

    try {
      const { data } = await supabase
        .from("event_votes")
        .select("submission_id")
        .eq("event_id", eventId);

      if (data) {
        for (const r of data) {
          counts[r.submission_id] = (counts[r.submission_id] || 0) + 1;
        }
      }
    } catch {}

    return counts;
  }

  public async getRankings(
    eventId: UUID
  ): Promise<Array<{ submissionId: string; voteCount: number; submissionCreatedAt: Date }>> {
    try {
      // Deterministic tie-breaking: vote count DESC, submission createdAt ASC
      const rows = await db
        .select({
          submissionId: eventSubmissions.id,
          voteCount: sql<number>`count(${eventVotes.id})`,
          submissionCreatedAt: eventSubmissions.createdAt,
        })
        .from(eventSubmissions)
        .leftJoin(eventVotes, eq(eventSubmissions.id, eventVotes.submissionId))
        .where(
          and(
            eq(eventSubmissions.eventId, eventId),
            eq(eventSubmissions.status, "published")
          )
        )
        .groupBy(eventSubmissions.id, eventSubmissions.createdAt)
        .orderBy(desc(sql`count(${eventVotes.id})`), asc(eventSubmissions.createdAt));

      return rows.map((r: any) => ({
        submissionId: r.submissionId,
        voteCount: Number(r.voteCount || 0),
        submissionCreatedAt: new Date(r.submissionCreatedAt),
      }));
    } catch (err) {
      logger.error("[EventVotesRepository] Drizzle getRankings error, falling back to REST", err);
    }

    try {
      const { data: subs } = await supabase
        .from("event_submissions")
        .select("id, created_at")
        .eq("event_id", eventId)
        .eq("status", "published");

      const { data: votes } = await supabase
        .from("event_votes")
        .select("submission_id")
        .eq("event_id", eventId);

      const voteMap: Record<string, number> = {};
      if (votes) {
        for (const v of votes) {
          voteMap[v.submission_id] = (voteMap[v.submission_id] || 0) + 1;
        }
      }

      const list = (subs || []).map((s: any) => ({
        submissionId: s.id,
        voteCount: voteMap[s.id] || 0,
        submissionCreatedAt: new Date(s.created_at),
      }));

      list.sort((a, b) => {
        if (b.voteCount !== a.voteCount) {
          return b.voteCount - a.voteCount;
        }
        return a.submissionCreatedAt.getTime() - b.submissionCreatedAt.getTime();
      });

      return list;
    } catch {}

    return [];
  }

  /**
   * Retrieves all votes for an event
   */
  public async findVotesByEvent(eventId: UUID): Promise<EventVoteSelect[]> {
    if (isServerless) {
      try {
        const { data } = await supabase
          .from("event_votes")
          .select("*")
          .eq("event_id", eventId);
        if (data) return toCamelCase<EventVoteSelect[]>(data);
      } catch (err) {
        logger.error("[EventVotesRepository] REST findVotesByEvent error", err);
      }
    }
    try {
      return await db.select().from(eventVotes).where(eq(eventVotes.eventId, eventId));
    } catch (err) {
      logger.error("[EventVotesRepository] Drizzle findVotesByEvent error", err);
      return [];
    }
  }
}
