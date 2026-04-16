import mongoose from "mongoose";
import { z } from "zod/v4";
import { autoIncrementId, createMongoSchema } from "./mongoUtils.js";

const InvoiceSchema = createMongoSchema({
  id: { type: Number, unique: true, index: true },
  clientId: { type: Number },
  clientName: { type: String, required: true },
  type: { type: String, default: "Tax" },
  documentNumber: { type: String, default: "" },
  invoiceNumber: { type: String, required: true, unique: true },
  poReference: { type: String, default: "" },
  issueDate: { type: Date, default: Date.now },
  dueDate: { type: Date, default: Date.now },
  subtotal: { type: Number, default: 0 },
  discountAmount: { type: Number, default: 0 },
  sgstTotal: { type: Number, default: 0 },
  cgstTotal: { type: Number, default: 0 },
  amount: { type: Number, default: 0 },
  grandTotal: { type: Number, default: 0 },
  balanceDue: { type: Number, default: 0 },
  notes: { type: String, default: "" },
  terms: { type: String, default: "" },
  reasonForCredit: { type: String, default: "" },
  invoiceReference: { type: String, default: "" },
  status: { type: String, default: "Draft" },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

autoIncrementId(InvoiceSchema, "legacy_invoices");
export const invoicesTable = mongoose.models.Invoice || mongoose.model("Invoice", InvoiceSchema);

export const insertInvoiceSchema = z.object({
  clientId: z.coerce.number().optional(),
  clientName: z.string().min(1),
  type: z.enum(["Proforma", "Tax", "Credit"]).default("Tax"),
  documentNumber: z.string().default("").optional(),
  invoiceNumber: z.string().min(1),
  poReference: z.string().default("").optional(),
  issueDate: z.union([z.string(), z.date()]).optional().transform((v) => (typeof v === "string" ? new Date(v) : v)),
  dueDate: z.union([z.string(), z.date()]).optional().transform((v) => (typeof v === "string" ? new Date(v) : v)),
  subtotal: z.coerce.number().default(0),
  discountAmount: z.coerce.number().default(0),
  sgstTotal: z.coerce.number().default(0),
  cgstTotal: z.coerce.number().default(0),
  amount: z.coerce.number().default(0),
  grandTotal: z.coerce.number().default(0),
  balanceDue: z.coerce.number().default(0),
  notes: z.string().default("").optional(),
  terms: z.string().default("").optional(),
  reasonForCredit: z.string().default("").optional(),
  invoiceReference: z.string().default("").optional(),
  status: z.enum(["Draft", "Sent", "Paid", "Unpaid", "Overdue", "Cancelled", "Partially Paid"]).default("Draft"),
});

export type InsertInvoice = z.infer<typeof insertInvoiceSchema>;
export type Invoice = mongoose.InferSchemaType<typeof InvoiceSchema>;
