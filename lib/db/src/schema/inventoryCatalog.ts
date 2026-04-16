
import mongoose from "mongoose";
import { z } from "zod";
import { autoIncrementId, createMongoSchema } from "./mongoUtils.js";

const InventoryCatalogSchema = createMongoSchema({
  id: { type: Number, unique: true, index: true },
  name: { type: String, required: true },
  sku: { type: String, default: "" },
  category: { type: String, default: "General" },
  itemType: { type: String, default: "Raw Material" },
  hsnSac: { type: String, default: "" },
  unitPrice: { type: Number, default: 0 },
  uom: { type: String, default: "Nos" },
  globalStock: { type: Number, default: 0 },
  reorderLevel: { type: Number, default: 10 },
  createdAt: { type: Date, default: Date.now },
});

autoIncrementId(InventoryCatalogSchema, "inventory_catalog");
export const inventoryCatalogTable = mongoose.models.InventoryCatalog || mongoose.model("InventoryCatalog", InventoryCatalogSchema);

export const insertInventoryCatalogSchema = z.object({
  name: z.string().min(1),
  sku: z.string().default("").optional(),
  category: z.string().default("General").optional(),
  itemType: z.enum(["Raw Material", "Finished Product"]).default("Raw Material"),
  hsnSac: z.string().default("").optional(),
  unitPrice: z.coerce.number().default(0),
  uom: z.string().default("Nos").optional(),
  globalStock: z.coerce.number().default(0),
  reorderLevel: z.coerce.number().default(10),
});

export type InsertInventoryCatalog = z.infer<typeof insertInventoryCatalogSchema>;
export type InventoryCatalog = mongoose.InferSchemaType<typeof InventoryCatalogSchema>;
