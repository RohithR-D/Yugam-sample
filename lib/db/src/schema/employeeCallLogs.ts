import { pgTable, serial, varchar, integer, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const employeeCallLogsTable = pgTable("employee_call_logs", {
  id: serial("id").primaryKey(),
  loggedByEmployee: varchar("logged_by_employee", { length: 255 }).notNull().default(""),
  clientName: varchar("client_name", { length: 255 }).notNull().default(""),
  callType: varchar("call_type", { length: 30 }).notNull().default("Outbound"),
  durationMinutes: integer("duration_minutes").notNull().default(0),
  callDate: timestamp("call_date").defaultNow(),
  callOutcome: varchar("call_outcome", { length: 30 }).notNull().default("Follow-up"),
  detailedNotes: text("detailed_notes").notNull().default(""),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertEmployeeCallLogSchema = createInsertSchema(employeeCallLogsTable).omit({
  id: true,
  createdAt: true,
}).extend({
  callType: z.enum(["Inbound", "Outbound"]).default("Outbound"),
  callOutcome: z.enum(["Interested", "Follow-up", "Not Interested", "Issue Resolved"]).default("Follow-up"),
  callDate: z.union([z.string(), z.date()]).optional().transform((v) => (typeof v === "string" ? new Date(v) : v)),
});

export type InsertEmployeeCallLog = z.infer<typeof insertEmployeeCallLogSchema>;
export type EmployeeCallLog = typeof employeeCallLogsTable.$inferSelect;
