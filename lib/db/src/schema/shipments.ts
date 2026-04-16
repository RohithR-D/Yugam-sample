import mongoose from "mongoose";
import { z } from "zod/v4";
import { autoIncrementId, createMongoSchema } from "./mongoUtils.js";

const ShipmentSchema = createMongoSchema({
  id: { type: Number, unique: true, index: true },
  trackingNumber: { type: String, required: true, unique: true },
  destination: { type: String, required: true },
  carrier: { type: String, required: true },
  status: { type: String, default: "Pending" },
  dispatchDate: { type: Date, required: true },
  createdAt: { type: Date, default: Date.now },
});

autoIncrementId(ShipmentSchema, "shipments");
export const shipmentsTable = mongoose.models.Shipment || mongoose.model("Shipment", ShipmentSchema);

export const insertShipmentSchema = z.object({
  trackingNumber: z.string().min(1),
  destination: z.string().min(1),
  carrier: z.string().min(1),
  status: z.enum(["Pending", "In Transit", "Delivered", "Delayed"]).default("Pending"),
  dispatchDate: z.union([z.string(), z.date()]).transform((v) => typeof v === "string" ? new Date(v) : v),
});

export type InsertShipment = z.infer<typeof insertShipmentSchema>;
export type Shipment = mongoose.InferSchemaType<typeof ShipmentSchema>;
