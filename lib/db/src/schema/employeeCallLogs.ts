import mongoose from "mongoose";
import { z } from "zod/v4";
import { autoIncrementId, createMongoSchema } from "./mongoUtils.js";

const EmployeeCallLogSchema = createMongoSchema({
  id: { type: Number, unique: true, index: true },
  loggedByEmployee: { type: String, default: "" },
  clientName: { type: String, default: "" },
  callType: { type: String, default: "Outbound" },
  durationMinutes: { type: Number, default: 0 },
  callDate: { type: Date, default: Date.now },
  callOutcome: { type: String, default: "Follow-up" },
  detailedNotes: { type: String, default: "" },
  createdAt: { type: Date, default: Date.now },
});

autoIncrementId(EmployeeCallLogSchema, "employee_call_logs");
export const employeeCallLogsTable = mongoose.models.EmployeeCallLog || mongoose.model("EmployeeCallLog", EmployeeCallLogSchema);

export const insertEmployeeCallLogSchema = z.object({
  loggedByEmployee: z.string().default("").optional(),
  clientName: z.string().default("").optional(),
  callType: z.enum(["Inbound", "Outbound"]).default("Outbound"),
  durationMinutes: z.coerce.number().default(0).optional(),
  callDate: z.union([z.string(), z.date()]).optional().transform((v) => (typeof v === "string" ? new Date(v) : v)),
  callOutcome: z.enum(["Interested", "Follow-up", "Not Interested", "Issue Resolved"]).default("Follow-up"),
  detailedNotes: z.string().default("").optional(),
});

export type InsertEmployeeCallLog = z.infer<typeof insertEmployeeCallLogSchema>;
export type EmployeeCallLog = mongoose.InferSchemaType<typeof EmployeeCallLogSchema>;
