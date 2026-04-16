import mongoose from "mongoose";
import { z } from "zod/v4";
import { autoIncrementId, createMongoSchema } from "./mongoUtils.js";

const ContractSchema = createMongoSchema({
  id: { type: Number, unique: true, index: true },
  title: { type: String, required: true },
  partyName: { type: String, required: true },
  type: { type: String, required: true },
  status: { type: String, required: true },
  expiryDate: { type: Date, required: true },
  createdAt: { type: Date, default: Date.now },
});

autoIncrementId(ContractSchema, "contracts");
export const contractsTable = mongoose.models.Contract || mongoose.model("Contract", ContractSchema);

export const insertContractSchema = z.object({
  title: z.string().min(1),
  partyName: z.string().min(1),
  type: z.string().min(1),
  status: z.enum(["Active", "Expiring Soon", "Expired", "Terminated"]),
  expiryDate: z.union([z.string(), z.date()]).transform((v) => typeof v === "string" ? new Date(v) : v),
});

export type InsertContract = z.infer<typeof insertContractSchema>;
export type Contract = mongoose.InferSchemaType<typeof ContractSchema>;
