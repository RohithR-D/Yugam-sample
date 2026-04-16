import { Router, type Request, type Response } from "express";
import { clientActivitiesTable, insertClientActivitySchema } from "@workspace/db/schema";

const clientActivitiesRouter = Router();

clientActivitiesRouter.get("/client-activities", async (req: Request, res: Response) => {
  const clientId = parseInt(req.query.clientId as string);
  if (isNaN(clientId)) {
    res.status(400).json({ error: "clientId query parameter required" });
    return;
  }

  const activities = await clientActivitiesTable
    .find({ clientId })
    .sort({ createdAt: -1 })
    .lean();

  res.json(activities);
});

clientActivitiesRouter.post("/client-activities", async (req: Request, res: Response) => {
  const parsed = insertClientActivitySchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input", details: parsed.error.issues });
    return;
  }

  const activity = await clientActivitiesTable.create(parsed.data);
  res.status(201).json(activity.toObject());
});

export default clientActivitiesRouter;
