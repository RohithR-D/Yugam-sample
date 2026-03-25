import { Router, type Request, type Response } from "express";
import { db } from "@workspace/db";
import { inventoryTable, insertInventorySchema } from "@workspace/db/schema";
import { desc } from "drizzle-orm";

const inventoryRouter = Router();

inventoryRouter.get("/inventory", async (_req: Request, res: Response) => {
  const items = await db.select().from(inventoryTable).orderBy(desc(inventoryTable.createdAt));
  res.json(items);
});

inventoryRouter.post("/inventory", async (req: Request, res: Response) => {
  const parsed = insertInventorySchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input", details: parsed.error.issues });
    return;
  }

  try {
    const [item] = await db.insert(inventoryTable).values(parsed.data).returning();
    res.status(201).json(item);
  } catch (err: any) {
    if (err?.code === "23505") {
      res.status(409).json({ error: "An item with this SKU already exists" });
      return;
    }
    res.status(500).json({ error: "Internal server error" });
  }
});

export default inventoryRouter;
