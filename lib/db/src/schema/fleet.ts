import { pgTable, serial, integer, varchar, timestamp, numeric, text } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const fleetVehiclesTable = pgTable("fleet_vehicles", {
  id: serial("id").primaryKey(),
  regNumber: varchar("reg_number", { length: 50 }).notNull().unique(),
  type: varchar("type", { length: 30 }).notNull().default("Truck"),
  make: varchar("make", { length: 100 }).notNull().default(""),
  model: varchar("model", { length: 100 }).notNull().default(""),
  status: varchar("status", { length: 30 }).notNull().default("Available"),
  rcExpiry: timestamp("rc_expiry"),
  insuranceExpiry: timestamp("insurance_expiry"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertFleetVehicleSchema = createInsertSchema(fleetVehiclesTable).omit({
  id: true,
  createdAt: true,
}).extend({
  type: z.enum(["Truck", "Van", "Car"]).default("Truck"),
  status: z.enum(["Available", "On Trip", "Maintenance"]).default("Available"),
  rcExpiry: z.union([z.string(), z.date()]).transform((v) => typeof v === "string" ? new Date(v) : v).optional().nullable(),
  insuranceExpiry: z.union([z.string(), z.date()]).transform((v) => typeof v === "string" ? new Date(v) : v).optional().nullable(),
});

export const fleetTripsTable = pgTable("fleet_trips", {
  id: serial("id").primaryKey(),
  vehicleId: integer("vehicle_id").references(() => fleetVehiclesTable.id),
  vehicleReg: varchar("vehicle_reg", { length: 50 }).notNull(),
  driverName: varchar("driver_name", { length: 200 }).notNull(),
  origin: varchar("origin", { length: 300 }).notNull(),
  destination: varchar("destination", { length: 300 }).notNull(),
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time"),
  status: varchar("status", { length: 30 }).notNull().default("Scheduled"),
  notes: text("notes").notNull().default(""),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertFleetTripSchema = createInsertSchema(fleetTripsTable).omit({
  id: true,
  createdAt: true,
}).extend({
  status: z.enum(["Scheduled", "In Transit", "Completed"]).default("Scheduled"),
  startTime: z.union([z.string(), z.date()]).transform((v) => typeof v === "string" ? new Date(v) : v),
  endTime: z.union([z.string(), z.date()]).transform((v) => typeof v === "string" ? new Date(v) : v).optional().nullable(),
});

export const fleetExpensesTable = pgTable("fleet_expenses", {
  id: serial("id").primaryKey(),
  vehicleId: integer("vehicle_id").references(() => fleetVehiclesTable.id),
  vehicleReg: varchar("vehicle_reg", { length: 50 }).notNull(),
  expenseDate: timestamp("expense_date").notNull(),
  expenseType: varchar("expense_type", { length: 30 }).notNull().default("Fuel"),
  amount: numeric("amount", { precision: 12, scale: 2 }).notNull().default("0"),
  description: text("description").notNull().default(""),
  loggedBy: varchar("logged_by", { length: 200 }).notNull().default(""),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertFleetExpenseSchema = createInsertSchema(fleetExpensesTable).omit({
  id: true,
  createdAt: true,
}).extend({
  expenseType: z.enum(["Fuel", "Repair", "Servicing"]),
  expenseDate: z.union([z.string(), z.date()]).transform((v) => typeof v === "string" ? new Date(v) : v),
});
