import { Router, type Request, type Response } from "express";
import { db } from "@workspace/db";
import { communicationsTable, insertCommunicationSchema } from "@workspace/db/schema";
import { desc } from "drizzle-orm";

const communicationsRouter = Router();

communicationsRouter.get("/communications", async (_req: Request, res: Response) => {
  const comms = await db.select().from(communicationsTable).orderBy(desc(communicationsTable.createdAt));
  res.json(comms);
});

communicationsRouter.post("/communications", async (req: Request, res: Response) => {
  const parsed = insertCommunicationSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input", details: parsed.error.issues });
    return;
  }

  try {
    const [comm] = await db.insert(communicationsTable).values(parsed.data).returning();
    res.status(201).json(comm);
  } catch (err: any) {
    res.status(500).json({ error: "Internal server error" });
  }
});

export default communicationsRouter;
