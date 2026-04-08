import { pgTable, serial, varchar, integer, numeric, timestamp, text, boolean, uniqueIndex } from "drizzle-orm/pg-core";
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
  locationId: integer("location_id").references(() => inventoryLocationsTable.id),
  capacity: integer("capacity").notNull().default(1),
  currentStatus: varchar("current_status", { length: 30 }).notNull().default("Idle"),
  maintenanceSchedule: varchar("maintenance_schedule", { length: 255 }),
  lastMaintenanceDate: timestamp("last_maintenance_date"),
  nextMaintenanceDate: timestamp("next_maintenance_date"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertForgeWorkstationSchema = createInsertSchema(forgeWorkstationsTable).omit({
  id: true,
  createdAt: true,
}).extend({
  type: z.enum(["Machine", "Manual Line", "Vendor", "QC Desk"]).default("Machine"),
  status: z.enum(["Active", "Idle", "Maintenance"]).default("Active"),
  currentStatus: z.enum(["Active", "Idle", "Maintenance", "Breakdown"]).default("Idle"),
  lastMaintenanceDate: z.union([z.string(), z.date()]).transform((v) => typeof v === "string" ? new Date(v) : v).optional().nullable(),
  nextMaintenanceDate: z.union([z.string(), z.date()]).transform((v) => typeof v === "string" ? new Date(v) : v).optional().nullable(),
});

export const forgeBOMTable = pgTable("forge_bom", {
  id: serial("id").primaryKey(),
  productName: varchar("product_name", { length: 255 }).notNull(),
  productCode: varchar("product_code", { length: 100 }).notNull().default(""),
  uom: varchar("uom", { length: 30 }).notNull().default("Nos"),
  outputQty: integer("output_qty").notNull().default(1),
  notes: text("notes").notNull().default(""),
  productItemId: integer("product_item_id").references(() => inventoryCatalogTable.id),
  version: integer("version").notNull().default(1),
  bomStatus: varchar("bom_status", { length: 20 }).notNull().default("Draft"),
  estimatedCostPerUnit: numeric("estimated_cost_per_unit", { precision: 12, scale: 2 }).notNull().default("0"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertForgeBOMSchema = createInsertSchema(forgeBOMTable).omit({
  id: true,
  createdAt: true,
  estimatedCostPerUnit: true,
}).extend({
  bomStatus: z.enum(["Draft", "Active", "Obsolete"]).default("Draft"),
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
  sopReference: varchar("sop_reference", { length: 100 }),
  sopDescription: text("sop_description"),
  hasQcCheck: boolean("has_qc_check").notNull().default(false),
  qcChecklistJson: text("qc_checklist_json"),
  consumableMaterials: text("consumable_materials"),
  setupTimeMinutes: integer("setup_time_minutes").notNull().default(0),
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
  projectId: integer("project_id"),
  taskId: integer("task_id"),
  expectedEndDate: timestamp("expected_end_date"),
  actualEndDate: timestamp("actual_end_date"),
  currentRoutingStep: integer("current_routing_step").notNull().default(0),
  totalRoutingSteps: integer("total_routing_steps").notNull().default(0),
  materialsCost: numeric("materials_cost", { precision: 12, scale: 2 }).notNull().default("0"),
  laborCost: numeric("labor_cost", { precision: 12, scale: 2 }).notNull().default("0"),
  overheadCost: numeric("overhead_cost", { precision: 12, scale: 2 }).notNull().default("0"),
  totalCost: numeric("total_cost", { precision: 12, scale: 2 }).notNull().default("0"),
  costPerUnit: numeric("cost_per_unit", { precision: 12, scale: 2 }).notNull().default("0"),
  trackIndividualUnits: boolean("track_individual_units").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertForgeWorkOrderSchema = createInsertSchema(forgeWorkOrdersTable).omit({
  id: true,
  createdAt: true,
  producedQty: true,
  scrapQty: true,
  currentRoutingStep: true,
  totalRoutingSteps: true,
  materialsCost: true,
  laborCost: true,
  overheadCost: true,
  totalCost: true,
  costPerUnit: true,
}).extend({
  status: z.enum(["Draft", "Planned", "In Progress", "QC", "Completed", "On Hold", "Cancelled"]).default("Draft"),
  priority: z.enum(["Low", "Normal", "High", "Urgent"]).default("Normal"),
  startDate: z.union([z.string(), z.date()]).transform((v) => typeof v === "string" ? new Date(v) : v).optional(),
  endDate: z.union([z.string(), z.date()]).transform((v) => typeof v === "string" ? new Date(v) : v).optional(),
  expectedEndDate: z.union([z.string(), z.date()]).transform((v) => typeof v === "string" ? new Date(v) : v).optional(),
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
  routingStepId: integer("routing_step_id").references(() => forgeBOMRoutingTable.id),
  unitIdentifier: varchar("unit_identifier", { length: 50 }),
  inspectionType: varchar("inspection_type", { length: 20 }).notNull().default("Final"),
  result: varchar("result", { length: 20 }).notNull().default("Passed"),
  checklistResultsJson: text("checklist_results_json"),
  reworkRequired: boolean("rework_required").notNull().default(false),
  reworkInstructions: text("rework_instructions"),
  reworkWorkOrderId: integer("rework_work_order_id").references(() => forgeWorkOrdersTable.id),
  defectCategory: varchar("defect_category", { length: 30 }),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertForgeQualityControlSchema = createInsertSchema(forgeQualityControlTable).omit({
  id: true,
  createdAt: true,
}).extend({
  inspectionDate: z.union([z.string(), z.date()]).transform((v) => typeof v === "string" ? new Date(v) : v).optional(),
  inspectionType: z.enum(["In-Process", "Final", "Rework"]).default("Final"),
  result: z.enum(["Passed", "Failed", "Conditional"]).default("Passed"),
  defectCategory: z.enum(["Dimensional", "Surface", "Welding", "Material", "Painting", "Assembly", "Other"]).optional().nullable(),
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
  workOrderId: integer("work_order_id").references(() => forgeWorkOrdersTable.id),
  costImpact: numeric("cost_impact", { precision: 12, scale: 2 }).notNull().default("0"),
  category: varchar("category", { length: 50 }).notNull().default("Other"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertForgeDowntimeLogSchema = createInsertSchema(forgeDowntimeLogsTable).omit({
  id: true,
  createdAt: true,
  costImpact: true,
}).extend({
  reason: z.enum(["Mechanical Failure", "Electrical Failure", "Material Shortage", "Operator Absence", "Power Outage", "Scheduled Maintenance", "Tool Change", "Setup", "Other"]).default("Mechanical Failure"),
  category: z.enum(["Mechanical Failure", "Electrical Failure", "Material Shortage", "Operator Absence", "Power Outage", "Scheduled Maintenance", "Tool Change", "Setup", "Other"]).default("Other"),
  startTime: z.union([z.string(), z.date()]).transform((v) => typeof v === "string" ? new Date(v) : v),
  endTime: z.union([z.string(), z.date()]).transform((v) => typeof v === "string" ? new Date(v) : v).optional(),
});

export const forgeWorkOrderUnitsTable = pgTable("forge_work_order_units", {
  id: serial("id").primaryKey(),
  workOrderId: integer("work_order_id").notNull().references(() => forgeWorkOrdersTable.id),
  unitNumber: integer("unit_number").notNull(),
  unitIdentifier: varchar("unit_identifier", { length: 50 }).notNull(),
  currentStepSequence: integer("current_step_sequence").notNull().default(0),
  currentStepName: varchar("current_step_name", { length: 255 }),
  status: varchar("status", { length: 20 }).notNull().default("Queued"),
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertForgeWorkOrderUnitSchema = createInsertSchema(forgeWorkOrderUnitsTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  status: z.enum(["Queued", "In Progress", "QC Pending", "QC Passed", "QC Failed", "Rework", "Completed", "Scrapped"]).default("Queued"),
});

export const forgeProductionLogTable = pgTable("forge_production_log", {
  id: serial("id").primaryKey(),
  workOrderId: integer("work_order_id").notNull().references(() => forgeWorkOrdersTable.id),
  unitId: integer("unit_id").notNull().references(() => forgeWorkOrderUnitsTable.id),
  routingStepId: integer("routing_step_id").notNull().references(() => forgeBOMRoutingTable.id),
  sequenceNo: integer("sequence_no").notNull(),
  workstationId: integer("workstation_id").references(() => forgeWorkstationsTable.id),
  operatorName: varchar("operator_name", { length: 255 }),
  status: varchar("status", { length: 20 }).notNull().default("Pending"),
  startTime: timestamp("start_time"),
  endTime: timestamp("end_time"),
  actualMinutes: integer("actual_minutes"),
  setupMinutes: integer("setup_minutes").notNull().default(0),
  qcRequired: boolean("qc_required").notNull().default(false),
  qcStatus: varchar("qc_status", { length: 20 }).notNull().default("Not Required"),
  qcRecordId: integer("qc_record_id").references(() => forgeQualityControlTable.id),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertForgeProductionLogSchema = createInsertSchema(forgeProductionLogTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  status: z.enum(["Pending", "In Progress", "Completed", "Skipped"]).default("Pending"),
  qcStatus: z.enum(["Not Required", "Pending", "Passed", "Failed"]).default("Not Required"),
  startTime: z.union([z.string(), z.date()]).transform((v) => typeof v === "string" ? new Date(v) : v).optional(),
  endTime: z.union([z.string(), z.date()]).transform((v) => typeof v === "string" ? new Date(v) : v).optional(),
});

export const forgeMaterialConsumptionTable = pgTable("forge_material_consumption", {
  id: serial("id").primaryKey(),
  workOrderId: integer("work_order_id").notNull().references(() => forgeWorkOrdersTable.id),
  itemId: integer("item_id").notNull().references(() => inventoryCatalogTable.id),
  itemName: varchar("item_name", { length: 255 }).notNull(),
  bomEstimatedQty: numeric("bom_estimated_qty", { precision: 10, scale: 3 }).notNull(),
  actualQtyIssued: numeric("actual_qty_issued", { precision: 10, scale: 3 }).notNull().default("0"),
  actualQtyConsumed: numeric("actual_qty_consumed", { precision: 10, scale: 3 }).notNull().default("0"),
  returnedQty: numeric("returned_qty", { precision: 10, scale: 3 }).notNull().default("0"),
  uom: varchar("uom", { length: 20 }).notNull(),
  unitCost: numeric("unit_cost", { precision: 12, scale: 2 }).notNull().default("0"),
  totalCost: numeric("total_cost", { precision: 12, scale: 2 }).notNull().default("0"),
  variance: numeric("variance", { precision: 10, scale: 3 }).notNull().default("0"),
  variancePercent: numeric("variance_percent", { precision: 5, scale: 2 }).notNull().default("0"),
  issuedFromLocationId: integer("issued_from_location_id").references(() => inventoryLocationsTable.id),
  issuedDate: timestamp("issued_date"),
  issuedBy: varchar("issued_by", { length: 255 }),
  stockMovementId: integer("stock_movement_id"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertForgeMaterialConsumptionSchema = createInsertSchema(forgeMaterialConsumptionTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  totalCost: true,
  variance: true,
  variancePercent: true,
});

export type ForgeWorkstation = typeof forgeWorkstationsTable.$inferSelect;
export type ForgeBOM = typeof forgeBOMTable.$inferSelect;
export type ForgeBOMMaterial = typeof forgeBOMMaterialsTable.$inferSelect;
export type ForgeBOMRouting = typeof forgeBOMRoutingTable.$inferSelect;
export type ForgeWorkOrder = typeof forgeWorkOrdersTable.$inferSelect;
export type ForgeQualityControl = typeof forgeQualityControlTable.$inferSelect;
export type ForgeDowntimeLog = typeof forgeDowntimeLogsTable.$inferSelect;
export type ForgeWorkOrderUnit = typeof forgeWorkOrderUnitsTable.$inferSelect;
export type ForgeProductionLog = typeof forgeProductionLogTable.$inferSelect;
export type ForgeMaterialConsumption = typeof forgeMaterialConsumptionTable.$inferSelect;
