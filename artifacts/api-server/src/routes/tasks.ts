import { Router, type Request, type Response } from "express";
import { db } from "@workspace/db";
import { tasksTable, insertTaskSchema } from "@workspace/db/schema";
import { desc } from "drizzle-orm";

const tasksRouter = Router();

tasksRouter.get("/tasks", async (_req: Request, res: Response) => {
  const tasks = await db.select().from(tasksTable).orderBy(desc(tasksTable.createdAt));
  res.json(tasks);
});

tasksRouter.post("/tasks", async (req: Request, res: Response) => {
  const parsed = insertTaskSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input", details: parsed.error.issues });
    return;
  }

  try {
    const [task] = await db.insert(tasksTable).values(parsed.data).returning();
    res.status(201).json(task);
  } catch (err: any) {
    res.status(500).json({ error: "Internal server error" });
  }
});

export default tasksRouter;
