import { Router, type Request, type Response } from "express";
import { db } from "@workspace/db";
import { invoicesTable, insertInvoiceSchema } from "@workspace/db/schema";
import { desc } from "drizzle-orm";

const invoicesRouter = Router();

invoicesRouter.get("/invoices", async (_req: Request, res: Response) => {
  const invoices = await db.select().from(invoicesTable).orderBy(desc(invoicesTable.createdAt));
  res.json(invoices);
});

invoicesRouter.post("/invoices", async (req: Request, res: Response) => {
  const parsed = insertInvoiceSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input", details: parsed.error.issues });
    return;
  }

  try {
    const [invoice] = await db.insert(invoicesTable).values(parsed.data).returning();
    res.status(201).json(invoice);
  } catch (err: any) {
    if (err?.code === "23505") {
      res.status(409).json({ error: "An invoice with this number already exists" });
      return;
    }
    res.status(500).json({ error: "Internal server error" });
  }
});

export default invoicesRouter;
