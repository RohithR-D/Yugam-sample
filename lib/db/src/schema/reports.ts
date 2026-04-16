import mongoose from "mongoose";
import { z } from "zod/v4";
import { autoIncrementId, createMongoSchema } from "./mongoUtils.js";

const ReportSchema = createMongoSchema({
  id: { type: Number, unique: true, index: true },
  reportName: { type: String, required: true },
  moduleSource: { type: String, required: true },
  chartType: { type: String, required: true },
  lastRun: { type: Date, required: true },
  createdAt: { type: Date, default: Date.now },
});

autoIncrementId(ReportSchema, "reports");
export const reportsTable = mongoose.models.Report || mongoose.model("Report", ReportSchema);

export const insertReportSchema = z.object({
  reportName: z.string().min(1),
  moduleSource: z.string().min(1),
  chartType: z.string().min(1),
  lastRun: z.union([z.string(), z.date()]).transform((v) => typeof v === "string" ? new Date(v) : v),
});

export type InsertReport = z.infer<typeof insertReportSchema>;
export type Report = mongoose.InferSchemaType<typeof ReportSchema>;
