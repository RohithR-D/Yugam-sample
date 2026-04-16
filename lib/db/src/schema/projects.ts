import mongoose from "mongoose";
import { z } from "zod/v4";
import { autoIncrementId, createMongoSchema } from "./mongoUtils.js";

const ProjectSchema = createMongoSchema({
  id: { type: Number, unique: true, index: true },
  projectName: { type: String, required: true },
  clientName: { type: String, required: true },
  budget: { type: Number, default: 0 },
  totalValue: { type: Number, default: 0 },
  status: { type: String, default: "Planning" },
  startDate: { type: Date },
  dueDate: { type: Date, required: true },
  description: { type: String, default: "" },
  createdAt: { type: Date, default: Date.now },
});

autoIncrementId(ProjectSchema, "projects");
export const projectsTable = mongoose.models.Project || mongoose.model("Project", ProjectSchema);

export const insertProjectSchema = z.object({
  projectName: z.string().min(1),
  clientName: z.string().min(1),
  budget: z.coerce.number().default(0),
  totalValue: z.coerce.number().default(0),
  status: z.enum(["Planning", "Active", "On Hold", "Handover"]).default("Planning"),
  startDate: z.union([z.string(), z.date()]).optional().transform((v) => (typeof v === "string" ? new Date(v) : v)),
  dueDate: z.union([z.string(), z.date()]).transform((v) => typeof v === "string" ? new Date(v) : v),
  description: z.string().default("").optional(),
});

const FlowMilestoneSchema = createMongoSchema({
  id: { type: Number, unique: true, index: true },
  projectId: { type: Number, required: true },
  title: { type: String, required: true },
  targetDate: { type: Date, required: true },
  completionPercent: { type: Number, default: 0 },
  notes: { type: String, default: "" },
  createdAt: { type: Date, default: Date.now },
});

autoIncrementId(FlowMilestoneSchema, "flow_milestones");
export const flowMilestonesTable = mongoose.models.FlowMilestone || mongoose.model("FlowMilestone", FlowMilestoneSchema);

export const insertFlowMilestoneSchema = z.object({
  projectId: z.coerce.number(),
  title: z.string().min(1),
  targetDate: z.union([z.string(), z.date()]).transform((v) => typeof v === "string" ? new Date(v) : v),
  completionPercent: z.coerce.number().default(0),
  notes: z.string().default("").optional(),
});

const FlowBudgetSchema = createMongoSchema({
  id: { type: Number, unique: true, index: true },
  projectId: { type: Number, required: true },
  category: { type: String, default: "General" },
  description: { type: String, default: "" },
  estimatedBudget: { type: Number, default: 0 },
  actualCost: { type: Number, default: 0 },
  notes: { type: String, default: "" },
  createdAt: { type: Date, default: Date.now },
});

autoIncrementId(FlowBudgetSchema, "flow_budgets");
export const flowBudgetsTable = mongoose.models.FlowBudget || mongoose.model("FlowBudget", FlowBudgetSchema);

export const insertFlowBudgetSchema = z.object({
  projectId: z.coerce.number(),
  category: z.string().default("General").optional(),
  description: z.string().default("").optional(),
  estimatedBudget: z.coerce.number().default(0),
  actualCost: z.coerce.number().default(0),
  notes: z.string().default("").optional(),
});

const FlowDocumentSchema = createMongoSchema({
  id: { type: Number, unique: true, index: true },
  projectId: { type: Number, required: true },
  fileName: { type: String, required: true },
  fileUrl: { type: String, default: "" },
  fileType: { type: String, default: "Contracts" },
  fileSize: { type: String, default: "" },
  uploadedBy: { type: String, default: "" },
  notes: { type: String, default: "" },
  createdAt: { type: Date, default: Date.now },
});

autoIncrementId(FlowDocumentSchema, "flow_documents");
export const flowDocumentsTable = mongoose.models.FlowDocument || mongoose.model("FlowDocument", FlowDocumentSchema);

export const insertFlowDocumentSchema = z.object({
  projectId: z.coerce.number(),
  fileName: z.string().min(1),
  fileUrl: z.string().default("").optional(),
  fileType: z.enum(["Contracts", "Architectural Drawings", "Compliance Permits", "BOQs"]).default("Contracts"),
  fileSize: z.string().default("").optional(),
  uploadedBy: z.string().default("").optional(),
  notes: z.string().default("").optional(),
});

export type InsertProject = z.infer<typeof insertProjectSchema>;
export type Project = mongoose.InferSchemaType<typeof ProjectSchema>;
export type FlowMilestone = mongoose.InferSchemaType<typeof FlowMilestoneSchema>;
export type FlowBudget = mongoose.InferSchemaType<typeof FlowBudgetSchema>;
export type FlowDocument = mongoose.InferSchemaType<typeof FlowDocumentSchema>;
