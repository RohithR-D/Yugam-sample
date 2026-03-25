import { Router, type Request, type Response } from "express";
import { db } from "@workspace/db";
import { filesTable, insertFileSchema } from "@workspace/db/schema";
import { desc } from "drizzle-orm";

const filesRouter = Router();

filesRouter.get("/files", async (_req: Request, res: Response) => {
  const files = await db.select().from(filesTable).orderBy(desc(filesTable.uploadDate));
  res.json(files);
});

filesRouter.post("/files", async (req: Request, res: Response) => {
  const parsed = insertFileSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input", details: parsed.error.issues });
    return;
  }

  try {
    const [file] = await db.insert(filesTable).values(parsed.data).returning();
    res.status(201).json(file);
  } catch (err: any) {
    res.status(500).json({ error: "Internal server error" });
  }
});

export default filesRouter;
