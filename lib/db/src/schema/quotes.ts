import mongoose from "mongoose";
import { z } from "zod/v4";
import { autoIncrementId, createMongoSchema } from "./mongoUtils.js";

const QuoteSchema = createMongoSchema({
  id: { type: Number, unique: true, index: true },
  clientName: { type: String, required: true },
  quoteNumber: { type: String, required: true, unique: true },
  totalAmount: { type: Number, default: 0 },
  status: { type: String, default: "Draft" },
  issueDate: { type: Date, default: Date.now },
  createdAt: { type: Date, default: Date.now },
});

autoIncrementId(QuoteSchema, "legacy_quotes");
export const quotesTable = mongoose.models.Quote || mongoose.model("Quote", QuoteSchema);

export const insertQuoteSchema = z.object({
  clientName: z.string().min(1),
  quoteNumber: z.string().min(1),
  totalAmount: z.coerce.number().default(0),
  status: z.enum(["Draft", "Sent", "Accepted", "Rejected"]).default("Draft"),
  issueDate: z.union([z.string(), z.date()]).optional().transform((v) => (typeof v === "string" ? new Date(v) : v)),
});

export type InsertQuote = z.infer<typeof insertQuoteSchema>;
export type Quote = mongoose.InferSchemaType<typeof QuoteSchema>;
