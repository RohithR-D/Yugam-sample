import { type Request, type Response } from "express";
import { createVisitor, getVisitors } from "../services/visitorsService";
import { insertVisitorSchema } from "@workspace/db/schema";

export const handleGetVisitors = async (_req: Request, res: Response) => {
  const visitors = await getVisitors();
  res.json(visitors);
};

export const handleCreateVisitor = async (req: Request, res: Response) => {
  const parsed = insertVisitorSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input", details: parsed.error.issues });
    return;
  }

  try {
    const visitor = await createVisitor(parsed.data);
    res.status(201).json(visitor);
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Internal server error" });
  }
};
