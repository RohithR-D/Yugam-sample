import { Router, type Request, type Response } from "express";
import { communicationsTable, insertCommunicationSchema } from "@workspace/db/schema";

const communicationsRouter = Router();

communicationsRouter.get("/communications", async (_req: Request, res: Response) => {
  const comms = await communicationsTable.find().sort({ createdAt: -1 }).lean();
  res.json(comms);
});

communicationsRouter.post("/communications", async (req: Request, res: Response) => {
  const parsed = insertCommunicationSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input", details: parsed.error.issues });
    return;
  }

  try {
    const comm = await communicationsTable.create(parsed.data);
    res.status(201).json(comm.toObject());
  } catch (err: any) {
    res.status(500).json({ error: "Internal server error" });
  }
});

export default communicationsRouter;
