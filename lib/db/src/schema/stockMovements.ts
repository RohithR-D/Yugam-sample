import mongoose from "mongoose";
import { z } from "zod/v4";
import { autoIncrementId, createMongoSchema } from "./mongoUtils.js";

const StockMovementSchema = createMongoSchema({
  id: { type: Number, unique: true, index: true },
  itemId: { type: Number, required: true },
  movementType: { type: String, default: "Inward" },
  quantity: { type: Number, default: 0 },
  fromLocationId: { type: Number },
  toLocationId: { type: Number },
  referenceNumber: { type: String, default: "" },
  notes: { type: String, default: "" },
  performedBy: { type: String, default: "" },
  movementDate: { type: Date, default: Date.now },
  createdAt: { type: Date, default: Date.now },
});

autoIncrementId(StockMovementSchema, "stock_movements");
export const stockMovementsTable = mongoose.models.StockMovement || mongoose.model("StockMovement", StockMovementSchema);

export const insertStockMovementSchema = z.object({
  itemId: z.coerce.number(),
  movementType: z.enum(["Inward", "Outward", "Transfer", "Adjustment"]).default("Inward"),
  quantity: z.coerce.number().default(0),
  fromLocationId: z.coerce.number().optional(),
  toLocationId: z.coerce.number().optional(),
  referenceNumber: z.string().default("").optional(),
  notes: z.string().default("").optional(),
  performedBy: z.string().default("").optional(),
  movementDate: z.union([z.string(), z.date()]).optional().transform((v) => (typeof v === "string" ? new Date(v) : v)),
});

export type InsertStockMovement = z.infer<typeof insertStockMovementSchema>;
export type StockMovement = mongoose.InferSchemaType<typeof StockMovementSchema>;
