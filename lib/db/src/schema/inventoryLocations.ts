import mongoose from "mongoose";
import { z } from "zod/v4";
import { autoIncrementId, createMongoSchema } from "./mongoUtils.js";

const InventoryLocationSchema = createMongoSchema({
  id: { type: Number, unique: true, index: true },
  locationName: { type: String, required: true },
  locationType: { type: String, default: "Warehouse" },
  capacity: { type: Number, default: 0 },
  manager: { type: String, default: "" },
  address: { type: String, default: "" },
  createdAt: { type: Date, default: Date.now },
});

autoIncrementId(InventoryLocationSchema, "inventory_locations");
export const inventoryLocationsTable = mongoose.models.InventoryLocation || mongoose.model("InventoryLocation", InventoryLocationSchema);

export const insertInventoryLocationSchema = z.object({
  locationName: z.string().min(1),
  locationType: z.enum(["Warehouse", "Store"]).default("Warehouse"),
  capacity: z.coerce.number().default(0),
  manager: z.string().default("").optional(),
  address: z.string().default("").optional(),
});

export type InsertInventoryLocation = z.infer<typeof insertInventoryLocationSchema>;
export type InventoryLocation = mongoose.InferSchemaType<typeof InventoryLocationSchema>;
