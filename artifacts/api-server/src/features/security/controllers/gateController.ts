import { type Request, type Response } from "express";
import {
  addWatchlistEntry,
  deleteWatchlistEntry,
  getGateDashboard,
  getGateEmployees,
  getGateRollCall,
  getGateSettings,
  getGateVisitors,
  updateGateSetting,
} from "../services/gateService";
import { insertWatchlistSchema } from "@workspace/db/schema";

export const handleGetGateDashboard = async (_req: Request, res: Response) => {
  res.json(await getGateDashboard());
};

export const handleGetGateRollCall = async (_req: Request, res: Response) => {
  res.json(await getGateRollCall());
};

export const handleGetGateEmployees = async (_req: Request, res: Response) => {
  res.json(await getGateEmployees());
};

export const handleGetGateVisitors = async (req: Request, res: Response) => {
  res.json(await getGateVisitors(req.query));
};

export const handleAddWatchlistEntry = async (req: Request, res: Response) => {
  const parsed = insertWatchlistSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input", details: parsed.error.issues });
    return;
  }
  try {
    const entry = await addWatchlistEntry(parsed.data);
    res.status(201).json(entry);
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to add to watchlist" });
  }
};

export const handleDeleteWatchlistEntry = async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  const deleted = await deleteWatchlistEntry(id);
  if (!deleted) {
    res.status(404).json({ error: "Entry not found" });
    return;
  }

  res.json({ success: true });
};

export const handleGetGateSettings = async (_req: Request, res: Response) => {
  res.json(await getGateSettings());
};

export const handleUpdateGateSettings = async (req: Request, res: Response) => {
  const { key, value } = req.body;
  if (!key) {
    res.status(400).json({ error: "key required" });
    return;
  }

  const result = await updateGateSetting(key, value || "");
  res.json(result);
};
