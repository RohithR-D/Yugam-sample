import { pgTable, serial, varchar, numeric, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const clientsTable = pgTable("clients", {
  id: serial("id").primaryKey(),
  companyName: varchar("company_name", { length: 255 }).notNull(),
  contactName: varchar("contact_name", { length: 255 }).notNull(),
  industry: varchar("industry", { length: 100 }).notNull().default("General"),
  status: varchar("status", { length: 50 }).notNull().default("Lead"),
  pipelineStatus: varchar("pipeline_status", { length: 50 }).notNull().default("Lead"),
  dealValue: numeric("deal_value", { precision: 12, scale: 2 }).notNull().default("0"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertClientSchema = createInsertSchema(clientsTable).omit({
  id: true,
  createdAt: true,
}).extend({
  pipelineStatus: z.enum(["Lead", "Contacted", "Proposal", "Won", "Lost"]).default("Lead"),
});

export type InsertClient = z.infer<typeof insertClientSchema>;
export type Client = typeof clientsTable.$inferSelect;
