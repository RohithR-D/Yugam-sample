import { pgTable, serial, varchar, text, integer, numeric, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const tasksTable = pgTable("tasks", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description").notNull().default(""),
  assignee: varchar("assignee", { length: 255 }).notNull(),
  priority: varchar("priority", { length: 50 }).notNull().default("Medium"),
  status: varchar("status", { length: 50 }).notNull().default("New"),
  parentProject: integer("parent_project"),
  startDate: timestamp("start_date"),
  dueDate: timestamp("due_date").notNull(),
  attachments: text("attachments").notNull().default(""),
  reminder: timestamp("reminder"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertTaskSchema = createInsertSchema(tasksTable).omit({
  id: true,
  createdAt: true,
}).extend({
  priority: z.enum(["Low", "Medium", "High"]),
  status: z.enum(["New", "In Progress", "Review", "Done"]),
  dueDate: z.union([z.string(), z.date()]).transform((v) => typeof v === "string" ? new Date(v) : v),
  startDate: z.union([z.string(), z.date()]).transform((v) => typeof v === "string" ? new Date(v) : v).optional(),
  reminder: z.union([z.string(), z.date()]).transform((v) => typeof v === "string" ? new Date(v) : v).optional(),
});

export type InsertTask = z.infer<typeof insertTaskSchema>;
export type Task = typeof tasksTable.$inferSelect;

export const ticketsTable = pgTable("sprint_tickets", {
  id: serial("id").primaryKey(),
  ticketName: varchar("ticket_name", { length: 255 }).notNull(),
  type: varchar("type", { length: 50 }).notNull().default("Question"),
  priority: varchar("priority", { length: 50 }).notNull().default("Medium"),
  status: varchar("status", { length: 50 }).notNull().default("New"),
  parentProject: integer("parent_project"),
  dueDate: timestamp("due_date"),
  contact: varchar("contact", { length: 255 }).notNull().default(""),
  description: text("description").notNull().default(""),
  assignedTeam: varchar("assigned_team", { length: 100 }).notNull().default(""),
  assignedTo: varchar("assigned_to", { length: 255 }).notNull().default(""),
  attachments: text("attachments").notNull().default(""),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertTicketSchema = createInsertSchema(ticketsTable).omit({
  id: true,
  createdAt: true,
}).extend({
  type: z.enum(["Question", "Bug", "Maintenance", "HR"]),
  priority: z.enum(["Low", "Medium", "High"]),
  status: z.enum(["New", "Open", "Pending", "Closed"]),
  dueDate: z.union([z.string(), z.date()]).transform((v) => typeof v === "string" ? new Date(v) : v).optional(),
});

export type InsertTicket = z.infer<typeof insertTicketSchema>;
export type Ticket = typeof ticketsTable.$inferSelect;

export const timesheetsTable = pgTable("sprint_timesheets", {
  id: serial("id").primaryKey(),
  userName: varchar("user_name", { length: 255 }).notNull(),
  referenceType: varchar("reference_type", { length: 50 }).notNull().default("Task"),
  referenceId: integer("reference_id"),
  referenceLabel: varchar("reference_label", { length: 255 }).notNull().default(""),
  logDate: timestamp("log_date").notNull(),
  startTime: varchar("start_time", { length: 10 }).notNull().default("09:00"),
  endTime: varchar("end_time", { length: 10 }).notNull().default("17:00"),
  totalHours: numeric("total_hours", { precision: 6, scale: 2 }).notNull().default("0"),
  notes: text("notes").notNull().default(""),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertTimesheetSchema = createInsertSchema(timesheetsTable).omit({
  id: true,
  createdAt: true,
}).extend({
  referenceType: z.enum(["Task", "Ticket"]),
  logDate: z.union([z.string(), z.date()]).transform((v) => typeof v === "string" ? new Date(v) : v),
});

export type InsertTimesheet = z.infer<typeof insertTimesheetSchema>;
export type Timesheet = typeof timesheetsTable.$inferSelect;
