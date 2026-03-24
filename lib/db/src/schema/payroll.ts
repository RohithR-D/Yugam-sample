import { pgTable, serial, varchar, numeric, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const payrollTable = pgTable("payroll", {
  id: serial("id").primaryKey(),
  employeeName: varchar("employee_name", { length: 255 }).notNull(),
  payPeriod: varchar("pay_period", { length: 100 }).notNull(),
  grossPay: numeric("gross_pay", { precision: 12, scale: 2 }).notNull().default("0"),
  deductions: numeric("deductions", { precision: 12, scale: 2 }).notNull().default("0"),
  netPay: numeric("net_pay", { precision: 12, scale: 2 }).notNull().default("0"),
  status: varchar("status", { length: 50 }).notNull().default("Processing"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertPayrollSchema = createInsertSchema(payrollTable).omit({
  id: true,
  createdAt: true,
}).extend({
  status: z.enum(["Processing", "Paid"]),
});

export type InsertPayroll = z.infer<typeof insertPayrollSchema>;
export type Payroll = typeof payrollTable.$inferSelect;
