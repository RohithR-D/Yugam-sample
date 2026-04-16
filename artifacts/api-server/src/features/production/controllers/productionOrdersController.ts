import { type Request, type Response } from "express";
import { getProductionOrders, createProductionOrder } from "../services/productionOrdersService";
import { insertProductionOrderSchema } from "@workspace/db/schema";

export const handleGetProductionOrders = async (_req: Request, res: Response) => {
  const orders = await getProductionOrders();
  res.json(orders);
};

export const handleCreateProductionOrder = async (req: Request, res: Response) => {
  const parsed = insertProductionOrderSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input", details: parsed.error.issues });
    return;
  }

  try {
    const order = await createProductionOrder(parsed.data);
    res.status(201).json(order);
  } catch (err: any) {
    if (err?.code === 11000) {
      res.status(409).json({ error: "A work order with this number already exists" });
      return;
    }
    console.error("Production order create error:", err);
    res.status(500).json({ error: err.message || "Internal server error" });
  }
};
