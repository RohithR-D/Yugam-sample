import { pgTable, serial, varchar, numeric, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const inventoryCatalogTable = pgTable("inventory_catalog", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  sku: varchar("sku", { length: 100 }).notNull().default(""),
  category: varchar("category", { length: 100 }).notNull().default("General"),
  itemType: varchar("item_type", { length: 30 }).notNull().default("Raw Material"),
  hsnSac: varchar("hsn_sac", { length: 20 }).notNull().default(""),
  unitPrice: numeric("unit_price", { precision: 14, scale: 2 }).notNull().default("0"),
  uom: varchar("uom", { length: 30 }).notNull().default("Nos"),
  globalStock: integer("global_stock").notNull().default(0),
  reorderLevel: integer("reorder_level").notNull().default(10),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertInventoryCatalogSchema = createInsertSchema(inventoryCatalogTable).omit({
  id: true,
  createdAt: true,
}).extend({
  itemType: z.enum(["Raw Material", "Finished Product"]).default("Raw Material"),
});

export type InsertInventoryCatalog = z.infer<typeof insertInventoryCatalogSchema>;
export type InventoryCatalog = typeof inventoryCatalogTable.$inferSelect;
