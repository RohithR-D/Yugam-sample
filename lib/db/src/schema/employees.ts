
import mongoose from "mongoose";
import { z } from "zod";
import { autoIncrementId, createMongoSchema } from "./mongoUtils.js";

const EmployeeSchema = createMongoSchema({
  id: { type: Number, unique: true, index: true },
  name: { type: String, required: true },
  designation: { type: String, required: true },
  department: { type: String, required: true },
  status: { type: String, default: "Active" },
  joinDate: { type: Date, default: Date.now },
  createdAt: { type: Date, default: Date.now },
});

autoIncrementId(EmployeeSchema, "employees");
export const employeesTable = mongoose.models.Employee || mongoose.model("Employee", EmployeeSchema);

export const insertEmployeeSchema = z.object({
  name: z.string().min(1),
  designation: z.string().min(1),
  department: z.string().min(1),
  status: z.enum(["Active", "On Leave", "Offboarded"]).default("Active"),
  joinDate: z.union([z.string(), z.date()]).optional().transform((v: unknown) => (typeof v === "string" ? new Date(v) : v)),
});

export type InsertEmployee = z.infer<typeof insertEmployeeSchema>;
export type Employee = mongoose.InferSchemaType<typeof EmployeeSchema>;
