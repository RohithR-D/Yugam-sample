import { pgTable, serial, varchar, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { clientsTable } from "./clients";

export const contactsTable = pgTable("contacts", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull(),
  phone: varchar("phone", { length: 50 }).notNull().default(""),
  contactType: varchar("contact_type", { length: 50 }).notNull().default("Client Employee"),
  clientId: integer("client_id").references(() => clientsTable.id),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertContactSchema = createInsertSchema(contactsTable).omit({
  id: true,
  createdAt: true,
}).extend({
  contactType: z.enum(["Client Employee", "Vendor", "Agent"]).default("Client Employee"),
  clientId: z.number().nullable().optional(),
});

export type InsertContact = z.infer<typeof insertContactSchema>;
export type Contact = typeof contactsTable.$inferSelect;
