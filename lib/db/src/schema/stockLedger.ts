import mongoose from "mongoose";
import { autoIncrementId, createMongoSchema } from "./mongoUtils.js";

const StockLedgerSchema = createMongoSchema({
  id: { type: Number, unique: true, index: true },
  itemId: { type: Number, required: true },
  locationId: { type: Number, required: true },
  quantity: { type: Number, default: 0 },
  updatedAt: { type: Date, default: Date.now },
});

autoIncrementId(StockLedgerSchema, "stock_ledger");
export const stockLedgerTable = mongoose.models.StockLedger || mongoose.model("StockLedger", StockLedgerSchema);

export type StockLedger = mongoose.InferSchemaType<typeof StockLedgerSchema>;
