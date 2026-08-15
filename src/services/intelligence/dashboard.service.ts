/**
 * Intelligence Layer - Executive Dashboard & Analytics Service Implementation
 */

import { db } from "@/db";
import { members, attendanceSessions, attendanceRecords, tasks, taskCompletions, events, eventParticipations, inventoryItems, inventoryBorrowings, financialTransactions } from "@/db/schema";
import { sql, count, eq } from "drizzle-orm";
import { logger } from "@/core/logger";

export interface DashboardMetricsResponse {
  totalMembers: number;
  activeMembers: number;
  totalAttendanceSessions: number;
  totalAttendanceScans: number;
  totalTasksCompleted: number;
  totalEvents: number;
  totalInventoryItems: number;
  activeBorrowings: number;
  financialNetBalance: number;
}

import { supabase } from "@/db";

export class DashboardService {
  public async getExecutiveDashboardMetrics(): Promise<DashboardMetricsResponse> {
    logger.info("[DashboardService] Aggregating executive dashboard intelligence metrics");

    let totalMembers = 0;
    let activeMembers = 0;
    let totalAttendanceSessions = 0;
    let totalAttendanceScans = 0;
    let totalTasksCompleted = 0;
    let totalEvents = 0;
    let totalInventoryItems = 0;
    let activeBorrowings = 0;
    let financialNetBalance = 0;

    try {
      const [
        membersCount,
        activeMembersCount,
        sessionsCount,
        scansCount,
        tasksCompletedCount,
        eventsCount,
        inventoryCount,
        activeBorrowingsCount,
        financialSummary,
      ] = await Promise.all([
        db.select({ count: count() }).from(members),
        db.select({ count: count() }).from(members).where(eq(members.status, "active")),
        db.select({ count: count() }).from(attendanceSessions),
        db.select({ count: count() }).from(attendanceRecords),
        db.select({ count: count() }).from(taskCompletions),
        db.select({ count: count() }).from(events),
        db.select({ count: count() }).from(inventoryItems),
        db.select({ count: count() }).from(inventoryBorrowings).where(eq(inventoryBorrowings.status, "issued")),
        db
          .select({
            income: sql<number>`COALESCE(SUM(CASE WHEN ${financialTransactions.type} = 'income' THEN ${financialTransactions.amount} ELSE 0 END), 0)`,
            expense: sql<number>`COALESCE(SUM(CASE WHEN ${financialTransactions.type} = 'expense' THEN ${financialTransactions.amount} ELSE 0 END), 0)`,
          })
          .from(financialTransactions),
      ]);

      totalMembers = Number(membersCount[0]?.count || 0);
      activeMembers = Number(activeMembersCount[0]?.count || 0);
      totalAttendanceSessions = Number(sessionsCount[0]?.count || 0);
      totalAttendanceScans = Number(scansCount[0]?.count || 0);
      totalTasksCompleted = Number(tasksCompletedCount[0]?.count || 0);
      totalEvents = Number(eventsCount[0]?.count || 0);
      totalInventoryItems = Number(inventoryCount[0]?.count || 0);
      activeBorrowings = Number(activeBorrowingsCount[0]?.count || 0);
      financialNetBalance = Number(financialSummary[0]?.income || 0) - Number(financialSummary[0]?.expense || 0);
    } catch (err) {
      logger.error("[DashboardService] Drizzle query error, falling back to Supabase REST API", err);

      try {
        const [mRes, sRes, rRes, tRes, eRes, iRes] = await Promise.all([
          supabase.from("members").select("status"),
          supabase.from("attendance_sessions").select("id", { count: "exact" }).neq("status", "archived").neq("status", "draft").is("deleted_at", null),
          supabase.from("attendance_records").select("id", { count: "exact" }),
          supabase.from("task_completions").select("id", { count: "exact" }),
          supabase.from("events").select("id", { count: "exact" }),
          supabase.from("inventory_items").select("id", { count: "exact" }),
        ]);

        if (mRes.data) {
          totalMembers = mRes.data.length;
          activeMembers = mRes.data.filter((m: any) => m.status === "active").length;
        }
        totalAttendanceSessions = sRes.count || sRes.data?.length || 0;
        totalAttendanceScans = rRes.count || rRes.data?.length || 0;
        totalTasksCompleted = tRes.count || tRes.data?.length || 0;
        totalEvents = eRes.count || eRes.data?.length || 0;
        totalInventoryItems = iRes.count || iRes.data?.length || 0;
      } catch (restErr) {
        logger.error("[DashboardService] REST fallback error", restErr);
      }
    }

    return {
      totalMembers,
      activeMembers,
      totalAttendanceSessions,
      totalAttendanceScans,
      totalTasksCompleted,
      totalEvents,
      totalInventoryItems,
      activeBorrowings,
      financialNetBalance,
    };
  }
}
