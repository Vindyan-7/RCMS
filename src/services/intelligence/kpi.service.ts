/**
 * Intelligence Layer - KPI Engine Service Implementation
 */

import { db } from "@/db";
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
    const activeRatio = totMem > 0 ? Math.round((actMem / totMem) * 100) : 0;

    const totalStock = Number(inventoryStats[0]?.totalQty || 0);
    const availableStock = Number(inventoryStats[0]?.availableQty || 0);
    const utilizedStock = totalStock - availableStock;
    const inventoryUtilPct = totalStock > 0 ? Math.round((utilizedStock / totalStock) * 100) : 0;

    return {
      memberActiveRatioPct: activeRatio,
      averageAttendancePerSession: Number(totalScans[0]?.count || 0),
      taskCompletionVolume: Number(totalCompletions[0]?.count || 0),
      inventoryUtilizationPct: inventoryUtilPct,
    };
  }
}
