import { Router, type Request, type Response } from "express";
import { candidatesTable, insertCandidateSchema } from "@workspace/db/schema";

const candidatesRouter = Router();

candidatesRouter.get("/candidates", async (_req: Request, res: Response) => {
  const candidates = await candidatesTable.find().sort({ createdAt: -1 }).lean();
  res.json(candidates);
});

candidatesRouter.post("/candidates", async (req: Request, res: Response) => {
  const parsed = insertCandidateSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input", details: parsed.error.issues });
    return;
  }

  try {
    const candidate = await candidatesTable.create(parsed.data);
    res.status(201).json(candidate.toObject());
  } catch (err: any) {
    res.status(500).json({ error: "Internal server error" });
  }
});

export default candidatesRouter;
