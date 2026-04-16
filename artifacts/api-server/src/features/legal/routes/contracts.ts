import { Router } from "express";
import { handleGetContracts, handleCreateContract } from "../controllers/legalController";

const contractsRouter = Router();

contractsRouter.get("/contracts", handleGetContracts);
contractsRouter.post("/contracts", handleCreateContract);

export default contractsRouter;
