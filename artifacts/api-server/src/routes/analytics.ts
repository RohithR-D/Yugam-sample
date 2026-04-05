import { Router, type Request, type Response } from "express";
import { db } from "@workspace/db";
import {
  transactionsTable,
  tasksTable,
  projectsTable,
  employeesTable,
  salesInvoicesTable,
  expensesTable,
} from "@workspace/db/schema";
import { sql, eq } from "drizzle-orm";

const analyticsRouter = Router();

analyticsRouter.get("/analytics/financial-trend", async (_req: Request, res: Response) => {
  try {
    const credits = await db
      .select({
        month: sql<string>`to_char(date, 'YYYY-MM')`,
        monthLabel: sql<string>`to_char(date, 'Mon')`,
        total: sql<string>`coalesce(sum(amount), 0)`,
      })
      .from(transactionsTable)
      .where(eq(transactionsTable.type, "Credit"))
      .groupBy(sql`to_char(date, 'YYYY-MM'), to_char(date, 'Mon')`)
      .orderBy(sql`to_char(date, 'YYYY-MM')`);

    const debits = await db
      .select({
        month: sql<string>`to_char(date, 'YYYY-MM')`,
        monthLabel: sql<string>`to_char(date, 'Mon')`,
        total: sql<string>`coalesce(sum(amount), 0)`,
      })
      .from(transactionsTable)
      .where(eq(transactionsTable.type, "Debit"))
      .groupBy(sql`to_char(date, 'YYYY-MM'), to_char(date, 'Mon')`)
      .orderBy(sql`to_char(date, 'YYYY-MM')`);

    const allMonths = new Set([...credits.map((c) => c.month), ...debits.map((d) => d.month)]);
    const sorted = [...allMonths].sort();

    const creditMap = Object.fromEntries(credits.map((c) => [c.month, c]));
    const debitMap = Object.fromEntries(debits.map((d) => [d.month, d]));

    const trend = sorted.map((m) => ({
      month: m,
      label: creditMap[m]?.monthLabel || debitMap[m]?.monthLabel || m.slice(5),
      revenue: parseFloat(creditMap[m]?.total || "0"),
      expenses: parseFloat(debitMap[m]?.total || "0"),
      netPL: parseFloat(creditMap[m]?.total || "0") - parseFloat(debitMap[m]?.total || "0"),
    }));

    res.json(trend);
  } catch (err: any) {
    console.error("Financial trend error:", err);
    res.status(500).json({ error: "Failed to fetch financial trend" });
  }
});

analyticsRouter.get("/analytics/operational-stats", async (_req: Request, res: Response) => {
  try {
    const tasksByStatus = await db
      .select({
        status: tasksTable.status,
        count: sql<number>`count(*)::int`,
      })
      .from(tasksTable)
      .groupBy(tasksTable.status);

    const projectsByStatus = await db
      .select({
        status: projectsTable.status,
        count: sql<number>`count(*)::int`,
      })
      .from(projectsTable)
      .groupBy(projectsTable.status);

    const employeesByDept = await db
      .select({
        department: employeesTable.department,
        count: sql<number>`count(*)::int`,
      })
      .from(employeesTable)
      .where(eq(employeesTable.status, "Active"))
      .groupBy(employeesTable.department);

    const invoicesByStatus = await db
      .select({
        status: salesInvoicesTable.status,
        count: sql<number>`count(*)::int`,
      })
      .from(salesInvoicesTable)
      .groupBy(salesInvoicesTable.status);

    const expensesByCategory = await db
      .select({
        category: expensesTable.category,
        total: sql<string>`coalesce(sum(amount), 0)`,
      })
      .from(expensesTable)
      .groupBy(expensesTable.category);

    res.json({
      tasksByStatus,
      projectsByStatus,
      employeesByDept,
      invoicesByStatus,
      expensesByCategory: expensesByCategory.map((e) => ({ ...e, total: parseFloat(e.total) })),
    });
  } catch (err: any) {
    console.error("Operational stats error:", err);
    res.status(500).json({ error: "Failed to fetch operational stats" });
  }
});

export default analyticsRouter;
