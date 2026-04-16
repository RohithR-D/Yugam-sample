import mongoose from "mongoose";
import { getNextSequence } from "../sequence.js";

export const autoIncrementId = (schema: mongoose.Schema, sequenceName: string) => {
  schema.pre("save", async function () {
    if (this.isNew && this.id == null) {
      this.id = await getNextSequence(sequenceName);
    }
  });
};

export const createMongoSchema = (
  definition: mongoose.SchemaDefinition,
  options: mongoose.SchemaOptions = {},
) => new mongoose.Schema(definition, { ...options, timestamps: false });
