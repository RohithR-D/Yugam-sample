import { Router, type Request, type Response } from "express";
import { db } from "@workspace/db";
import { productionOrdersTable, insertProductionOrderSchema } from "@workspace/db/schema";
import { desc } from "drizzle-orm";

const productionOrdersRouter = Router();

productionOrdersRouter.get("/production-orders", async (_req: Request, res: Response) => {
  const orders = await db.select().from(productionOrdersTable).orderBy(desc(productionOrdersTable.createdAt));
  res.json(orders);
});

productionOrdersRouter.post("/production-orders", async (req: Request, res: Response) => {
  const parsed = insertProductionOrderSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input", details: parsed.error.issues });
    return;
  }

  try {
    const [order] = await db.insert(productionOrdersTable).values(parsed.data).returning();
    res.status(201).json(order);
  } catch (err: any) {
    if (err?.code === "23505") {
      res.status(409).json({ error: "A work order with this number already exists" });
      return;
    }
    res.status(500).json({ error: "Internal server error" });
  }
});

export default productionOrdersRouter;
