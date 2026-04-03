 import { pgTable, serial, varchar, numeric, integer, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const chartOfAccountsTable = pgTable("chart_of_accounts", {
  id: serial("id").primaryKey(),
  accountCode: varchar("account_code", { length: 20 }).notNull(),
  accountName: varchar("account_name", { length: 255 }).notNull(),
  accountType: varchar("account_type", { length: 50 }).notNull().default("Asset"),
  currentBalance: numeric("current_balance", { precision: 16, scale: 2 }).notNull().default("0"),
  parentId: integer("parent_id"),
  description: text("description").notNull().default(""),
  isActive: varchar("is_active", { length: 10 }).notNull().default("Yes"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertChartOfAccountsSchema = createInsertSchema(chartOfAccountsTable).omit({
  id: true,
  createdAt: true,
}).extend({
  accountType: z.enum(["Asset", "Liability", "Equity", "Revenue", "Expense"]),
});

export const journalEntriesTable = pgTable("journal_entries", {
  id: serial("id").primaryKey(),
  entryDate: timestamp("entry_date").notNull(),
  reference: varchar("reference", { length: 100 }).notNull().default(""),
  description: text("description").notNull().default(""),
  totalDebit: numeric("total_debit", { precision: 16, scale: 2 }).notNull().default("0"),
  totalCredit: numeric("total_credit", { precision: 16, scale: 2 }).notNull().default("0"),
  status: varchar("status", { length: 50 }).notNull().default("Draft"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertJournalEntrySchema = createInsertSchema(journalEntriesTable).omit({
  id: true,
  createdAt: true,
}).extend({
  entryDate: z.union([z.string(), z.date()]).transform((v) => typeof v === "string" ? new Date(v) : v),
  status: z.enum(["Draft", "Posted"]).default("Draft"),
});

export const journalLinesTable = pgTable("journal_lines", {
  id: serial("id").primaryKey(),
  journalEntryId: integer("journal_entry_id").notNull(),
  accountId: integer("account_id").notNull(),
  accountCode: varchar("account_code", { length: 20 }).notNull().default(""),
  accountName: varchar("account_name", { length: 255 }).notNull().default(""),
  debit: numeric("debit", { precision: 16, scale: 2 }).notNull().default("0"),
  credit: numeric("credit", { precision: 16, scale: 2 }).notNull().default("0"),
  memo: text("memo").notNull().default(""),
});

export const insertJournalLineSchema = createInsertSchema(journalLinesTable).omit({ id: true });

export const accountsPayableTable = pgTable("accounts_payable", {
  id: serial("id").primaryKey(),
  vendorName: varchar("vendor_name", { length: 255 }).notNull(),
  billNumber: varchar("bill_number", { length: 100 }).notNull().default(""),
  billDate: timestamp("bill_date").notNull(),
  dueDate: timestamp("due_date").notNull(),
  amount: numeric("amount", { precision: 16, scale: 2 }).notNull().default("0"),
  paidAmount: numeric("paid_amount", { precision: 16, scale: 2 }).notNull().default("0"),
  status: varchar("status", { length: 50 }).notNull().default("Pending"),
  entryType: varchar("entry_type", { length: 50 }).notNull().default("Bill"),
  notes: text("notes").notNull().default(""),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertAPSchema = createInsertSchema(accountsPayableTable).omit({
  id: true,
  createdAt: true,
}).extend({
  billDate: z.union([z.string(), z.date()]).transform((v) => typeof v === "string" ? new Date(v) : v),
  dueDate: z.union([z.string(), z.date()]).transform((v) => typeof v === "string" ? new Date(v) : v),
  status: z.enum(["Pending", "Partial", "Paid", "Overdue"]).default("Pending"),
  entryType: z.enum(["Bill", "Debit Note"]).default("Bill"),
});

export const accountsReceivableTable = pgTable("accounts_receivable", {
  id: serial("id").primaryKey(),
  clientName: varchar("client_name", { length: 255 }).notNull(),
  invoiceNumber: varchar("invoice_number", { length: 100 }).notNull().default(""),
  invoiceDate: timestamp("invoice_date").notNull(),
  dueDate: timestamp("due_date").notNull(),
  amount: numeric("amount", { precision: 16, scale: 2 }).notNull().default("0"),
  receivedAmount: numeric("received_amount", { precision: 16, scale: 2 }).notNull().default("0"),
  status: varchar("status", { length: 50 }).notNull().default("Pending"),
  entryType: varchar("entry_type", { length: 50 }).notNull().default("Invoice"),
  notes: text("notes").notNull().default(""),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertARSchema = createInsertSchema(accountsReceivableTable).omit({
  id: true,
  createdAt: true,
}).extend({
  invoiceDate: z.union([z.string(), z.date()]).transform((v) => typeof v === "string" ? new Date(v) : v),
  dueDate: z.union([z.string(), z.date()]).transform((v) => typeof v === "string" ? new Date(v) : v),
  status: z.enum(["Pending", "Partial", "Received", "Overdue"]).default("Pending"),
  entryType: z.enum(["Invoice", "Credit Note"]).default("Invoice"),
});

export type ChartOfAccount = typeof chartOfAccountsTable.$inferSelect;
export type JournalEntry = typeof journalEntriesTable.$inferSelect;
export type JournalLine = typeof journalLinesTable.$inferSelect;
export type AccountPayable = typeof accountsPayableTable.$inferSelect;
export type AccountReceivable = typeof accountsReceivableTable.$inferSelect;
