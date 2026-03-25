import { pgTable, serial, varchar, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const tasksTable = pgTable("tasks", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description").notNull().default(""),
  assignee: varchar("assignee", { length: 255 }).notNull(),
  priority: varchar("priority", { length: 50 }).notNull().default("Medium"),
  status: varchar("status", { length: 50 }).notNull().default("To Do"),
  dueDate: timestamp("due_date").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertTaskSchema = createInsertSchema(tasksTable).omit({
  id: true,
  createdAt: true,
}).extend({
  priority: z.enum(["High", "Medium", "Low"]),
  status: z.enum(["To Do", "In Progress", "Review", "Done"]),
  dueDate: z.union([z.string(), z.date()]).transform((v) => typeof v === "string" ? new Date(v) : v),
});

export type InsertTask = z.infer<typeof insertTaskSchema>;
export type Task = typeof tasksTable.$inferSelect;
