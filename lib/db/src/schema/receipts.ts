import { pgTable, serial, integer, varchar, numeric, text, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { clientsTable } from "./clients";

export const receiptsTable = pgTable("legacy_receipts", {
  id: serial("id").primaryKey(),
  clientId: integer("client_id").references(() => clientsTable.id),
  clientName: varchar("client_name", { length: 255 }).notNull().default(""),
  paymentDate: timestamp("payment_date").defaultNow(),
  paymentNumber: varchar("payment_number", { length: 80 }).notNull().default(""),
  amountReceived: numeric("amount_received", { precision: 14, scale: 2 }).notNull().default("0"),
  bankCharges: numeric("bank_charges", { precision: 14, scale: 2 }).notNull().default("0"),
  paymentMode: varchar("payment_mode", { length: 50 }).notNull().default("Bank Transfer"),
  depositTo: varchar("deposit_to", { length: 100 }).notNull().default(""),
  reference: text("reference").notNull().default(""),
  taxDeducted: boolean("tax_deducted").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertReceiptSchema = createInsertSchema(receiptsTable).omit({
  id: true,
  createdAt: true,
}).extend({
  paymentDate: z.union([z.string(), z.date()]).optional().transform((v) => (typeof v === "string" ? new Date(v) : v)),
});

export type InsertReceipt = z.infer<typeof insertReceiptSchema>;
export type Receipt = typeof receiptsTable.$inferSelect;
