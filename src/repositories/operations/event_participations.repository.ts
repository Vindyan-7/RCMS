/**
 * Operations Domain - Event Participations Repository Implementation
 */

import { eq, and, sql } from "drizzle-orm";
import { db } from "@/db";
import { eventParticipations, EventParticipationSelect, EventParticipationInsert } from "@/db/schema";
import { PaginatedResult } from "@/core/repository/repository.types";
import { UUID, PaginationQuery } from "@/core/types";

export class EventParticipationsRepository {
  public async findById(id: UUID): Promise<EventParticipationSelect | null> {
    const result = await db
      .select()
      .from(eventParticipations)
      .where(eq(eventParticipations.id, id))
      .limit(1);

    return result[0] || null;
  }

  public async findByEventAndMember(
    eventId: UUID,
    memberId: UUID
  ): Promise<EventParticipationSelect | null> {
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

    return result[0] || null;
  }

  public async getByEventId(
    eventId: UUID,
    query: PaginationQuery
  ): Promise<PaginatedResult<EventParticipationSelect>> {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const offset = (page - 1) * limit;

    const whereClause = eq(eventParticipations.eventId, eventId);

    const [items, totalRes] = await Promise.all([
      db
        .select()
        .from(eventParticipations)
        .where(whereClause)
        .limit(limit)
        .offset(offset),
      db
        .select({ count: sql<number>`count(*)` })
        .from(eventParticipations)
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
  ): Promise<PaginatedResult<EventParticipationSelect>> {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const offset = (page - 1) * limit;

    const whereClause = eq(eventParticipations.memberId, memberId);

    const [items, totalRes] = await Promise.all([
      db
        .select()
        .from(eventParticipations)
        .where(whereClause)
        .limit(limit)
        .offset(offset),
      db
        .select({ count: sql<number>`count(*)` })
        .from(eventParticipations)
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

  public async create(data: EventParticipationInsert): Promise<EventParticipationSelect> {
    const result = await db.insert(eventParticipations).values(data).returning();
    return result[0];
  }

  public async delete(id: UUID): Promise<boolean> {
    const result = await db
      .delete(eventParticipations)
      .where(eq(eventParticipations.id, id))
      .returning();

    return result.length > 0;
  }
}
