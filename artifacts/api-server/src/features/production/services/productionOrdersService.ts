import { productionOrdersTable } from "@workspace/db/schema";

export const getProductionOrders = async () => {
  return await productionOrdersTable.find().sort({ createdAt: -1 }).lean();
};

export const createProductionOrder = async (data: any) => {
  const order = await productionOrdersTable.create(data);
  return order.toObject();
};
