import { Router, type Request, type Response } from "express";
import { db } from "@workspace/db";
import {
  trailClaimsTable, insertTrailClaimSchema,
  pettyCashTable, insertPettyCashSchema,
  journalEntriesTable, journalLinesTable,
  chartOfAccountsTable,
} from "@workspace/db/schema";
import { eq, desc, sql, and } from "drizzle-orm";
import { onTrailClaimApproved } from "./crossModuleAutomation";

const trailRouter = Router();

trailRouter.get("/trail/claims", async (req: Request, res: Response) => {
  const { employee } = req.query;
  const conditions = employee
    ? [eq(trailClaimsTable.employeeName, String(employee))]
    : [];
  const rows = await db.select().from(trailClaimsTable)
    .where(conditions.length ? conditions[0] : undefined)
    .orderBy(desc(trailClaimsTable.date));
  res.json(rows);
});

trailRouter.post("/trail/claims", async (req: Request, res: Response) => {
  const parsed = insertTrailClaimSchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Invalid input", details: parsed.error.issues }); return; }

  const count = await db.select({ count: sql<number>`count(*)::int` }).from(trailClaimsTable);
  const claimId = `CLM-${String((count[0].count || 0) + 1).padStart(4, "0")}`;

  try {
    const [row] = await db.insert(trailClaimsTable).values({ ...parsed.data, claimId }).returning();
    res.status(201).json(row);
  } catch (err: any) { res.status(500).json({ error: "Failed to create claim" }); }
});

trailRouter.patch("/trail/claims/:id/status", async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const { status } = req.body;
  const validStatuses = ["Pending", "Approved", "Rejected", "Paid"];
  if (!validStatuses.includes(status)) { res.status(400).json({ error: "Invalid status" }); return; }

  const [claim] = await db.select().from(trailClaimsTable).where(eq(trailClaimsTable.id, id));
  if (!claim) { res.status(404).json({ error: "Claim not found" }); return; }

  if (claim.status !== "Pending") {
    res.status(400).json({ error: `Cannot change status: claim is already ${claim.status}` });
    return;
  }

  try {
    if (status === "Approved") {
      const result = await db.transaction(async (tx) => {
        await tx.update(trailClaimsTable).set({ status }).where(eq(trailClaimsTable.id, id));
        const automation = await onTrailClaimApproved(id, tx);
        return automation;
      });

      const [updated] = await db.select().from(trailClaimsTable).where(eq(trailClaimsTable.id, id));
      res.json({ ...updated, _automation: result });
    } else {
      const [updated] = await db.update(trailClaimsTable).set({ status }).where(eq(trailClaimsTable.id, id)).returning();
      res.json(updated);
    }
  } catch (err: any) {
    console.error("[TRAIL] Claim status update error:", err.message);
    res.status(500).json({ error: "Failed to update claim status" });
  }
});

trailRouter.delete("/trail/claims/:id", async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  const [claim] = await db.select().from(trailClaimsTable).where(eq(trailClaimsTable.id, id));
  if (!claim) { res.status(404).json({ error: "Claim not found" }); return; }

  if (claim.status === "Approved" || claim.status === "Paid") {
    res.status(400).json({ error: `Cannot delete a claim that is ${claim.status}. Only Pending or Rejected claims can be deleted.` });
    return;
  }

  await db.delete(trailClaimsTable).where(eq(trailClaimsTable.id, id));
  res.json({ success: true });
});

trailRouter.get("/trail/petty-cash", async (_req: Request, res: Response) => {
  const rows = await db.select().from(pettyCashTable).orderBy(desc(pettyCashTable.date));
  res.json(rows);
});

trailRouter.post("/trail/petty-cash", async (req: Request, res: Response) => {
  const parsed = insertPettyCashSchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Invalid input", details: parsed.error.issues }); return; }

  const [lastEntry] = await db.select({ balance: pettyCashTable.runningBalance }).from(pettyCashTable).orderBy(desc(pettyCashTable.date)).limit(1);
  const prevBalance = lastEntry ? parseFloat(lastEntry.balance) : 0;
  const cashIn = parseFloat(String(parsed.data.cashIn)) || 0;
  const cashOut = parseFloat(String(parsed.data.cashOut)) || 0;
  const runningBalance = (prevBalance + cashIn - cashOut).toFixed(2);

  try {
    const [row] = await db.insert(pettyCashTable).values({ ...parsed.data, runningBalance }).returning();
    res.status(201).json(row);
  } catch (err: any) { res.status(500).json({ error: "Failed to record petty cash" }); }
});

trailRouter.get("/trail/dashboard-summary", async (_req: Request, res: Response) => {
  const now = new Date();
  const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [claimStats] = await db.select({
    totalThisMonth: sql<number>`coalesce(sum(case when ${trailClaimsTable.date} >= ${firstOfMonth} then ${trailClaimsTable.amount}::numeric else 0 end), 0)`,
    pendingCount: sql<number>`coalesce(sum(case when ${trailClaimsTable.status} = 'Pending' then 1 else 0 end), 0)`,
    travelTotal: sql<number>`coalesce(sum(case when ${trailClaimsTable.category} = 'Travel' then ${trailClaimsTable.amount}::numeric else 0 end), 0)`,
    fuelTotal: sql<number>`coalesce(sum(case when ${trailClaimsTable.category} = 'Fuel' then ${trailClaimsTable.amount}::numeric else 0 end), 0)`,
    mealsTotal: sql<number>`coalesce(sum(case when ${trailClaimsTable.category} = 'Meals' then ${trailClaimsTable.amount}::numeric else 0 end), 0)`,
    miscTotal: sql<number>`coalesce(sum(case when ${trailClaimsTable.category} = 'Misc' then ${trailClaimsTable.amount}::numeric else 0 end), 0)`,
  }).from(trailClaimsTable);

  const [pettyCashStats] = await db.select({
    totalDisbursed: sql<number>`coalesce(sum(${pettyCashTable.cashOut}::numeric), 0)`,
  }).from(pettyCashTable);

  res.json({
    totalClaimsThisMonth: Number(claimStats.totalThisMonth),
    pendingApprovals: Number(claimStats.pendingCount),
    totalPettyCashDisbursed: Number(pettyCashStats.totalDisbursed),
    categoryBreakdown: {
      Travel: Number(claimStats.travelTotal),
      Fuel: Number(claimStats.fuelTotal),
      Meals: Number(claimStats.mealsTotal),
      Misc: Number(claimStats.miscTotal),
    },
  });
});

export default trailRouter;
