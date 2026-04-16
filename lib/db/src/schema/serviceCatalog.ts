import mongoose from "mongoose";
import { z } from "zod/v4";
import { autoIncrementId, createMongoSchema } from "./mongoUtils.js";

const ServiceCatalogSchema = createMongoSchema({
  id: { type: Number, unique: true, index: true },
  category: { type: String, default: "General" },
  itemCode: { type: String, default: "" },
  templateName: { type: String, required: true },
  description: { type: String, default: "" },
  uom: { type: String, default: "Nos" },
  tags: { type: String, default: "" },
  baseHours: { type: String, default: "0" },
  baseRate: { type: String, default: "0" },
  createdAt: { type: Date, default: Date.now },
});

autoIncrementId(ServiceCatalogSchema, "service_catalog");
export const serviceCatalogTable = mongoose.models.ServiceCatalog || mongoose.model("ServiceCatalog", ServiceCatalogSchema);

export const insertServiceCatalogSchema = z.object({
  category: z.string().default("General").optional(),
  itemCode: z.string().default("").optional(),
  templateName: z.string().min(1),
  description: z.string().default("").optional(),
  uom: z.string().default("Nos").optional(),
  tags: z.string().default("").optional(),
  baseHours: z.string().default("0").optional(),
  baseRate: z.string().default("0").optional(),
});

export type InsertServiceCatalog = z.infer<typeof insertServiceCatalogSchema>;
export type ServiceCatalog = mongoose.InferSchemaType<typeof ServiceCatalogSchema>;
