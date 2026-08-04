import { pgTable, uuid, integer } from "drizzle-orm/pg-core";
import { baseColumns } from "./base";
import { teamGenerations } from "./team_generations";
import { members } from "./members";

export const teamMembers = pgTable("team_members", {
  generationId: uuid("generation_id")
    .notNull()
    .references(() => teamGenerations.id),
  teamNumber: integer("team_number").notNull(),
  memberId: uuid("member_id")
    .notNull()
    .references(() => members.id),
  positionInTeam: integer("position_in_team").notNull(),
  ...baseColumns,
});
