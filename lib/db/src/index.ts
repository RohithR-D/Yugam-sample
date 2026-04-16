import mongoose from "mongoose";
import { connectMongoDB } from "./connectMongoDB";
import { runMongoTransaction } from "./transaction";
import * as schema from "./schema/index.js";

export const db = mongoose.connection;
export const mongooseInstance = mongoose;
export const connectDB = connectMongoDB;

export * from "./schema/index.js";
export { connectMongoDB, runMongoTransaction };
export type MongoConnection = typeof mongoose.connection;
