import mongoose from "mongoose";
import { z } from "zod/v4";
import { autoIncrementId, createMongoSchema } from "./mongoUtils.js";

const UserSchema = createMongoSchema({
  id: { type: Number, unique: true, index: true },
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  passwordHash: { type: String },
  role: { type: String, default: "Employee" },
  department: { type: String },
  lastLogin: { type: Date, default: Date.now },
  createdAt: { type: Date, default: Date.now },
});

autoIncrementId(UserSchema, "users");

export const usersTable = mongoose.models.User || mongoose.model("User", UserSchema);

export const insertUserSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  role: z.enum(["Employee", "Admin", "Manager"]).default("Employee"),
  department: z.string().optional(),
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = mongoose.InferSchemaType<typeof UserSchema>;
