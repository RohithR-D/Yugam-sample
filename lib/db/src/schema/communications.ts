import { pgTable, serial, varchar, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const communicationsTable = pgTable("communications", {
  id: serial("id").primaryKey(),
  recipientName: varchar("recipient_name", { length: 255 }).notNull(),
  subject: varchar("subject", { length: 500 }).notNull(),
  type: varchar("type", { length: 50 }).notNull().default("Email"),
  status: varchar("status", { length: 50 }).notNull().default("Sent"),
  sentAt: timestamp("sent_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertCommunicationSchema = createInsertSchema(communicationsTable).omit({
  id: true,
  createdAt: true,
}).extend({
  type: z.enum(["Email", "SMS", "Call"]),
  status: z.enum(["Sent", "Delivered", "Failed"]),
  sentAt: z.union([z.string(), z.date()]).optional().transform((v) => (typeof v === "string" ? new Date(v) : v)),
});

export type InsertCommunication = z.infer<typeof insertCommunicationSchema>;
export type Communication = typeof communicationsTable.$inferSelect;
