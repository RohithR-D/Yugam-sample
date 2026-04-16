import { type Request, type Response } from "express";
import { createReport, getReports } from "../services/reportsService";
import { insertReportSchema } from "@workspace/db/schema";

export const handleGetReports = async (_req: Request, res: Response) => {
  try {
    res.json(await getReports());
  } catch (err: any) {
    console.error("Reports fetch error:", err);
    res.status(500).json({ error: "Failed to fetch reports" });
  }
};

export const handleCreateReport = async (req: Request, res: Response) => {
  const parsed = insertReportSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input", details: parsed.error.issues });
    return;
  }

  try {
    const report = await createReport(parsed.data);
    res.status(201).json(report);
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Internal server error" });
  }
};
