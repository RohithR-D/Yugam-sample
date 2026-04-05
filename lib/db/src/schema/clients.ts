import { pgTable, serial, varchar, numeric, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const clientsTable = pgTable("clients", {
  id: serial("id").primaryKey(),
  companyName: varchar("company_name", { length: 255 }).notNull(),
  contactName: varchar("contact_name", { length: 255 }).notNull(),
  industry: varchar("industry", { length: 100 }).notNull().default("General"),
  status: varchar("status", { length: 50 }).notNull().default("Lead"),
  pipelineStatus: varchar("pipeline_status", { length: 50 }).notNull().default("Lead"),
  dealValue: numeric("deal_value", { precision: 12, scale: 2 }).notNull().default("0"),
  gstin: varchar("gstin", { length: 15 }),
  pan: varchar("pan", { length: 10 }),
  tan: varchar("tan", { length: 10 }),
  gstTreatment: varchar("gst_treatment", { length: 30 }).notNull().default("Unregistered"),
  creditLimit: numeric("credit_limit", { precision: 12, scale: 2 }),
  paymentTermsDefault: varchar("payment_terms_default", { length: 100 }),
  paymentDueDaysDefault: integer("payment_due_days_default"),
  currencyDefault: varchar("currency_default", { length: 3 }).notNull().default("INR"),
  stateCode: varchar("state_code", { length: 2 }),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertClientSchema = createInsertSchema(clientsTable).omit({
  id: true,
  createdAt: true,
}).extend({
  pipelineStatus: z.enum(["Lead", "Contacted", "Proposal", "Won", "Lost"]).default("Lead"),
  gstTreatment: z.enum(["Registered", "Unregistered", "Consumer", "Composition", "SEZ", "Overseas", "UIN Holders"]).default("Unregistered"),
});

export type InsertClient = z.infer<typeof insertClientSchema>;
export type Client = typeof clientsTable.$inferSelect;
