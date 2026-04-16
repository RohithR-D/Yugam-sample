import mongoose from "mongoose";
import { z } from "zod/v4";
import { autoIncrementId, createMongoSchema } from "./mongoUtils.js";

const ForgeWorkstationSchema = createMongoSchema({
  id: { type: Number, unique: true, index: true },
  name: { type: String, required: true },
  type: { type: String, default: "Machine" },
  costPerHour: { type: Number, default: 0 },
  status: { type: String, default: "Active" },
  description: { type: String, default: "" },
  locationId: { type: Number },
  capacity: { type: Number, default: 1 },
  currentStatus: { type: String, default: "Idle" },
  maintenanceSchedule: { type: String },
  lastMaintenanceDate: { type: Date },
  nextMaintenanceDate: { type: Date },
  createdAt: { type: Date, default: Date.now },
});

autoIncrementId(ForgeWorkstationSchema, "forge_workstations");
export const forgeWorkstationsTable = mongoose.models.ForgeWorkstation || mongoose.model("ForgeWorkstation", ForgeWorkstationSchema);

export const insertForgeWorkstationSchema = z.object({
  name: z.string().min(1),
  type: z.enum(["Machine", "Manual Line", "Vendor", "QC Desk"]).default("Machine"),
  costPerHour: z.coerce.number().default(0),
  status: z.enum(["Active", "Idle", "Maintenance"]).default("Active"),
  description: z.string().default("").optional(),
  locationId: z.coerce.number().optional(),
  capacity: z.coerce.number().default(1),
  currentStatus: z.enum(["Active", "Idle", "Maintenance", "Breakdown"]).default("Idle"),
  maintenanceSchedule: z.string().optional(),
  lastMaintenanceDate: z.union([z.string(), z.date()]).optional().nullable().transform((v) => (typeof v === "string" ? new Date(v) : v)),
  nextMaintenanceDate: z.union([z.string(), z.date()]).optional().nullable().transform((v) => (typeof v === "string" ? new Date(v) : v)),
});

const ForgeBOMSchema = createMongoSchema({
  id: { type: Number, unique: true, index: true },
  productName: { type: String, required: true },
  productCode: { type: String, default: "" },
  uom: { type: String, default: "Nos" },
  outputQty: { type: Number, default: 1 },
  notes: { type: String, default: "" },
  productItemId: { type: Number },
  version: { type: Number, default: 1 },
  bomStatus: { type: String, default: "Draft" },
  estimatedCostPerUnit: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
});

autoIncrementId(ForgeBOMSchema, "forge_bom");
export const forgeBOMTable = mongoose.models.ForgeBOM || mongoose.model("ForgeBOM", ForgeBOMSchema);

export const insertForgeBOMSchema = z.object({
  productName: z.string().min(1),
  productCode: z.string().default("").optional(),
  uom: z.string().default("Nos").optional(),
  outputQty: z.coerce.number().default(1),
  notes: z.string().default("").optional(),
  productItemId: z.coerce.number().optional(),
  version: z.coerce.number().default(1),
  bomStatus: z.enum(["Draft", "Active", "Obsolete"]).default("Draft"),
});

const ForgeBOMMaterialSchema = createMongoSchema({
  id: { type: Number, unique: true, index: true },
  bomId: { type: Number, required: true },
  itemName: { type: String, required: true },
  itemId: { type: Number },
  qty: { type: Number, default: 1 },
  uom: { type: String, default: "Nos" },
  wastagePercent: { type: Number, default: 0 },
});

autoIncrementId(ForgeBOMMaterialSchema, "forge_bom_materials");
export const forgeBOMMaterialsTable = mongoose.models.ForgeBOMMaterial || mongoose.model("ForgeBOMMaterial", ForgeBOMMaterialSchema);

export const insertForgeBOMMaterialSchema = z.object({
  bomId: z.coerce.number(),
  itemName: z.string().min(1),
  itemId: z.coerce.number().optional(),
  qty: z.coerce.number().default(1),
  uom: z.string().default("Nos").optional(),
  wastagePercent: z.coerce.number().default(0),
});

const ForgeBOMRoutingSchema = createMongoSchema({
  id: { type: Number, unique: true, index: true },
  bomId: { type: Number, required: true },
  sequenceNo: { type: Number, default: 1 },
  workstationId: { type: Number, required: true },
  workstationName: { type: String, default: "" },
  operationName: { type: String, default: "" },
  estimatedMinutes: { type: Number, default: 0 },
  sopReference: { type: String },
  sopDescription: { type: String },
  hasQcCheck: { type: Boolean, default: false },
  qcChecklistJson: { type: String },
  consumableMaterials: { type: String },
  setupTimeMinutes: { type: Number, default: 0 },
});

