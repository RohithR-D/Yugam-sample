import { Router } from "express";
import { handleCreateReport, handleGetReports } from "../controllers/reportsController";

const reportsRouter = Router();

reportsRouter.get("/reports", handleGetReports);
reportsRouter.post("/reports", handleCreateReport);

export default reportsRouter;
