import { pgTable, serial, varchar, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const shipmentsTable = pgTable("shipments", {
  id: serial("id").primaryKey(),
  trackingNumber: varchar("tracking_number", { length: 100 }).notNull().unique(),
  destination: varchar("destination", { length: 255 }).notNull(),
  carrier: varchar("carrier", { length: 100 }).notNull(),
  status: varchar("status", { length: 50 }).notNull().default("Pending"),
  dispatchDate: timestamp("dispatch_date").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertShipmentSchema = createInsertSchema(shipmentsTable).omit({
  id: true,
  createdAt: true,
}).extend({
  status: z.enum(["Pending", "In Transit", "Delivered", "Delayed"]),
  dispatchDate: z.union([z.string(), z.date()]).transform((v) => typeof v === "string" ? new Date(v) : v),
});

export type InsertShipment = z.infer<typeof insertShipmentSchema>;
export type Shipment = typeof shipmentsTable.$inferSelect;
