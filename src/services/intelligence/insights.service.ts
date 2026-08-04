/**
 * Intelligence Layer - Automated Insights Engine Implementation
 */

import { db, supabase, isServerless } from "@/db";
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

    if (isServerless) {
      try {
        const [invRes, memRes] = await Promise.all([
          supabase.from("inventory_items").select("id, name, available, quantity").is("deleted_at", null),
          supabase.from("members").select("id").eq("status", "inactive"),
        ]);

        if (invRes.data) {
          invRes.data.forEach((item: any) => {
            if (item.available === 0) {
              insights.push({
                id: `inv-out-${item.id}`,
                type: "warning",
                title: `Stock Depleted: ${item.name}`,
                description: `All ${item.quantity} units are currently issued out or unavailable.`,
              });
            }
          });
        }

        if (memRes.data && memRes.data.length > 0) {
          insights.push({
            id: "mem-inactive-info",
            type: "info",
            title: `${memRes.data.length} Inactive Member Records`,
            description: "Member records marked inactive; term renewal may be required.",
          });
        }
      } catch (restErr) {
        logger.error("[InsightsService] REST query error", restErr);
      }
      return insights;
    }

    try {
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
    } catch (err) {
      logger.error("[InsightsService] Drizzle query error, falling back to Supabase REST API", err);
    }

    return insights;
  }
}
