import { pgTable, serial, integer, varchar, numeric, text, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { clientsTable } from "./clients";

export const invoicesTable = pgTable("invoices", {
  id: serial("id").primaryKey(),
  clientId: integer("client_id").references(() => clientsTable.id),
  clientName: varchar("client_name", { length: 255 }).notNull(),
  type: varchar("type", { length: 20 }).notNull().default("Tax"),
  documentNumber: varchar("document_number", { length: 80 }).notNull().default(""),
  invoiceNumber: varchar("invoice_number", { length: 50 }).notNull().unique(),
  poReference: varchar("po_reference", { length: 100 }).notNull().default(""),
  issueDate: timestamp("issue_date").defaultNow(),
  dueDate: timestamp("due_date").defaultNow(),
  subtotal: numeric("subtotal", { precision: 14, scale: 2 }).notNull().default("0"),
  discountAmount: numeric("discount_amount", { precision: 14, scale: 2 }).notNull().default("0"),
  sgstTotal: numeric("sgst_total", { precision: 14, scale: 2 }).notNull().default("0"),
  cgstTotal: numeric("cgst_total", { precision: 14, scale: 2 }).notNull().default("0"),
  amount: numeric("amount", { precision: 12, scale: 2 }).notNull().default("0"),
  grandTotal: numeric("grand_total", { precision: 14, scale: 2 }).notNull().default("0"),
  balanceDue: numeric("balance_due", { precision: 14, scale: 2 }).notNull().default("0"),
  notes: text("notes").notNull().default(""),
  terms: text("terms").notNull().default(""),
  reasonForCredit: varchar("reason_for_credit", { length: 255 }).notNull().default(""),
  invoiceReference: varchar("invoice_reference", { length: 100 }).notNull().default(""),
  status: varchar("status", { length: 50 }).notNull().default("Draft"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertInvoiceSchema = createInsertSchema(invoicesTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  type: z.enum(["Proforma", "Tax", "Credit"]).default("Tax"),
  status: z.enum(["Draft", "Sent", "Paid", "Unpaid", "Overdue", "Cancelled", "Partially Paid"]).default("Draft"),
  issueDate: z.union([z.string(), z.date()]).optional().transform((v) => (typeof v === "string" ? new Date(v) : v)),
  dueDate: z.union([z.string(), z.date()]).optional().transform((v) => (typeof v === "string" ? new Date(v) : v)),
});

export type InsertInvoice = z.infer<typeof insertInvoiceSchema>;
export type Invoice = typeof invoicesTable.$inferSelect;
