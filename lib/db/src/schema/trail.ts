import { pgTable, serial, varchar, numeric, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const trailClaimsTable = pgTable("trail_claims", {
  id: serial("id").primaryKey(),
  claimId: varchar("claim_id", { length: 50 }).notNull(),
  employeeName: varchar("employee_name", { length: 255 }).notNull(),
  date: timestamp("date").notNull(),
  category: varchar("category", { length: 100 }).notNull().default("Travel"),
  claimType: varchar("claim_type", { length: 50 }).notNull().default("Standard Receipt"),
  amount: numeric("amount", { precision: 14, scale: 2 }).notNull().default("0"),
  status: varchar("status", { length: 50 }).notNull().default("Pending"),
  description: text("description").notNull().default(""),
  distance: numeric("distance", { precision: 10, scale: 2 }),
  ratePerKm: numeric("rate_per_km", { precision: 10, scale: 2 }),
  numDays: numeric("num_days", { precision: 5, scale: 0 }),
  dailyRate: numeric("daily_rate", { precision: 10, scale: 2 }),
  ledgerJournalId: varchar("ledger_journal_id", { length: 50 }),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertTrailClaimSchema = createInsertSchema(trailClaimsTable).omit({
  id: true,
  createdAt: true,
  claimId: true,
  ledgerJournalId: true,
}).extend({
  date: z.union([z.string(), z.date()]).transform((v) => typeof v === "string" ? new Date(v) : v),
  category: z.enum(["Travel", "Fuel", "Meals", "Misc"]),
  claimType: z.enum(["Standard Receipt", "Mileage/Fuel Claim", "Per Diem"]),
  status: z.enum(["Pending", "Approved", "Rejected", "Paid"]).default("Pending"),
  distance: z.union([z.string(), z.number()]).optional().nullable(),
  ratePerKm: z.union([z.string(), z.number()]).optional().nullable(),
  numDays: z.union([z.string(), z.number()]).optional().nullable(),
  dailyRate: z.union([z.string(), z.number()]).optional().nullable(),
});

export const pettyCashTable = pgTable("petty_cash", {
  id: serial("id").primaryKey(),
  date: timestamp("date").notNull(),
  description: varchar("description", { length: 500 }).notNull(),
  cashIn: numeric("cash_in", { precision: 14, scale: 2 }).notNull().default("0"),
  cashOut: numeric("cash_out", { precision: 14, scale: 2 }).notNull().default("0"),
  runningBalance: numeric("running_balance", { precision: 14, scale: 2 }).notNull().default("0"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertPettyCashSchema = createInsertSchema(pettyCashTable).omit({
  id: true,
  createdAt: true,
  runningBalance: true,
}).extend({
  date: z.union([z.string(), z.date()]).transform((v) => typeof v === "string" ? new Date(v) : v),
});

export type TrailClaim = typeof trailClaimsTable.$inferSelect;
export type PettyCash = typeof pettyCashTable.$inferSelect;
