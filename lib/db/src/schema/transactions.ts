import mongoose from "mongoose";
import { z } from "zod/v4";
import { autoIncrementId, createMongoSchema } from "./mongoUtils.js";

const TransactionSchema = createMongoSchema({
  id: { type: Number, unique: true, index: true },
  date: { type: Date, required: true },
  description: { type: String, required: true },
  category: { type: String, required: true },
  type: { type: String, required: true },
  amount: { type: Number, required: true },
  createdAt: { type: Date, default: Date.now },
});

autoIncrementId(TransactionSchema, "transactions");
export const transactionsTable = mongoose.models.Transaction || mongoose.model("Transaction", TransactionSchema);

export const insertTransactionSchema = z.object({
  date: z.union([z.string(), z.date()]).transform((v) => typeof v === "string" ? new Date(v) : v),
  description: z.string().min(1),
  category: z.string().min(1),
  type: z.enum(["Credit", "Debit"]),
  amount: z.coerce.number(),
});

export type InsertTransaction = z.infer<typeof insertTransactionSchema>;
export type Transaction = mongoose.InferSchemaType<typeof TransactionSchema>;
