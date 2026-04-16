import mongoose from "mongoose";
import { z } from "zod/v4";
import { autoIncrementId, createMongoSchema } from "./mongoUtils.js";

const ReceiptSchema = createMongoSchema({
  id: { type: Number, unique: true, index: true },
  clientId: { type: Number },
  clientName: { type: String, default: "" },
  paymentDate: { type: Date, default: Date.now },
  paymentNumber: { type: String, default: "" },
  amountReceived: { type: Number, default: 0 },
  bankCharges: { type: Number, default: 0 },
  paymentMode: { type: String, default: "Bank Transfer" },
  depositTo: { type: String, default: "" },
  reference: { type: String, default: "" },
  taxDeducted: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

autoIncrementId(ReceiptSchema, "legacy_receipts");
export const receiptsTable = mongoose.models.Receipt || mongoose.model("Receipt", ReceiptSchema);

export const insertReceiptSchema = z.object({
  clientId: z.coerce.number().optional(),
  clientName: z.string().default("").optional(),
  paymentDate: z.union([z.string(), z.date()]).optional().transform((v) => (typeof v === "string" ? new Date(v) : v)),
  paymentNumber: z.string().default("").optional(),
  amountReceived: z.coerce.number().default(0),
  bankCharges: z.coerce.number().default(0),
  paymentMode: z.string().default("Bank Transfer").optional(),
  depositTo: z.string().default("").optional(),
  reference: z.string().default("").optional(),
  taxDeducted: z.boolean().default(false).optional(),
});

export type InsertReceipt = z.infer<typeof insertReceiptSchema>;
export type Receipt = mongoose.InferSchemaType<typeof ReceiptSchema>;
