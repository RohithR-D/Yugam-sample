import mongoose from "mongoose";
import { z } from "zod/v4";
import { autoIncrementId, createMongoSchema } from "./mongoUtils.js";

const ProposalSchema = createMongoSchema({
  id: { type: Number, unique: true, index: true },
  clientId: { type: Number },
  title: { type: String, required: true },
  quoteNumber: { type: String, default: "" },
  revision: { type: String, default: "R0" },
  status: { type: String, default: "Draft" },
  validFrom: { type: Date },
  validTo: { type: Date },
  projectLocation: { type: String, default: "" },
  pocName: { type: String, default: "" },
  pocContact: { type: String, default: "" },
  scopeOfWork: { type: String, default: "" },
  inclusions: { type: String, default: "" },
  exclusions: { type: String, default: "" },
  totalEstimatedHours: { type: Number, default: 0 },
  grandTotal: { type: Number, default: 0 },
  proposalData: { type: mongoose.Schema.Types.Mixed, default: [] },
  boqData: { type: mongoose.Schema.Types.Mixed, default: [] },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

autoIncrementId(ProposalSchema, "proposals");
export const proposalsTable = mongoose.models.Proposal || mongoose.model("Proposal", ProposalSchema);

export const insertProposalSchema = z.object({
  clientId: z.coerce.number().nullable().optional(),
  title: z.string().min(1),
  quoteNumber: z.string().default("").optional(),
  revision: z.string().default("R0").optional(),
  status: z.enum(["Draft", "Sent", "Accepted", "Rejected", "Revised"]).default("Draft"),
  validFrom: z.union([z.string(), z.date()]).nullable().optional().transform((v) => (typeof v === "string" && v ? new Date(v) : v ?? null)),
  validTo: z.union([z.string(), z.date()]).nullable().optional().transform((v) => (typeof v === "string" && v ? new Date(v) : v ?? null)),
  projectLocation: z.string().default("").optional(),
  pocName: z.string().default("").optional(),
  pocContact: z.string().default("").optional(),
  scopeOfWork: z.string().default("").optional(),
  inclusions: z.string().default("").optional(),
  exclusions: z.string().default("").optional(),
  totalEstimatedHours: z.coerce.number().default(0).optional(),
  grandTotal: z.coerce.number().default(0).optional(),
  proposalData: z.any().optional(),
  boqData: z.any().optional(),
});

export type InsertProposal = z.infer<typeof insertProposalSchema>;
export type Proposal = mongoose.InferSchemaType<typeof ProposalSchema>;
