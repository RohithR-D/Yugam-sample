import { pgTable, serial, varchar, numeric, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const assetsTable = pgTable("assets", {
  id: serial("id").primaryKey(),
  assetName: varchar("asset_name", { length: 255 }).notNull(),
  serialNumber: varchar("serial_number", { length: 100 }).notNull().default(""),
  category: varchar("category", { length: 100 }).notNull().default("Equipment"),
  status: varchar("status", { length: 30 }).notNull().default("Active"),
  assignedTo: varchar("assigned_to", { length: 255 }).notNull().default(""),
  purchaseValue: numeric("purchase_value", { precision: 14, scale: 2 }).notNull().default("0"),
  purchaseDate: timestamp("purchase_date"),
  maintenanceNotes: text("maintenance_notes").notNull().default(""),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertAssetSchema = createInsertSchema(assetsTable).omit({
  id: true,
  createdAt: true,
}).extend({
  status: z.enum(["Active", "Allocated", "Maintenance", "Sold"]).default("Active"),
  purchaseDate: z.union([z.string(), z.date()]).optional().nullable().transform((v) => (typeof v === "string" ? new Date(v) : v)),
});

export type InsertAsset = z.infer<typeof insertAssetSchema>;
export type Asset = typeof assetsTable.$inferSelect;
