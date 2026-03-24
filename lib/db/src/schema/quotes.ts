import { pgTable, serial, varchar, numeric, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const quotesTable = pgTable("quotes", {
  id: serial("id").primaryKey(),
  clientName: varchar("client_name", { length: 255 }).notNull(),
  quoteNumber: varchar("quote_number", { length: 50 }).notNull().unique(),
  totalAmount: numeric("total_amount", { precision: 12, scale: 2 }).notNull().default("0"),
  status: varchar("status", { length: 50 }).notNull().default("Draft"),
  issueDate: timestamp("issue_date").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertQuoteSchema = createInsertSchema(quotesTable).omit({
  id: true,
  createdAt: true,
}).extend({
  status: z.enum(["Draft", "Sent", "Accepted", "Rejected"]),
});

export type InsertQuote = z.infer<typeof insertQuoteSchema>;
export type Quote = typeof quotesTable.$inferSelect;
