import mongoose from "mongoose";
import { z } from "zod/v4";
import { autoIncrementId, createMongoSchema } from "./mongoUtils.js";

const TaskSchema = createMongoSchema({
  id: { type: Number, unique: true, index: true },
  title: { type: String, required: true },
  description: { type: String, default: "" },
  assignee: { type: String, required: true },
  priority: { type: String, default: "Medium" },
  status: { type: String, default: "New" },
  parentProject: { type: Number },
  startDate: { type: Date },
  dueDate: { type: Date, required: true },
  attachments: { type: String, default: "" },
  reminder: { type: Date },
  createdAt: { type: Date, default: Date.now },
});

autoIncrementId(TaskSchema, "tasks");
export const tasksTable = mongoose.models.Task || mongoose.model("Task", TaskSchema);

export const insertTaskSchema = z.object({
  title: z.string().min(1),
  description: z.string().default("").optional(),
  assignee: z.string().min(1),
  priority: z.enum(["Low", "Medium", "High"]).default("Medium"),
  status: z.enum(["New", "In Progress", "Review", "Done"]).default("New"),
  parentProject: z.coerce.number().optional(),
  startDate: z.union([z.string(), z.date()]).optional().transform((v) => (typeof v === "string" ? new Date(v) : v)),
  dueDate: z.union([z.string(), z.date()]).transform((v) => typeof v === "string" ? new Date(v) : v),
  attachments: z.string().default("").optional(),
  reminder: z.union([z.string(), z.date()]).optional().transform((v) => (typeof v === "string" ? new Date(v) : v)),
});

export type InsertTask = z.infer<typeof insertTaskSchema>;
export type Task = mongoose.InferSchemaType<typeof TaskSchema>;

const TicketSchema = createMongoSchema({
  id: { type: Number, unique: true, index: true },
  ticketName: { type: String, required: true },
  type: { type: String, default: "Question" },
  priority: { type: String, default: "Medium" },
  status: { type: String, default: "New" },
  parentProject: { type: Number },
  dueDate: { type: Date },
  contact: { type: String, default: "" },
  description: { type: String, default: "" },
  assignedTeam: { type: String, default: "" },
  assignedTo: { type: String, default: "" },
  attachments: { type: String, default: "" },
  createdAt: { type: Date, default: Date.now },
});

autoIncrementId(TicketSchema, "sprint_tickets");
export const ticketsTable = mongoose.models.Ticket || mongoose.model("Ticket", TicketSchema);

export const insertTicketSchema = z.object({
  ticketName: z.string().min(1),
  type: z.enum(["Question", "Bug", "Maintenance", "HR"]).default("Question"),
  priority: z.enum(["Low", "Medium", "High"]).default("Medium"),
  status: z.enum(["New", "Open", "Pending", "Closed"]).default("New"),
  parentProject: z.coerce.number().optional(),
  dueDate: z.union([z.string(), z.date()]).optional().transform((v) => (typeof v === "string" ? new Date(v) : v)),
  contact: z.string().default("").optional(),
  description: z.string().default("").optional(),
  assignedTeam: z.string().default("").optional(),
  assignedTo: z.string().default("").optional(),
  attachments: z.string().default("").optional(),
});

export type InsertTicket = z.infer<typeof insertTicketSchema>;
export type Ticket = mongoose.InferSchemaType<typeof TicketSchema>;

const TimesheetSchema = createMongoSchema({
  id: { type: Number, unique: true, index: true },
  userName: { type: String, required: true },
  referenceType: { type: String, default: "Task" },
  referenceId: { type: Number },
  referenceLabel: { type: String, default: "" },
  logDate: { type: Date, required: true },
  startTime: { type: String, default: "09:00" },
  endTime: { type: String, default: "17:00" },
  totalHours: { type: Number, default: 0 },
  notes: { type: String, default: "" },
  createdAt: { type: Date, default: Date.now },
});

autoIncrementId(TimesheetSchema, "sprint_timesheets");
export const timesheetsTable = mongoose.models.Timesheet || mongoose.model("Timesheet", TimesheetSchema);

export const insertTimesheetSchema = z.object({
  userName: z.string().min(1),
  referenceType: z.enum(["Task", "Ticket"]).default("Task"),
  referenceId: z.coerce.number().optional(),
  referenceLabel: z.string().default("").optional(),
  logDate: z.union([z.string(), z.date()]).transform((v) => typeof v === "string" ? new Date(v) : v),
  startTime: z.string().default("09:00").optional(),
  endTime: z.string().default("17:00").optional(),
  totalHours: z.coerce.number().default(0),
  notes: z.string().default("").optional(),
});

export type InsertTimesheet = z.infer<typeof insertTimesheetSchema>;
export type Timesheet = mongoose.InferSchemaType<typeof TimesheetSchema>;
