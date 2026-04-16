import mongoose from "mongoose";
import { z } from "zod/v4";
import { autoIncrementId, createMongoSchema } from "./mongoUtils.js";

const PurchaseOrderSchema = createMongoSchema({
  id: { type: Number, unique: true, index: true },
  vendorName: { type: String, required: true },
  poNumber: { type: String, required: true, unique: true },
  totalAmount: { type: Number, default: 0 },
  status: { type: String, default: "Draft" },
  orderDate: { type: Date, required: true },
  createdAt: { type: Date, default: Date.now },
});

autoIncrementId(PurchaseOrderSchema, "purchase_orders");
export const purchaseOrdersTable = mongoose.models.PurchaseOrder || mongoose.model("PurchaseOrder", PurchaseOrderSchema);

export const insertPurchaseOrderSchema = z.object({
  vendorName: z.string().min(1),
  poNumber: z.string().min(1),
  totalAmount: z.coerce.number().default(0),
  status: z.enum(["Draft", "Pending", "Approved", "Received"]).default("Draft"),
  orderDate: z.union([z.string(), z.date()]).transform((v) => typeof v === "string" ? new Date(v) : v),
});

export type InsertPurchaseOrder = z.infer<typeof insertPurchaseOrderSchema>;
export type PurchaseOrder = mongoose.InferSchemaType<typeof PurchaseOrderSchema>;
