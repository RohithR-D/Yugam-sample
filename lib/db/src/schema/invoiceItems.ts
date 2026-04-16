import mongoose from "mongoose";
import { z } from "zod/v4";
import { autoIncrementId, createMongoSchema } from "./mongoUtils.js";

const InvoiceItemSchema = createMongoSchema({
  id: { type: Number, unique: true, index: true },
  invoiceId: { type: Number, required: true },
  description: { type: String, default: "" },
  hsnSac: { type: String, default: "" },
  qty: { type: Number, default: 1 },
  unit: { type: String, default: "NOS" },
  rate: { type: Number, default: 0 },
  taxPercentage: { type: Number, default: 18 },
  taxAmount: { type: Number, default: 0 },
  lineTotal: { type: Number, default: 0 },
});

autoIncrementId(InvoiceItemSchema, "legacy_invoice_items");
export const invoiceItemsTable = mongoose.models.InvoiceItem || mongoose.model("InvoiceItem", InvoiceItemSchema);

export const insertInvoiceItemSchema = z.object({
  invoiceId: z.coerce.number(),
  description: z.string().default("").optional(),
  hsnSac: z.string().default("").optional(),
  qty: z.coerce.number().default(1),
  unit: z.string().default("NOS").optional(),
  rate: z.coerce.number().default(0),
  taxPercentage: z.coerce.number().default(18),
  taxAmount: z.coerce.number().default(0),
  lineTotal: z.coerce.number().default(0),
});

export type InsertInvoiceItem = z.infer<typeof insertInvoiceItemSchema>;
export type InvoiceItem = mongoose.InferSchemaType<typeof InvoiceItemSchema>;
