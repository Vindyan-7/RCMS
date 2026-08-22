/**
 * Attendance Domain - Volunteer Codes Repository Implementation
 * Dual-tier execution (Drizzle ORM primary + Supabase REST API fallback)
 */

import { eq, and } from "drizzle-orm";
import { db, supabase, toCamelCase, toSnakeCase, isServerless } from "@/db";
import { volunteerCodes, VolunteerCodeSelect, VolunteerCodeInsert } from "@/db/schema";
import { UUID } from "@/core/types";
import { logger } from "@/core/logger";

export class VolunteerCodesRepository {
  public async findByCode(code: string): Promise<VolunteerCodeSelect | null> {
    if (isServerless) {
      try {
        const { data } = await supabase
          .from("volunteer_codes")
          .select("*")
          .eq("code", code)
          .limit(1);
        if (data && data[0]) return toCamelCase<VolunteerCodeSelect>(data[0]);
      } catch (err) {
        logger.error("[VolunteerCodesRepository] REST findByCode error", err);
      }
    }

    try {
      const result = await db
        .select()
        .from(volunteerCodes)
        .where(eq(volunteerCodes.code, code))
        .limit(1);

      if (result[0]) return result[0];
    } catch (err) {
      logger.error("[VolunteerCodesRepository] Drizzle findByCode error", err);
    }

    try {
      const { data } = await supabase
        .from("volunteer_codes")
        .select("*")
        .eq("code", code)
        .limit(1);
      if (data && data[0]) return toCamelCase<VolunteerCodeSelect>(data[0]);
    } catch {}

    return null;
  }

  public async findBySessionId(sessionId: UUID): Promise<VolunteerCodeSelect[]> {
    if (isServerless) {
      try {
        const { data } = await supabase
          .from("volunteer_codes")
          .select("*")
          .eq("session_id", sessionId);
        if (data) return toCamelCase<VolunteerCodeSelect[]>(data);
      } catch (err) {
        logger.error("[VolunteerCodesRepository] REST findBySessionId error", err);
      }
    }

    try {
      const rows = await db
        .select()
        .from(volunteerCodes)
        .where(eq(volunteerCodes.sessionId, sessionId));

      if (rows && rows.length > 0) return rows;
    } catch (err) {
      logger.error("[VolunteerCodesRepository] Drizzle findBySessionId error", err);
    }

    try {
      const { data } = await supabase
        .from("volunteer_codes")
        .select("*")
        .eq("session_id", sessionId);
      if (data) return toCamelCase<VolunteerCodeSelect[]>(data);
    } catch {}

    return [];
  }

  public async create(data: VolunteerCodeInsert): Promise<VolunteerCodeSelect> {
    const payload = { ...data };

    if (isServerless) {
      try {
        const snakePayload = toSnakeCase(payload);
        const { data: inserted, error } = await supabase
          .from("volunteer_codes")
          .insert(snakePayload)
          .select()
          .single();

        if (!error && inserted) {
          return toCamelCase<VolunteerCodeSelect>(inserted);
        } else if (error) {
          logger.error("[VolunteerCodesRepository] REST create error response", error);
        }
      } catch (err) {
        logger.error("[VolunteerCodesRepository] REST create exception", err);
      }
    }

    try {
      const result = await db.insert(volunteerCodes).values(payload).returning();
      if (result[0]) return result[0];
    } catch (err) {
      logger.error("[VolunteerCodesRepository] Drizzle create error", err);
    }

    const snakePayload = toSnakeCase(payload);
    const { data: inserted, error } = await supabase
      .from("volunteer_codes")
      .insert(snakePayload)
      .select()
      .single();

    if (error || !inserted) {
      throw new Error(`Failed to create volunteer code: ${error?.message || "Unknown error"}`);
    }

    return toCamelCase<VolunteerCodeSelect>(inserted);
  }

  public async updateStatus(
    id: UUID,
    status: string,
    activatedBy?: UUID
  ): Promise<VolunteerCodeSelect> {
    const payload: Partial<VolunteerCodeInsert> = {
      status,
    };

    if (activatedBy) {
      const { data: user } = await supabase
        .from("users")
        .select("id")
        .eq("id", activatedBy)
        .maybeSingle();

      if (user) {
        payload.activatedBy = activatedBy;
        payload.activatedAt = new Date();
      }
    }

    if (isServerless) {
      try {
        const snakePayload = toSnakeCase(payload);
        const { data: updated, error } = await supabase
          .from("volunteer_codes")
          .update(snakePayload)
          .eq("id", id)
          .select()
          .single();

        if (!error && updated) {
          return toCamelCase<VolunteerCodeSelect>(updated);
        } else if (error) {
          logger.error("[VolunteerCodesRepository] REST updateStatus error response", error);
        }
      } catch (err) {
        logger.error("[VolunteerCodesRepository] REST updateStatus exception", err);
      }
    }

    try {
      const result = await db
        .update(volunteerCodes)
        .set(payload)
        .where(eq(volunteerCodes.id, id))
        .returning();

      if (result[0]) return result[0];
    } catch (err) {
      logger.error("[VolunteerCodesRepository] Drizzle updateStatus error", err);
    }

    const snakePayload = toSnakeCase(payload);
    const { data: updated, error } = await supabase
      .from("volunteer_codes")
      .update(snakePayload)
      .eq("id", id)
      .select()
      .single();

    if (error || !updated) {
      throw new Error(`Failed to update volunteer code: ${error?.message || "Unknown error"}`);
    }

    return toCamelCase<VolunteerCodeSelect>(updated);
  }

  public async expireCodesForSession(sessionId: UUID): Promise<boolean> {
    if (isServerless) {
      try {
        const { error } = await supabase
          .from("volunteer_codes")
          .update({ status: "expired" })
          .eq("session_id", sessionId)
          .eq("status", "active");

        if (!error) return true;
      } catch (err) {
        logger.error("[VolunteerCodesRepository] REST expireCodesForSession error", err);
      }
    }

    try {
      const result = await db
        .update(volunteerCodes)
        .set({ status: "expired" })
        .where(and(eq(volunteerCodes.sessionId, sessionId), eq(volunteerCodes.status, "active")))
        .returning();

      return result.length > 0;
    } catch (err) {
      logger.error("[VolunteerCodesRepository] Drizzle expireCodesForSession error", err);
    }

    try {
      const { error } = await supabase
        .from("volunteer_codes")
        .update({ status: "expired" })
        .eq("session_id", sessionId)
        .eq("status", "active");

      return !error;
    } catch {
      return false;
    }
  }

  public async deactivate(id: UUID): Promise<boolean> {
    if (isServerless) {
      try {
        const { error } = await supabase
          .from("volunteer_codes")
          .update({ status: "expired" })
          .eq("id", id);

        if (!error) return true;
      } catch (err) {
        logger.error("[VolunteerCodesRepository] REST deactivate error", err);
      }
    }

    try {
      const result = await db
        .update(volunteerCodes)
        .set({ status: "expired" })
        .where(eq(volunteerCodes.id, id))
        .returning();

      return result.length > 0;
    } catch (err) {
      logger.error("[VolunteerCodesRepository] Drizzle deactivate error", err);
    }

    try {
      const { error } = await supabase
        .from("volunteer_codes")
        .update({ status: "expired" })
        .eq("id", id);

      return !error;
    } catch {
      return false;
    }
  }
}
