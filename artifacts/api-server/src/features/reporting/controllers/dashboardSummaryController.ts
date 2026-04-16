import { type Request, type Response } from "express";
import { getDashboardSummary } from "../services/dashboardSummaryService";

export const handleGetDashboardSummary = async (_req: Request, res: Response) => {
  try {
    res.json(await getDashboardSummary());
  } catch (err: any) {
    console.error("Dashboard summary error:", err);
    res.status(500).json({ error: "Failed to fetch dashboard summary" });
  }
};
