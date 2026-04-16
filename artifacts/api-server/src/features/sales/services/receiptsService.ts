import { insertReceiptSchema, receiptsTable } from "@workspace/db/schema";

export const getReceipts = async () => {
  return await receiptsTable.find().sort({ createdAt: -1 }).lean();
};

export const createReceipt = async (data: any) => {
  const receipt = await receiptsTable.create(data);
  return receipt.toObject();
};

export const deleteReceipt = async (id: number) => {
  return await receiptsTable.findOneAndDelete({ id }).lean();
};
