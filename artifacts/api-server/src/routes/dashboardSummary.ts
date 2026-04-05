import { Router, type Request, type Response } from "express";
import { db } from "@workspace/db";
import {
  employeesTable,
  tasksTable,
  projectsTable,
  transactionsTable,
  salesInvoicesTable,
  clientsTable,
  contractsTable,
  visitorsTable,
  expensesTable,
  shipmentsTable,
} from "@workspace/db/schema";
import { eq, desc, sql, ne } from "drizzle-orm";

const dashboardSummaryRouter = Router();

dashboardSummaryRouter.get("/dashboard-summary", async (_req: Request, res: Response) => {
  try {
    const [activeEmployees] = await db.select({ count: sql<number>`count(*)::int` }).from(employeesTable).where(eq(employeesTable.status, "Active"));
    const [openTasks] = await db.select({ count: sql<number>`count(*)::int` }).from(tasksTable).where(ne(tasksTable.status, "Done"));
    const [activeProjects] = await db.select({ count: sql<number>`count(*)::int` }).from(projectsTable).where(eq(projectsTable.status, "Active"));
    const [totalClients] = await db.select({ count: sql<number>`count(*)::int` }).from(clientsTable);
    const [activeContracts] = await db.select({ count: sql<number>`count(*)::int` }).from(contractsTable).where(eq(contractsTable.status, "Active"));
    const [onPremisesVisitors] = await db.select({ count: sql<number>`count(*)::int` }).from(visitorsTable).where(eq(visitorsTable.status, "On Premises"));
    const [pendingShipments] = await db.select({ count: sql<number>`count(*)::int` }).from(shipmentsTable).where(eq(shipmentsTable.status, "In Transit"));
    const [pendingExpenses] = await db.select({ count: sql<number>`count(*)::int` }).from(expensesTable).where(eq(expensesTable.status, "Pending"));

    const [credits] = await db.select({ total: sql<string>`coalesce(sum(amount), 0)` }).from(transactionsTable).where(eq(transactionsTable.type, "Credit"));
    const [debits] = await db.select({ total: sql<string>`coalesce(sum(amount), 0)` }).from(transactionsTable).where(eq(transactionsTable.type, "Debit"));

    const [outstandingInvoices] = await db.select({ total: sql<string>`coalesce(sum(${salesInvoicesTable.balanceDue}::numeric), 0)`, count: sql<number>`count(*)::int` }).from(salesInvoicesTable).where(ne(salesInvoicesTable.status, "Paid"));

    const recentTransactions = await db.select().from(transactionsTable).orderBy(desc(transactionsTable.date)).limit(5);
    const recentTasks = await db.select().from(tasksTable).orderBy(desc(tasksTable.createdAt)).limit(5);

    res.json({
      activeEmployees: activeEmployees.count,
      openTasks: openTasks.count,
      activeProjects: activeProjects.count,
      totalClients: totalClients.count,
      activeContracts: activeContracts.count,
      onPremisesVisitors: onPremisesVisitors.count,
      pendingShipments: pendingShipments.count,
      pendingExpenses: pendingExpenses.count,
      totalCredits: parseFloat(credits.total),
      totalDebits: parseFloat(debits.total),
      monthlyPL: parseFloat(credits.total) - parseFloat(debits.total),
      outstandingInvoiceAmount: parseFloat(outstandingInvoices.total),
      outstandingInvoiceCount: outstandingInvoices.count,
      recentTransactions,
      recentTasks,
    });
  } catch (err: any) {
    console.error("Dashboard summary error:", err);
    res.status(500).json({ error: "Failed to fetch dashboard summary" });
  }
});

export default dashboardSummaryRouter;
