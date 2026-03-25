import { Router, type Request, type Response } from "express";
import { db } from "@workspace/db";
import { transactionsTable, insertTransactionSchema } from "@workspace/db/schema";
import { desc, sql } from "drizzle-orm";

const transactionsRouter = Router();

transactionsRouter.get("/transactions", async (req: Request, res: Response) => {
  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));
  const offset = (page - 1) * limit;

  const [countResult] = await db.select({ count: sql<number>`count(*)::int` }).from(transactionsTable);
  const totalCount = countResult.count;

  const txns = await db.select().from(transactionsTable).orderBy(desc(transactionsTable.date)).limit(limit).offset(offset);

  res.json({
    data: txns,
    totalCount,
    page,
    limit,
    totalPages: Math.ceil(totalCount / limit),
  });
});

transactionsRouter.post("/transactions", async (req: Request, res: Response) => {
  const parsed = insertTransactionSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input", details: parsed.error.issues });
    return;
  }

  try {
    const [txn] = await db.insert(transactionsTable).values(parsed.data).returning();
    res.status(201).json(txn);
  } catch (err: any) {
    res.status(500).json({ error: "Internal server error" });
  }
});

export default transactionsRouter;
