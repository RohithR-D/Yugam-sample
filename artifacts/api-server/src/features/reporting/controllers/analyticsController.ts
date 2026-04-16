import { type Request, type Response } from "express";
import { getFinancialTrend, getOperationalStats } from "../services/analyticsService";

export const handleGetFinancialTrend = async (_req: Request, res: Response) => {
  try {
    res.json(await getFinancialTrend());
  } catch (err: any) {
    console.error("Financial trend error:", err);
    res.status(500).json({ error: "Failed to fetch financial trend" });
  }
};

export const handleGetOperationalStats = async (_req: Request, res: Response) => {
  try {
    res.json(await getOperationalStats());
  } catch (err: any) {
    console.error("Operational stats error:", err);
    res.status(500).json({ error: "Failed to fetch operational stats" });
  }
};
