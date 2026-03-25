import { Router, type Request, type Response } from "express";
import { db } from "@workspace/db";
import { expensesTable, insertExpenseSchema } from "@workspace/db/schema";
import { desc } from "drizzle-orm";

const expensesRouter = Router();

expensesRouter.get("/expenses", async (_req: Request, res: Response) => {
  const expenses = await db.select().from(expensesTable).orderBy(desc(expensesTable.date));
  res.json(expenses);
});

expensesRouter.post("/expenses", async (req: Request, res: Response) => {
  const parsed = insertExpenseSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input", details: parsed.error.issues });
    return;
  }

  try {
    const [expense] = await db.insert(expensesTable).values(parsed.data).returning();
    res.status(201).json(expense);
  } catch (err: any) {
    res.status(500).json({ error: "Internal server error" });
  }
});

export default expensesRouter;
