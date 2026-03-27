import { pgTable, serial, integer, varchar, numeric, text } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { invoicesTable } from "./invoices";

export const invoiceItemsTable = pgTable("invoice_items", {
  id: serial("id").primaryKey(),
  invoiceId: integer("invoice_id").references(() => invoicesTable.id, { onDelete: "cascade" }).notNull(),
  description: text("description").notNull().default(""),
  hsnSac: varchar("hsn_sac", { length: 20 }).notNull().default(""),
  qty: numeric("qty", { precision: 12, scale: 2 }).notNull().default("1"),
  unit: varchar("unit", { length: 20 }).notNull().default("NOS"),
  rate: numeric("rate", { precision: 14, scale: 2 }).notNull().default("0"),
  taxPercentage: numeric("tax_percentage", { precision: 5, scale: 2 }).notNull().default("18"),
  taxAmount: numeric("tax_amount", { precision: 14, scale: 2 }).notNull().default("0"),
  lineTotal: numeric("line_total", { precision: 14, scale: 2 }).notNull().default("0"),
});

export const insertInvoiceItemSchema = createInsertSchema(invoiceItemsTable).omit({
  id: true,
});

export type InsertInvoiceItem = z.infer<typeof insertInvoiceItemSchema>;
export type InvoiceItem = typeof invoiceItemsTable.$inferSelect;
