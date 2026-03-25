import { pgTable, serial, varchar, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const reportsTable = pgTable("reports", {
  id: serial("id").primaryKey(),
  reportName: varchar("report_name", { length: 500 }).notNull(),
  moduleSource: varchar("module_source", { length: 100 }).notNull(),
  chartType: varchar("chart_type", { length: 50 }).notNull(),
  lastRun: timestamp("last_run").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertReportSchema = createInsertSchema(reportsTable).omit({
  id: true,
  createdAt: true,
}).extend({
  lastRun: z.union([z.string(), z.date()]).transform((v) => typeof v === "string" ? new Date(v) : v),
});

export type InsertReport = z.infer<typeof insertReportSchema>;
export type Report = typeof reportsTable.$inferSelect;
