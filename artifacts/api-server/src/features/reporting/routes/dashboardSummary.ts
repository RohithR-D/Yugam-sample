import { Router } from "express";
import { handleGetDashboardSummary } from "../controllers/dashboardSummaryController";

const dashboardSummaryRouter = Router();

dashboardSummaryRouter.get("/dashboard-summary", handleGetDashboardSummary);

export default dashboardSummaryRouter;
