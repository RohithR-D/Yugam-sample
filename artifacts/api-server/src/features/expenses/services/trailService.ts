import { onTrailClaimApproved } from "../../finance/routes/crossModuleAutomation";
import { trailClaimsTable, pettyCashTable } from "@workspace/db/schema";

export const getTrailClaims = async (employee?: string) => {
  const filter: any = {};
  if (employee) filter.employeeName = employee;
  return await trailClaimsTable.find(filter).sort({ date: -1 }).lean();
};

export const createTrailClaim = async (data: any) => {
  const count = await trailClaimsTable.countDocuments();
  const claimId = `CLM-${String(count + 1).padStart(4, "0")}`;
  const claim = await trailClaimsTable.create({ ...data, claimId });
  return claim.toObject();
};

export const updateTrailClaimStatus = async (id: number, status: string) => {
  const claim = await trailClaimsTable.findOne({ id }).lean();
  if (!claim) return null;
  if ((claim as any).status !== "Pending") {
    return { error: `Cannot change status: claim is already ${(claim as any).status}` };
  }

  if (status === "Approved") {
    await trailClaimsTable.findOneAndUpdate({ id }, { $set: { status } });
    const automation = await onTrailClaimApproved(id);
    const updated = await trailClaimsTable.findOne({ id }).lean();
    return { ...updated, _automation: automation };
  }

  const updated = await trailClaimsTable.findOneAndUpdate({ id }, { $set: { status } }, { new: true }).lean();
  return updated;
};

export const deleteTrailClaim = async (id: number) => {
  const claim = await trailClaimsTable.findOne({ id }).lean();
  if (!claim) return { notFound: true };
  if ((claim as any).status === "Approved" || (claim as any).status === "Paid") {
    return { invalid: true, message: `Cannot delete a claim that is ${(claim as any).status}. Only Pending or Rejected claims can be deleted.` };
  }
  await trailClaimsTable.findOneAndDelete({ id });
  return { success: true };
};

export const getPettyCash = async () => {
  return await pettyCashTable.find().sort({ date: -1 }).lean();
};

export const createPettyCash = async (data: any) => {
  const lastEntry = await pettyCashTable.findOne().sort({ date: -1 }).lean();
  const prevBalance = lastEntry ? parseFloat(String((lastEntry as any).runningBalance || 0)) : 0;
  const cashIn = parseFloat(String(data.cashIn)) || 0;
  const cashOut = parseFloat(String(data.cashOut)) || 0;
  const runningBalance = (prevBalance + cashIn - cashOut).toFixed(2);
  const row = await pettyCashTable.create({ ...data, runningBalance });
  return row.toObject();
};

export const getTrailDashboardSummary = async () => {
  const now = new Date();
  const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [claimAgg] = await trailClaimsTable.aggregate([
    {
      $group: {
        _id: null,
        totalThisMonth: { $sum: { $cond: [{ $gte: ["$date", firstOfMonth] }, { $toDouble: "$amount" }, 0] } },
        pendingCount: { $sum: { $cond: [{ $eq: ["$status", "Pending"] }, 1, 0] } },
        travelTotal: { $sum: { $cond: [{ $eq: ["$category", "Travel"] }, { $toDouble: "$amount" }, 0] } },
        fuelTotal: { $sum: { $cond: [{ $eq: ["$category", "Fuel"] }, { $toDouble: "$amount" }, 0] } },
        mealsTotal: { $sum: { $cond: [{ $eq: ["$category", "Meals"] }, { $toDouble: "$amount" }, 0] } },
        miscTotal: { $sum: { $cond: [{ $eq: ["$category", "Misc"] }, { $toDouble: "$amount" }, 0] } },
      },
    },
  ]);

  const [pcAgg] = await pettyCashTable.aggregate([
    { $group: { _id: null, totalDisbursed: { $sum: { $toDouble: "$cashOut" } } } },
  ]);

  return {
    totalClaimsThisMonth: Number(claimAgg?.totalThisMonth || 0),
    pendingApprovals: Number(claimAgg?.pendingCount || 0),
    totalPettyCashDisbursed: Number(pcAgg?.totalDisbursed || 0),
    categoryBreakdown: {
      Travel: Number(claimAgg?.travelTotal || 0),
      Fuel: Number(claimAgg?.fuelTotal || 0),
      Meals: Number(claimAgg?.mealsTotal || 0),
      Misc: Number(claimAgg?.miscTotal || 0),
    },
  };
};
