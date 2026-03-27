import { pgTable, serial, integer, varchar, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { inventoryCatalogTable } from "./inventoryCatalog";

export const materialIndentsTable = pgTable("material_indents", {
  id: serial("id").primaryKey(),
  itemId: integer("item_id").references(() => inventoryCatalogTable.id).notNull(),
  requestedQty: integer("requested_qty").notNull().default(1),
  approvedQty: integer("approved_qty").notNull().default(0),
  issuedFromLocationId: integer("issued_from_location_id"),
  requestedBy: varchar("requested_by", { length: 255 }).notNull().default(""),
  department: varchar("department", { length: 100 }).notNull().default(""),
  purpose: text("purpose").notNull().default(""),
  status: varchar("status", { length: 30 }).notNull().default("Pending"),
  requestDate: timestamp("request_date").defaultNow(),
  issueDate: timestamp("issue_date"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertMaterialIndentSchema = createInsertSchema(materialIndentsTable).omit({
  id: true,
  createdAt: true,
}).extend({
  status: z.enum(["Pending", "Approved", "Issued", "Rejected"]).default("Pending"),
  requestDate: z.union([z.string(), z.date()]).optional().transform((v) => (typeof v === "string" ? new Date(v) : v)),
  issueDate: z.union([z.string(), z.date()]).optional().nullable().transform((v) => (typeof v === "string" ? new Date(v) : v)),
});

export type InsertMaterialIndent = z.infer<typeof insertMaterialIndentSchema>;
export type MaterialIndent = typeof materialIndentsTable.$inferSelect;
