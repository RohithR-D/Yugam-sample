import { type Request, type Response } from "express";
import { createExpense, getExpenses } from "../services/expensesService";
import { insertExpenseSchema } from "@workspace/db/schema";

export const handleGetExpenses = async (_req: Request, res: Response) => {
  const expenses = await getExpenses();
  res.json(expenses);
};

export const handleCreateExpense = async (req: Request, res: Response) => {
  const parsed = insertExpenseSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input", details: parsed.error.issues });
    return;
  }

  try {
    const expense = await createExpense(parsed.data);
    res.status(201).json(expense);
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Internal server error" });
  }
};
