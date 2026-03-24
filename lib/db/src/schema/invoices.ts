import { pgTable, serial, varchar, numeric, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const invoicesTable = pgTable("invoices", {
  id: serial("id").primaryKey(),
  clientName: varchar("client_name", { length: 255 }).notNull(),
  invoiceNumber: varchar("invoice_number", { length: 50 }).notNull().unique(),
  amount: numeric("amount", { precision: 12, scale: 2 }).notNull().default("0"),
  status: varchar("status", { length: 50 }).notNull().default("Draft"),
  dueDate: timestamp("due_date").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertInvoiceSchema = createInsertSchema(invoicesTable).omit({
  id: true,
  createdAt: true,
}).extend({
  status: z.enum(["Paid", "Unpaid", "Overdue", "Draft"]),
  dueDate: z.union([z.string(), z.date()]).optional().transform((v) => (typeof v === "string" ? new Date(v) : v)),
});

export type InsertInvoice = z.infer<typeof insertInvoiceSchema>;
export type Invoice = typeof invoicesTable.$inferSelect;
