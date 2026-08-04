"use server";

/**
 * Academic Years - Server Actions
 */

import { ApiResponse } from "@/core/types";
import { AcademicYearSelect } from "@/db/schema";
import { db, supabase, toCamelCase } from "@/db";
import { academicYears } from "@/db/schema";
import { isNull, desc } from "drizzle-orm";
import { formatErrorResponse } from "@/core/errors";
import { logger } from "@/core/logger";

async function ensureDefaultAcademicYears(): Promise<void> {
  const currentYear = new Date().getFullYear();
  const month = new Date().getMonth();
  const baseYear = month < 5 ? currentYear - 1 : currentYear;
  const yearsToEnsure = [baseYear - 1, baseYear, baseYear + 1, baseYear + 2];

  for (const y of yearsToEnsure) {
    const name = `${y}-${y + 1}`;
    const startDate = new Date(Date.UTC(y, 5, 1));
    const endDate = new Date(Date.UTC(y + 1, 4, 31));

    try {
      await db
        .insert(academicYears)
        .values({
          name,
          startDate,
          endDate,
          status: "active",
          createdBy: "00000000-0000-0000-0000-000000000001",
          updatedBy: "00000000-0000-0000-0000-000000000001",
        })
        .onConflictDoNothing({ target: academicYears.name });
    } catch {
      try {
        await supabase.from("academic_years").upsert({
          name,
          start_date: startDate.toISOString(),
          end_date: endDate.toISOString(),
          status: "active",
        }, { onConflict: "name" });
      } catch {}
    }
  }
}

export async function getAllAcademicYearsAction(): Promise<ApiResponse<AcademicYearSelect[]>> {
  logger.debug("[Action: getAllAcademicYearsAction] Initiating");
  try {
    await ensureDefaultAcademicYears();

    let items: AcademicYearSelect[] = [];
    try {
      items = await db
        .select()
        .from(academicYears)
        .where(isNull(academicYears.deletedAt))
        .orderBy(desc(academicYears.startDate));
    } catch (err) {
      logger.error("[Action: getAllAcademicYearsAction] Drizzle query error", err);
    }

    if (items.length === 0) {
      try {
        const { data } = await supabase
          .from("academic_years")
          .select("*")
          .is("deleted_at", null)
          .order("start_date", { ascending: false });
        if (data && data.length > 0) {
          items = toCamelCase<AcademicYearSelect[]>(data);
        }
      } catch (restErr) {
        logger.error("[Action: getAllAcademicYearsAction] REST fallback error", restErr);
      }
    }

    return { success: true, data: items };
  } catch (error) {
    logger.error("[Action: getAllAcademicYearsAction] Failed", error);
    return formatErrorResponse(error);
  }
}

export async function createAcademicYearAction(rawInput: unknown): Promise<ApiResponse<AcademicYearSelect>> {
  logger.info("[Action: createAcademicYearAction] Initiating");
  try {
    const data = rawInput as any;
    if (!data?.name || !data?.startDate || !data?.endDate) {
      return {
        success: false,
        error: { code: "VALIDATION_ERROR", message: "name, startDate and endDate are required" },
      };
    }

    const result = await db
      .insert(academicYears)
      .values({
        name: data.name,
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
        status: data.status || "active",
        createdBy: "00000000-0000-0000-0000-000000000001",
        updatedBy: "00000000-0000-0000-0000-000000000001",
      })
      .returning();

    logger.info("[Action: createAcademicYearAction] Done", { id: result[0].id });
    return { success: true, data: result[0] };
  } catch (error) {
    logger.error("[Action: createAcademicYearAction] Failed", error);
    return formatErrorResponse(error);
  }
}
