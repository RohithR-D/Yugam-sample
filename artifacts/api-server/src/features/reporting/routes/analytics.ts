import { Router } from "express";
import { handleGetFinancialTrend, handleGetOperationalStats } from "../controllers/analyticsController";

const analyticsRouter = Router();

analyticsRouter.get("/analytics/financial-trend", handleGetFinancialTrend);
analyticsRouter.get("/analytics/operational-stats", handleGetOperationalStats);

export default analyticsRouter;
