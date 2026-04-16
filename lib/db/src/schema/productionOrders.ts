import mongoose from "mongoose";
import { z } from "zod/v4";
import { autoIncrementId, createMongoSchema } from "./mongoUtils.js";

const ProductionOrderSchema = createMongoSchema({
  id: { type: Number, unique: true, index: true },
  workOrderNumber: { type: String, required: true, unique: true },
  productName: { type: String, required: true },
  quantity: { type: Number, default: 0 },
  status: { type: String, default: "Planned" },
  startDate: { type: Date, required: true },
  createdAt: { type: Date, default: Date.now },
});

autoIncrementId(ProductionOrderSchema, "production_orders");
export const productionOrdersTable = mongoose.models.ProductionOrder || mongoose.model("ProductionOrder", ProductionOrderSchema);

export const insertProductionOrderSchema = z.object({
  workOrderNumber: z.string().min(1),
  productName: z.string().min(1),
  quantity: z.coerce.number().default(0),
  status: z.enum(["Planned", "In Progress", "Completed", "Halted"]).default("Planned"),
  startDate: z.union([z.string(), z.date()]).transform((v) => typeof v === "string" ? new Date(v) : v),
});

export type InsertProductionOrder = z.infer<typeof insertProductionOrderSchema>;
export type ProductionOrder = mongoose.InferSchemaType<typeof ProductionOrderSchema>;
