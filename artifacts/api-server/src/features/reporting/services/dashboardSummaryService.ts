import {
  clientsTable,
  contractsTable,
  employeesTable,
  expensesTable,
  projectsTable,
  salesInvoicesTable,
  shipmentsTable,
  tasksTable,
  transactionsTable,
  visitorsTable,
} from "@workspace/db/schema";

export const getDashboardSummary = async () => {
  const [
    activeEmployees,
    openTasks,
    activeProjects,
    totalClients,
    activeContracts,
    onPremisesVisitors,
    pendingShipments,
    pendingExpenses,
  ] = await Promise.all([
    employeesTable.countDocuments({ status: "Active" }),
    tasksTable.countDocuments({ status: { $ne: "Done" } }),
    projectsTable.countDocuments({ status: "Active" }),
    clientsTable.countDocuments(),
    contractsTable.countDocuments({ status: "Active" }),
    visitorsTable.countDocuments({ status: "On Premises" }),
    shipmentsTable.countDocuments({ status: "In Transit" }),
    expensesTable.countDocuments({ status: "Pending" }),
  ]);

  const [creditAgg] = await transactionsTable.aggregate([
    { $match: { type: "Credit" } },
    { $group: { _id: null, total: { $sum: { $toDouble: "$amount" } } } },
  ]);

  const [debitAgg] = await transactionsTable.aggregate([
    { $match: { type: "Debit" } },
    { $group: { _id: null, total: { $sum: { $toDouble: "$amount" } } } },
  ]);

  const [invoiceAgg] = await salesInvoicesTable.aggregate([
    { $match: { status: { $ne: "Paid" } } },
    { $group: { _id: null, total: { $sum: { $toDouble: { $ifNull: ["$balanceDue", 0] } } }, count: { $sum: 1 } } },
  ]);

  const [recentTransactions, recentTasks] = await Promise.all([
    transactionsTable.find().sort({ date: -1 }).limit(5).lean(),
    tasksTable.find().sort({ createdAt: -1 }).limit(5).lean(),
  ]);

  return {
    activeEmployees,
    openTasks,
    activeProjects,
    totalClients,
    activeContracts,
    onPremisesVisitors,
    pendingShipments,
    pendingExpenses,
    totalCredits: creditAgg?.total || 0,
    totalDebits: debitAgg?.total || 0,
    monthlyPL: (creditAgg?.total || 0) - (debitAgg?.total || 0),
    outstandingInvoiceAmount: invoiceAgg?.total || 0,
    outstandingInvoiceCount: invoiceAgg?.count || 0,
    recentTransactions,
    recentTasks,
  };
};
