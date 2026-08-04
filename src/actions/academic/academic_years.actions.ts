"use server";

/**
 * Academic Years - Server Actions
 * Production ready with serverless REST support
 */

import { ApiResponse } from "@/core/types";
import { AcademicYearSelect } from "@/db/schema";
import { db, supabase, isServerless, toCamelCase } from "@/db";
import { academicYears } from "@/db/schema";
import { isNull, desc } from "drizzle-orm";
import { formatErrorResponse } from "@/core/errors";
import { logger } from "@/core/logger";

const DEFAULT_SYSTEM_USER = "00000000-0000-0000-0000-000000000001";

async function ensureDefaultAcademicYears(): Promise<void> {
  const currentYear = new Date().getFullYear();
  const month = new Date().getMonth();
  const baseYear = month < 5 ? currentYear - 1 : currentYear;
  const yearsToEnsure = [baseYear - 1, baseYear, baseYear + 1, baseYear + 2];

  for (const y of yearsToEnsure) {
    const name = `${y}-${y + 1}`;
    const startDate = new Date(Date.UTC(y, 5, 1));
    const endDate = new Date(Date.UTC(y + 1, 4, 31));

    if (isServerless) {
      try {
        await supabase.from("academic_years").upsert(
          {
            name,
            start_date: startDate.toISOString(),
            end_date: endDate.toISOString(),
            status: "active",
            created_by: DEFAULT_SYSTEM_USER,
            updated_by: DEFAULT_SYSTEM_USER,
          },
          { onConflict: "name" }
        );
      } catch (err) {
        logger.error("[ensureDefaultAcademicYears] REST upsert error", err);
      }
    } else {
      try {
        await db
          .insert(academicYears)
          .values({
            name,
            startDate,
            endDate,
            status: "active",
            createdBy: DEFAULT_SYSTEM_USER,
            updatedBy: DEFAULT_SYSTEM_USER,
          })
          .onConflictDoNothing({ target: academicYears.name });
      } catch {
        try {
          await supabase.from("academic_years").upsert(
            {
              name,
              start_date: startDate.toISOString(),
              end_date: endDate.toISOString(),
              status: "active",
              created_by: DEFAULT_SYSTEM_USER,
              updated_by: DEFAULT_SYSTEM_USER,
            },
            { onConflict: "name" }
          );
        } catch (restErr) {
          logger.error("[ensureDefaultAcademicYears] Fallback error", restErr);
        }
      }
    }
  }
}

export async function getAllAcademicYearsAction(): Promise<ApiResponse<AcademicYearSelect[]>> {
  logger.debug("[Action: getAllAcademicYearsAction] Initiating");
  try {
    await ensureDefaultAcademicYears();

    let items: AcademicYearSelect[] = [];

    if (isServerless) {
      const { data, error } = await supabase
        .from("academic_years")
        .select("*")
        .is("deleted_at", null)
        .order("start_date", { ascending: false });

      if (!error && data) {
        items = toCamelCase<AcademicYearSelect[]>(data);
      }
    } else {
      try {
        items = await db
          .select()
          .from(academicYears)
          .where(isNull(academicYears.deletedAt))
          .orderBy(desc(academicYears.startDate));
      } catch (err) {
        logger.error("[Action: getAllAcademicYearsAction] Drizzle query error", err);
      }
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

    const startDateObj = new Date(data.startDate);
    const endDateObj = new Date(data.endDate);

    if (isServerless) {
      const { data: inserted, error } = await supabase
        .from("academic_years")
        .insert({
          name: data.name,
          start_date: startDateObj.toISOString(),
          end_date: endDateObj.toISOString(),
          status: data.status || "active",
          created_by: DEFAULT_SYSTEM_USER,
          updated_by: DEFAULT_SYSTEM_USER,
        })
        .select()
        .single();

      if (error) {
        logger.error("[Action: createAcademicYearAction] REST insert error", error);
        return { success: false, error: { code: "DB_ERROR", message: error.message } };
      }

      const item = toCamelCase<AcademicYearSelect>(inserted);
      return { success: true, data: item };
    }

    const result = await db
      .insert(academicYears)
      .values({
        name: data.name,
        startDate: startDateObj,
        endDate: endDateObj,
        status: data.status || "active",
        createdBy: DEFAULT_SYSTEM_USER,
        updatedBy: DEFAULT_SYSTEM_USER,
      })
      .returning();

    logger.info("[Action: createAcademicYearAction] Done", { id: result[0].id });
    return { success: true, data: result[0] };
  } catch (error) {
    logger.error("[Action: createAcademicYearAction] Failed", error);
    return formatErrorResponse(error);
  }
}
