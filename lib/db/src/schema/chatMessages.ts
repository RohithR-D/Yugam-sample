import mongoose from "mongoose";
import { z } from "zod/v4";
import { autoIncrementId, createMongoSchema } from "./mongoUtils.js";

const ChatMessageSchema = createMongoSchema({
  id: { type: Number, unique: true, index: true },
  threadType: { type: String, default: "Internal" },
  employeeId: { type: Number },
  senderName: { type: String, default: "" },
  messageBody: { type: String, default: "" },
  timestamp: { type: Date, default: Date.now },
});

autoIncrementId(ChatMessageSchema, "chat_messages");
export const chatMessagesTable = mongoose.models.ChatMessage || mongoose.model("ChatMessage", ChatMessageSchema);

export const insertChatMessageSchema = z.object({
  threadType: z.enum(["Internal", "Client", "Supplier"]).default("Internal"),
  employeeId: z.coerce.number().optional(),
  senderName: z.string().default("").optional(),
  messageBody: z.string().default("").optional(),
  timestamp: z.union([z.string(), z.date()]).optional().transform((v) => (typeof v === "string" ? new Date(v) : v)),
});

export type InsertChatMessage = z.infer<typeof insertChatMessageSchema>;
export type ChatMessage = mongoose.InferSchemaType<typeof ChatMessageSchema>;
