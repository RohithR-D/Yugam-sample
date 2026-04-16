
import mongoose from "mongoose";
import { z } from "zod/v4";
import { autoIncrementId, createMongoSchema } from "./mongoUtils.js";

const ExpenseSchema = createMongoSchema({
  id: { type: Number, unique: true, index: true },
  date: { type: Date, required: true },
  merchant: { type: String, required: true },
  category: { type: String, required: true },
  amount: { type: Number, required: true },
  status: { type: String, default: "Pending" },
  submittedBy: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

autoIncrementId(ExpenseSchema, "expenses");
export const expensesTable = mongoose.models.Expense || mongoose.model("Expense", ExpenseSchema);

export const insertExpenseSchema = z.object({
  date: z.union([z.string(), z.date()]).transform((v) => typeof v === "string" ? new Date(v) : v),
  merchant: z.string().min(1),
  category: z.string().min(1),
  amount: z.coerce.number(),
  status: z.enum(["Pending", "Approved", "Reimbursed", "Rejected"]).default("Pending"),
  submittedBy: z.string().min(1),
});

export type InsertExpense = z.infer<typeof insertExpenseSchema>;
export type Expense = mongoose.InferSchemaType<typeof ExpenseSchema>;
