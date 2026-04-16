import { Router } from "express";
import {
  handleAddWatchlistEntry,
  handleDeleteWatchlistEntry,
  handleGetGateDashboard,
  handleGetGateEmployees,
  handleGetGateRollCall,
  handleGetGateSettings,
  handleGetGateVisitors,
  handleUpdateGateSettings,
} from "../controllers/gateController";

const gateRouter = Router();

gateRouter.get("/gate/dashboard", handleGetGateDashboard);
gateRouter.get("/gate/roll-call", handleGetGateRollCall);
gateRouter.get("/gate/employees", handleGetGateEmployees);
gateRouter.get("/gate/visitors", handleGetGateVisitors);
gateRouter.post("/gate/watchlist", handleAddWatchlistEntry);
gateRouter.delete("/gate/watchlist/:id", handleDeleteWatchlistEntry);
gateRouter.get("/gate/settings", handleGetGateSettings);
gateRouter.put("/gate/settings", handleUpdateGateSettings);

export default gateRouter;
