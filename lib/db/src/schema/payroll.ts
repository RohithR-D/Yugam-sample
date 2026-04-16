import mongoose from "mongoose";
import { z } from "zod/v4";
import { autoIncrementId, createMongoSchema } from "./mongoUtils.js";

const PayrollSchema = createMongoSchema({
  id: { type: Number, unique: true, index: true },
  employeeId: { type: Number },
  employeeName: { type: String, required: true },
  payPeriod: { type: String, required: true },
  grossPay: { type: Number, default: 0 },
  deductions: { type: Number, default: 0 },
  netPay: { type: Number, default: 0 },
  status: { type: String, default: "Processing" },
  createdAt: { type: Date, default: Date.now },
});

autoIncrementId(PayrollSchema, "payroll");
export const payrollTable = mongoose.models.Payroll || mongoose.model("Payroll", PayrollSchema);

export const insertPayrollSchema = z.object({
  employeeId: z.coerce.number().optional(),
  employeeName: z.string().min(1),
  payPeriod: z.string().min(1),
  grossPay: z.coerce.number().default(0),
  deductions: z.coerce.number().default(0),
  netPay: z.coerce.number().default(0),
  status: z.enum(["Processing", "Processed", "Paid"]).default("Processing"),
});

export type InsertPayroll = z.infer<typeof insertPayrollSchema>;
export type Payroll = mongoose.InferSchemaType<typeof PayrollSchema>;
