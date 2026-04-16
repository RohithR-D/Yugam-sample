import mongoose from "mongoose";
import { z } from "zod/v4";
import { autoIncrementId, createMongoSchema } from "./mongoUtils.js";

const SalesDocumentSchema = createMongoSchema({
  id: { type: Number, unique: true, index: true },
  clientId: { type: Number, required: true },
  clientName: { type: String, default: "" },
  documentType: { type: String, default: "Quotation" },
  documentNumber: { type: String, default: "" },
  issueDate: { type: Date, default: Date.now },
  dueDate: { type: Date },
  subtotal: { type: Number, default: 0 },
  sgstTotal: { type: Number, default: 0 },
  cgstTotal: { type: Number, default: 0 },
  grandTotal: { type: Number, default: 0 },
  notes: { type: String, default: "" },
  terms: { type: String, default: "" },
  status: { type: String, default: "Drafting" },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

autoIncrementId(SalesDocumentSchema, "legacy_sales_documents");

export const salesDocumentsTable = mongoose.models.SalesDocument || mongoose.model("SalesDocument", SalesDocumentSchema);

export const insertSalesDocumentSchema = z.object({
  clientId: z.coerce.number(),
  clientName: z.string().default(""),
  documentType: z.string().default("Quotation"),
  documentNumber: z.string().default(""),
  issueDate: z.coerce.date().optional(),
  dueDate: z.coerce.date().optional(),
  subtotal: z.coerce.number().default(0),
  sgstTotal: z.coerce.number().default(0),
  cgstTotal: z.coerce.number().default(0),
  grandTotal: z.coerce.number().default(0),
  notes: z.string().default(""),
  terms: z.string().default(""),
  status: z.string().default("Drafting"),
});
