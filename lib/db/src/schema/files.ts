import { pgTable, serial, varchar, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const filesTable = pgTable("files", {
  id: serial("id").primaryKey(),
  fileName: varchar("file_name", { length: 500 }).notNull(),
  folder: varchar("folder", { length: 200 }).notNull(),
  size: varchar("size", { length: 50 }).notNull(),
  uploadedBy: varchar("uploaded_by", { length: 300 }).notNull(),
  uploadDate: timestamp("upload_date").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertFileSchema = createInsertSchema(filesTable).omit({
  id: true,
  createdAt: true,
}).extend({
  uploadDate: z.union([z.string(), z.date()]).transform((v) => typeof v === "string" ? new Date(v) : v),
});

export type InsertFile = z.infer<typeof insertFileSchema>;
export type FileRecord = typeof filesTable.$inferSelect;
