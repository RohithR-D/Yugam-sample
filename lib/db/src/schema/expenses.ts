import { pgTable, serial, varchar, numeric, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const expensesTable = pgTable("expenses", {
  id: serial("id").primaryKey(),
  date: timestamp("date").notNull(),
  merchant: varchar("merchant", { length: 300 }).notNull(),
  category: varchar("category", { length: 100 }).notNull(),
  amount: numeric("amount", { precision: 14, scale: 2 }).notNull(),
  status: varchar("status", { length: 50 }).notNull(),
  submittedBy: varchar("submitted_by", { length: 200 }).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertExpenseSchema = createInsertSchema(expensesTable).omit({
  id: true,
  createdAt: true,
}).extend({
  status: z.enum(["Pending", "Approved", "Reimbursed", "Rejected"]),
  date: z.union([z.string(), z.date()]).transform((v) => typeof v === "string" ? new Date(v) : v),
});

export type InsertExpense = z.infer<typeof insertExpenseSchema>;
export type Expense = typeof expensesTable.$inferSelect;
