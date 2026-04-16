import mongoose from "mongoose";
import { z } from "zod/v4";
import { autoIncrementId, createMongoSchema } from "./mongoUtils.js";

const VisitorSchema = createMongoSchema({
  id: { type: Number, unique: true, index: true },
  visitorName: { type: String, required: true },
  phone: { type: String, default: "" },
  photoUrl: { type: String, default: "" },
  hostEmployeeId: { type: Number },
  hostName: { type: String, required: true },
  purpose: { type: String, default: "Meeting" },
  ticketRef: { type: String, default: "" },
  classification: { type: String, default: "Standard" },
  status: { type: String, default: "In-Premises" },
  checkInTime: { type: Date, required: true },
  checkOutTime: { type: Date },
  createdAt: { type: Date, default: Date.now },
});

autoIncrementId(VisitorSchema, "visitors");
export const visitorsTable = mongoose.models.Visitor || mongoose.model("Visitor", VisitorSchema);

export const insertVisitorSchema = z.object({
  visitorName: z.string().min(1),
  phone: z.string().default("").optional(),
  photoUrl: z.string().default("").optional(),
  hostEmployeeId: z.coerce.number().optional(),
  hostName: z.string().min(1),
  purpose: z.enum(["Meeting", "Interview", "Delivery", "Maintenance"]).default("Meeting"),
  ticketRef: z.string().default("").optional(),
  classification: z.enum(["Standard", "VIP", "Blacklist"]).default("Standard"),
  status: z.enum(["In-Premises", "Checked-Out"]).default("In-Premises"),
  checkInTime: z.union([z.string(), z.date()]).transform((v) => typeof v === "string" ? new Date(v) : v),
  checkOutTime: z.union([z.string(), z.date()]).optional().nullable().transform((v) => v != null && typeof v === "string" ? new Date(v) : v),
});

const GateWatchlistSchema = createMongoSchema({
  id: { type: Number, unique: true, index: true },
  name: { type: String, required: true },
  phone: { type: String, default: "" },
  classification: { type: String, default: "Blacklist" },
  reason: { type: String, default: "" },
  createdAt: { type: Date, default: Date.now },
});

autoIncrementId(GateWatchlistSchema, "gate_watchlist");
export const gateWatchlistTable = mongoose.models.GateWatchlist || mongoose.model("GateWatchlist", GateWatchlistSchema);

export const insertWatchlistSchema = z.object({
  name: z.string().min(1),
  phone: z.string().default("").optional(),
  classification: z.enum(["VIP", "Blacklist"]).default("Blacklist"),
  reason: z.string().default("").optional(),
});

const GateSettingSchema = createMongoSchema({
  id: { type: Number, unique: true, index: true },
  settingKey: { type: String, required: true, unique: true },
  settingValue: { type: String, default: "" },
  updatedAt: { type: Date, default: Date.now },
});

autoIncrementId(GateSettingSchema, "gate_settings");
export const gateSettingsTable = mongoose.models.GateSetting || mongoose.model("GateSetting", GateSettingSchema);

export type InsertVisitor = z.infer<typeof insertVisitorSchema>;
export type Visitor = mongoose.InferSchemaType<typeof VisitorSchema>;
export type GateWatchlist = mongoose.InferSchemaType<typeof GateWatchlistSchema>;
export type GateSetting = mongoose.InferSchemaType<typeof GateSettingSchema>;
