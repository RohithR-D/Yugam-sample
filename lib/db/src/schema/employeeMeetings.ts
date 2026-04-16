import mongoose from "mongoose";
import { z } from "zod/v4";
import { autoIncrementId, createMongoSchema } from "./mongoUtils.js";

const EmployeeMeetingSchema = createMongoSchema({
  id: { type: Number, unique: true, index: true },
  loggedByEmployee: { type: String, default: "" },
  clientName: { type: String, default: "" },
  meetingTitle: { type: String, default: "" },
  meetingDate: { type: Date, default: Date.now },
  startTime: { type: String, default: "09:00" },
  endTime: { type: String, default: "10:00" },
  attendees: { type: String, default: "" },
  agendaAndMinutes: { type: String, default: "" },
  status: { type: String, default: "Scheduled" },
  createdAt: { type: Date, default: Date.now },
});

autoIncrementId(EmployeeMeetingSchema, "employee_meetings");
export const employeeMeetingsTable = mongoose.models.EmployeeMeeting || mongoose.model("EmployeeMeeting", EmployeeMeetingSchema);

export const insertEmployeeMeetingSchema = z.object({
  loggedByEmployee: z.string().default("").optional(),
  clientName: z.string().default("").optional(),
  meetingTitle: z.string().default("").optional(),
  meetingDate: z.union([z.string(), z.date()]).optional().transform((v) => (typeof v === "string" ? new Date(v) : v)),
  startTime: z.string().default("09:00").optional(),
  endTime: z.string().default("10:00").optional(),
  attendees: z.string().default("").optional(),
  agendaAndMinutes: z.string().default("").optional(),
  status: z.enum(["Scheduled", "Completed", "Canceled"]).default("Scheduled"),
});

export type InsertEmployeeMeeting = z.infer<typeof insertEmployeeMeetingSchema>;
export type EmployeeMeeting = mongoose.InferSchemaType<typeof EmployeeMeetingSchema>;
