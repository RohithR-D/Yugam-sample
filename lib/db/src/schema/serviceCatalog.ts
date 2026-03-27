import { pgTable, serial, varchar, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const serviceCatalogTable = pgTable("service_catalog", {
  id: serial("id").primaryKey(),
  category: varchar("category", { length: 100 }).notNull().default("General"),
  itemCode: varchar("item_code", { length: 50 }).notNull().default(""),
  templateName: varchar("template_name", { length: 255 }).notNull(),
  description: text("description").notNull().default(""),
  uom: varchar("uom", { length: 20 }).notNull().default("Nos"),
  tags: varchar("tags", { length: 500 }).notNull().default(""),
  baseHours: varchar("base_hours", { length: 20 }).notNull().default("0"),
  baseRate: varchar("base_rate", { length: 20 }).notNull().default("0"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertServiceCatalogSchema = createInsertSchema(serviceCatalogTable).omit({
  id: true,
  createdAt: true,
});

export type InsertServiceCatalog = z.infer<typeof insertServiceCatalogSchema>;
export type ServiceCatalog = typeof serviceCatalogTable.$inferSelect;
