import { pgTable, serial, integer, varchar, numeric, text } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { salesDocumentsTable } from "./salesDocuments";

export const salesDocumentItemsTable = pgTable("legacy_sales_document_items", {
  id: serial("id").primaryKey(),
  documentId: integer("document_id").references(() => salesDocumentsTable.id, { onDelete: "cascade" }).notNull(),
  description: text("description").notNull().default(""),
  hsnSac: varchar("hsn_sac", { length: 20 }).notNull().default(""),
  qty: numeric("qty", { precision: 12, scale: 2 }).notNull().default("1"),
  rate: numeric("rate", { precision: 14, scale: 2 }).notNull().default("0"),
  cgstPercentage: numeric("cgst_percentage", { precision: 5, scale: 2 }).notNull().default("9"),
  sgstPercentage: numeric("sgst_percentage", { precision: 5, scale: 2 }).notNull().default("9"),
  lineTotal: numeric("line_total", { precision: 14, scale: 2 }).notNull().default("0"),
});

export const insertSalesDocumentItemSchema = createInsertSchema(salesDocumentItemsTable).omit({
  id: true,
});

export type InsertSalesDocumentItem = z.infer<typeof insertSalesDocumentItemSchema>;
export type SalesDocumentItem = typeof salesDocumentItemsTable.$inferSelect;
