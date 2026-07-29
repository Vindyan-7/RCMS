/**
 * Intelligence Layer - Automated Insights Engine Implementation
 */

import { db } from "@/db";
import { inventoryItems, inventoryBorrowings, members } from "@/db/schema";
import { eq, isNull } from "drizzle-orm";
import { logger } from "@/core/logger";

export interface SystemInsightItem {
  id: string;
  type: "warning" | "info" | "alert";
  title: string;
  description: string;
  severity?: "critical" | "high" | "warning" | "info";
  actionableRecommendation?: string;
}

export class InsightsService {
  public async getSystemInsights(): Promise<SystemInsightItem[]> {
    logger.info("[InsightsService] Evaluating system-wide automated operational insights");

    const insights: SystemInsightItem[] = [];

    // 1. Low stock inventory warnings
    const lowStockItems = await db
      .select()
      .from(inventoryItems)
      .where(isNull(inventoryItems.deletedAt));

    (lowStockItems as any[]).forEach((item: any) => {
      if (item.available === 0) {
        insights.push({
          id: `inv-out-${item.id}`,
          type: "warning",
          title: `Stock Depleted: ${item.name}`,
          description: `All ${item.quantity} units are currently issued out or unavailable.`,
        });
      }
    });

    // 2. Overdue borrowings alert
    const overdueList = await db
      .select()
      .from(inventoryBorrowings)
      .where(eq(inventoryBorrowings.status, "overdue"));

    if (overdueList.length > 0) {
      insights.push({
        id: "inv-overdue-alert",
        type: "alert",
        title: `${overdueList.length} Equipment Borrowings Overdue`,
        description: "Equipment borrowings have passed their designated return due dates.",
      });
    }

    // 3. Inactive member status check
    const inactiveMembers = await db
      .select()
      .from(members)
      .where(eq(members.status, "inactive"));

    if (inactiveMembers.length > 0) {
      insights.push({
        id: "mem-inactive-info",
        type: "info",
        title: `${inactiveMembers.length} Inactive Member Records`,
        description: "Member records marked inactive; term renewal may be required.",
      });
    }

    return insights;
  }
}
