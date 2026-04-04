import { pgTable, serial, varchar, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const contractaCompliancesTable = pgTable("contracta_compliances", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 500 }).notNull(),
  category: varchar("category", { length: 50 }).notNull(),
  entityName: varchar("entity_name", { length: 300 }).notNull(),
  validFrom: timestamp("valid_from").notNull(),
  expiryDate: timestamp("expiry_date").notNull(),
  status: varchar("status", { length: 50 }).notNull().default("Active"),
  attachmentUrl: varchar("attachment_url", { length: 1000 }),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertComplianceSchema = createInsertSchema(contractaCompliancesTable).omit({
  id: true,
  createdAt: true,
  status: true,
}).extend({
  category: z.enum(["Client", "Vendor", "Statutory"]),
  validFrom: z.union([z.string(), z.date()]).transform((v) => typeof v === "string" ? new Date(v) : v),
  expiryDate: z.union([z.string(), z.date()]).transform((v) => typeof v === "string" ? new Date(v) : v),
  attachmentUrl: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export const contractaTemplatesTable = pgTable("contracta_templates", {
  id: serial("id").primaryKey(),
  templateName: varchar("template_name", { length: 300 }).notNull(),
  category: varchar("category", { length: 50 }).notNull(),
  contentHtml: text("content_html").notNull().default(""),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertTemplateSchema = createInsertSchema(contractaTemplatesTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  category: z.enum(["HR", "Legal", "General"]),
  contentHtml: z.string().optional().default(""),
});
