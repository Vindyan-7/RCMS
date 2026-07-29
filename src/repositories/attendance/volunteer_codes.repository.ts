/**
 * Attendance Domain - Volunteer Codes Repository
 */

import { eq, and } from "drizzle-orm";
import { db } from "@/db";
import { volunteerCodes, VolunteerCodeSelect, VolunteerCodeInsert } from "@/db/schema";
import { UUID } from "@/core/types";

export class VolunteerCodesRepository {
  public async findByCode(code: string): Promise<VolunteerCodeSelect | null> {
    const result = await db
      .select()
      .from(volunteerCodes)
      .where(eq(volunteerCodes.code, code))
      .limit(1);

    return result[0] || null;
  }

  public async findBySessionId(sessionId: UUID): Promise<VolunteerCodeSelect[]> {
    return db
      .select()
      .from(volunteerCodes)
      .where(eq(volunteerCodes.sessionId, sessionId));
  }

  public async create(data: VolunteerCodeInsert): Promise<VolunteerCodeSelect> {
    const result = await db.insert(volunteerCodes).values(data).returning();
    return result[0];
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
      const { data: member } = await db
        .from("members")
        .select("id")
        .eq("id", activatedBy)
        .maybeSingle();

      if (member) {
        payload.activatedBy = activatedBy;
        payload.activatedAt = new Date();
      }
    }

    const result = await db
      .update(volunteerCodes)
      .set(payload)
      .where(eq(volunteerCodes.id, id))
      .returning();

    return result[0];
  }

  public async expireCodesForSession(sessionId: UUID): Promise<boolean> {
    const result = await db
      .update(volunteerCodes)
      .set({ status: "expired" })
      .where(and(eq(volunteerCodes.sessionId, sessionId), eq(volunteerCodes.status, "active")))
      .returning();

    return result.length > 0;
  }

  public async deactivate(id: UUID): Promise<boolean> {
    const result = await db
      .update(volunteerCodes)
      .set({ status: "expired" })
      .where(eq(volunteerCodes.id, id))
      .returning();

    return result.length > 0;
  }
}
