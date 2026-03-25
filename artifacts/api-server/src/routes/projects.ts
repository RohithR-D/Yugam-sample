import { Router, type Request, type Response } from "express";
import { db } from "@workspace/db";
import { projectsTable, insertProjectSchema } from "@workspace/db/schema";
import { desc } from "drizzle-orm";

const projectsRouter = Router();

projectsRouter.get("/projects", async (_req: Request, res: Response) => {
  const projects = await db.select().from(projectsTable).orderBy(desc(projectsTable.createdAt));
  res.json(projects);
});

projectsRouter.post("/projects", async (req: Request, res: Response) => {
  const parsed = insertProjectSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input", details: parsed.error.issues });
    return;
  }

  try {
    const [project] = await db.insert(projectsTable).values(parsed.data).returning();
    res.status(201).json(project);
  } catch (err: any) {
    res.status(500).json({ error: "Internal server error" });
  }
});

export default projectsRouter;
