import mongoose from "mongoose";
import { z } from "zod/v4";
import { autoIncrementId, createMongoSchema } from "./mongoUtils.js";

const TrailClaimSchema = createMongoSchema({
  id: { type: Number, unique: true, index: true },
  claimId: { type: String, default: "" },
  employeeName: { type: String, required: true },
  date: { type: Date, required: true },
  category: { type: String, default: "Travel" },
  claimType: { type: String, default: "Standard Receipt" },
  amount: { type: Number, default: 0 },
  status: { type: String, default: "Pending" },
  description: { type: String, default: "" },
  distance: { type: Number },
  ratePerKm: { type: Number },
  numDays: { type: Number },
  dailyRate: { type: Number },
  ledgerJournalId: { type: Number },
  createdAt: { type: Date, default: Date.now },
});

autoIncrementId(TrailClaimSchema, "trail_claims");
export const trailClaimsTable = mongoose.models.TrailClaim || mongoose.model("TrailClaim", TrailClaimSchema);

export const insertTrailClaimSchema = z.object({
  employeeName: z.string().min(1),
  date: z.union([z.string(), z.date()]).transform((v) => typeof v === "string" ? new Date(v) : v),
  category: z.enum(["Travel", "Fuel", "Meals", "Misc", "Transport"]),
  claimType: z.enum(["Standard Receipt", "Mileage/Fuel Claim", "Per Diem"]),
  amount: z.coerce.number().default(0),
  status: z.enum(["Pending", "Approved", "Rejected", "Paid"]).default("Pending"),
  description: z.string().default("").optional(),
  distance: z.coerce.number().optional().nullable(),
  ratePerKm: z.coerce.number().optional().nullable(),
  numDays: z.coerce.number().optional().nullable(),
  dailyRate: z.coerce.number().optional().nullable(),
});

const PettyCashSchema = createMongoSchema({
  id: { type: Number, unique: true, index: true },
  date: { type: Date, required: true },
  description: { type: String, required: true },
  cashIn: { type: Number, default: 0 },
  cashOut: { type: Number, default: 0 },
  runningBalance: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
});

autoIncrementId(PettyCashSchema, "petty_cash");
export const pettyCashTable = mongoose.models.PettyCash || mongoose.model("PettyCash", PettyCashSchema);

export const insertPettyCashSchema = z.object({
  date: z.union([z.string(), z.date()]).transform((v) => typeof v === "string" ? new Date(v) : v),
  description: z.string().min(1),
  cashIn: z.coerce.number().default(0),
  cashOut: z.coerce.number().default(0),
});

export type TrailClaim = mongoose.InferSchemaType<typeof TrailClaimSchema>;
export type PettyCash = mongoose.InferSchemaType<typeof PettyCashSchema>;
