import { pgTable, serial, varchar, numeric, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const transactionsTable = pgTable("transactions", {
  id: serial("id").primaryKey(),
  date: timestamp("date").notNull(),
  description: varchar("description", { length: 500 }).notNull(),
  category: varchar("category", { length: 100 }).notNull(),
  type: varchar("type", { length: 50 }).notNull(),
  amount: numeric("amount", { precision: 14, scale: 2 }).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertTransactionSchema = createInsertSchema(transactionsTable).omit({
  id: true,
  createdAt: true,
}).extend({
  type: z.enum(["Credit", "Debit"]),
  date: z.union([z.string(), z.date()]).transform((v) => typeof v === "string" ? new Date(v) : v),
});

export type InsertTransaction = z.infer<typeof insertTransactionSchema>;
export type Transaction = typeof transactionsTable.$inferSelect;
