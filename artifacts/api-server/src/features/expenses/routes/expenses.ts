import { Router } from "express";
import { handleCreateExpense, handleGetExpenses } from "../controllers/expensesController";

const expensesRouter = Router();

expensesRouter.get("/expenses", handleGetExpenses);
expensesRouter.post("/expenses", handleCreateExpense);

export default expensesRouter;
