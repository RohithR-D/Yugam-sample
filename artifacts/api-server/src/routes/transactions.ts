import { Router, type Request, type Response } from "express";
import { db } from "@workspace/db";
import { transactionsTable, insertTransactionSchema } from "@workspace/db/schema";
import { desc } from "drizzle-orm";

const transactionsRouter = Router();

transactionsRouter.get("/transactions", async (_req: Request, res: Response) => {
  const txns = await db.select().from(transactionsTable).orderBy(desc(transactionsTable.date));
  res.json(txns);
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
