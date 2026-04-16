import { Router } from "express";
import {
  handleCreateGeneratedReport,
  handleGetExecutiveSummary,
  handleGetFinancialHealth,
  handleGetGeneratedReports,
  handleGetOpsProduction,
} from "../controllers/visionController";

const visionRouter = Router();

visionRouter.get("/vision/executive-summary", handleGetExecutiveSummary);
visionRouter.get("/vision/financial-health", handleGetFinancialHealth);
visionRouter.get("/vision/ops-production", handleGetOpsProduction);
visionRouter.get("/vision/generated-reports", handleGetGeneratedReports);
visionRouter.post("/vision/generated-reports", handleCreateGeneratedReport);

export default visionRouter;
