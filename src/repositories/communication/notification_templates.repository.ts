/**
 * Communication Domain - Notification Templates Repository Implementation
 */

import { eq, and, isNull, sql } from "drizzle-orm";
import { db } from "@/db";
import { notificationTemplates, NotificationTemplateSelect, NotificationTemplateInsert } from "@/db/schema";
import { BaseRepository } from "@/core/repository/base-repository";
import { PaginatedResult, QueryOptions } from "@/core/repository/repository.types";
import { UUID, PaginationQuery } from "@/core/types";

export class NotificationTemplatesRepository extends BaseRepository<
  NotificationTemplateSelect,
  NotificationTemplateInsert,
  Partial<NotificationTemplateInsert>
> {
  protected getTableName(): string {
    return "notification_templates";
  }

  public async findById(
    id: UUID,
    options?: { includeDeleted?: boolean }
  ): Promise<NotificationTemplateSelect | null> {
    const conditions = [eq(notificationTemplates.id, id)];
    if (!options?.includeDeleted) {
      conditions.push(isNull(notificationTemplates.deletedAt));
    }

    const result = await db
      .select()
      .from(notificationTemplates)
      .where(and(...conditions))
      .limit(1);

    return result[0] || null;
  }

  public async findByCode(code: string): Promise<NotificationTemplateSelect | null> {
    const result = await db
      .select()
      .from(notificationTemplates)
      .where(and(eq(notificationTemplates.code, code), isNull(notificationTemplates.deletedAt)))
      .limit(1);

    return result[0] || null;
  }

  public async findAll(
    query: PaginationQuery,
    options?: QueryOptions
  ): Promise<PaginatedResult<NotificationTemplateSelect>> {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const offset = (page - 1) * limit;

    const conditions = [];
    if (!options?.includeDeleted) {
      conditions.push(isNull(notificationTemplates.deletedAt));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [items, totalRes] = await Promise.all([
      db
        .select()
        .from(notificationTemplates)
        .where(whereClause)
        .limit(limit)
        .offset(offset),
      db
        .select({ count: sql<number>`count(*)` })
        .from(notificationTemplates)
        .where(whereClause),
    ]);

    const total = Number(totalRes[0]?.count || 0);

    return {
      items,
      total,
      page,
      limit,
      totalPages: this.calculateTotalPages(total, limit),
    };
  }

  public async create(
    data: NotificationTemplateInsert,
    creatorId: UUID
  ): Promise<NotificationTemplateSelect> {
    const audit = this.getAuditFields(creatorId, "create");
    const payload = {
      ...data,
      ...audit,
    };

    const result = await db.insert(notificationTemplates).values(payload).returning();
    return result[0];
  }

  public async update(
    id: UUID,
    data: Partial<NotificationTemplateInsert>,
    updaterId: UUID
  ): Promise<NotificationTemplateSelect> {
    const audit = this.getAuditFields(updaterId, "update");
    const payload = {
      ...data,
      ...audit,
    };

    const result = await db
      .update(notificationTemplates)
      .set(payload)
      .where(and(eq(notificationTemplates.id, id), isNull(notificationTemplates.deletedAt)))
      .returning();

    return result[0];
  }

  public async delete(id: UUID, deleterId: UUID): Promise<boolean> {
    const timestamp = new Date();
    const result = await db
      .update(notificationTemplates)
      .set({
        deletedAt: timestamp,
        deletedBy: deleterId,
        updatedAt: timestamp,
        updatedBy: deleterId,
      })
      .where(and(eq(notificationTemplates.id, id), isNull(notificationTemplates.deletedAt)))
      .returning();

    return result.length > 0;
  }

  public async restore(id: UUID, restorerId: UUID): Promise<boolean> {
    const timestamp = new Date();
    const result = await db
      .update(notificationTemplates)
      .set({
        deletedAt: null,
        deletedBy: null,
        updatedAt: timestamp,
        updatedBy: restorerId,
      })
      .where(eq(notificationTemplates.id, id))
      .returning();

    return result.length > 0;
  }

  public async purge(id: UUID): Promise<boolean> {
    const result = await db
      .delete(notificationTemplates)
      .where(eq(notificationTemplates.id, id))
      .returning();
    return result.length > 0;
  }
}
