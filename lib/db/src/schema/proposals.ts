import { pgTable, serial, integer, varchar, numeric, jsonb, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { clientsTable } from "./clients";

export const proposalsTable = pgTable("proposals", {
  id: serial("id").primaryKey(),
  clientId: integer("client_id").references(() => clientsTable.id),
  title: varchar("title", { length: 500 }).notNull(),
  status: varchar("status", { length: 50 }).notNull().default("Draft"),
  totalEstimatedHours: numeric("total_estimated_hours", { precision: 10, scale: 1 }).notNull().default("0"),
  grandTotal: numeric("grand_total", { precision: 14, scale: 2 }).notNull().default("0"),
  proposalData: jsonb("proposal_data").notNull().default("[]"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertProposalSchema = createInsertSchema(proposalsTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  status: z.enum(["Draft", "Sent", "Accepted", "Rejected", "Revised"]).default("Draft"),
  clientId: z.number().nullable().optional(),
  proposalData: z.any().optional(),
  totalEstimatedHours: z.union([z.string(), z.number()]).optional().transform((v) => String(v ?? "0")),
  grandTotal: z.union([z.string(), z.number()]).optional().transform((v) => String(v ?? "0")),
});

export type InsertProposal = z.infer<typeof insertProposalSchema>;
export type Proposal = typeof proposalsTable.$inferSelect;
