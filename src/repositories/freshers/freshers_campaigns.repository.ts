/**
 * Freshers Domain - Freshers Campaigns Repository
 */

import { eq, and, isNull, desc } from "drizzle-orm";
import { drizzleDb, supabase, toCamelCase, toSnakeCase } from "@/db";
import { freshersCampaigns, FreshersCampaignSelect, FreshersCampaignInsert } from "@/db/schema";
import { BaseRepository } from "@/core/repository/base-repository";
import { PaginatedResult, QueryOptions } from "@/core/repository/repository.types";
import { UUID, PaginationQuery } from "@/core/types";
import { logger } from "@/core/logger";

export class FreshersCampaignsRepository extends BaseRepository<
  FreshersCampaignSelect,
  FreshersCampaignInsert,
  Partial<FreshersCampaignInsert>
> {
  protected getTableName(): string {
    return "freshers_campaigns";
  }

  public async findById(id: UUID, options?: { includeDeleted?: boolean }): Promise<FreshersCampaignSelect | null> {
    try {
      const conditions = [eq(freshersCampaigns.id, id)];
      if (!options?.includeDeleted) {
        conditions.push(isNull(freshersCampaigns.deletedAt));
      }
      const rows = await drizzleDb
        .select()
        .from(freshersCampaigns)
        .where(and(...conditions))
        .limit(1);

      if (rows && rows[0]) return rows[0];
    } catch (err: any) {
      logger.warn("[FreshersCampaignsRepository] Drizzle findById error, falling back to Supabase", { message: err?.message });
    }

    try {
      let query = supabase.from("freshers_campaigns").select("*").eq("id", id);
      if (!options?.includeDeleted) {
        query = query.is("deleted_at", null);
      }
      const { data } = await query.limit(1);
      if (data && data[0]) return toCamelCase<FreshersCampaignSelect>(data[0]);
    } catch (err: any) {
      logger.error("[FreshersCampaignsRepository] findById error", { message: err?.message });
    }
    return null;
  }

  public async findAll(
    query: PaginationQuery,
    options?: QueryOptions
  ): Promise<PaginatedResult<FreshersCampaignSelect>> {
    const page = query.page || 1;
    const limit = query.limit || 10;
    const from = (page - 1) * limit;

    try {
      const rows = await drizzleDb
        .select()
        .from(freshersCampaigns)
        .where(isNull(freshersCampaigns.deletedAt))
        .orderBy(desc(freshersCampaigns.createdAt));

      const total = rows.length;
      const items = rows.slice(from, from + limit);

      return {
        items,
        total,
        page,
        limit,
        totalPages: this.calculateTotalPages(total, limit),
      };
    } catch (err: any) {
      logger.warn("[FreshersCampaignsRepository] Drizzle findAll fallback to Supabase", { message: err?.message });
    }

    try {
      const to = from + limit - 1;
      let req = supabase
        .from("freshers_campaigns")
        .select("*", { count: "exact" })
        .is("deleted_at", null)
        .order("created_at", { ascending: false })
        .range(from, to);

      const { data, count } = await req;
      const parsedData = (data || []).map((row) => toCamelCase<FreshersCampaignSelect>(row));
      const total = count || 0;

      return {
        items: parsedData,
        total,
        page,
        limit,
        totalPages: this.calculateTotalPages(total, limit),
      };
    } catch (err: any) {
      logger.error("[FreshersCampaignsRepository] findAll error", { message: err?.message });
      return { items: [], total: 0, page, limit, totalPages: 1 };
    }
  }

  public async create(data: FreshersCampaignInsert, creatorId: UUID): Promise<FreshersCampaignSelect> {
    try {
      const [result] = await drizzleDb
        .insert(freshersCampaigns)
        .values({
          ...data,
          createdBy: creatorId,
          updatedBy: creatorId,
        })
        .returning();

      if (result) return result;
    } catch (err: any) {
      logger.warn("[FreshersCampaignsRepository] Drizzle create fallback to Supabase", { message: err?.message });
    }

    const payload = toSnakeCase({
      ...data,
      created_by: creatorId,
      updated_by: creatorId,
    });

    const { data: result, error } = await supabase
      .from("freshers_campaigns")
      .insert(payload)
      .select("*")
      .single();

    if (error || !result) {
      logger.error("[FreshersCampaignsRepository] create error", { message: error?.message });
      throw new Error(error?.message || "Failed to create campaign record.");
    }

    return toCamelCase<FreshersCampaignSelect>(result);
  }

  public async update(
    id: UUID,
    data: Partial<FreshersCampaignInsert>,
    updaterId: UUID
  ): Promise<FreshersCampaignSelect> {
    try {
      const [result] = await drizzleDb
        .update(freshersCampaigns)
        .set({
          ...data,
          updatedBy: updaterId,
          updatedAt: new Date().toISOString() as any,
        })
        .where(eq(freshersCampaigns.id, id))
        .returning();

      if (result) return result;
    } catch (err: any) {
      logger.warn("[FreshersCampaignsRepository] Drizzle update fallback to Supabase", { message: err?.message });
    }

    const payload = toSnakeCase({
      ...data,
      updated_by: updaterId,
      updated_at: new Date().toISOString(),
    });

    const { data: result, error } = await supabase
      .from("freshers_campaigns")
      .update(payload)
      .eq("id", id)
      .select("*")
      .single();

    if (error || !result) {
      logger.error("[FreshersCampaignsRepository] update error", { message: error?.message });
      throw new Error(error?.message || "Failed to update campaign record.");
    }

    return toCamelCase<FreshersCampaignSelect>(result);
  }

  public async delete(id: UUID, deleterId: UUID): Promise<boolean> {
    try {
      await drizzleDb
        .update(freshersCampaigns)
        .set({
          deletedAt: new Date().toISOString() as any,
          updatedBy: deleterId,
        })
        .where(eq(freshersCampaigns.id, id));
      return true;
    } catch (err: any) {
      logger.warn("[FreshersCampaignsRepository] Drizzle delete fallback", { message: err?.message });
    }

    const { error } = await supabase
      .from("freshers_campaigns")
      .update({ deleted_at: new Date().toISOString(), updated_by: deleterId })
      .eq("id", id);
    return !error;
  }

  public async purge(id: UUID): Promise<boolean> {
    try {
      await drizzleDb.delete(freshersCampaigns).where(eq(freshersCampaigns.id, id));
      return true;
    } catch (err: any) {
      logger.warn("[FreshersCampaignsRepository] Drizzle purge fallback", { message: err?.message });
    }

    const { error } = await supabase.from("freshers_campaigns").delete().eq("id", id);
    return !error;
  }

  public async findActiveCampaign(): Promise<FreshersCampaignSelect | null> {
    try {
      const rows = await drizzleDb
        .select()
        .from(freshersCampaigns)
        .where(and(eq(freshersCampaigns.status, "active"), isNull(freshersCampaigns.deletedAt)))
        .orderBy(desc(freshersCampaigns.createdAt))
        .limit(1);

      if (rows && rows[0]) return rows[0];
    } catch (err: any) {
      logger.warn("[FreshersCampaignsRepository] Drizzle findActiveCampaign fallback to Supabase", { message: err?.message });
    }

    try {
      const { data } = await supabase
        .from("freshers_campaigns")
        .select("*")
        .eq("status", "active")
        .is("deleted_at", null)
        .order("created_at", { ascending: false })
        .limit(1);
      if (data && data[0]) return toCamelCase<FreshersCampaignSelect>(data[0]);
    } catch (err: any) {
      logger.error("[FreshersCampaignsRepository] Error fetching active campaign", { message: err?.message });
    }
    return null;
  }

  public async findByKey(campaignKey: string): Promise<FreshersCampaignSelect | null> {
    try {
      const rows = await drizzleDb
        .select()
        .from(freshersCampaigns)
        .where(and(eq(freshersCampaigns.campaignKey, campaignKey), isNull(freshersCampaigns.deletedAt)))
        .limit(1);

      if (rows && rows[0]) return rows[0];
    } catch (err: any) {
      logger.warn("[FreshersCampaignsRepository] Drizzle findByKey fallback to Supabase", { message: err?.message });
    }

    try {
      const { data } = await supabase
        .from("freshers_campaigns")
        .select("*")
        .eq("campaign_key", campaignKey)
        .is("deleted_at", null)
        .limit(1);
      if (data && data[0]) return toCamelCase<FreshersCampaignSelect>(data[0]);
    } catch (err: any) {
      logger.error("[FreshersCampaignsRepository] Error fetching campaign by key", { message: err?.message });
    }
    return null;
  }
}
