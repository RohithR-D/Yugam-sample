import { type Request, type Response } from "express";
import {
  createTrailClaim,
  deleteTrailClaim,
  getPettyCash,
  getTrailClaims,
  getTrailDashboardSummary,
  createPettyCash,
  updateTrailClaimStatus,
} from "../services/trailService";
import { insertTrailClaimSchema, insertPettyCashSchema } from "@workspace/db/schema";

export const handleGetTrailClaims = async (req: Request, res: Response) => {
  const employee = req.query.employee ? String(req.query.employee) : undefined;
  const rows = await getTrailClaims(employee);
  res.json(rows);
};

export const handleCreateTrailClaim = async (req: Request, res: Response) => {
  const parsed = insertTrailClaimSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input", details: parsed.error.issues });
    return;
  }

  try {
    const claim = await createTrailClaim(parsed.data);
    res.status(201).json(claim);
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to create claim" });
  }
};

export const handleUpdateTrailClaimStatus = async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  const { status } = req.body;
  const validStatuses = ["Pending", "Approved", "Rejected", "Paid"];
  if (!validStatuses.includes(status)) {
    res.status(400).json({ error: "Invalid status" });
    return;
  }

  try {
    const result = await updateTrailClaimStatus(id, status);
    if (!result) {
      res.status(404).json({ error: "Claim not found" });
      return;
    }
    if ((result as any).error) {
      res.status(400).json({ error: (result as any).error });
      return;
    }
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to update claim status" });
  }
};

export const handleDeleteTrailClaim = async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  try {
    const result = await deleteTrailClaim(id);
    if (result.notFound) {
      res.status(404).json({ error: "Claim not found" });
      return;
    }
    if (result.invalid) {
      res.status(400).json({ error: result.message });
      return;
    }
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to delete claim" });
  }
};

export const handleGetPettyCash = async (_req: Request, res: Response) => {
  const rows = await getPettyCash();
  res.json(rows);
};

export const handleCreatePettyCash = async (req: Request, res: Response) => {
  const parsed = insertPettyCashSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input", details: parsed.error.issues });
    return;
  }

  try {
    const row = await createPettyCash(parsed.data);
    res.status(201).json(row);
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to record petty cash" });
  }
};

export const handleGetTrailDashboardSummary = async (_req: Request, res: Response) => {
  const summary = await getTrailDashboardSummary();
  res.json(summary);
};
