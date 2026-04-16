import mongoose from "mongoose";
import { z } from "zod/v4";
import { autoIncrementId, createMongoSchema } from "./mongoUtils.js";

const SalesDocumentItemSchema = createMongoSchema({
  id: { type: Number, unique: true, index: true },
  documentId: { type: Number, required: true },
  description: { type: String, default: "" },
  hsnSac: { type: String, default: "" },
  qty: { type: Number, default: 1 },
  rate: { type: Number, default: 0 },
  cgstPercentage: { type: Number, default: 9 },
  sgstPercentage: { type: Number, default: 9 },
  lineTotal: { type: Number, default: 0 },
});

autoIncrementId(SalesDocumentItemSchema, "legacy_sales_document_items");
export const salesDocumentItemsTable = mongoose.models.SalesDocumentItem || mongoose.model("SalesDocumentItem", SalesDocumentItemSchema);

export const insertSalesDocumentItemSchema = z.object({
  documentId: z.coerce.number(),
  description: z.string().default("").optional(),
  hsnSac: z.string().default("").optional(),
  qty: z.coerce.number().default(1),
  rate: z.coerce.number().default(0),
  cgstPercentage: z.coerce.number().default(9),
  sgstPercentage: z.coerce.number().default(9),
  lineTotal: z.coerce.number().default(0),
});

export type InsertSalesDocumentItem = z.infer<typeof insertSalesDocumentItemSchema>;
export type SalesDocumentItem = mongoose.InferSchemaType<typeof SalesDocumentItemSchema>;
