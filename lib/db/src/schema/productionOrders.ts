import { pgTable, serial, varchar, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const productionOrdersTable = pgTable("production_orders", {
  id: serial("id").primaryKey(),
  workOrderNumber: varchar("work_order_number", { length: 100 }).notNull().unique(),
  productName: varchar("product_name", { length: 255 }).notNull(),
  quantity: integer("quantity").notNull().default(0),
  status: varchar("status", { length: 50 }).notNull().default("Planned"),
  startDate: timestamp("start_date").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertProductionOrderSchema = createInsertSchema(productionOrdersTable).omit({
  id: true,
  createdAt: true,
}).extend({
  status: z.enum(["Planned", "In Progress", "Completed", "Halted"]),
  startDate: z.union([z.string(), z.date()]).transform((v) => typeof v === "string" ? new Date(v) : v),
});

export type InsertProductionOrder = z.infer<typeof insertProductionOrderSchema>;
export type ProductionOrder = typeof productionOrdersTable.$inferSelect;
