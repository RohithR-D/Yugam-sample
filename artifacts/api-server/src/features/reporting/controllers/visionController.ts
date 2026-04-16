import { type Request, type Response } from "express";
import {
  createVisionReport,
  getExecutiveSummary,
  getFinancialHealth,
  getGeneratedReports,
  getOpsProduction,
} from "../services/visionService";
import { insertVisionReportSchema } from "@workspace/db/schema";

export const handleGetExecutiveSummary = async (_req: Request, res: Response) => {
  try {
    res.json(await getExecutiveSummary());
  } catch (err: any) {
    console.error("Executive summary error:", err);
    res.status(500).json({ error: "Failed to fetch executive summary" });
  }
};

export const handleGetFinancialHealth = async (_req: Request, res: Response) => {
  try {
    res.json(await getFinancialHealth());
  } catch (err: any) {
    console.error("Financial health error:", err);
    res.status(500).json({ error: "Failed to fetch financial health data" });
  }
};

export const handleGetOpsProduction = async (_req: Request, res: Response) => {
  try {
    res.json(await getOpsProduction());
  } catch (err: any) {
    console.error("Ops production error:", err);
    res.status(500).json({ error: "Failed to fetch ops data" });
  }
};

export const handleGetGeneratedReports = async (_req: Request, res: Response) => {
  try {
    res.json(await getGeneratedReports());
  } catch (err: any) {
    console.error("Generated reports error:", err);
    res.status(500).json({ error: "Failed to fetch generated reports" });
  }
};

export const handleCreateGeneratedReport = async (req: Request, res: Response) => {
  const parsed = insertVisionReportSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input", details: parsed.error.issues });
    return;
  }

  try {
    const report = await createVisionReport(parsed.data);
    res.status(201).json(report);
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to generate report" });
  }
};
