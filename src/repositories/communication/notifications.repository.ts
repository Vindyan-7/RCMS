/**
 * Communication Domain - Notifications Repository Implementation
 */

import { eq, and, sql, desc } from "drizzle-orm";
import { db } from "@/db";
import { notifications, NotificationSelect, NotificationInsert } from "@/db/schema";
import { PaginatedResult } from "@/core/repository/repository.types";
import { UUID, PaginationQuery } from "@/core/types";

export class NotificationsRepository {
  public async create(data: NotificationInsert): Promise<NotificationSelect> {
    const result = await db.insert(notifications).values(data).returning();
    return result[0];
  }

  public async createBatch(data: NotificationInsert[]): Promise<NotificationSelect[]> {
    if (data.length === 0) return [];
    return db.insert(notifications).values(data).returning();
  }

  public async findById(id: UUID): Promise<NotificationSelect | null> {
    const result = await db
      .select()
      .from(notifications)
      .where(eq(notifications.id, id))
      .limit(1);

    return result[0] || null;
  }

  public async getByRecipientId(
    recipientId: UUID,
    query: PaginationQuery
  ): Promise<PaginatedResult<NotificationSelect>> {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const offset = (page - 1) * limit;

    const whereClause = eq(notifications.recipientId, recipientId);

    const [items, totalRes] = await Promise.all([
      db
        .select()
        .from(notifications)
        .where(whereClause)
        .orderBy(desc(notifications.createdAt))
        .limit(limit)
        .offset(offset),
      db
        .select({ count: sql<number>`count(*)` })
        .from(notifications)
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

  public async findAll(
    query: PaginationQuery
  ): Promise<PaginatedResult<NotificationSelect>> {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const offset = (page - 1) * limit;

    const [items, totalRes] = await Promise.all([
      db
        .select()
        .from(notifications)
        .orderBy(desc(notifications.createdAt))
        .limit(limit)
        .offset(offset),
      db.select({ count: sql<number>`count(*)` }).from(notifications),
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

  public async markAsRead(id: UUID): Promise<NotificationSelect | null> {
    const result = await db
      .update(notifications)
      .set({ read: true, readAt: new Date() })
      .where(eq(notifications.id, id))
      .returning();

    return result[0] || null;
  }

  public async markAllAsRead(recipientId: UUID): Promise<boolean> {
    const result = await db
      .update(notifications)
      .set({ read: true, readAt: new Date() })
      .where(and(eq(notifications.recipientId, recipientId), eq(notifications.read, false)))
      .returning();

    return result.length > 0;
  }
}
