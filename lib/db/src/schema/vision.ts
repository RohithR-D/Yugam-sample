import { pgTable, serial, varchar, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const visionGeneratedReportsTable = pgTable("vision_generated_reports", {
  id: serial("id").primaryKey(),
  reportName: varchar("report_name", { length: 300 }).notNull(),
  reportType: varchar("report_type", { length: 100 }).notNull(),
  dateFrom: timestamp("date_from").notNull(),
  dateTo: timestamp("date_to").notNull(),
  format: varchar("format", { length: 10 }).notNull().default("PDF"),
  generatedBy: varchar("generated_by", { length: 200 }).notNull().default("Admin"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertVisionReportSchema = createInsertSchema(visionGeneratedReportsTable).omit({
  id: true,
  createdAt: true,
}).extend({
  dateFrom: z.union([z.string(), z.date()]).transform((v) => typeof v === "string" ? new Date(v) : v),
  dateTo: z.union([z.string(), z.date()]).transform((v) => typeof v === "string" ? new Date(v) : v),
  format: z.enum(["PDF", "XLS"]).default("PDF"),
});
