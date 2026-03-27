import { pgTable, serial, integer, varchar, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { inventoryCatalogTable } from "./inventoryCatalog";
import { inventoryLocationsTable } from "./inventoryLocations";

export const stockMovementsTable = pgTable("stock_movements", {
  id: serial("id").primaryKey(),
  itemId: integer("item_id").references(() => inventoryCatalogTable.id).notNull(),
  movementType: varchar("movement_type", { length: 30 }).notNull().default("Inward"),
  quantity: integer("quantity").notNull().default(0),
  fromLocationId: integer("from_location_id").references(() => inventoryLocationsTable.id),
  toLocationId: integer("to_location_id").references(() => inventoryLocationsTable.id),
  referenceNumber: varchar("reference_number", { length: 100 }).notNull().default(""),
  notes: text("notes").notNull().default(""),
  performedBy: varchar("performed_by", { length: 255 }).notNull().default(""),
  movementDate: timestamp("movement_date").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertStockMovementSchema = createInsertSchema(stockMovementsTable).omit({
  id: true,
  createdAt: true,
}).extend({
  movementType: z.enum(["Inward", "Outward", "Transfer", "Adjustment"]).default("Inward"),
  movementDate: z.union([z.string(), z.date()]).optional().transform((v) => (typeof v === "string" ? new Date(v) : v)),
});

export type InsertStockMovement = z.infer<typeof insertStockMovementSchema>;
export type StockMovement = typeof stockMovementsTable.$inferSelect;
