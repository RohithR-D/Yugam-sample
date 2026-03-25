import { Router, type Request, type Response } from "express";
import { db } from "@workspace/db";
import { purchaseOrdersTable, insertPurchaseOrderSchema } from "@workspace/db/schema";
import { desc } from "drizzle-orm";

const purchaseOrdersRouter = Router();

purchaseOrdersRouter.get("/purchase-orders", async (_req: Request, res: Response) => {
  const orders = await db.select().from(purchaseOrdersTable).orderBy(desc(purchaseOrdersTable.createdAt));
  res.json(orders);
});

purchaseOrdersRouter.post("/purchase-orders", async (req: Request, res: Response) => {
  const parsed = insertPurchaseOrderSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input", details: parsed.error.issues });
    return;
  }

  try {
    const [order] = await db.insert(purchaseOrdersTable).values(parsed.data).returning();
    res.status(201).json(order);
  } catch (err: any) {
    if (err?.code === "23505") {
      res.status(409).json({ error: "A purchase order with this PO number already exists" });
      return;
    }
    res.status(500).json({ error: "Internal server error" });
  }
});

export default purchaseOrdersRouter;
