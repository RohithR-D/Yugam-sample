import mongoose from "mongoose";
import { usersTable } from "./schema/index.js";

const MONGO_URL = process.env.MONGO_URL || "mongodb://127.0.0.1:27017,127.0.0.1:27018,127.0.0.1:27019/yugam?replicaSet=rs0";

if (!MONGO_URL) {
  throw new Error("MONGO_URL environment variable is required for MongoDB connection.");
}

const autoIndex = process.env.MONGO_AUTO_INDEX === "true";

const ADMIN_EMAIL = "admin@yugam.com";
const ADMIN_USER = {
  name: "Admin",
  email: ADMIN_EMAIL,
  role: "Admin",
  department: "IT",
  passwordHash: "$2b$10$XQIa/.Uzs7v5Zd7T9K01b.qMLdWBBScfknPTjv.O5inen6LO2DvFq",
};

const seedAdminUser = async () => {
  await usersTable.updateOne(
    { email: ADMIN_EMAIL },
    { $setOnInsert: ADMIN_USER },
    { upsert: true },
  );
};

export const connectMongoDB = async () => {
  try {
    await mongoose.connect(MONGO_URL, {
      dbName: process.env.MONGO_DB_NAME || "yugam",
      autoIndex,
      retryWrites: true,
      readConcern: { level: "majority" },
      writeConcern: { w: "majority" },
    });
    await seedAdminUser();
    console.log(`Connected to MongoDB (autoIndex=${autoIndex})`);
  } catch (error) {
    console.error("MongoDB connection error:", error);
    throw error;
  }
};

export default connectMongoDB;
