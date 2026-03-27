import { pgTable, serial, integer, timestamp } from "drizzle-orm/pg-core";
import { inventoryCatalogTable } from "./inventoryCatalog";
import { inventoryLocationsTable } from "./inventoryLocations";

export const stockLedgerTable = pgTable("stock_ledger", {
  id: serial("id").primaryKey(),
  itemId: integer("item_id").references(() => inventoryCatalogTable.id, { onDelete: "cascade" }).notNull(),
  locationId: integer("location_id").references(() => inventoryLocationsTable.id, { onDelete: "cascade" }).notNull(),
  quantity: integer("quantity").notNull().default(0),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type StockLedger = typeof stockLedgerTable.$inferSelect;
