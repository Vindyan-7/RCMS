/**
 * Operations Domain - Event Submission Images Schema Definition
 */

import { pgTable, uuid, text, integer, varchar, timestamp } from "drizzle-orm/pg-core";
import { eventSubmissions } from "./event_submissions";

export const eventSubmissionImages = pgTable("event_submission_images", {
  id: uuid("id").primaryKey().defaultRandom(),
  submissionId: uuid("submission_id")
    .notNull()
    .references(() => eventSubmissions.id, { onDelete: "cascade" }),
  imageUrl: text("image_url").notNull(),
  storagePath: text("storage_path").notNull(),
  fileSizeBytes: integer("file_size_bytes"),
  mimeType: varchar("mime_type", { length: 50 }),
  displayOrder: integer("display_order").default(0).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).defaultNow().notNull(),
});

export type EventSubmissionImageSelect = typeof eventSubmissionImages.$inferSelect;
export type EventSubmissionImageInsert = typeof eventSubmissionImages.$inferInsert;