autoIncrementId(ForgeBOMRoutingSchema, "forge_bom_routing");
export const forgeBOMRoutingTable = mongoose.models.ForgeBOMRouting || mongoose.model("ForgeBOMRouting", ForgeBOMRoutingSchema);

export const insertForgeBOMRoutingSchema = z.object({
  bomId: z.coerce.number(),
  sequenceNo: z.coerce.number().default(1),
  workstationId: z.coerce.number(),
  workstationName: z.string().default("").optional(),
  operationName: z.string().default("").optional(),
  estimatedMinutes: z.coerce.number().default(0),
  sopReference: z.string().optional(),
  sopDescription: z.string().optional(),
  hasQcCheck: z.boolean().default(false),
  qcChecklistJson: z.string().optional(),
  consumableMaterials: z.string().optional(),
  setupTimeMinutes: z.coerce.number().default(0),
});

const ForgeWorkOrderSchema = createMongoSchema({
  id: { type: Number, unique: true, index: true },
  woNumber: { type: String, required: true },
  productName: { type: String, required: true },
  bomId: { type: Number },
  productItemId: { type: Number },
  productionLocationId: { type: Number },
  targetQty: { type: Number, default: 1 },
  producedQty: { type: Number, default: 0 },
  scrapQty: { type: Number, default: 0 },
  assignedWorkstationId: { type: Number },
  assignedWorkstationName: { type: String, default: "" },
  status: { type: String, default: "Draft" },
  priority: { type: String, default: "Normal" },
  startDate: { type: Date },
  endDate: { type: Date },
  notes: { type: String, default: "" },
  projectId: { type: Number },
  taskId: { type: Number },
  expectedEndDate: { type: Date },
  actualEndDate: { type: Date },
  currentRoutingStep: { type: Number, default: 0 },
  totalRoutingSteps: { type: Number, default: 0 },
  materialsCost: { type: Number, default: 0 },
  laborCost: { type: Number, default: 0 },
  overheadCost: { type: Number, default: 0 },
  totalCost: { type: Number, default: 0 },
  costPerUnit: { type: Number, default: 0 },
  trackIndividualUnits: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
});

autoIncrementId(ForgeWorkOrderSchema, "forge_work_orders");
export const forgeWorkOrdersTable = mongoose.models.ForgeWorkOrder || mongoose.model("ForgeWorkOrder", ForgeWorkOrderSchema);

export const insertForgeWorkOrderSchema = z.object({
  woNumber: z.string().min(1),
  productName: z.string().min(1),
  bomId: z.coerce.number().optional(),
  productItemId: z.coerce.number().optional(),
  productionLocationId: z.coerce.number().optional(),
  targetQty: z.coerce.number().default(1),
  assignedWorkstationId: z.coerce.number().optional(),
  assignedWorkstationName: z.string().default("").optional(),
  status: z.enum(["Draft", "Planned", "In Progress", "QC", "Completed", "On Hold", "Cancelled"]).default("Draft"),
  priority: z.enum(["Low", "Normal", "High", "Urgent"]).default("Normal"),
  startDate: z.union([z.string(), z.date()]).optional().transform((v) => (typeof v === "string" ? new Date(v) : v)),
  endDate: z.union([z.string(), z.date()]).optional().transform((v) => (typeof v === "string" ? new Date(v) : v)),
  expectedEndDate: z.union([z.string(), z.date()]).optional().transform((v) => (typeof v === "string" ? new Date(v) : v)),
  notes: z.string().default("").optional(),
  projectId: z.coerce.number().optional(),
  taskId: z.coerce.number().optional(),
  trackIndividualUnits: z.boolean().default(true),
});

const ForgeQualityControlSchema = createMongoSchema({
  id: { type: Number, unique: true, index: true },
  workOrderId: { type: Number, required: true },
  woNumber: { type: String, default: "" },
  productName: { type: String, default: "" },
  inspectedQty: { type: Number, default: 0 },
  passedQty: { type: Number, default: 0 },
  rejectedQty: { type: Number, default: 0 },
  rejectionReason: { type: String, default: "" },
  inspectedBy: { type: String, default: "" },
  inspectionDate: { type: Date, default: Date.now },
  notes: { type: String, default: "" },
  routingStepId: { type: Number },
  unitIdentifier: { type: String },
  inspectionType: { type: String, default: "Final" },
  result: { type: String, default: "Passed" },
  checklistResultsJson: { type: String },
  reworkRequired: { type: Boolean, default: false },
  reworkInstructions: { type: String },
  reworkWorkOrderId: { type: Number },
  defectCategory: { type: String },
  createdAt: { type: Date, default: Date.now },
});

autoIncrementId(ForgeQualityControlSchema, "forge_quality_control");
export const forgeQualityControlTable = mongoose.models.ForgeQualityControl || mongoose.model("ForgeQualityControl", ForgeQualityControlSchema);

