import { gateWatchlistTable, gateSettingsTable, visitorsTable, employeesTable } from "@workspace/db/schema";

export const getGateDashboard = async () => {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const allToday = await visitorsTable.find({ checkInTime: { $gte: todayStart } }).lean();
  const currentOccupancy = allToday.filter((v) => v.status === "In-Premises").length;
  const totalToday = allToday.length;
  const expectedVIPs = allToday.filter((v) => v.classification === "VIP").length;

  return { currentOccupancy, totalToday, expectedVIPs };
};

export const getGateRollCall = async () => {
  return await visitorsTable.find({ status: "In-Premises" }).sort({ checkInTime: 1 }).lean();
};

export const getGateEmployees = async () => {
  return await employeesTable.find({ status: "Active" }).sort({ name: 1 }).select({ id: 1, name: 1, department: 1 }).lean();
};

export const getGateVisitors = async (query: any) => {
  const filter: any = {};
  if (query.classification && query.classification !== "all") filter.classification = query.classification;
  if (query.status && query.status !== "all") filter.status = query.status;
  if (query.search) {
    const regex = new RegExp(String(query.search).replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
    filter.$or = [{ visitorName: regex }, { phone: regex }, { hostName: regex }];
  }

  return await visitorsTable.find(filter).sort({ checkInTime: -1 }).limit(query.limit ? parseInt(String(query.limit)) : 200).lean();
};

export const getWatchlist = async () => {
  return await gateWatchlistTable.find().sort({ createdAt: -1 }).lean();
};

export const addWatchlistEntry = async (data: any) => {
  const entry = await gateWatchlistTable.create(data);
  return entry.toObject();
};

export const deleteWatchlistEntry = async (id: number) => {
  return await gateWatchlistTable.findOneAndDelete({ id }).lean();
};

export const getGateSettings = async () => {
  const settings = await gateSettingsTable.find().lean();
  const map: Record<string, string> = {};
  settings.forEach((s) => { map[(s as any).settingKey] = (s as any).settingValue; });
  return map;
};

export const updateGateSetting = async (key: string, value: string) => {
  await gateSettingsTable.findOneAndUpdate(
    { settingKey: key },
    { $set: { settingValue: value || "", updatedAt: new Date() } },
    { upsert: true },
  );
  return { success: true };
};
