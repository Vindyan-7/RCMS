"use server";

/**
 * Academic Years - Server Actions
 */

import { ApiResponse } from "@/core/types";
import { AcademicYearSelect } from "@/db/schema";
import { db } from "@/db";
import { academicYears } from "@/db/schema";
import { isNull, desc } from "drizzle-orm";
import { formatErrorResponse } from "@/core/errors";
import { logger } from "@/core/logger";

async function ensureDefaultAcademicYears(): Promise<void> {
  const currentYear = new Date().getFullYear();
  const month = new Date().getMonth();
  // If current month is before June (month 5), current academic year started last year
  const baseYear = month < 5 ? currentYear - 1 : currentYear;

  // Generate 4 rolling academic years: [baseYear - 1, baseYear, baseYear + 1, baseYear + 2]
  const yearsToEnsure = [baseYear - 1, baseYear, baseYear + 1, baseYear + 2];

  for (const y of yearsToEnsure) {
    const name = `${y}-${y + 1}`;
    const startDate = new Date(Date.UTC(y, 5, 1)); // 01-06-YYYY
    const endDate = new Date(Date.UTC(y + 1, 4, 31)); // 31-05-YYYY+1

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
  }
}

export async function getAllAcademicYearsAction(): Promise<ApiResponse<AcademicYearSelect[]>> {
  logger.debug("[Action: getAllAcademicYearsAction] Initiating");
  try {
    await ensureDefaultAcademicYears();

    const items = await db
      .select()
      .from(academicYears)
      .where(isNull(academicYears.deletedAt))
      .orderBy(desc(academicYears.startDate));

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
