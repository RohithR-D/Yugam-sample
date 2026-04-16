import mongoose from "mongoose";
import { z } from "zod/v4";
import { autoIncrementId, createMongoSchema } from "./mongoUtils.js";

const ContractaComplianceSchema = createMongoSchema({
  id: { type: Number, unique: true, index: true },
  title: { type: String, required: true },
  category: { type: String, required: true },
  entityName: { type: String, required: true },
  validFrom: { type: Date, required: true },
  expiryDate: { type: Date, required: true },
  status: { type: String, default: "Active" },
  attachmentUrl: { type: String },
  notes: { type: String },
  createdAt: { type: Date, default: Date.now },
});

autoIncrementId(ContractaComplianceSchema, "contracta_compliances");
export const contractaCompliancesTable = mongoose.models.ContractaCompliance || mongoose.model("ContractaCompliance", ContractaComplianceSchema);

export const insertComplianceSchema = z.object({
  title: z.string().min(1),
  category: z.enum(["Client", "Vendor", "Statutory"]),
  entityName: z.string().min(1),
  validFrom: z.union([z.string(), z.date()]).transform((v) => typeof v === "string" ? new Date(v) : v),
  expiryDate: z.union([z.string(), z.date()]).transform((v) => typeof v === "string" ? new Date(v) : v),
  attachmentUrl: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

const ContractaTemplateSchema = createMongoSchema({
  id: { type: Number, unique: true, index: true },
  templateName: { type: String, required: true },
  category: { type: String, required: true },
  contentHtml: { type: String, default: "" },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

autoIncrementId(ContractaTemplateSchema, "contracta_templates");
export const contractaTemplatesTable = mongoose.models.ContractaTemplate || mongoose.model("ContractaTemplate", ContractaTemplateSchema);

export const insertTemplateSchema = z.object({
  templateName: z.string().min(1),
  category: z.enum(["HR", "Legal", "General"]),
  contentHtml: z.string().optional().default(""),
});

export type ContractaCompliance = mongoose.InferSchemaType<typeof ContractaComplianceSchema>;
export type ContractaTemplate = mongoose.InferSchemaType<typeof ContractaTemplateSchema>;
