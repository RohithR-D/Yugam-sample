import { pgTable, serial, varchar, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const inventoryLocationsTable = pgTable("inventory_locations", {
  id: serial("id").primaryKey(),
  locationName: varchar("location_name", { length: 255 }).notNull(),
  locationType: varchar("location_type", { length: 30 }).notNull().default("Warehouse"),
  capacity: integer("capacity").notNull().default(0),
  manager: varchar("manager", { length: 255 }).notNull().default(""),
  address: varchar("address", { length: 500 }).notNull().default(""),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertInventoryLocationSchema = createInsertSchema(inventoryLocationsTable).omit({
  id: true,
  createdAt: true,
}).extend({
  locationType: z.enum(["Warehouse", "Store"]).default("Warehouse"),
});

export type InsertInventoryLocation = z.infer<typeof insertInventoryLocationSchema>;
export type InventoryLocation = typeof inventoryLocationsTable.$inferSelect;
