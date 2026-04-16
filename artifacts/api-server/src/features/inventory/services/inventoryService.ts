import { inventoryTable } from "@workspace/db/schema";

export const getInventoryItems = async () => {
  return await inventoryTable.find().sort({ createdAt: -1 }).lean();
};

export const createInventoryItem = async (data: any) => {
  const item = await inventoryTable.create(data);
  return item.toObject();
};
