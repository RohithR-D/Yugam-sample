import mongoose from "mongoose";
import { z } from "zod/v4";
import { autoIncrementId, createMongoSchema } from "./mongoUtils.js";

const CommunicationSchema = createMongoSchema({
  id: { type: Number, unique: true, index: true },
  recipientName: { type: String, required: true },
  subject: { type: String, required: true },
  type: { type: String, default: "Email" },
  status: { type: String, default: "Sent" },
  sentAt: { type: Date, default: Date.now },
  createdAt: { type: Date, default: Date.now },
});

autoIncrementId(CommunicationSchema, "communications");
export const communicationsTable = mongoose.models.Communication || mongoose.model("Communication", CommunicationSchema);

export const insertCommunicationSchema = z.object({
  recipientName: z.string().min(1),
  subject: z.string().min(1),
  type: z.enum(["Email", "SMS", "Call"]).default("Email"),
  status: z.enum(["Sent", "Delivered", "Failed"]).default("Sent"),
  sentAt: z.union([z.string(), z.date()]).optional().transform((v) => (typeof v === "string" ? new Date(v) : v)),
});

export type InsertCommunication = z.infer<typeof insertCommunicationSchema>;
export type Communication = mongoose.InferSchemaType<typeof CommunicationSchema>;
