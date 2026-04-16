import mongoose from "mongoose";
import { z } from "zod/v4";
import { autoIncrementId, createMongoSchema } from "./mongoUtils.js";

const ClientSchema = createMongoSchema({
  id: { type: Number, unique: true, index: true },
  companyName: { type: String, required: true },
  contactName: { type: String, required: true },
  industry: { type: String, default: "General" },
  status: { type: String, default: "Lead" },
  pipelineStatus: { type: String, default: "Lead" },
  dealValue: { type: Number, default: 0 },
  gstin: { type: String },
  pan: { type: String },
  tan: { type: String },
  gstTreatment: { type: String, default: "Unregistered" },
  creditLimit: { type: Number, default: 0 },
  paymentTermsDefault: { type: String },
  paymentDueDaysDefault: { type: Number },
  currencyDefault: { type: String, default: "INR" },
  stateCode: { type: String },
  createdAt: { type: Date, default: Date.now },
});

autoIncrementId(ClientSchema, "clients");

export const clientsTable = mongoose.models.Client || mongoose.model("Client", ClientSchema);

export const insertClientSchema = z.object({
  companyName: z.string().min(1),
  contactName: z.string().min(1),
  industry: z.string().default("General"),
  status: z.string().default("Lead"),
  pipelineStatus: z.enum(["Lead", "Contacted", "Proposal", "Won", "Lost"]).default("Lead"),
  dealValue: z.coerce.number().default(0),
  gstin: z.string().optional(),
  pan: z.string().optional(),
  tan: z.string().optional(),
  gstTreatment: z.enum(["Registered", "Unregistered", "Consumer", "Composition", "SEZ", "Overseas", "UIN Holders"]).default("Unregistered"),
  creditLimit: z.coerce.number().optional(),
  paymentTermsDefault: z.string().optional(),
  paymentDueDaysDefault: z.coerce.number().optional(),
  currencyDefault: z.string().default("INR"),
  stateCode: z.string().optional(),
});

export type InsertClient = z.infer<typeof insertClientSchema>;
export type Client = mongoose.InferSchemaType<typeof ClientSchema>;
