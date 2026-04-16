import mongoose from "mongoose";
import { z } from "zod/v4";
import { autoIncrementId, createMongoSchema } from "./mongoUtils.js";
import { clientsTable } from "./clients.js";

const ClientActivitySchema = createMongoSchema({
  id: { type: Number, unique: true, index: true },
  clientId: { type: Number, ref: "Client", required: true },
  activityType: { type: String, required: true },
  notes: { type: String, default: "" },
  createdAt: { type: Date, default: Date.now },
});

autoIncrementId(ClientActivitySchema, "client_activities");

export const clientActivitiesTable = mongoose.models.ClientActivity || mongoose.model("ClientActivity", ClientActivitySchema);

export const insertClientActivitySchema = z.object({
  clientId: z.coerce.number(),
  activityType: z.enum(["Call", "Email", "Meeting", "Note"]),
  notes: z.string().default(""),
});

export type InsertClientActivity = z.infer<typeof insertClientActivitySchema>;
export type ClientActivity = mongoose.InferSchemaType<typeof ClientActivitySchema>;
