import { pgTable, serial, varchar, timestamp, integer, text } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { employeesTable } from "./employees";

export const visitorsTable = pgTable("visitors", {
  id: serial("id").primaryKey(),
  visitorName: varchar("visitor_name", { length: 300 }).notNull(),
  phone: varchar("phone", { length: 20 }).notNull().default(""),
  photoUrl: text("photo_url").notNull().default(""),
  hostEmployeeId: integer("host_employee_id").references(() => employeesTable.id),
  hostName: varchar("host_name", { length: 300 }).notNull(),
  purpose: varchar("purpose", { length: 50 }).notNull().default("Meeting"),
  ticketRef: varchar("ticket_ref", { length: 100 }).notNull().default(""),
  classification: varchar("classification", { length: 20 }).notNull().default("Standard"),
  status: varchar("status", { length: 50 }).notNull().default("In-Premises"),
  checkInTime: timestamp("check_in_time").notNull(),
  checkOutTime: timestamp("check_out_time"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertVisitorSchema = createInsertSchema(visitorsTable).omit({
  id: true,
  createdAt: true,
}).extend({
  status: z.enum(["In-Premises", "Checked-Out"]).default("In-Premises"),
  purpose: z.enum(["Meeting", "Interview", "Delivery", "Maintenance"]).default("Meeting"),
  classification: z.enum(["Standard", "VIP", "Blacklist"]).default("Standard"),
  checkInTime: z.union([z.string(), z.date()]).transform((v) => typeof v === "string" ? new Date(v) : v),
  checkOutTime: z.union([z.string(), z.date()]).transform((v) => typeof v === "string" ? new Date(v) : v).optional().nullable(),
});

export const gateWatchlistTable = pgTable("gate_watchlist", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 300 }).notNull(),
  phone: varchar("phone", { length: 20 }).notNull().default(""),
  classification: varchar("classification", { length: 20 }).notNull().default("Blacklist"),
  reason: text("reason").notNull().default(""),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertWatchlistSchema = createInsertSchema(gateWatchlistTable).omit({
  id: true,
  createdAt: true,
}).extend({
  classification: z.enum(["VIP", "Blacklist"]),
});

export const gateSettingsTable = pgTable("gate_settings", {
  id: serial("id").primaryKey(),
  settingKey: varchar("setting_key", { length: 100 }).notNull().unique(),
  settingValue: varchar("setting_value", { length: 500 }).notNull().default(""),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type InsertVisitor = z.infer<typeof insertVisitorSchema>;
export type Visitor = typeof visitorsTable.$inferSelect;
