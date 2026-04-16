import mongoose from "mongoose";
import { z } from "zod/v4";
import { autoIncrementId, createMongoSchema } from "./mongoUtils.js";

const VisionGeneratedReportSchema = createMongoSchema({
  id: { type: Number, unique: true, index: true },
  reportName: { type: String, required: true },
  reportType: { type: String, required: true },
  dateFrom: { type: Date, required: true },
  dateTo: { type: Date, required: true },
  format: { type: String, default: "PDF" },
  generatedBy: { type: String, default: "Admin" },
  createdAt: { type: Date, default: Date.now },
});

autoIncrementId(VisionGeneratedReportSchema, "vision_generated_reports");
export const visionGeneratedReportsTable = mongoose.models.VisionGeneratedReport || mongoose.model("VisionGeneratedReport", VisionGeneratedReportSchema);

export const insertVisionReportSchema = z.object({
  reportName: z.string().min(1),
  reportType: z.string().min(1),
  dateFrom: z.union([z.string(), z.date()]).transform((v) => typeof v === "string" ? new Date(v) : v),
  dateTo: z.union([z.string(), z.date()]).transform((v) => typeof v === "string" ? new Date(v) : v),
  format: z.enum(["PDF", "XLS"]).default("PDF"),
  generatedBy: z.string().default("Admin").optional(),
});

export type InsertVisionReport = z.infer<typeof insertVisionReportSchema>;
export type VisionGeneratedReport = mongoose.InferSchemaType<typeof VisionGeneratedReportSchema>;
