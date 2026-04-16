import { filesTable } from "@workspace/db/schema";

export const getFiles = async () => {
  return await filesTable.find().sort({ uploadDate: -1 }).lean();
};

export const createFile = async (data: any) => {
  const file = await filesTable.create(data);
  return file.toObject();
};
