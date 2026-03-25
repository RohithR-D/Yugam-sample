import { pgTable, serial, varchar, integer, numeric, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const inventoryTable = pgTable("inventory", {
  id: serial("id").primaryKey(),
  itemName: varchar("item_name", { length: 255 }).notNull(),
  sku: varchar("sku", { length: 100 }).notNull().unique(),
  category: varchar("category", { length: 100 }).notNull(),
  quantity: integer("quantity").notNull().default(0),
  unitPrice: numeric("unit_price", { precision: 12, scale: 2 }).notNull().default("0"),
  status: varchar("status", { length: 50 }).notNull().default("In Stock"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertInventorySchema = createInsertSchema(inventoryTable).omit({
  id: true,
  createdAt: true,
}).extend({
  status: z.enum(["In Stock", "Low Stock", "Out of Stock"]),
});

export type InsertInventory = z.infer<typeof insertInventorySchema>;
export type Inventory = typeof inventoryTable.$inferSelect;
