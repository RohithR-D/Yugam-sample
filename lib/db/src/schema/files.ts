import mongoose from "mongoose";
import { z } from "zod/v4";
import { autoIncrementId, createMongoSchema } from "./mongoUtils.js";

const FileSchema = createMongoSchema({
  id: { type: Number, unique: true, index: true },
  fileName: { type: String, required: true },
  folder: { type: String, required: true },
  size: { type: String, required: true },
  uploadedBy: { type: String, required: true },
  uploadDate: { type: Date, required: true },
  createdAt: { type: Date, default: Date.now },
});

autoIncrementId(FileSchema, "files");
export const filesTable = mongoose.models.File || mongoose.model("File", FileSchema);

export const insertFileSchema = z.object({
  fileName: z.string().min(1),
  folder: z.string().min(1),
  size: z.string().min(1),
  uploadedBy: z.string().min(1),
  uploadDate: z.union([z.string(), z.date()]).transform((v) => typeof v === "string" ? new Date(v) : v),
});

export type InsertFile = z.infer<typeof insertFileSchema>;
export type FileRecord = mongoose.InferSchemaType<typeof FileSchema>;
