import { Router, type Request, type Response } from "express";
import { db } from "@workspace/db";
import {
  visionGeneratedReportsTable, insertVisionReportSchema,
  transactionsTable, projectsTable, salesInvoicesTable,
  chartOfAccountsTable, accountsReceivableTable, accountsPayableTable,
} from "@workspace/db/schema";
import { eq, desc, sql, and, gte, lte } from "drizzle-orm";

const visionRouter = Router();

function formatCurrency(v: number) {
  if (v >= 10000000) return `${(v / 10000000).toFixed(2)} Cr`;
  if (v >= 100000) return `${(v / 100000).toFixed(2)} L`;
  if (v >= 1000) return `${(v / 1000).toFixed(1)}K`;
  return v.toFixed(0);
}

visionRouter.get("/vision/executive-summary", async (_req: Request, res: Response) => {
  try {
    const [revenueResult] = await db.select({
      total: sql<string>`coalesce(sum(amount), 0)`,
    }).from(transactionsTable).where(eq(transactionsTable.type, "Credit"));

    const [expenseResult] = await db.select({
      total: sql<string>`coalesce(sum(amount), 0)`,
    }).from(transactionsTable).where(eq(transactionsTable.type, "Debit"));

    const grossRevenue = parseFloat(revenueResult.total);
    const totalExpenses = parseFloat(expenseResult.total);
    const netProfit = grossRevenue - totalExpenses;

    const [projectCount] = await db.select({
      count: sql<number>`count(*)::int`,
    }).from(projectsTable).where(eq(projectsTable.status, "Active"));

    const [ticketCount] = await db.select({
      count: sql<number>`count(*)::int`,
    }).from(salesInvoicesTable).where(eq(salesInvoicesTable.paymentStatus, "Unpaid"));

    const cashFlowData = await db.select({
      month: sql<string>`to_char(date, 'Mon')`,
      monthKey: sql<string>`to_char(date, 'YYYY-MM')`,
      inflow: sql<string>`coalesce(sum(case when type = 'Credit' then amount else 0 end), 0)`,
      outflow: sql<string>`coalesce(sum(case when type = 'Debit' then amount else 0 end), 0)`,
    }).from(transactionsTable)
      .groupBy(sql`to_char(date, 'Mon'), to_char(date, 'YYYY-MM')`)
      .orderBy(sql`to_char(date, 'YYYY-MM')`);

    res.json({
      grossRevenue,
      netProfit,
      activeProjects: projectCount.count,
      openTickets: ticketCount.count,
      cashFlow: cashFlowData.map((d) => ({
        month: d.month,
        inflow: parseFloat(d.inflow),
        outflow: parseFloat(d.outflow),
      })),
    });
  } catch (err: any) {
    console.error("Executive summary error:", err);
    res.status(500).json({ error: "Failed to fetch executive summary" });
  }
});