export const insertForgeQualityControlSchema = z.object({
  workOrderId: z.coerce.number(),
  woNumber: z.string().default("").optional(),
  productName: z.string().default("").optional(),
  inspectedQty: z.coerce.number().default(0),
  passedQty: z.coerce.number().default(0),
  rejectedQty: z.coerce.number().default(0),
  rejectionReason: z.string().default("").optional(),
  inspectedBy: z.string().default("").optional(),
  inspectionDate: z.union([z.string(), z.date()]).optional().transform((v) => (typeof v === "string" ? new Date(v) : v)),
  notes: z.string().default("").optional(),
  routingStepId: z.coerce.number().optional(),
  unitIdentifier: z.string().optional(),
  inspectionType: z.enum(["In-Process", "Final", "Rework"]).default("Final"),
  result: z.enum(["Passed", "Failed", "Conditional"]).default("Passed"),
  checklistResultsJson: z.string().optional(),
  reworkRequired: z.boolean().default(false),
  reworkInstructions: z.string().optional(),
  reworkWorkOrderId: z.coerce.number().optional(),
  defectCategory: z.enum(["Dimensional", "Surface", "Welding", "Material", "Painting", "Assembly", "Other"]).optional().nullable(),
});

const ForgeDowntimeLogSchema = createMongoSchema({
  id: { type: Number, unique: true, index: true },
  workstationId: { type: Number, required: true },
  workstationName: { type: String, default: "" },
  reason: { type: String, default: "Mechanical Failure" },
  startTime: { type: Date, required: true },
  endTime: { type: Date },
  totalMinutesLost: { type: Number, default: 0 },
  notes: { type: String, default: "" },
  loggedBy: { type: String, default: "" },
  workOrderId: { type: Number },
  costImpact: { type: Number, default: 0 },
  category: { type: String, default: "Other" },
  createdAt: { type: Date, default: Date.now },
});

autoIncrementId(ForgeDowntimeLogSchema, "forge_downtime_logs");
export const forgeDowntimeLogsTable = mongoose.models.ForgeDowntimeLog || mongoose.model("ForgeDowntimeLog", ForgeDowntimeLogSchema);

export const insertForgeDowntimeLogSchema = z.object({
  workstationId: z.coerce.number(),
  workstationName: z.string().default("").optional(),
  reason: z.enum(["Mechanical Failure", "Electrical Failure", "Material Shortage", "Operator Absence", "Power Outage", "Scheduled Maintenance", "Tool Change", "Setup", "Other"]).default("Mechanical Failure"),
  startTime: z.union([z.string(), z.date()]).transform((v) => typeof v === "string" ? new Date(v) : v),
  endTime: z.union([z.string(), z.date()]).optional().transform((v) => (typeof v === "string" ? new Date(v) : v)),
  totalMinutesLost: z.coerce.number().default(0),
  notes: z.string().default("").optional(),
  loggedBy: z.string().default("").optional(),
  workOrderId: z.coerce.number().optional(),
  category: z.enum(["Mechanical Failure", "Electrical Failure", "Material Shortage", "Operator Absence", "Power Outage", "Scheduled Maintenance", "Tool Change", "Setup", "Other"]).default("Other"),
});

