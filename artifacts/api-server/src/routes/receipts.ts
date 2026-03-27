import { Router, type Request, type Response } from "express";
import { db } from "@workspace/db";
import { receiptsTable, insertReceiptSchema } from "@workspace/db/schema";
import { desc, eq } from "drizzle-orm";

const receiptsRouter = Router();

receiptsRouter.get("/receipts", async (_req: Request, res: Response) => {
  const receipts = await db.select().from(receiptsTable).orderBy(desc(receiptsTable.createdAt));
  res.json(receipts);
});

receiptsRouter.post("/receipts", async (req: Request, res: Response) => {
  const parsed = insertReceiptSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input", details: parsed.error.issues });
    return;
  }
  try {
    const [receipt] = await db.insert(receiptsTable).values(parsed.data).returning();
    res.status(201).json(receipt);
  } catch (err: any) {
    console.error("Receipt create error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

receiptsRouter.delete("/receipts/:id", async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const [deleted] = await db.delete(receiptsTable).where(eq(receiptsTable.id, id)).returning();
  if (!deleted) { res.status(404).json({ error: "Receipt not found" }); return; }
  res.json({ success: true });
});

export default receiptsRouter;
