import { Router } from "express";
import { handleCreateTransaction, handleGetTransactions } from "../controllers/transactionsController";

const transactionsRouter = Router();

transactionsRouter.get("/transactions", handleGetTransactions);
transactionsRouter.post("/transactions", handleCreateTransaction);

export default transactionsRouter;
