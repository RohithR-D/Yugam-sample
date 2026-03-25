import { pgTable, serial, varchar, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const visitorsTable = pgTable("visitors", {
  id: serial("id").primaryKey(),
  visitorName: varchar("visitor_name", { length: 300 }).notNull(),
  purpose: varchar("purpose", { length: 200 }).notNull(),
  hostName: varchar("host_name", { length: 300 }).notNull(),
  status: varchar("status", { length: 50 }).notNull(),
  checkInTime: timestamp("check_in_time").notNull(),
  checkOutTime: timestamp("check_out_time"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertVisitorSchema = createInsertSchema(visitorsTable).omit({
  id: true,
  createdAt: true,
}).extend({
  status: z.enum(["On Premises", "Checked Out"]),
  checkInTime: z.union([z.string(), z.date()]).transform((v) => typeof v === "string" ? new Date(v) : v),
  checkOutTime: z.union([z.string(), z.date()]).transform((v) => typeof v === "string" ? new Date(v) : v).optional().nullable(),
});

export type InsertVisitor = z.infer<typeof insertVisitorSchema>;
export type Visitor = typeof visitorsTable.$inferSelect;
