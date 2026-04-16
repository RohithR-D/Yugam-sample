import { type Request, type Response } from "express";
import { getTransactions, createTransaction } from "../services/transactionsService";
import { insertTransactionSchema } from "@workspace/db/schema";

export const handleGetTransactions = async (req: Request, res: Response) => {
  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));

  const result = await getTransactions(page, limit);
  res.json(result);
};

export const handleCreateTransaction = async (req: Request, res: Response) => {
  const parsed = insertTransactionSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input", details: parsed.error.issues });
    return;
  }

  try {
    const txn = await createTransaction(parsed.data);
    res.status(201).json(txn);
  } catch (err: any) {
    console.error("Transaction create error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};
