import { Router } from "express";
import { handleCreateVisitor, handleGetVisitors } from "../controllers/visitorsController";

const visitorsRouter = Router();

visitorsRouter.get("/visitors", handleGetVisitors);
visitorsRouter.post("/visitors", handleCreateVisitor);

export default visitorsRouter;
