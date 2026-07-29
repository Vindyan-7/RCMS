/**
 * Intelligence Layer - Universal Search Engine Implementation
 */

import { db } from "@/db";
import { members, tasks, events, inventoryItems } from "@/db/schema";
import { ilike, or } from "drizzle-orm";
import { logger } from "@/core/logger";

export interface UniversalSearchResultItem {
  id: string;
  type: "member" | "task" | "event" | "inventory";
  title: string;
  subtitle: string;
}

export class UniversalSearchService {
  public async searchAll(query: string): Promise<UniversalSearchResultItem[]> {
    logger.info("[UniversalSearchService] Executing cross-domain universal search", { query });

    if (!query || query.trim().length === 0) return [];
    const searchPattern = `%${query}%`;

    const [matchedMembers, matchedTasks, matchedEvents, matchedInventory] = await Promise.all([
      db
        .select()
        .from(members)
        .where(
          or(
            ilike(members.name, searchPattern),
            ilike(members.rollNumber, searchPattern),
            ilike(members.email, searchPattern)
          )
        )
        .limit(5),
      db
        .select()
        .from(tasks)
        .where(ilike(tasks.title, searchPattern))
        .limit(5),
      db
        .select()
        .from(events)
        .where(ilike(events.name, searchPattern))
        .limit(5),
      db
        .select()
        .from(inventoryItems)
        .where(ilike(inventoryItems.name, searchPattern))
        .limit(5),
    ]);

    const results: UniversalSearchResultItem[] = [];

    (matchedMembers as any[]).forEach((m: any) =>
      results.push({
        id: m.id,
        type: "member",
        title: m.name,
        subtitle: `Roll: ${m.rollNumber} | Email: ${m.email}`,
      })
    );

    (matchedTasks as any[]).forEach((t: any) =>
      results.push({
        id: t.id,
        type: "task",
        title: t.title,
        subtitle: `Points: ${t.points} | Status: ${t.status}`,
      })
    );

    (matchedEvents as any[]).forEach((e: any) =>
      results.push({
        id: e.id,
        type: "event",
        title: e.name,
        subtitle: `Status: ${e.status} | Venue: ${e.venue || "TBD"}`,
      })
    );

    (matchedInventory as any[]).forEach((i: any) =>
      results.push({
        id: i.id,
        type: "inventory",
        title: i.name,
        subtitle: `Category: ${i.category} | Available: ${i.available}/${i.quantity}`,
      })
    );

    return results;
  }
}
