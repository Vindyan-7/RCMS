import { db, supabase } from "@/db";
import { members, attendanceRecords, taskCompletions, inventoryItems } from "@/db/schema";
import { sql, count, eq } from "drizzle-orm";
import { logger } from "@/core/logger";

export interface KpiMetricsResponse {
  memberActiveRatioPct: number;
  averageAttendancePerSession: number;
  taskCompletionVolume: number;
  inventoryUtilizationPct: number;
  attendanceRate?: number;
  budgetUtilization?: number;
  activeMembers?: number;
  inventoryUtilization?: number;
}

export class KpiService {
  public async getKpiMetrics(): Promise<KpiMetricsResponse> {
    logger.info("[KpiService] Calculating central system KPI indicators");

    let memberActiveRatioPct = 0;
    let averageAttendancePerSession = 0;
    let taskCompletionVolume = 0;
    let inventoryUtilizationPct = 0;

    try {
      const [totalM, activeM, totalScans, totalCompletions, inventoryStats] = await Promise.all([
        db.select({ count: count() }).from(members),
        db.select({ count: count() }).from(members).where(eq(members.status, "active")),
        db.select({ count: count() }).from(attendanceRecords),
        db.select({ count: count() }).from(taskCompletions),
        db
          .select({
            totalQty: sql<number>`COALESCE(SUM(${inventoryItems.quantity}), 0)`,
            availableQty: sql<number>`COALESCE(SUM(${inventoryItems.available}), 0)`,
          })
          .from(inventoryItems),
      ]);

      const totMem = Number(totalM[0]?.count || 0);
      const actMem = Number(activeM[0]?.count || 0);
      memberActiveRatioPct = totMem > 0 ? Math.round((actMem / totMem) * 100) : 0;

      averageAttendancePerSession = Number(totalScans[0]?.count || 0);
      taskCompletionVolume = Number(totalCompletions[0]?.count || 0);

      const totalStock = Number(inventoryStats[0]?.totalQty || 0);
      const availableStock = Number(inventoryStats[0]?.availableQty || 0);
      const utilizedStock = totalStock - availableStock;
      inventoryUtilizationPct = totalStock > 0 ? Math.round((utilizedStock / totalStock) * 100) : 0;
    } catch (err) {
      logger.error("[KpiService] Drizzle query error, falling back to Supabase REST API", err);

      try {
        const [mRes, rRes, tRes, iRes] = await Promise.all([
          supabase.from("members").select("status"),
          supabase.from("attendance_records").select("id", { count: "exact" }),
          supabase.from("task_completions").select("id", { count: "exact" }),
          supabase.from("inventory_items").select("quantity, available"),
        ]);

        if (mRes.data) {
          const tot = mRes.data.length;
          const act = mRes.data.filter((m: any) => m.status === "active").length;
          memberActiveRatioPct = tot > 0 ? Math.round((act / tot) * 100) : 0;
        }

        averageAttendancePerSession = rRes.count || rRes.data?.length || 0;
        taskCompletionVolume = tRes.count || tRes.data?.length || 0;

        if (iRes.data) {
          const totalStock = iRes.data.reduce((acc: number, item: any) => acc + (Number(item.quantity) || 0), 0);
          const availStock = iRes.data.reduce((acc: number, item: any) => acc + (Number(item.available) || 0), 0);
          const util = totalStock - availStock;
          inventoryUtilizationPct = totalStock > 0 ? Math.round((util / totalStock) * 100) : 0;
        }
      } catch (restErr) {
        logger.error("[KpiService] REST fallback error", restErr);
      }
    }

    return {
      memberActiveRatioPct,
      averageAttendancePerSession,
      taskCompletionVolume,
      inventoryUtilizationPct,
    };
  }
}
