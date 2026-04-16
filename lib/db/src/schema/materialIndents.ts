
import mongoose from "mongoose";
import { z } from "zod";
import { autoIncrementId, createMongoSchema } from "./mongoUtils.js";

const MaterialIndentSchema = createMongoSchema({
  id: { type: Number, unique: true, index: true },
  itemId: { type: Number, required: true },
  requestedQty: { type: Number, default: 1 },
  approvedQty: { type: Number, default: 0 },
  issuedFromLocationId: { type: Number },
  requestedBy: { type: String, default: "" },
  department: { type: String, default: "" },
  purpose: { type: String, default: "" },
  status: { type: String, default: "Pending" },
  requestDate: { type: Date, default: Date.now },
  issueDate: { type: Date },
  createdAt: { type: Date, default: Date.now },
});

autoIncrementId(MaterialIndentSchema, "material_indents");
export const materialIndentsTable = mongoose.models.MaterialIndent || mongoose.model("MaterialIndent", MaterialIndentSchema);

export const insertMaterialIndentSchema = z.object({
  itemId: z.coerce.number(),
  requestedQty: z.coerce.number().default(1),
  approvedQty: z.coerce.number().default(0),
  issuedFromLocationId: z.coerce.number().optional(),
  requestedBy: z.string().default("").optional(),
  department: z.string().default("").optional(),
  purpose: z.string().default("").optional(),
  status: z.enum(["Pending", "Approved", "Issued", "Rejected"]).default("Pending"),
  requestDate: z.union([z.string(), z.date()]).optional().transform((v: unknown) => (typeof v === "string" ? new Date(v) : v)),
  issueDate: z.union([z.string(), z.date()]).optional().nullable().transform((v: unknown) => (typeof v === "string" ? new Date(v) : v)),
});

export type InsertMaterialIndent = z.infer<typeof insertMaterialIndentSchema>;
export type MaterialIndent = mongoose.InferSchemaType<typeof MaterialIndentSchema>;
