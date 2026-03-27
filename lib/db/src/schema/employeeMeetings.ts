import { pgTable, serial, varchar, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const employeeMeetingsTable = pgTable("employee_meetings", {
  id: serial("id").primaryKey(),
  loggedByEmployee: varchar("logged_by_employee", { length: 255 }).notNull().default(""),
  clientName: varchar("client_name", { length: 255 }).notNull().default(""),
  meetingTitle: varchar("meeting_title", { length: 500 }).notNull().default(""),
  meetingDate: timestamp("meeting_date").defaultNow(),
  startTime: varchar("start_time", { length: 10 }).notNull().default("09:00"),
  endTime: varchar("end_time", { length: 10 }).notNull().default("10:00"),
  attendees: text("attendees").notNull().default(""),
  agendaAndMinutes: text("agenda_and_minutes").notNull().default(""),
  status: varchar("status", { length: 30 }).notNull().default("Scheduled"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertEmployeeMeetingSchema = createInsertSchema(employeeMeetingsTable).omit({
  id: true,
  createdAt: true,
}).extend({
  status: z.enum(["Scheduled", "Completed", "Canceled"]).default("Scheduled"),
  meetingDate: z.union([z.string(), z.date()]).optional().transform((v) => (typeof v === "string" ? new Date(v) : v)),
});

export type InsertEmployeeMeeting = z.infer<typeof insertEmployeeMeetingSchema>;
export type EmployeeMeeting = typeof employeeMeetingsTable.$inferSelect;
