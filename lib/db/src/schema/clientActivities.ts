import { pgTable, serial, integer, varchar, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { clientsTable } from "./clients";

export const clientActivitiesTable = pgTable("client_activities", {
  id: serial("id").primaryKey(),
  clientId: integer("client_id").notNull().references(() => clientsTable.id),
  activityType: varchar("activity_type", { length: 50 }).notNull(),
  notes: text("notes").notNull().default(""),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertClientActivitySchema = createInsertSchema(clientActivitiesTable).omit({
  id: true,
  createdAt: true,
}).extend({
  activityType: z.enum(["Call", "Email", "Meeting", "Note"]),
});

export type InsertClientActivity = z.infer<typeof insertClientActivitySchema>;
export type ClientActivity = typeof clientActivitiesTable.$inferSelect;
