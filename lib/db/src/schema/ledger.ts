import mongoose from "mongoose";
import { z } from "zod/v4";
import { autoIncrementId, createMongoSchema } from "./mongoUtils.js";

const ChartOfAccountsSchema = createMongoSchema({
  id: { type: Number, unique: true, index: true },
  accountCode: { type: String, required: true },
  accountName: { type: String, required: true },
  accountType: { type: String, default: "Asset" },
  currentBalance: { type: Number, default: 0 },
  parentId: { type: Number },
  description: { type: String, default: "" },
  isActive: { type: String, default: "Yes" },
  createdAt: { type: Date, default: Date.now },
});

autoIncrementId(ChartOfAccountsSchema, "chart_of_accounts");
export const chartOfAccountsTable = mongoose.models.ChartOfAccount || mongoose.model("ChartOfAccount", ChartOfAccountsSchema);

export const insertChartOfAccountsSchema = z.object({
  accountCode: z.string().min(1),
  accountName: z.string().min(1),
  accountType: z.enum(["Asset", "Liability", "Equity", "Revenue", "Expense"]).default("Asset"),
  currentBalance: z.coerce.number().default(0),
  parentId: z.coerce.number().optional(),
  description: z.string().default("").optional(),
  isActive: z.string().default("Yes").optional(),
});

const JournalEntrySchema = createMongoSchema({
  id: { type: Number, unique: true, index: true },
  entryDate: { type: Date, required: true },
  reference: { type: String, default: "" },
  description: { type: String, default: "" },
  totalDebit: { type: Number, default: 0 },
  totalCredit: { type: Number, default: 0 },
  status: { type: String, default: "Draft" },
  createdAt: { type: Date, default: Date.now },
});

autoIncrementId(JournalEntrySchema, "journal_entries");
export const journalEntriesTable = mongoose.models.JournalEntry || mongoose.model("JournalEntry", JournalEntrySchema);

export const insertJournalEntrySchema = z.object({
  entryDate: z.union([z.string(), z.date()]).transform((v) => typeof v === "string" ? new Date(v) : v),
  reference: z.string().default("").optional(),
  description: z.string().default("").optional(),
  totalDebit: z.coerce.number().default(0),
  totalCredit: z.coerce.number().default(0),
  status: z.enum(["Draft", "Posted"]).default("Draft"),
});

const JournalLineSchema = createMongoSchema({
  id: { type: Number, unique: true, index: true },
  journalEntryId: { type: Number, required: true },
  accountId: { type: Number, required: true },
  accountCode: { type: String, default: "" },
  accountName: { type: String, default: "" },
  debit: { type: Number, default: 0 },
  credit: { type: Number, default: 0 },
  memo: { type: String, default: "" },
});

autoIncrementId(JournalLineSchema, "journal_lines");
export const journalLinesTable = mongoose.models.JournalLine || mongoose.model("JournalLine", JournalLineSchema);

export const insertJournalLineSchema = z.object({
  journalEntryId: z.coerce.number(),
  accountId: z.coerce.number(),
  accountCode: z.string().default("").optional(),
  accountName: z.string().default("").optional(),
  debit: z.coerce.number().default(0),
  credit: z.coerce.number().default(0),
  memo: z.string().default("").optional(),
});

const AccountsPayableSchema = createMongoSchema({
  id: { type: Number, unique: true, index: true },
  vendorName: { type: String, required: true },
  billNumber: { type: String, default: "" },
  billDate: { type: Date, required: true },
  dueDate: { type: Date, required: true },
  amount: { type: Number, default: 0 },
  paidAmount: { type: Number, default: 0 },
  status: { type: String, default: "Pending" },
  entryType: { type: String, default: "Bill" },
  notes: { type: String, default: "" },
  createdAt: { type: Date, default: Date.now },
});

autoIncrementId(AccountsPayableSchema, "accounts_payable");
export const accountsPayableTable = mongoose.models.AccountsPayable || mongoose.model("AccountsPayable", AccountsPayableSchema);

export const insertAPSchema = z.object({
  vendorName: z.string().min(1),
  billNumber: z.string().default("").optional(),
  billDate: z.union([z.string(), z.date()]).transform((v) => typeof v === "string" ? new Date(v) : v),
  dueDate: z.union([z.string(), z.date()]).transform((v) => typeof v === "string" ? new Date(v) : v),
  amount: z.coerce.number().default(0),
  paidAmount: z.coerce.number().default(0),
  status: z.enum(["Pending", "Partial", "Paid", "Overdue"]).default("Pending"),
  entryType: z.enum(["Bill", "Debit Note"]).default("Bill"),
  notes: z.string().default("").optional(),
});

const AccountsReceivableSchema = createMongoSchema({
  id: { type: Number, unique: true, index: true },
  clientName: { type: String, required: true },
  invoiceNumber: { type: String, default: "" },
  invoiceDate: { type: Date, required: true },
  dueDate: { type: Date, required: true },
  amount: { type: Number, default: 0 },
  receivedAmount: { type: Number, default: 0 },
  status: { type: String, default: "Pending" },
  entryType: { type: String, default: "Invoice" },
  notes: { type: String, default: "" },
  createdAt: { type: Date, default: Date.now },
});

autoIncrementId(AccountsReceivableSchema, "accounts_receivable");
export const accountsReceivableTable = mongoose.models.AccountsReceivable || mongoose.model("AccountsReceivable", AccountsReceivableSchema);

export const insertARSchema = z.object({
  clientName: z.string().min(1),
  invoiceNumber: z.string().default("").optional(),
  invoiceDate: z.union([z.string(), z.date()]).transform((v) => typeof v === "string" ? new Date(v) : v),
  dueDate: z.union([z.string(), z.date()]).transform((v) => typeof v === "string" ? new Date(v) : v),
  amount: z.coerce.number().default(0),
  receivedAmount: z.coerce.number().default(0),
  status: z.enum(["Pending", "Partial", "Received", "Overdue"]).default("Pending"),
  entryType: z.enum(["Invoice", "Credit Note"]).default("Invoice"),
  notes: z.string().default("").optional(),
});

export type ChartOfAccount = mongoose.InferSchemaType<typeof ChartOfAccountsSchema>;
export type JournalEntry = mongoose.InferSchemaType<typeof JournalEntrySchema>;
export type JournalLine = mongoose.InferSchemaType<typeof JournalLineSchema>;
export type AccountPayable = mongoose.InferSchemaType<typeof AccountsPayableSchema>;
export type AccountReceivable = mongoose.InferSchemaType<typeof AccountsReceivableSchema>;
