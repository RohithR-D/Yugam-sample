import { pgTable, serial, varchar, numeric, integer, timestamp, text } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const projectsTable = pgTable("projects", {
  id: serial("id").primaryKey(),
  projectName: varchar("project_name", { length: 255 }).notNull(),
  clientName: varchar("client_name", { length: 255 }).notNull(),
  budget: numeric("budget", { precision: 14, scale: 2 }).notNull().default("0"),
  totalValue: numeric("total_value", { precision: 14, scale: 2 }).notNull().default("0"),
  status: varchar("status", { length: 50 }).notNull().default("Planning"),
  startDate: timestamp("start_date"),
  dueDate: timestamp("due_date").notNull(),
  description: text("description").notNull().default(""),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertProjectSchema = createInsertSchema(projectsTable).omit({
  id: true,
  createdAt: true,
}).extend({
  status: z.enum(["Planning", "Active", "On Hold", "Handover"]).default("Planning"),
  dueDate: z.union([z.string(), z.date()]).transform((v) => typeof v === "string" ? new Date(v) : v),
  startDate: z.union([z.string(), z.date()]).transform((v) => typeof v === "string" ? new Date(v) : v).optional(),
});

export const flowMilestonesTable = pgTable("flow_milestones", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  targetDate: timestamp("target_date").notNull(),
  completionPercent: integer("completion_percent").notNull().default(0),
  notes: text("notes").notNull().default(""),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertFlowMilestoneSchema = createInsertSchema(flowMilestonesTable).omit({
  id: true,
  createdAt: true,
}).extend({
  targetDate: z.union([z.string(), z.date()]).transform((v) => typeof v === "string" ? new Date(v) : v),
});

export const flowBudgetsTable = pgTable("flow_budgets", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull(),
  category: varchar("category", { length: 100 }).notNull().default("General"),
  description: varchar("description", { length: 255 }).notNull().default(""),
  estimatedBudget: numeric("estimated_budget", { precision: 14, scale: 2 }).notNull().default("0"),
  actualCost: numeric("actual_cost", { precision: 14, scale: 2 }).notNull().default("0"),
  notes: text("notes").notNull().default(""),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertFlowBudgetSchema = createInsertSchema(flowBudgetsTable).omit({
  id: true,
  createdAt: true,
});

export const flowDocumentsTable = pgTable("flow_documents", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull(),
  fileName: varchar("file_name", { length: 255 }).notNull(),
  fileUrl: varchar("file_url", { length: 500 }).notNull().default(""),
  fileType: varchar("file_type", { length: 50 }).notNull().default("Contracts"),
  fileSize: varchar("file_size", { length: 30 }).notNull().default(""),
  uploadedBy: varchar("uploaded_by", { length: 100 }).notNull().default(""),
  notes: text("notes").notNull().default(""),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertFlowDocumentSchema = createInsertSchema(flowDocumentsTable).omit({
  id: true,
  createdAt: true,
}).extend({
  fileType: z.enum(["Contracts", "Architectural Drawings", "Compliance Permits", "BOQs"]).default("Contracts"),
});

export type InsertProject = z.infer<typeof insertProjectSchema>;
export type Project = typeof projectsTable.$inferSelect;
export type FlowMilestone = typeof flowMilestonesTable.$inferSelect;
export type FlowBudget = typeof flowBudgetsTable.$inferSelect;
export type FlowDocument = typeof flowDocumentsTable.$inferSelect;
