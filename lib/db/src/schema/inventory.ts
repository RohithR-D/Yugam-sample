import mongoose from "mongoose";
import { z } from "zod/v4";
import { autoIncrementId, createMongoSchema } from "./mongoUtils.js";

const InventorySchema = createMongoSchema({
  id: { type: Number, unique: true, index: true },
  itemName: { type: String, required: true },
  sku: { type: String, required: true, unique: true },
  category: { type: String, required: true },
  quantity: { type: Number, default: 0 },
  unitPrice: { type: Number, default: 0 },
  status: { type: String, default: "In Stock" },
  createdAt: { type: Date, default: Date.now },
});

autoIncrementId(InventorySchema, "inventory");
export const inventoryTable = mongoose.models.Inventory || mongoose.model("Inventory", InventorySchema);

export const insertInventorySchema = z.object({
  itemName: z.string().min(1),
  sku: z.string().min(1),
  category: z.string().min(1),
  quantity: z.coerce.number().default(0),
  unitPrice: z.coerce.number().default(0),
  status: z.enum(["In Stock", "Low Stock", "Out of Stock"]).default("In Stock"),
});

export type InsertInventory = z.infer<typeof insertInventorySchema>;
export type Inventory = mongoose.InferSchemaType<typeof InventorySchema>;
