import { pgTable, serial, varchar, integer, numeric, timestamp, text } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { inventoryCatalogTable } from "./inventoryCatalog";
import { inventoryLocationsTable } from "./inventoryLocations";

export const forgeWorkstationsTable = pgTable("forge_workstations", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  type: varchar("type", { length: 30 }).notNull().default("Machine"),
  costPerHour: numeric("cost_per_hour", { precision: 12, scale: 2 }).notNull().default("0"),
  status: varchar("status", { length: 30 }).notNull().default("Active"),
  description: text("description").notNull().default(""),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertForgeWorkstationSchema = createInsertSchema(forgeWorkstationsTable).omit({
  id: true,
  createdAt: true,
}).extend({
  type: z.enum(["Machine", "Manual Line", "Vendor", "QC Desk"]).default("Machine"),
  status: z.enum(["Active", "Idle", "Maintenance"]).default("Active"),
});

export const forgeBOMTable = pgTable("forge_bom", {
  id: serial("id").primaryKey(),
  productName: varchar("product_name", { length: 255 }).notNull(),
  productCode: varchar("product_code", { length: 100 }).notNull().default(""),
  uom: varchar("uom", { length: 30 }).notNull().default("Nos"),
  outputQty: integer("output_qty").notNull().default(1),
  notes: text("notes").notNull().default(""),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertForgeBOMSchema = createInsertSchema(forgeBOMTable).omit({
  id: true,
  createdAt: true,
});

export const forgeBOMMaterialsTable = pgTable("forge_bom_materials", {
  id: serial("id").primaryKey(),
  bomId: integer("bom_id").notNull().references(() => forgeBOMTable.id),
  itemName: varchar("item_name", { length: 255 }).notNull(),
  itemId: integer("item_id").references(() => inventoryCatalogTable.id),
  qty: numeric("qty", { precision: 12, scale: 2 }).notNull().default("1"),
  uom: varchar("uom", { length: 30 }).notNull().default("Nos"),
  wastagePercent: numeric("wastage_percent", { precision: 5, scale: 2 }).notNull().default("0"),
});

export const insertForgeBOMMaterialSchema = createInsertSchema(forgeBOMMaterialsTable).omit({
  id: true,
});

export const forgeBOMRoutingTable = pgTable("forge_bom_routing", {
  id: serial("id").primaryKey(),
  bomId: integer("bom_id").notNull().references(() => forgeBOMTable.id),
  sequenceNo: integer("sequence_no").notNull().default(1),
  workstationId: integer("workstation_id").notNull().references(() => forgeWorkstationsTable.id),
  workstationName: varchar("workstation_name", { length: 255 }).notNull().default(""),
  operationName: varchar("operation_name", { length: 255 }).notNull().default(""),
  estimatedMinutes: integer("estimated_minutes").notNull().default(0),
});

export const insertForgeBOMRoutingSchema = createInsertSchema(forgeBOMRoutingTable).omit({
  id: true,
});

export const forgeWorkOrdersTable = pgTable("forge_work_orders", {
  id: serial("id").primaryKey(),
  woNumber: varchar("wo_number", { length: 100 }).notNull(),
  productName: varchar("product_name", { length: 255 }).notNull(),
  bomId: integer("bom_id").references(() => forgeBOMTable.id),
  productItemId: integer("product_item_id").references(() => inventoryCatalogTable.id),
  productionLocationId: integer("production_location_id").references(() => inventoryLocationsTable.id),
  targetQty: integer("target_qty").notNull().default(1),
  producedQty: integer("produced_qty").notNull().default(0),
  scrapQty: integer("scrap_qty").notNull().default(0),
  assignedWorkstationId: integer("assigned_workstation_id").references(() => forgeWorkstationsTable.id),
  assignedWorkstationName: varchar("assigned_workstation_name", { length: 255 }).notNull().default(""),
  status: varchar("status", { length: 30 }).notNull().default("Draft"),
  priority: varchar("priority", { length: 20 }).notNull().default("Normal"),
  startDate: timestamp("start_date"),
  endDate: timestamp("end_date"),
  notes: text("notes").notNull().default(""),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertForgeWorkOrderSchema = createInsertSchema(forgeWorkOrdersTable).omit({
  id: true,
  createdAt: true,
}).extend({
  status: z.enum(["Draft", "In Progress", "QC", "Completed"]).default("Draft"),
  priority: z.enum(["Low", "Normal", "High", "Urgent"]).default("Normal"),
  startDate: z.union([z.string(), z.date()]).transform((v) => typeof v === "string" ? new Date(v) : v).optional(),
  endDate: z.union([z.string(), z.date()]).transform((v) => typeof v === "string" ? new Date(v) : v).optional(),
});

export const forgeQualityControlTable = pgTable("forge_quality_control", {
  id: serial("id").primaryKey(),
  workOrderId: integer("work_order_id").notNull().references(() => forgeWorkOrdersTable.id),
  woNumber: varchar("wo_number", { length: 100 }).notNull().default(""),
  productName: varchar("product_name", { length: 255 }).notNull().default(""),
  inspectedQty: integer("inspected_qty").notNull().default(0),
  passedQty: integer("passed_qty").notNull().default(0),
  rejectedQty: integer("rejected_qty").notNull().default(0),
  rejectionReason: text("rejection_reason").notNull().default(""),
  inspectedBy: varchar("inspected_by", { length: 100 }).notNull().default(""),
  inspectionDate: timestamp("inspection_date").defaultNow(),
  notes: text("notes").notNull().default(""),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertForgeQualityControlSchema = createInsertSchema(forgeQualityControlTable).omit({
  id: true,
  createdAt: true,
}).extend({
  inspectionDate: z.union([z.string(), z.date()]).transform((v) => typeof v === "string" ? new Date(v) : v).optional(),
});

export const forgeDowntimeLogsTable = pgTable("forge_downtime_logs", {
  id: serial("id").primaryKey(),
  workstationId: integer("workstation_id").notNull().references(() => forgeWorkstationsTable.id),
  workstationName: varchar("workstation_name", { length: 255 }).notNull().default(""),
  reason: varchar("reason", { length: 50 }).notNull().default("Mechanical Failure"),
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time"),
  totalMinutesLost: integer("total_minutes_lost").notNull().default(0),
  notes: text("notes").notNull().default(""),
  loggedBy: varchar("logged_by", { length: 100 }).notNull().default(""),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertForgeDowntimeLogSchema = createInsertSchema(forgeDowntimeLogsTable).omit({
  id: true,
  createdAt: true,
}).extend({
  reason: z.enum(["Mechanical Failure", "Material Shortage", "Labor Absence", "Power Outage", "Tooling Issue", "Other"]).default("Mechanical Failure"),
  startTime: z.union([z.string(), z.date()]).transform((v) => typeof v === "string" ? new Date(v) : v),
  endTime: z.union([z.string(), z.date()]).transform((v) => typeof v === "string" ? new Date(v) : v).optional(),
});

export type ForgeWorkstation = typeof forgeWorkstationsTable.$inferSelect;
export type ForgeBOM = typeof forgeBOMTable.$inferSelect;
export type ForgeBOMMaterial = typeof forgeBOMMaterialsTable.$inferSelect;
export type ForgeBOMRouting = typeof forgeBOMRoutingTable.$inferSelect;
export type ForgeWorkOrder = typeof forgeWorkOrdersTable.$inferSelect;
export type ForgeQualityControl = typeof forgeQualityControlTable.$inferSelect;
export type ForgeDowntimeLog = typeof forgeDowntimeLogsTable.$inferSelect;
