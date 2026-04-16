import { reportsTable } from "@workspace/db/schema";

export const getReports = async () => {
  return await reportsTable.find().sort({ lastRun: -1 }).lean();
};

export const createReport = async (data: any) => {
  const report = await reportsTable.create(data);
  return report.toObject();
};
