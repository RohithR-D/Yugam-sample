import { Router, type Request, type Response } from "express";
import { db } from "@workspace/db";
import { clientActivitiesTable, insertClientActivitySchema } from "@workspace/db/schema";
import { desc, eq } from "drizzle-orm";

const clientActivitiesRouter = Router();

clientActivitiesRouter.get("/client-activities", async (req: Request, res: Response) => {
  const clientId = parseInt(req.query.clientId as string);
  if (isNaN(clientId)) {
    res.status(400).json({ error: "clientId query parameter required" });
    return;
  }

  const activities = await db
    .select()
    .from(clientActivitiesTable)
    .where(eq(clientActivitiesTable.clientId, clientId))
    .orderBy(desc(clientActivitiesTable.createdAt));

  res.json(activities);
});

clientActivitiesRouter.post("/client-activities", async (req: Request, res: Response) => {
  const parsed = insertClientActivitySchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input", details: parsed.error.issues });
    return;
  }

  const [activity] = await db.insert(clientActivitiesTable).values(parsed.data).returning();
  res.status(201).json(activity);
});

export default clientActivitiesRouter;
