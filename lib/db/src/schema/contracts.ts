import { pgTable, serial, varchar, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const contractsTable = pgTable("contracts", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 500 }).notNull(),
  partyName: varchar("party_name", { length: 300 }).notNull(),
  type: varchar("type", { length: 100 }).notNull(),
  status: varchar("status", { length: 50 }).notNull(),
  expiryDate: timestamp("expiry_date").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertContractSchema = createInsertSchema(contractsTable).omit({
  id: true,
  createdAt: true,
}).extend({
  status: z.enum(["Active", "Expiring Soon", "Expired", "Terminated"]),
  expiryDate: z.union([z.string(), z.date()]).transform((v) => typeof v === "string" ? new Date(v) : v),
});

export type InsertContract = z.infer<typeof insertContractSchema>;
export type Contract = typeof contractsTable.$inferSelect;
