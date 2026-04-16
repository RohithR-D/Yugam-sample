import mongoose from "mongoose";
import { z } from "zod/v4";
import { autoIncrementId, createMongoSchema } from "./mongoUtils.js";
import { clientsTable } from "./clients.js";

const ContactSchema = createMongoSchema({
  id: { type: Number, unique: true, index: true },
  name: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String, default: "" },
  contactType: { type: String, default: "Client Employee" },
  clientId: { type: Number, ref: "Client", required: false },
  createdAt: { type: Date, default: Date.now },
});

autoIncrementId(ContactSchema, "contacts");

export const contactsTable = mongoose.models.Contact || mongoose.model("Contact", ContactSchema);

export const insertContactSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  phone: z.string().default(""),
  contactType: z.enum(["Client Employee", "Vendor", "Agent"]).default("Client Employee"),
  clientId: z.coerce.number().nullable().optional(),
});

export type InsertContact = z.infer<typeof insertContactSchema>;
export type Contact = mongoose.InferSchemaType<typeof ContactSchema>;
