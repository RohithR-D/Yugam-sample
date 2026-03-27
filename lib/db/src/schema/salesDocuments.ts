import { pgTable, serial, integer, varchar, numeric, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { clientsTable } from "./clients";

export const salesDocumentsTable = pgTable("sales_documents", {
  id: serial("id").primaryKey(),
  clientId: integer("client_id").references(() => clientsTable.id),
  clientName: varchar("client_name", { length: 255 }).notNull().default(""),
  documentType: varchar("document_type", { length: 30 }).notNull().default("Quotation"),
  documentNumber: varchar("document_number", { length: 80 }).notNull().default(""),
  issueDate: timestamp("issue_date").defaultNow(),
  dueDate: timestamp("due_date"),
  subtotal: numeric("subtotal", { precision: 14, scale: 2 }).notNull().default("0"),
  sgstTotal: numeric("sgst_total", { precision: 14, scale: 2 }).notNull().default("0"),
  cgstTotal: numeric("cgst_total", { precision: 14, scale: 2 }).notNull().default("0"),
  grandTotal: numeric("grand_total", { precision: 14, scale: 2 }).notNull().default("0"),
  notes: text("notes").notNull().default(""),
  terms: text("terms").notNull().default(""),
  status: varchar("status", { length: 30 }).notNull().default("Drafting"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertSalesDocumentSchema = createInsertSchema(salesDocumentsTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  documentType: z.enum(["Quotation", "Proforma Invoice", "Sales Order", "Invoice", "Delivery Challan", "Sales Return"]),
  status: z.enum(["Paid", "Unpaid", "Drafting"]).default("Drafting"),
  issueDate: z.union([z.string(), z.date()]).optional().transform((v) => (typeof v === "string" ? new Date(v) : v)),
  dueDate: z.union([z.string(), z.date()]).optional().nullable().transform((v) => (typeof v === "string" ? new Date(v) : v)),
});

export type InsertSalesDocument = z.infer<typeof insertSalesDocumentSchema>;
export type SalesDocument = typeof salesDocumentsTable.$inferSelect;
