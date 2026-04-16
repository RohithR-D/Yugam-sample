import {
  employeesTable,
  expensesTable,
  projectsTable,
  salesInvoicesTable,
  tasksTable,
  transactionsTable,
} from "@workspace/db/schema";

export const getFinancialTrend = async () => {
  const creditsByMonth = await transactionsTable.aggregate([
    { $match: { type: "Credit" } },
    { $group: { _id: { $dateToString: { format: "%Y-%m", date: "$date" } }, total: { $sum: { $toDouble: "$amount" } } } },
    { $sort: { _id: 1 } },
  ]);

  const debitsByMonth = await transactionsTable.aggregate([
    { $match: { type: "Debit" } },
    { $group: { _id: { $dateToString: { format: "%Y-%m", date: "$date" } }, total: { $sum: { $toDouble: "$amount" } } } },
    { $sort: { _id: 1 } },
  ]);

  const allMonths = new Set([...creditsByMonth.map((c: any) => c._id), ...debitsByMonth.map((d: any) => d._id)]);
  const sorted = [...allMonths].sort();
  const creditMap = Object.fromEntries(creditsByMonth.map((c: any) => [c._id, c.total]));
  const debitMap = Object.fromEntries(debitsByMonth.map((d: any) => [d._id, d.total]));

  return sorted.map((m) => ({
    month: m,
    label: m.slice(5),
    revenue: creditMap[m] || 0,
    expenses: debitMap[m] || 0,
    netPL: (creditMap[m] || 0) - (debitMap[m] || 0),
  }));
};

export const getOperationalStats = async () => {
  const [tasksByStatus, projectsByStatus, employeesByDept, invoicesByStatus, expensesByCategory] = await Promise.all([
    tasksTable.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }, { $project: { _id: 0, status: "$_id", count: 1 } }]),
    projectsTable.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }, { $project: { _id: 0, status: "$_id", count: 1 } }]),
    employeesTable.aggregate([{ $match: { status: "Active" } }, { $group: { _id: "$department", count: { $sum: 1 } } }, { $project: { _id: 0, department: "$_id", count: 1 } }]),
    salesInvoicesTable.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }, { $project: { _id: 0, status: "$_id", count: 1 } }]),
    expensesTable.aggregate([{ $group: { _id: "$category", total: { $sum: { $toDouble: "$amount" } } } }, { $project: { _id: 0, category: "$_id", total: 1 } }]),
  ]);

  return { tasksByStatus, projectsByStatus, employeesByDept, invoicesByStatus, expensesByCategory };
};
