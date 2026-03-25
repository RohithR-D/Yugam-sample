import { Router, type Request, type Response } from "express";
import { db } from "@workspace/db";
import { reportsTable, insertReportSchema } from "@workspace/db/schema";
import { desc } from "drizzle-orm";

const reportsRouter = Router();

reportsRouter.get("/reports", async (_req: Request, res: Response) => {
  const reports = await db.select().from(reportsTable).orderBy(desc(reportsTable.lastRun));
  res.json(reports);
});

reportsRouter.post("/reports", async (req: Request, res: Response) => {
  const parsed = insertReportSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input", details: parsed.error.issues });
    return;
  }

  try {
    const [report] = await db.insert(reportsTable).values(parsed.data).returning();
    res.status(201).json(report);
  } catch (err: any) {
    res.status(500).json({ error: "Internal server error" });
  }
});

export default reportsRouter;
