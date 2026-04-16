import { shipmentsTable } from "@workspace/db/schema";

export const getShipments = async () => {
  return await shipmentsTable.find().sort({ createdAt: -1 }).lean();
};

export const createShipment = async (data: any) => {
  const shipment = await shipmentsTable.create(data);
  return shipment.toObject();
};
