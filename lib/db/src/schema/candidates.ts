
import mongoose from "mongoose";
import { z } from "zod/v4";
import { autoIncrementId, createMongoSchema } from "./mongoUtils.js";

const CandidateSchema = createMongoSchema({
  id: { type: Number, unique: true, index: true },
  name: { type: String, required: true },
  roleApplied: { type: String, required: true },
  status: { type: String, default: "Applied" },
  appliedDate: { type: Date, default: Date.now },
  createdAt: { type: Date, default: Date.now },
});

autoIncrementId(CandidateSchema, "candidates");
export const candidatesTable = mongoose.models.Candidate || mongoose.model("Candidate", CandidateSchema);

export const insertCandidateSchema = z.object({
  name: z.string().min(1),
  roleApplied: z.string().min(1),
  status: z.enum(["Applied", "Interviewing", "Offered", "Rejected"]).default("Applied"),
  appliedDate: z.union([z.string(), z.date()]).optional().transform((v) => (typeof v === "string" ? new Date(v) : v)),
});

export type InsertCandidate = z.infer<typeof insertCandidateSchema>;
export type Candidate = mongoose.InferSchemaType<typeof CandidateSchema>;
