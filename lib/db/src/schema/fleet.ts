import mongoose from "mongoose";
import { z } from "zod/v4";
import { autoIncrementId, createMongoSchema } from "./mongoUtils.js";

const FleetVehicleSchema = createMongoSchema({
  id: { type: Number, unique: true, index: true },
  regNumber: { type: String, required: true, unique: true },
  type: { type: String, default: "Truck" },
  make: { type: String, default: "" },
  model: { type: String, default: "" },
  status: { type: String, default: "Available" },
  rcExpiry: { type: Date },
  insuranceExpiry: { type: Date },
  createdAt: { type: Date, default: Date.now },
});

autoIncrementId(FleetVehicleSchema, "fleet_vehicles");
export const fleetVehiclesTable = mongoose.models.FleetVehicle || mongoose.model("FleetVehicle", FleetVehicleSchema);

export const insertFleetVehicleSchema = z.object({
  regNumber: z.string().min(1),
  type: z.enum(["Truck", "Van", "Car"]).default("Truck"),
  make: z.string().default("").optional(),
  model: z.string().default("").optional(),
  status: z.enum(["Available", "On Trip", "Maintenance"]).default("Available"),
  rcExpiry: z.union([z.string(), z.date()]).optional().nullable().transform((v) => (typeof v === "string" ? new Date(v) : v)),
  insuranceExpiry: z.union([z.string(), z.date()]).optional().nullable().transform((v) => (typeof v === "string" ? new Date(v) : v)),
});

const FleetTripSchema = createMongoSchema({
  id: { type: Number, unique: true, index: true },
  vehicleId: { type: Number },
  vehicleReg: { type: String, required: true },
  driverName: { type: String, required: true },
  origin: { type: String, required: true },
  destination: { type: String, required: true },
  startTime: { type: Date, required: true },
  endTime: { type: Date },
  status: { type: String, default: "Scheduled" },
  notes: { type: String, default: "" },
  createdAt: { type: Date, default: Date.now },
});

autoIncrementId(FleetTripSchema, "fleet_trips");
export const fleetTripsTable = mongoose.models.FleetTrip || mongoose.model("FleetTrip", FleetTripSchema);

export const insertFleetTripSchema = z.object({
  vehicleId: z.coerce.number().optional(),
  vehicleReg: z.string().min(1),
  driverName: z.string().min(1),
  origin: z.string().min(1),
  destination: z.string().min(1),
  startTime: z.union([z.string(), z.date()]).transform((v) => typeof v === "string" ? new Date(v) : v),
  endTime: z.union([z.string(), z.date()]).optional().nullable().transform((v) => (typeof v === "string" ? new Date(v) : v)),
  status: z.enum(["Scheduled", "In Transit", "Completed"]).default("Scheduled"),
  notes: z.string().default("").optional(),
});

const FleetExpenseSchema = createMongoSchema({
  id: { type: Number, unique: true, index: true },
  vehicleId: { type: Number },
  vehicleReg: { type: String, required: true },
  expenseDate: { type: Date, required: true },
  expenseType: { type: String, default: "Fuel" },
  amount: { type: Number, default: 0 },
  description: { type: String, default: "" },
  loggedBy: { type: String, default: "" },
  paidBy: { type: String, default: "Company" },
  isClaimed: { type: Boolean, default: false },
  trailClaimId: { type: Number },
  reimbursementStatus: { type: String, default: "Not Applicable" },
  createdAt: { type: Date, default: Date.now },
});

autoIncrementId(FleetExpenseSchema, "fleet_expenses");
export const fleetExpensesTable = mongoose.models.FleetExpense || mongoose.model("FleetExpense", FleetExpenseSchema);

export const insertFleetExpenseSchema = z.object({
  vehicleId: z.coerce.number().optional(),
  vehicleReg: z.string().min(1),
  expenseDate: z.union([z.string(), z.date()]).transform((v) => typeof v === "string" ? new Date(v) : v),
  expenseType: z.enum(["Fuel", "Repair", "Servicing"]).default("Fuel"),
  amount: z.coerce.number().default(0),
  description: z.string().default("").optional(),
  loggedBy: z.string().default("").optional(),
  paidBy: z.enum(["Company", "Employee"]).default("Company"),
});

export type FleetVehicle = mongoose.InferSchemaType<typeof FleetVehicleSchema>;
export type FleetTrip = mongoose.InferSchemaType<typeof FleetTripSchema>;
export type FleetExpense = mongoose.InferSchemaType<typeof FleetExpenseSchema>;
