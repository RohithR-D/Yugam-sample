import {
  accountsPayableTable,
  accountsReceivableTable,
  projectsTable,
  salesInvoicesTable,
  transactionsTable,
  visionGeneratedReportsTable,
} from "@workspace/db/schema";

export const getExecutiveSummary = async () => {
  const [revAgg] = await transactionsTable.aggregate([
    { $match: { type: "Credit" } },
    { $group: { _id: null, total: { $sum: { $toDouble: "$amount" } } } },
  ]);
  const [expAgg] = await transactionsTable.aggregate([
    { $match: { type: "Debit" } },
    { $group: { _id: null, total: { $sum: { $toDouble: "$amount" } } } },
  ]);
  const grossRevenue = revAgg?.total || 0;
  const totalExpenses = expAgg?.total || 0;
  const netProfit = grossRevenue - totalExpenses;

  const [projectCount, ticketCount] = await Promise.all([
    projectsTable.countDocuments({ status: "Active" }),
    salesInvoicesTable.countDocuments({ paymentStatus: "Unpaid" }),
  ]);

  const cashFlowData = await transactionsTable.aggregate([
    {
      $group: {
        _id: { $dateToString: { format: "%Y-%m", date: "$date" } },
        inflow: { $sum: { $cond: [{ $eq: ["$type", "Credit"] }, { $toDouble: "$amount" }, 0] } },
        outflow: { $sum: { $cond: [{ $eq: ["$type", "Debit"] }, { $toDouble: "$amount" }, 0] } },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  return {
    grossRevenue,
    netProfit,
    activeProjects: projectCount,
    openTickets: ticketCount,
    cashFlow: cashFlowData.map((d: any) => ({ month: d._id.slice(5), inflow: d.inflow, outflow: d.outflow })),
  };
};

export const getFinancialHealth = async () => {
  const now = new Date();
  const agingBuckets = (rows: any[]) => {
    const map: Record<string, number> = { "0-30 days": 0, "31-60 days": 0, "61-90 days": 0, "90+ days": 0 };
    for (const row of rows) {
      const days = Math.floor((now.getTime() - new Date(row.dueDate).getTime()) / (1000 * 60 * 60 * 24));
      const bucket = days <= 30 ? "0-30 days" : days <= 60 ? "31-60 days" : days <= 90 ? "61-90 days" : "90+ days";
      map[bucket] += parseFloat(row.amount || "0");
    }
    return map;
  };

  const [arRows, apRows, topInvoices] = await Promise.all([
    accountsReceivableTable.find({ status: "Pending" }).select({ dueDate: 1, amount: 1 }).lean(),
    accountsPayableTable.find({ status: "Pending" }).select({ dueDate: 1, amount: 1 }).lean(),
    salesInvoicesTable.find({ paymentStatus: "Unpaid" }).sort({ grandTotal: -1 }).limit(5).lean(),
  ]);

  const arMap = agingBuckets(arRows);
  const apMap = agingBuckets(apRows);
  const buckets = ["0-30 days", "31-60 days", "61-90 days", "90+ days"];

  return {
    aging: buckets.map((b) => ({ bucket: b, ar: arMap[b] || 0, ap: apMap[b] || 0 })),
    topInvoices: topInvoices.map((inv: any) => ({
      id: inv.id,
      clientName: inv.clientName,
      invoiceNumber: inv.invoiceNumber,
      totalAmount: inv.grandTotal,
      dueDate: inv.dueDate,
      status: inv.status,
    })),
  };
};

export const getOpsProduction = async () => {
  let capacityPercent = 72;
  try {
    const { forgeWorkOrdersTable } = await import("@workspace/db/schema");
    const [activeCount, totalCount] = await Promise.all([
      forgeWorkOrdersTable.countDocuments({ status: "In Progress" }),
      forgeWorkOrdersTable.countDocuments(),
    ]);
    if (totalCount > 0) {
      capacityPercent = Math.round((activeCount / Math.max(totalCount, 1)) * 100);
    }
  } catch {
    // ignore missing schema module
  }

  let topMaterials: { name: string; quantity: number }[] = [];
  try {
    const { forgeBomMaterialsTable } = await import("@workspace/db/schema");
    topMaterials = await forgeBomMaterialsTable.aggregate([
      { $group: { _id: "$materialName", quantity: { $sum: { $toDouble: "$quantity" } } } },
      { $sort: { quantity: -1 } },
      { $limit: 6 },
      { $project: { _id: 0, name: "$_id", quantity: 1 } },
    ]);
  } catch {
    topMaterials = [];
  }

  const activeProjects = await projectsTable.find({ status: "Active" }).sort({ startDate: -1 }).limit(8).lean();

  return {
    factoryCapacity: capacityPercent,
    topMaterials,
    activeProjects: activeProjects.map((p: any) => ({
      id: p.id,
      name: p.projectName,
      status: p.status,
      startDate: p.startDate,
      totalValue: p.totalValue,
    })),
  };
};

export const getGeneratedReports = async () => {
  return await visionGeneratedReportsTable.find().sort({ createdAt: -1 }).limit(20).lean();
};

export const createVisionReport = async (data: any) => {
  const row = await visionGeneratedReportsTable.create(data);
  return row.toObject();
};
