import { pgTable, serial, integer, text, timestamp, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const chatMessagesTable = pgTable("chat_messages", {
  id: serial("id").primaryKey(),
  threadType: varchar("thread_type", { length: 30 }).notNull().default("Internal"),
  employeeId: integer("employee_id"),
  senderName: varchar("sender_name", { length: 255 }).notNull().default(""),
  messageBody: text("message_body").notNull().default(""),
  timestamp: timestamp("timestamp").defaultNow(),
});

export const insertChatMessageSchema = createInsertSchema(chatMessagesTable).omit({
  id: true,
}).extend({
  threadType: z.enum(["Internal", "Client", "Supplier"]).default("Internal"),
  timestamp: z.union([z.string(), z.date()]).optional().transform((v) => (typeof v === "string" ? new Date(v) : v)),
});

export type InsertChatMessage = z.infer<typeof insertChatMessageSchema>;
export type ChatMessage = typeof chatMessagesTable.$inferSelect;
