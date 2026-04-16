import { Router } from "express";
import {
  handleCreatePettyCash,
  handleCreateTrailClaim,
  handleDeleteTrailClaim,
  handleGetPettyCash,
  handleGetTrailClaims,
  handleGetTrailDashboardSummary,
  handleUpdateTrailClaimStatus,
} from "../controllers/trailController";

const trailRouter = Router();

trailRouter.get("/trail/claims", handleGetTrailClaims);
trailRouter.post("/trail/claims", handleCreateTrailClaim);
trailRouter.patch("/trail/claims/:id/status", handleUpdateTrailClaimStatus);
trailRouter.delete("/trail/claims/:id", handleDeleteTrailClaim);

trailRouter.get("/trail/petty-cash", handleGetPettyCash);
trailRouter.post("/trail/petty-cash", handleCreatePettyCash);

trailRouter.get("/trail/dashboard-summary", handleGetTrailDashboardSummary);

export default trailRouter;
