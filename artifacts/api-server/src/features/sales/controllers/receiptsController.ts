import { type Request, type Response } from "express";
import { createReceipt, deleteReceipt, getReceipts } from "../services/receiptsService";
import { insertReceiptSchema } from "@workspace/db/schema";

export const handleGetReceipts = async (_req: Request, res: Response) => {
  res.json(await getReceipts());
};

export const handleCreateReceipt = async (req: Request, res: Response) => {
  const parsed = insertReceiptSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input", details: parsed.error.issues });
    return;
  }
  try {
    const receipt = await createReceipt(parsed.data);
    res.status(201).json(receipt);
  } catch (err: any) {
    console.error("Receipt create error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const handleDeleteReceipt = async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  const deleted = await deleteReceipt(id);
  if (!deleted) {
    res.status(404).json({ error: "Receipt not found" });
    return;
  }
  res.json({ success: true });
};
