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

export class DashboardService {
  public async getExecutiveDashboardMetrics(): Promise<DashboardMetricsResponse> {
    logger.info("[DashboardService] Aggregating executive dashboard intelligence metrics");

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

    const totalIncome = Number(financialSummary[0]?.income || 0);
    const totalExpense = Number(financialSummary[0]?.expense || 0);

    return {
      totalMembers: Number(membersCount[0]?.count || 0),
      activeMembers: Number(activeMembersCount[0]?.count || 0),
      totalAttendanceSessions: Number(sessionsCount[0]?.count || 0),
      totalAttendanceScans: Number(scansCount[0]?.count || 0),
      totalTasksCompleted: Number(tasksCompletedCount[0]?.count || 0),
      totalEvents: Number(eventsCount[0]?.count || 0),
      totalInventoryItems: Number(inventoryCount[0]?.count || 0),
      activeBorrowings: Number(activeBorrowingsCount[0]?.count || 0),
      financialNetBalance: totalIncome - totalExpense,
    };
  }
}
