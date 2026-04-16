import { visitorsTable } from "@workspace/db/schema";

export const getVisitors = async () => {
  return await visitorsTable.find().sort({ checkInTime: -1 }).lean();
};

export const createVisitor = async (data: any) => {
  const visitor = await visitorsTable.create(data);
  return visitor.toObject();
};
