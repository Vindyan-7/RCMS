/**
 * Events Domain - Event Submission Images Repository Implementation
 * Dual-tier execution: Drizzle ORM primary + Supabase PostgREST API fallback
 */

import { eq, inArray, asc } from "drizzle-orm";
import { db, supabase, toCamelCase, toSnakeCase, isServerless } from "@/db";
import { eventSubmissionImages, EventSubmissionImageSelect, EventSubmissionImageInsert } from "@/db/schema";
import { UUID } from "@/core/types";
import { logger } from "@/core/logger";

export class EventSubmissionImagesRepository {
  public async create(
    data: EventSubmissionImageInsert
  ): Promise<EventSubmissionImageSelect> {
    if (isServerless) {
      try {
        const snakePayload = toSnakeCase(data);
        const { data: inserted, error } = await supabase
          .from("event_submission_images")
          .insert(snakePayload)
          .select()
          .single();

        if (!error && inserted) {
          return toCamelCase<EventSubmissionImageSelect>(inserted);
        }
      } catch (err) {
        logger.error("[EventSubmissionImagesRepository] REST create error", err);
      }
    }

    try {
      const result = await db.insert(eventSubmissionImages).values(data).returning();
      if (result[0]) return result[0];
    } catch (err) {
      logger.error("[EventSubmissionImagesRepository] Drizzle create error, falling back to REST", err);
    }

    const snakePayload = toSnakeCase(data);
    const { data: inserted, error } = await supabase
      .from("event_submission_images")
      .insert(snakePayload)
      .select()
      .single();

    if (error || !inserted) {
      throw new Error(`[EventSubmissionImagesRepository] Create failed: ${error?.message || "Unknown error"}`);
    }

    return toCamelCase<EventSubmissionImageSelect>(inserted);
  }

  public async createMany(
    dataList: EventSubmissionImageInsert[]
  ): Promise<EventSubmissionImageSelect[]> {
    if (dataList.length === 0) return [];

    if (isServerless) {
      try {
        const snakeList = dataList.map((d) => toSnakeCase(d));
        const { data: inserted, error } = await supabase
          .from("event_submission_images")
          .insert(snakeList)
          .select();

        if (!error && inserted && inserted.length > 0) {
          return toCamelCase<EventSubmissionImageSelect[]>(inserted);
        }
      } catch (err) {
        logger.error("[EventSubmissionImagesRepository] REST createMany error", err);
      }
    }

    try {
      const results = await db.insert(eventSubmissionImages).values(dataList).returning();
      if (results && results.length > 0) return results;
    } catch (err) {
      logger.error("[EventSubmissionImagesRepository] Drizzle createMany error, falling back to REST", err);
    }

    const snakeList = dataList.map((d) => toSnakeCase(d));
    const { data: inserted, error } = await supabase
      .from("event_submission_images")
      .insert(snakeList)
      .select();

    if (error || !inserted) {
      throw new Error(`[EventSubmissionImagesRepository] Batch create failed: ${error?.message || "Unknown error"}`);
    }

    return toCamelCase<EventSubmissionImageSelect[]>(inserted);
  }

  public async findBySubmissionId(
    submissionId: UUID
  ): Promise<EventSubmissionImageSelect[]> {
    if (isServerless) {
      try {
        const { data } = await supabase
          .from("event_submission_images")
          .select("*")
          .eq("submission_id", submissionId)
          .order("display_order", { ascending: true });

        if (data) return toCamelCase<EventSubmissionImageSelect[]>(data);
      } catch (err) {
        logger.error("[EventSubmissionImagesRepository] REST findBySubmissionId error", err);
      }
    }

    try {
      const rows = await db
        .select()
        .from(eventSubmissionImages)
        .where(eq(eventSubmissionImages.submissionId, submissionId))
        .orderBy(asc(eventSubmissionImages.displayOrder));

      if (rows && rows.length > 0) return rows;
    } catch (err) {
      logger.error("[EventSubmissionImagesRepository] Drizzle findBySubmissionId error", err);
    }

    try {
      const { data } = await supabase
        .from("event_submission_images")
        .select("*")
        .eq("submission_id", submissionId)
        .order("display_order", { ascending: true });

      if (data) return toCamelCase<EventSubmissionImageSelect[]>(data);
    } catch {}

    return [];
  }

  public async findBySubmissionIds(
    submissionIds: UUID[]
  ): Promise<Record<string, EventSubmissionImageSelect[]>> {
    const map: Record<string, EventSubmissionImageSelect[]> = {};
    if (submissionIds.length === 0) return map;

    let rows: EventSubmissionImageSelect[] = [];
    try {
      rows = await db
        .select()
        .from(eventSubmissionImages)
        .where(inArray(eventSubmissionImages.submissionId, submissionIds))
        .orderBy(asc(eventSubmissionImages.displayOrder));
    } catch (err) {
      logger.error("[EventSubmissionImagesRepository] Drizzle findBySubmissionIds error", err);
    }

    if (rows.length === 0) {
      try {
        const { data } = await supabase
          .from("event_submission_images")
          .select("*")
          .in("submission_id", submissionIds)
          .order("display_order", { ascending: true });

        if (data) {
          rows = toCamelCase<EventSubmissionImageSelect[]>(data);
        }
      } catch (err) {
        logger.error("[EventSubmissionImagesRepository] REST findBySubmissionIds error", err);
      }
    }

    for (const img of rows) {
      if (!map[img.submissionId]) {
        map[img.submissionId] = [];
      }
      map[img.submissionId].push(img);
    }

    return map;
  }

  public async deleteBySubmissionId(submissionId: UUID): Promise<boolean> {
    try {
      const result = await db
        .delete(eventSubmissionImages)
        .where(eq(eventSubmissionImages.submissionId, submissionId))
        .returning();

      if (result.length > 0) return true;
    } catch (err) {
      logger.error("[EventSubmissionImagesRepository] Drizzle deleteBySubmissionId error", err);
    }

    try {
      const { error } = await supabase
        .from("event_submission_images")
        .delete()
        .eq("submission_id", submissionId);

      return !error;
    } catch {
      return false;
    }
  }

  public async countBySubmissionId(submissionId: UUID): Promise<number> {
    const images = await this.findBySubmissionId(submissionId);
    return images.length;
  }
}