visionRouter.get("/vision/financial-health", async (_req: Request, res: Response) => {
  try {
    const arAging = await db.select({
      bucket: sql<string>`case
        when extract(day from now() - due_date) <= 30 then '0-30 days'
        when extract(day from now() - due_date) <= 60 then '31-60 days'
        when extract(day from now() - due_date) <= 90 then '61-90 days'
        else '90+ days'
      end`,
      total: sql<string>`coalesce(sum(amount::numeric), 0)`,
    }).from(accountsReceivableTable)
      .where(eq(accountsReceivableTable.status, "Pending"))
      .groupBy(sql`case
        when extract(day from now() - due_date) <= 30 then '0-30 days'
        when extract(day from now() - due_date) <= 60 then '31-60 days'
        when extract(day from now() - due_date) <= 90 then '61-90 days'
        else '90+ days'
      end`);

    const apAging = await db.select({
      bucket: sql<string>`case
        when extract(day from now() - due_date) <= 30 then '0-30 days'
        when extract(day from now() - due_date) <= 60 then '31-60 days'
        when extract(day from now() - due_date) <= 90 then '61-90 days'
        else '90+ days'
      end`,
      total: sql<string>`coalesce(sum(amount::numeric), 0)`,
    }).from(accountsPayableTable)
      .where(eq(accountsPayableTable.status, "Pending"))
      .groupBy(sql`case
        when extract(day from now() - due_date) <= 30 then '0-30 days'
        when extract(day from now() - due_date) <= 60 then '31-60 days'
        when extract(day from now() - due_date) <= 90 then '61-90 days'
        else '90+ days'
      end`);

    const topInvoices = await db.select().from(salesInvoicesTable)
      .where(eq(salesInvoicesTable.paymentStatus, "Unpaid"))
      .orderBy(desc(sql`${salesInvoicesTable.grandTotal}::numeric`))
      .limit(5);

    const buckets = ["0-30 days", "31-60 days", "61-90 days", "90+ days"];
    const arMap = Object.fromEntries(arAging.map((r) => [r.bucket, parseFloat(r.total)]));
    const apMap = Object.fromEntries(apAging.map((r) => [r.bucket, parseFloat(r.total)]));

    res.json({
      aging: buckets.map((b) => ({ bucket: b, ar: arMap[b] || 0, ap: apMap[b] || 0 })),
      topInvoices: topInvoices.map((inv) => ({
        id: inv.id,
        clientName: inv.clientName,
        invoiceNumber: inv.invoiceNumber,
        totalAmount: inv.grandTotal,
        dueDate: inv.dueDate,
        status: inv.status,
      })),
    });
  } catch (err: any) {
    console.error("Financial health error:", err);
    res.status(500).json({ error: "Failed to fetch financial health data" });
  }
});

visionRouter.get("/vision/ops-production", async (_req: Request, res: Response) => {
  try {
    let capacityPercent = 72;
    try {
      const { forgeWorkOrdersTable } = await import("@workspace/db/schema");
      const [activeOrders] = await db.select({
        count: sql<number>`count(*)::int`,
      }).from(forgeWorkOrdersTable).where(eq(forgeWorkOrdersTable.status, "In Progress"));
      const [totalOrders] = await db.select({
        count: sql<number>`count(*)::int`,
      }).from(forgeWorkOrdersTable);
      if (totalOrders.count > 0) {
        capacityPercent = Math.round((activeOrders.count / Math.max(totalOrders.count, 1)) * 100);
      }
    } catch {}

    let topMaterials: { name: string; quantity: number }[] = [];
    try {
      const { forgeBomMaterialsTable } = await import("@workspace/db/schema");
      const mats = await db.select({
        name: forgeBomMaterialsTable.materialName,
        quantity: sql<number>`coalesce(sum(${forgeBomMaterialsTable.quantity}::numeric), 0)::int`,
      }).from(forgeBomMaterialsTable)
        .groupBy(forgeBomMaterialsTable.materialName)
        .orderBy(desc(sql`sum(${forgeBomMaterialsTable.quantity}::numeric)`))
        .limit(6);
      topMaterials = mats.map((m) => ({ name: m.name, quantity: Number(m.quantity) }));
    } catch {}

    const activeProjects = await db.select().from(projectsTable)
      .where(eq(projectsTable.status, "Active"))
      .orderBy(desc(projectsTable.startDate))
      .limit(8);

    res.json({
      factoryCapacity: capacityPercent,
      topMaterials,
      activeProjects: activeProjects.map((p) => ({
        id: p.id,
        name: p.projectName,
        status: p.status,
        startDate: p.startDate,
        totalValue: p.totalValue,
      })),
    });
  } catch (err: any) {
    console.error("Ops production error:", err);
    res.status(500).json({ error: "Failed to fetch ops data" });
  }
});

visionRouter.get("/vision/generated-reports", async (_req: Request, res: Response) => {
  const rows = await db.select().from(visionGeneratedReportsTable).orderBy(desc(visionGeneratedReportsTable.createdAt)).limit(20);
  res.json(rows);
});

visionRouter.post("/vision/generated-reports", async (req: Request, res: Response) => {
  const parsed = insertVisionReportSchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Invalid input", details: parsed.error.issues }); return; }

  try {
    const [row] = await db.insert(visionGeneratedReportsTable).values(parsed.data).returning();
    res.status(201).json(row);
  } catch (err: any) {
    res.status(500).json({ error: "Failed to generate report" });
  }
});

export default visionRouter;
