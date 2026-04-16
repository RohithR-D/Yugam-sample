
import mongoose from "mongoose";
import { z } from "zod";
import { autoIncrementId, createMongoSchema } from "./mongoUtils.js";

const AssetSchema = createMongoSchema({
  id: { type: Number, unique: true, index: true },
  assetName: { type: String, required: true },
  serialNumber: { type: String, default: "" },
  category: { type: String, default: "Equipment" },
  status: { type: String, default: "Active" },
  assignedTo: { type: String, default: "" },
  purchaseValue: { type: Number, default: 0 },
  purchaseDate: { type: Date },
  maintenanceNotes: { type: String, default: "" },
  createdAt: { type: Date, default: Date.now },
});

autoIncrementId(AssetSchema, "assets");
export const assetsTable = mongoose.models.Asset || mongoose.model("Asset", AssetSchema);

export const insertAssetSchema = z.object({
  assetName: z.string().min(1),
  serialNumber: z.string().default("").optional(),
  category: z.string().default("Equipment").optional(),
  status: z.enum(["Active", "Allocated", "Maintenance", "Sold"]).default("Active"),
  assignedTo: z.string().default("").optional(),
  purchaseValue: z.coerce.number().default(0),
  purchaseDate: z.union([z.string(), z.date()]).optional().nullable().transform((v: unknown) => (typeof v === "string" ? new Date(v) : v)),
  maintenanceNotes: z.string().default("").optional(),
});

export type InsertAsset = z.infer<typeof insertAssetSchema>;
export type Asset = mongoose.InferSchemaType<typeof AssetSchema>;
