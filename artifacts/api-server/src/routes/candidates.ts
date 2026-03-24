import { Router, type Request, type Response } from "express";
import { db } from "@workspace/db";
import { candidatesTable, insertCandidateSchema } from "@workspace/db/schema";
import { desc } from "drizzle-orm";

const candidatesRouter = Router();

candidatesRouter.get("/candidates", async (_req: Request, res: Response) => {
  const candidates = await db.select().from(candidatesTable).orderBy(desc(candidatesTable.createdAt));
  res.json(candidates);
});

candidatesRouter.post("/candidates", async (req: Request, res: Response) => {
  const parsed = insertCandidateSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input", details: parsed.error.issues });
    return;
  }

  try {
    const [candidate] = await db.insert(candidatesTable).values(parsed.data).returning();
    res.status(201).json(candidate);
  } catch (err: any) {
    res.status(500).json({ error: "Internal server error" });
  }
});

export default candidatesRouter;
