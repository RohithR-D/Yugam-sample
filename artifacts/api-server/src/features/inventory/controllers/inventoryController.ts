import { type Request, type Response } from "express";
import { getInventoryItems, createInventoryItem } from "../services/inventoryService";
import { insertInventorySchema } from "@workspace/db/schema";

export const handleGetInventory = async (_req: Request, res: Response) => {
  const items = await getInventoryItems();
  res.json(items);
};

export const handleCreateInventory = async (req: Request, res: Response) => {
  const parsed = insertInventorySchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input", details: parsed.error.issues });
    return;
  }

  try {
    const item = await createInventoryItem(parsed.data);
    res.status(201).json(item);
  } catch (err: any) {
    if (err?.code === 11000) {
      res.status(409).json({ error: "An item with this SKU already exists" });
      return;
    }
    res.status(500).json({ error: err.message || "Internal server error" });
  }
};