const ForgeWorkOrderUnitSchema = createMongoSchema({
  id: { type: Number, unique: true, index: true },
  workOrderId: { type: Number, required: true },
  unitNumber: { type: Number, required: true },
  unitIdentifier: { type: String, required: true },
  currentStepSequence: { type: Number, default: 0 },
  currentStepName: { type: String },
  status: { type: String, default: "Queued" },
  startedAt: { type: Date },
  completedAt: { type: Date },
  notes: { type: String },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

autoIncrementId(ForgeWorkOrderUnitSchema, "forge_work_order_units");
export const forgeWorkOrderUnitsTable = mongoose.models.ForgeWorkOrderUnit || mongoose.model("ForgeWorkOrderUnit", ForgeWorkOrderUnitSchema);

export const insertForgeWorkOrderUnitSchema = z.object({
  workOrderId: z.coerce.number(),
  unitNumber: z.coerce.number(),
  unitIdentifier: z.string().min(1),
  currentStepSequence: z.coerce.number().default(0),
  currentStepName: z.string().optional(),
  status: z.enum(["Queued", "In Progress", "QC Pending", "QC Passed", "QC Failed", "Rework", "Completed", "Scrapped"]).default("Queued"),
  startedAt: z.union([z.string(), z.date()]).optional().transform((v) => (typeof v === "string" ? new Date(v) : v)),
  completedAt: z.union([z.string(), z.date()]).optional().transform((v) => (typeof v === "string" ? new Date(v) : v)),
  notes: z.string().optional(),
});

const ForgeProductionLogSchema = createMongoSchema({
  id: { type: Number, unique: true, index: true },
  workOrderId: { type: Number, required: true },
  unitId: { type: Number, required: true },
  routingStepId: { type: Number, required: true },
  sequenceNo: { type: Number, required: true },
  workstationId: { type: Number },
  operatorName: { type: String },
  status: { type: String, default: "Pending" },
  startTime: { type: Date },
  endTime: { type: Date },
  actualMinutes: { type: Number },
  setupMinutes: { type: Number, default: 0 },
  qcRequired: { type: Boolean, default: false },
  qcStatus: { type: String, default: "Not Required" },
  qcRecordId: { type: Number },
  notes: { type: String },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

autoIncrementId(ForgeProductionLogSchema, "forge_production_log");
export const forgeProductionLogTable = mongoose.models.ForgeProductionLog || mongoose.model("ForgeProductionLog", ForgeProductionLogSchema);

export const insertForgeProductionLogSchema = z.object({
  workOrderId: z.coerce.number(),
  unitId: z.coerce.number(),
  routingStepId: z.coerce.number(),
  sequenceNo: z.coerce.number(),
  workstationId: z.coerce.number().optional(),
  operatorName: z.string().optional(),
  status: z.enum(["Pending", "In Progress", "Completed", "Skipped"]).default("Pending"),
  startTime: z.union([z.string(), z.date()]).optional().transform((v) => (typeof v === "string" ? new Date(v) : v)),
  endTime: z.union([z.string(), z.date()]).optional().transform((v) => (typeof v === "string" ? new Date(v) : v)),
  actualMinutes: z.coerce.number().optional(),
  setupMinutes: z.coerce.number().default(0),
  qcRequired: z.boolean().default(false),
  qcStatus: z.enum(["Not Required", "Pending", "Passed", "Failed"]).default("Not Required"),
  qcRecordId: z.coerce.number().optional(),
  notes: z.string().optional(),
});

const ForgeMaterialConsumptionSchema = createMongoSchema({
  id: { type: Number, unique: true, index: true },
  workOrderId: { type: Number, required: true },
  itemId: { type: Number, required: true },
  itemName: { type: String, required: true },
  bomEstimatedQty: { type: Number, required: true },
  actualQtyIssued: { type: Number, default: 0 },
  actualQtyConsumed: { type: Number, default: 0 },
  returnedQty: { type: Number, default: 0 },
  uom: { type: String, required: true },
  unitCost: { type: Number, default: 0 },
  totalCost: { type: Number, default: 0 },
  variance: { type: Number, default: 0 },
  variancePercent: { type: Number, default: 0 },
  issuedFromLocationId: { type: Number },
  issuedDate: { type: Date },
  issuedBy: { type: String },
  stockMovementId: { type: Number },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

autoIncrementId(ForgeMaterialConsumptionSchema, "forge_material_consumption");
export const forgeMaterialConsumptionTable = mongoose.models.ForgeMaterialConsumption || mongoose.model("ForgeMaterialConsumption", ForgeMaterialConsumptionSchema);

export const insertForgeMaterialConsumptionSchema = z.object({
  workOrderId: z.coerce.number(),
  itemId: z.coerce.number(),
  itemName: z.string().min(1),
  bomEstimatedQty: z.coerce.number(),
  actualQtyIssued: z.coerce.number().default(0),
  actualQtyConsumed: z.coerce.number().default(0),
  returnedQty: z.coerce.number().default(0),
  uom: z.string().min(1),
  unitCost: z.coerce.number().default(0),
  issuedFromLocationId: z.coerce.number().optional(),
  issuedDate: z.union([z.string(), z.date()]).optional().transform((v) => (typeof v === "string" ? new Date(v) : v)),
  issuedBy: z.string().optional(),
  stockMovementId: z.coerce.number().optional(),
});

export type ForgeWorkstation = mongoose.InferSchemaType<typeof ForgeWorkstationSchema>;
export type ForgeBOM = mongoose.InferSchemaType<typeof ForgeBOMSchema>;
export type ForgeBOMMaterial = mongoose.InferSchemaType<typeof ForgeBOMMaterialSchema>;
export type ForgeBOMRouting = mongoose.InferSchemaType<typeof ForgeBOMRoutingSchema>;
export type ForgeWorkOrder = mongoose.InferSchemaType<typeof ForgeWorkOrderSchema>;
export type ForgeQualityControl = mongoose.InferSchemaType<typeof ForgeQualityControlSchema>;
export type ForgeDowntimeLog = mongoose.InferSchemaType<typeof ForgeDowntimeLogSchema>;
export type ForgeWorkOrderUnit = mongoose.InferSchemaType<typeof ForgeWorkOrderUnitSchema>;
export type ForgeProductionLog = mongoose.InferSchemaType<typeof ForgeProductionLogSchema>;
export type ForgeMaterialConsumption = mongoose.InferSchemaType<typeof ForgeMaterialConsumptionSchema>;
