import { Router, type Request, type Response } from "express";
import { db } from "@workspace/db";
import { visitorsTable, insertVisitorSchema } from "@workspace/db/schema";
import { desc } from "drizzle-orm";

const visitorsRouter = Router();

visitorsRouter.get("/visitors", async (_req: Request, res: Response) => {
  const visitors = await db.select().from(visitorsTable).orderBy(desc(visitorsTable.checkInTime));
  res.json(visitors);
});

visitorsRouter.post("/visitors", async (req: Request, res: Response) => {
  const parsed = insertVisitorSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input", details: parsed.error.issues });
    return;
  }

  try {
    const [visitor] = await db.insert(visitorsTable).values(parsed.data).returning();
    res.status(201).json(visitor);
  } catch (err: any) {
    res.status(500).json({ error: "Internal server error" });
  }
});

export default visitorsRouter;
